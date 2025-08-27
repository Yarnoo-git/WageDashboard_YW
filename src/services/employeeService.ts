/**
 * 직원 데이터 관리 서비스
 * CRUD 작업, 검색, 급여 계산
 */

import { 
  EmployeeRecord,
  calculateBandStatistics,
  calculatePercentile,
  generateDummyEmployees
} from '@/lib/bandDataGenerator'
import {
  getCachedEmployeeData,
  setCachedEmployeeData,
  loadEmployeeDataFromExcel,
  getAISettings
} from './excelService'

// 메모리 내 수정된 데이터 저장
let modifiedEmployeeData: EmployeeRecord[] | null = null

// 업로드된 데이터를 임시로 저장 (Vercel 서버리스 환경)
const uploadedDataCache = new Map<string, EmployeeRecord[]>()

/**
 * 직원 데이터 가져오기
 */
export async function getEmployeeData(): Promise<EmployeeRecord[]> {
  // 우선순위: 수정된 데이터 > 캐시된 데이터 > 더미 데이터
  
  // 1. 수정된 데이터가 있으면 반환
  if (modifiedEmployeeData) {
    return modifiedEmployeeData
  }
  
  // 2. 캐시된 데이터 확인 (엑셀에서 로드한 데이터)
  const cached = getCachedEmployeeData()
  if (cached) {
    return cached
  }
  
  // 3. 더미 데이터 생성
  const dummyData = generateDummyEmployees()
  setCachedEmployeeData(dummyData)
  return dummyData
}

/**
 * 직원 데이터 업데이트
 */
export async function updateEmployee(id: string, updates: Partial<EmployeeRecord>): Promise<EmployeeRecord | null> {
  const employees = await getEmployeeData()
  const index = employees.findIndex(emp => emp.employeeId === id)
  
  if (index === -1) {
    return null
  }
  
  // 수정된 데이터 배열 생성 (원본을 변경하지 않음)
  modifiedEmployeeData = [...employees]
  modifiedEmployeeData[index] = {
    ...modifiedEmployeeData[index],
    ...updates,
    employeeId: id // ID는 변경 불가
  }
  
  return modifiedEmployeeData[index]
}

/**
 * 직원 검색
 */
export async function searchEmployees(params: {
  query?: string
  band?: string
  level?: string
  performanceRating?: string
  minSalary?: number
  maxSalary?: number
}): Promise<EmployeeRecord[]> {
  const employees = await getEmployeeData()
  
  return employees.filter(emp => {
    // 텍스트 검색
    if (params.query) {
      const query = params.query.toLowerCase()
      if (!emp.employeeId.toLowerCase().includes(query)) {
        return false
      }
    }
    
    // Band 필터
    if (params.band && emp.band !== params.band) {
      return false
    }
    
    // Level 필터
    if (params.level && emp.level !== params.level) {
      return false
    }
    
    // 평가 등급 필터
    if (params.performanceRating && emp.performanceRating !== params.performanceRating) {
      return false
    }
    
    // 연봉 범위 필터
    if (params.minSalary && emp.currentSalary < params.minSalary) {
      return false
    }
    if (params.maxSalary && emp.currentSalary > params.maxSalary) {
      return false
    }
    
    return true
  })
}

/**
 * 직원 급여 계산
 */
export async function calculateEmployeeSalary(
  employeeId: string,
  options: {
    baseUpPercentage?: number
    meritIncreasePercentage?: number
    promotionIncrease?: number
    specialAdjustment?: number
  }
): Promise<{
  currentSalary: number
  baseIncrease: number
  meritIncrease: number
  promotionIncrease: number
  specialAdjustment: number
  totalIncrease: number
  finalSalary: number
  increasePercentage: number
} | null> {
  const employees = await getEmployeeData()
  const employee = employees.find(emp => emp.employeeId === employeeId)
  
  if (!employee) {
    return null
  }
  
  // AI 설정에서 기본값 가져오기
  const aiSettings = getAISettings()
  const baseUpPercentage = options.baseUpPercentage ?? aiSettings.baseUpPercentage
  const meritIncreasePercentage = options.meritIncreasePercentage ?? aiSettings.meritIncreasePercentage
  
  // 계산
  const baseIncrease = employee.currentSalary * (baseUpPercentage / 100)
  const meritIncrease = employee.currentSalary * (meritIncreasePercentage / 100)
  const promotionIncrease = options.promotionIncrease || 0
  const specialAdjustment = options.specialAdjustment || 0
  
  const totalIncrease = baseIncrease + meritIncrease + promotionIncrease + specialAdjustment
  const finalSalary = employee.currentSalary + totalIncrease
  const increasePercentage = (totalIncrease / employee.currentSalary) * 100
  
  return {
    currentSalary: employee.currentSalary,
    baseIncrease,
    meritIncrease,
    promotionIncrease,
    specialAdjustment,
    totalIncrease,
    finalSalary,
    increasePercentage
  }
}

/**
 * 엑셀 파일 업로드 처리
 */
export async function uploadEmployeeExcel(file: File): Promise<{
  success: boolean
  message: string
  data?: {
    employeeCount: number
    totalBudget: number
    averageSalary: number
  }
}> {
  try {
    const employees = await loadEmployeeDataFromExcel(file)
    
    if (!employees || employees.length === 0) {
      return {
        success: false,
        message: '엑셀 파일에서 직원 데이터를 찾을 수 없습니다.'
      }
    }
    
    // 통계 계산
    const totalSalary = employees.reduce((sum, emp) => sum + emp.currentSalary, 0)
    const averageSalary = totalSalary / employees.length
    
    // 업로드 ID 생성 (임시)
    const uploadId = Date.now().toString()
    uploadedDataCache.set(uploadId, employees)
    
    // 메모리에 저장
    modifiedEmployeeData = employees
    
    return {
      success: true,
      message: `${employees.length}명의 직원 데이터를 성공적으로 로드했습니다.`,
      data: {
        employeeCount: employees.length,
        totalBudget: totalSalary,
        averageSalary
      }
    }
  } catch (error) {
    console.error('Excel upload error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '엑셀 파일 처리 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 현재 데이터 내보내기
 */
export function exportCurrentData(): EmployeeRecord[] {
  return modifiedEmployeeData || getCachedEmployeeData() || []
}

/**
 * 수정된 데이터 초기화
 */
export function clearModifiedData(): void {
  modifiedEmployeeData = null
}