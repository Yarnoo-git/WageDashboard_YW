/**
 * Excel 파일 처리 서비스
 * 엑셀 파일 읽기, 데이터 파싱, AI 설정 및 경쟁사 데이터 추출
 */

import * as XLSX from 'xlsx'
// bandDataGenerator는 테스트용이므로 제거하고 필요한 타입만 정의
import { EmployeeRecord } from './employeeService'
import { extractBands, extractLevels, extractGrades } from '@/utils/excelDataUtils'

// AI 설정 구조
export interface AISettings {
  baseUpPercentage: number
  meritIncreasePercentage: number
  totalPercentage: number
  minRange: number
  maxRange: number
}

// 경쟁사 데이터 구조 (집계 데이터)
export interface CompetitorData {
  company: string      // 회사명 (C사)
  band: string        // 직군
  level: string       // 직급
  averageSalary: number  // 평균연봉
}

// 캐시 데이터
let cachedEmployeeData: EmployeeRecord[] | null = null
let cachedAISettings: AISettings | null = null
let cachedCompetitorData: CompetitorData[] | null = null
let cachedCompetitorIncrease: number | null = null
let cachedBands: string[] | null = null
let cachedLevels: string[] | null = null
let cachedGrades: string[] | null = null

/**
 * 캐시 초기화
 */
export function clearCache() {
  if (typeof window === 'undefined') {
    cachedEmployeeData = null
    cachedAISettings = null
    cachedCompetitorData = null
    cachedCompetitorIncrease = null
    cachedBands = null
    cachedLevels = null
    cachedGrades = null
  }
}

/**
 * 엑셀 파일에서 직원 데이터 로드
 */
export async function loadEmployeeDataFromExcel(file?: File): Promise<EmployeeRecord[]> {
  if (!file) {
    throw new Error('파일이 제공되지 않았습니다.')
  }

  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array', cellText: true, cellNF: true })
    
    // 인원현황 시트 처리
    const worksheet = workbook.Sheets['인원현황']
    if (!worksheet) {
      console.error('인원현황 시트를 찾을 수 없습니다.')
      return []
    }

    // 시트를 JSON으로 변환 (빈 셀 포함)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[]
    
    // 직원 데이터 변환
    const employees = jsonData
      .map(row => {
        // 기본값으로 필수 필드 채우기
        const rowWithDefaults = {
          employeeId: row['사번'] || '',
          name: row['이름'] || row['성명'] || '미입력',  // 추가
          department: row['부서'] || row['팀'] || '미배정',  // 추가
          band: row['Band'] || row['직군'] || '',
          level: row['Level'] || row['직급'] || '',
          position: row['직책'] || '',  // optional
          hireDate: row['입사일'] || new Date().toISOString().split('T')[0],  // 추가
          currentSalary: parseFloat(String(row['현재연봉'] || '0').replace(/,/g, '')) || 0,
          performanceRating: row['평가등급'] || 'B', // 기본값 B
          payZone: row['PayZone'] ? parseInt(row['PayZone']) : undefined  // optional
        }
        
        // 빈 문자열이나 유효하지 않은 값 체크
        if (!rowWithDefaults.employeeId || 
            !rowWithDefaults.band || 
            !rowWithDefaults.level ||
            rowWithDefaults.currentSalary <= 0) {
          return null
        }
        
        return rowWithDefaults
      })
      .filter(Boolean) as EmployeeRecord[]
    
    // 최종 연봉 계산 (현재는 필요 없음)
    // employees.forEach(emp => {
    //   emp.finalSalary = emp.currentSalary
    //   emp.increasePercentage = 0
    // })
    
    // 캐시 업데이트
    cachedEmployeeData = employees
    
    // 밴드, 직급, 평가등급 정보도 캐시
    cachedBands = extractBands(employees)
    cachedLevels = extractLevels(employees)
    cachedGrades = extractGrades(employees)
    
    // AI 설정 시트 처리
    const aiSheet = workbook.Sheets['AI설정'] || workbook.Sheets['AI 설정']
    if (aiSheet) {
      const aiData = XLSX.utils.sheet_to_json(aiSheet) as any[]
      
      if (aiData.length > 0) {
        const firstRow = aiData[0]
        
        // 다양한 컬럼명 지원
        const baseUpKey = Object.keys(firstRow).find(key => 
          key.includes('Base-up') || key.includes('Base up') || key.includes('기본인상')
        )
        const meritKey = Object.keys(firstRow).find(key => 
          key.includes('성과') && key.includes('인상률')
        )
        const totalKey = Object.keys(firstRow).find(key => 
          key.includes('총') && key.includes('인상률')
        )
        
        cachedAISettings = {
          baseUpPercentage: baseUpKey ? (parseFloat(String(firstRow[baseUpKey]).replace('%', '')) || 0) : 0,
          meritIncreasePercentage: meritKey ? (parseFloat(String(firstRow[meritKey]).replace('%', '')) || 0) : 0,
          totalPercentage: totalKey ? (parseFloat(String(firstRow[totalKey]).replace('%', '')) || 0) : 0,
          minRange: parseFloat(String(firstRow['최소범위(%)'] || '0').replace('%', '')) || 0,
          maxRange: parseFloat(String(firstRow['최대범위(%)'] || '0').replace('%', '')) || 0
        }
      }
    }
    
    // C사 시트 처리 (경쟁사 데이터)
    const competitorSheet = workbook.Sheets['C사'] || workbook.Sheets['c사'] || workbook.Sheets['경쟁사']
    if (competitorSheet) {
      const competitorRawData = XLSX.utils.sheet_to_json(competitorSheet) as any[]
      
      if (competitorRawData.length > 0) {
        cachedCompetitorData = competitorRawData
          .map(row => {
            const bandKey = Object.keys(row).find(key => 
              key.toLowerCase().includes('band') || key.includes('직군')
            )
            const levelKey = Object.keys(row).find(key => 
              key.toLowerCase().includes('level') || key.includes('직급')
            )
            const salaryKey = Object.keys(row).find(key => 
              key.includes('평균') || key.includes('연봉') || key.toLowerCase().includes('salary')
            )
            
            if (!bandKey || !levelKey || !salaryKey) return null
            
            return {
              company: 'C사',
              band: row[bandKey] || '',
              level: row[levelKey] || '',
              averageSalary: parseFloat(String(row[salaryKey] || '0').replace(/,/g, '')) || 0
            }
          })
          .filter(Boolean) as CompetitorData[]

        // C사 인상률 처리
        const increaseRateRow = competitorRawData.find(row => {
          const keys = Object.keys(row)
          return keys.some(key => 
            key.includes('인상률') || 
            key.includes('증가율') || 
            key.toLowerCase().includes('increase')
          )
        })
        
        if (increaseRateRow) {
          const rateKey = Object.keys(increaseRateRow).find(key => 
            key.includes('인상률') || 
            key.includes('증가율') || 
            key.toLowerCase().includes('increase')
          )
          if (rateKey) {
            cachedCompetitorIncrease = parseFloat(
              String(increaseRateRow[rateKey]).replace('%', '').replace(/,/g, '')
            ) || 0
          }
        } else {
          // 첫 번째 행에서 인상률 찾기
          const firstRow = competitorRawData[0]
          if (firstRow) {
            const rateKey = Object.keys(firstRow).find(key => 
              key.includes('C사') && key.includes('인상률')
            )
            if (rateKey) {
              cachedCompetitorIncrease = parseFloat(
                String(firstRow[rateKey]).replace('%', '').replace(/,/g, '')
              ) || 0
            }
          }
        }
      }
    }
    
    return employees
  } catch (error) {
    console.error('엑셀 파일 로드 중 오류:', error)
    throw error
  }
}

/**
 * AI 설정 가져오기
 */
export function getAISettings(): AISettings {
  return cachedAISettings || {
    baseUpPercentage: 0,
    meritIncreasePercentage: 0,
    totalPercentage: 0,
    minRange: 0,
    maxRange: 0
  }
}

/**
 * 경쟁사 데이터 가져오기
 */
export function getCompetitorData(): CompetitorData[] {
  return cachedCompetitorData || []
}

/**
 * 경쟁사 인상률 가져오기
 */
export function getCompetitorIncreaseRate(): number {
  return cachedCompetitorIncrease || 0
}

/**
 * 캐시된 직원 데이터 가져오기
 */
export function getCachedEmployeeData(): EmployeeRecord[] | null {
  return cachedEmployeeData
}

/**
 * 캐시된 직원 데이터 설정
 */
export function setCachedEmployeeData(data: EmployeeRecord[]): void {
  cachedEmployeeData = data
  // 밴드, 직급, 평가등급 정보도 업데이트
  cachedBands = extractBands(data)
  cachedLevels = extractLevels(data)
  cachedGrades = extractGrades(data)
}

/**
 * 캐시된 밴드 목록 가져오기
 */
export function getCachedBands(): string[] {
  if (!cachedBands && cachedEmployeeData) {
    cachedBands = extractBands(cachedEmployeeData)
  }
  return cachedBands || []
}

/**
 * 캐시된 직급 목록 가져오기
 */
export function getCachedLevels(): string[] {
  if (!cachedLevels && cachedEmployeeData) {
    cachedLevels = extractLevels(cachedEmployeeData)
  }
  return cachedLevels || []
}

/**
 * 캐시된 평가등급 목록 가져오기
 */
export function getCachedGrades(): string[] {
  if (!cachedGrades && cachedEmployeeData) {
    cachedGrades = extractGrades(cachedEmployeeData)
  }
  return cachedGrades || []
}