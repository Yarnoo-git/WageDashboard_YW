/**
 * 직원 데이터 서비스
 * 엑셀 파일에서 데이터를 읽어오거나 더미 데이터를 생성
 */

import * as XLSX from 'xlsx'
import { 
  EmployeeRecord, 
  convertFromExcelFormat,
  calculateBandStatistics,
  calculatePercentile,
  LEVEL_INFO
} from '@/lib/bandDataGenerator'

let cachedEmployeeData: EmployeeRecord[] | null = null
let cachedAISettings: {
  baseUpPercentage: number
  meritIncreasePercentage: number
  totalPercentage: number
  minRange: number
  maxRange: number
} | null = null

// 경쟁사 데이터 구조 (집계 데이터)
interface CompetitorData {
  company: string      // 회사명 (C사)
  band: string        // 직군
  level: string       // 직급
  averageSalary: number  // 평균연봉
}

// 경쟁사 데이터 캐시
let cachedCompetitorData: CompetitorData[] | null = null
let cachedCompetitorIncrease: number | null = null // C사 인상률 캐시 추가

// 메모리 내 수정된 데이터 저장
let modifiedEmployeeData: EmployeeRecord[] | null = null

// 업로드된 데이터를 임시로 저장 (Vercel 서버리스 환경)
const uploadedDataCache = new Map<string, EmployeeRecord[]>()

/**
 * 캐시 초기화 (서버 사이드에서만 사용)
 */
export function clearCache() {
  if (typeof window === 'undefined') {
    cachedEmployeeData = null
    cachedAISettings = null
    cachedCompetitorData = null
    modifiedEmployeeData = null
    console.log('서버 사이드 캐시가 초기화되었습니다.')
  }
}

/**
 * 엑셀 파일에서 직원 데이터 읽기
 */
export async function loadEmployeeDataFromExcel(file?: File): Promise<EmployeeRecord[]> {
  try {
    if (file) {
      // 업로드된 파일 처리
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      // AI설정 시트 읽기
      if (workbook.SheetNames.includes('AI설정')) {
        const aiSheet = workbook.Sheets['AI설정']
        const aiData = XLSX.utils.sheet_to_json(aiSheet)
        
        // 상세 디버깅: AI설정 데이터 확인
        console.log('========== AI설정 데이터 상세 분석 ==========')
        console.log('전체 데이터 개수:', aiData.length)
        
        // 각 행을 자세히 출력
        aiData.forEach((row: any, index: number) => {
          console.log(`\n[행 ${index + 1}]`)
          console.log('  원본 데이터:', row)
          
          // 각 키와 값의 타입 확인
          Object.keys(row).forEach(key => {
            const value = row[key]
            console.log(`  - 키: "${key}" (타입: ${typeof key}, 길이: ${key.length})`)
            console.log(`    값: "${value}" (타입: ${typeof value})`)
            
            // 키에 특수문자나 공백 확인
            if (key.includes(' ')) {
              console.log(`    -> 키에 공백 포함됨`)
            }
            
            // '항목' 키인 경우 상세 분석
            if (key === '항목' || key.includes('항목')) {
              const itemValue = String(value)
              console.log(`    -> 항목 값 상세: "${itemValue}"`)
              console.log(`    -> 문자 코드:`, itemValue.split('').map(c => c.charCodeAt(0)))
              
              // 특정 문자열 포함 확인
              if (itemValue.includes('성과')) {
                console.log(`    -> "성과" 포함됨`)
              }
              if (itemValue.includes('인상률')) {
                console.log(`    -> "인상률" 포함됨`)
              }
              if (itemValue.includes('총')) {
                console.log(`    -> "총" 포함됨`)
              }
            }
          })
        })
        
        console.log('\n========== find() 테스트 ==========')
        
        // 각 항목별로 디버깅
        const testItems = [
          'Base-up(%)',
          '성과 인상률(%)',
          '성과인상률(%)',
          '총 인상률(%)',
          '총인상률(%)'
        ]
        
        testItems.forEach(testItem => {
          const foundRow = aiData.find((row: any) => row['항목'] === testItem)
          console.log(`\n"${testItem}" 검색 결과:`, foundRow ? '찾음' : '못 찾음')
          if (foundRow) {
            console.log('  찾은 데이터:', foundRow)
          }
        })
        
        // 실제로 찾은 항목들로 설정 - 띄어쓰기 있는 경우와 없는 경우 모두 처리
        const baseUpRow = aiData.find((row: any) => row['항목'] === 'Base-up(%)')
        const meritRow = aiData.find((row: any) => 
          row['항목'] === '성과 인상률(%)' || row['항목'] === '성과인상률(%)' || row['항목'] === '성과 인상률 (%)' || row['항목'] === '성과인상률 (%)' || 
          row['항목'] === '성과인상률(%)' ||
          row['항목'] === '성과 인상률 (%)' ||
          row['항목'] === '성과인상률 (%)')
        const totalRow = aiData.find((row: any) => 
          row['항목'] === '총 인상률(%)' || row['항목'] === '총인상률(%)' || row['항목'] === '총 인상률 (%)' || row['항목'] === '총인상률 (%)' || 
          row['항목'] === '총인상률(%)' ||
          row['항목'] === '총 인상률 (%)' ||
          row['항목'] === '총인상률 (%)')
        
        cachedAISettings = {
          baseUpPercentage: (baseUpRow as any)?.['값'] || 0,
          meritIncreasePercentage: (meritRow as any)?.['값'] || 0,
          totalPercentage: (totalRow as any)?.['값'] || 0,
          minRange: (aiData.find((row: any) => row['항목'] === '최소범위(%)') as any)?.['값'] || 0,
          maxRange: (aiData.find((row: any) => row['항목'] === '최대범위(%)') as any)?.['값'] || 0
        }
        
        console.log('\n========== 최종 AI 설정 ==========')
        console.log('Base-up:', cachedAISettings.baseUpPercentage)
        console.log('성과 인상률:', cachedAISettings.meritIncreasePercentage)
        console.log('총 인상률:', cachedAISettings.totalPercentage)
        console.log('========================================\n')
      }
      
      // C사인상률 시트 읽기
      console.log('C사인상률 시트 확인 중...')
      if (workbook.SheetNames.includes('C사인상률')) {
        console.log('C사인상률 시트 발견!')
        const competitorRateSheet = workbook.Sheets['C사인상률']
        const competitorRateData = XLSX.utils.sheet_to_json(competitorRateSheet)
        console.log('C사인상률 데이터:', competitorRateData)
        const rateRow = competitorRateData.find((row: any) => row['항목'] === 'C사 인상률(%)')
        if (rateRow) {
          cachedCompetitorIncrease = (rateRow as any)['값'] || 0
          console.log('C사 인상률 로드 성공:', cachedCompetitorIncrease, '%')
        } else {
          console.log('C사 인상률 행을 찾을 수 없음')
        }
      } else {
        console.log('C사인상률 시트가 없음. 시트 목록:', workbook.SheetNames)
      }
      
      // C사데이터 시트 읽기 (직군×직급 매트릭스)
      if (workbook.SheetNames.includes('C사데이터')) {
        const competitorSheet = workbook.Sheets['C사데이터']
        const competitorRawData = XLSX.utils.sheet_to_json(competitorSheet)
        
        // 집계 데이터 형식으로 변환
        const competitorData: CompetitorData[] = []
        competitorRawData.forEach((row: any) => {
          const band = row['직군']
          if (band) {
            // 각 레벨에 대한 데이터 처리
            ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4'].forEach(level => {
              if (row[level]) {
                competitorData.push({
                  company: 'C사',
                  band: band,
                  level: level,
                  averageSalary: row[level] * 1000 // 천원 단위를 원 단위로
                })
              }
            })
          }
        })
        
        cachedCompetitorData = competitorData
        console.log('C사 데이터 로드:', competitorData.length, '개 직군×직급 데이터')
      }
      
      // 직원 데이터 읽기 (직원기본정보 시트 우선, 없으면 첫 번째 시트)
      const employeeSheetName = workbook.SheetNames.includes('직원기본정보') 
        ? '직원기본정보' 
        : workbook.SheetNames.find(name => name.includes('직원')) || workbook.SheetNames[0]
      
      const worksheet = workbook.Sheets[employeeSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      const employees = convertFromExcelFormat(jsonData)
      cachedEmployeeData = employees
      return employees
    }
  } catch (error) {
    console.error('엑셀 파일 로드 실패:', error)
  }
  
  // 파일 로드 실패 시 빈 배열 반환 (Excel 필수)
  console.log('Excel 파일이 없습니다. 데이터를 업로드해주세요.')
  const employees: EmployeeRecord[] = []
  cachedEmployeeData = employees
  return employees
}

/**
 * 캐시된 직원 데이터 가져오기
 */
export async function getEmployeeData(): Promise<EmployeeRecord[]> {
  // 수정된 데이터가 있으면 우선 반환
  if (modifiedEmployeeData) {
    return modifiedEmployeeData
  }
  
  // Vercel 환경에서는 캐시를 짧게 유지
  if (cachedEmployeeData && process.env.VERCEL !== '1') {
    return cachedEmployeeData
  }
  
  // 서버 사이드에서만 파일 시스템 접근 가능
  // 클라이언트에서는 API를 통해 데이터를 가져옴
  if (typeof window === 'undefined') {
    // 서버 사이드 코드
    try {
      const fs = await import('fs').then(m => m.promises)
      const path = await import('path')
      const XLSX = await import('xlsx')
      
      // 먼저 temp 폴더의 current_data.xlsx 확인 (Vercel에서는 /tmp 사용)
      const tempDir = process.env.VERCEL === '1' ? '/tmp' : path.join(process.cwd(), 'temp')
      const tempPath = path.join(tempDir, 'current_data.xlsx')
      try {
        await fs.access(tempPath)
        const fileBuffer = await fs.readFile(tempPath)
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
        
        // AI설정 시트 읽기
        if (workbook.SheetNames.includes('AI설정')) {
          const aiSheet = workbook.Sheets['AI설정']
          const aiData = XLSX.utils.sheet_to_json(aiSheet)
          console.log('[서버] AI설정 시트 데이터:', aiData)
          
          const baseUpRow = aiData.find((row: any) => row['항목'] === 'Base-up(%)')
          const meritRow = aiData.find((row: any) => row['항목'] === '성과 인상률(%)' || row['항목'] === '성과인상률(%)' || row['항목'] === '성과 인상률 (%)' || row['항목'] === '성과인상률 (%)')
          
          cachedAISettings = {
            baseUpPercentage: baseUpRow ? (baseUpRow as any)['값'] || 0 : 0,
            meritIncreasePercentage: meritRow ? (meritRow as any)['값'] || 0 : 0,
            totalPercentage: (aiData.find((row: any) => row['항목'] === '총 인상률(%)' || row['항목'] === '총인상률(%)' || row['항목'] === '총 인상률 (%)' || row['항목'] === '총인상률 (%)') as any)?.['값'] || 0,
            minRange: (aiData.find((row: any) => row['항목'] === '최소범위(%)') as any)?.['값'] || 0,
            maxRange: (aiData.find((row: any) => row['항목'] === '최대범위(%)') as any)?.['값'] || 0
          }
          console.log('[서버] AI 설정 로드 완료:', cachedAISettings)
        } else {
          console.log('[서버] AI설정 시트가 없음. 기본값 사용')
          cachedAISettings = {
            baseUpPercentage: 0,
            meritIncreasePercentage: 0,
            totalPercentage: 0,
            minRange: 0,
            maxRange: 0
          }
        }
        
        // C사인상률 시트 읽기
        console.log('[서버] C사인상률 시트 확인 중...')
        if (workbook.SheetNames.includes('C사인상률')) {
          console.log('[서버] C사인상률 시트 발견!')
          const competitorRateSheet = workbook.Sheets['C사인상률']
          const competitorRateData = XLSX.utils.sheet_to_json(competitorRateSheet)
          console.log('[서버] C사인상률 데이터:', competitorRateData)
          const rateRow = competitorRateData.find((row: any) => row['항목'] === 'C사 인상률(%)')
          if (rateRow) {
            cachedCompetitorIncrease = (rateRow as any)['값'] || 0
            console.log('[서버] C사 인상률 로드 성공:', cachedCompetitorIncrease, '%')
          } else {
            console.log('[서버] C사 인상률 행을 찾을 수 없음')
          }
        } else {
          console.log('[서버] C사인상률 시트가 없음. 시트 목록:', workbook.SheetNames)
        }
        
        // C사데이터 시트 읽기
        if (workbook.SheetNames.includes('C사데이터')) {
          const competitorSheet = workbook.Sheets['C사데이터']
          const competitorRawData = XLSX.utils.sheet_to_json(competitorSheet)
          
          // 집계 데이터 형식으로 변환
          const competitorData: CompetitorData[] = []
          competitorRawData.forEach((row: any) => {
            const band = row['직군']
            if (band) {
              // 각 레벨에 대한 데이터 처리
              ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4'].forEach(level => {
                if (row[level]) {
                  competitorData.push({
                    company: 'C사',
                    band: band,
                    level: level,
                    averageSalary: row[level] * 1000 // 천원 단위를 원 단위로
                  })
                }
              })
            }
          })
          
          cachedCompetitorData = competitorData
          console.log('C사 데이터 로드:', competitorData.length, '개 직군×직급 데이터')
        }
        
        // 직원 데이터 읽기
        const employeeSheetName = workbook.SheetNames.includes('직원기본정보') 
          ? '직원기본정보' 
          : workbook.SheetNames.find(name => name.includes('직원')) || workbook.SheetNames[0]
        
        const worksheet = workbook.Sheets[employeeSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        const employees = convertFromExcelFormat(jsonData)
        cachedEmployeeData = employees
        console.log('저장된 데이터 파일에서 로드 완료:', employees.length, '명')
        return employees
      } catch {
        // temp 파일이 없으면 기본 파일 시도
      }
      
      // 초기 로드 시 기본 파일 시도 - Vercel 환경 고려
      // Vercel에서는 .next/server/app 경로를 확인
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'data', 'SBL_employee_data_comp.xlsx'),
        path.join(process.cwd(), 'data', 'SBL_employee_data_comp.xlsx'),
        path.join(process.cwd(), '.next/server/app', 'public', 'data', 'SBL_employee_data_comp.xlsx')
      ]
      
      let fileBuffer: Buffer | null = null
      let loadedPath = ''
      
      for (const tryPath of possiblePaths) {
        try {
          await fs.access(tryPath)
          fileBuffer = await fs.readFile(tryPath)
          loadedPath = tryPath
          console.log('파일 로드 성공:', loadedPath)
          break
        } catch {
          console.log('파일 경로 실패:', tryPath)
          continue
        }
      }
      
      if (fileBuffer) {
        try {
          const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
        
        // AI설정 시트 읽기
        if (workbook.SheetNames.includes('AI설정')) {
          const aiSheet = workbook.Sheets['AI설정']
          const aiData = XLSX.utils.sheet_to_json(aiSheet)
          console.log('[서버] AI설정 시트 데이터:', aiData)
          
          const baseUpRow = aiData.find((row: any) => row['항목'] === 'Base-up(%)')
          const meritRow = aiData.find((row: any) => row['항목'] === '성과 인상률(%)' || row['항목'] === '성과인상률(%)' || row['항목'] === '성과 인상률 (%)' || row['항목'] === '성과인상률 (%)')
          
          cachedAISettings = {
            baseUpPercentage: baseUpRow ? (baseUpRow as any)['값'] || 0 : 0,
            meritIncreasePercentage: meritRow ? (meritRow as any)['값'] || 0 : 0,
            totalPercentage: (aiData.find((row: any) => row['항목'] === '총 인상률(%)' || row['항목'] === '총인상률(%)' || row['항목'] === '총 인상률 (%)' || row['항목'] === '총인상률 (%)') as any)?.['값'] || 0,
            minRange: (aiData.find((row: any) => row['항목'] === '최소범위(%)') as any)?.['값'] || 0,
            maxRange: (aiData.find((row: any) => row['항목'] === '최대범위(%)') as any)?.['값'] || 0
          }
          console.log('[서버] AI 설정 로드 완료:', cachedAISettings)
        } else {
          console.log('[서버] AI설정 시트가 없음. 기본값 사용')
          cachedAISettings = {
            baseUpPercentage: 0,
            meritIncreasePercentage: 0,
            totalPercentage: 0,
            minRange: 0,
            maxRange: 0
          }
        }
        
        // C사인상률 시트 읽기
        console.log('[서버] C사인상률 시트 확인 중...')
        if (workbook.SheetNames.includes('C사인상률')) {
          console.log('[서버] C사인상률 시트 발견!')
          const competitorRateSheet = workbook.Sheets['C사인상률']
          const competitorRateData = XLSX.utils.sheet_to_json(competitorRateSheet)
          console.log('[서버] C사인상률 데이터:', competitorRateData)
          const rateRow = competitorRateData.find((row: any) => row['항목'] === 'C사 인상률(%)')
          if (rateRow) {
            cachedCompetitorIncrease = (rateRow as any)['값'] || 0
            console.log('[서버] C사 인상률 로드 성공:', cachedCompetitorIncrease, '%')
          } else {
            console.log('[서버] C사 인상률 행을 찾을 수 없음')
          }
        } else {
          console.log('[서버] C사인상률 시트가 없음. 시트 목록:', workbook.SheetNames)
        }
        
        // C사데이터 시트 읽기
        if (workbook.SheetNames.includes('C사데이터')) {
          const competitorSheet = workbook.Sheets['C사데이터']
          const competitorRawData = XLSX.utils.sheet_to_json(competitorSheet)
          
          // 집계 데이터 형식으로 변환
          const competitorData: CompetitorData[] = []
          competitorRawData.forEach((row: any) => {
            const band = row['직군']
            if (band) {
              // 각 레벨에 대한 데이터 처리
              ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4'].forEach(level => {
                if (row[level]) {
                  competitorData.push({
                    company: 'C사',
                    band: band,
                    level: level,
                    averageSalary: row[level] * 1000 // 천원 단위를 원 단위로
                  })
                }
              })
            }
          })
          
          cachedCompetitorData = competitorData
          console.log('C사 데이터 로드:', competitorData.length, '개 직군×직급 데이터')
        }
        
          // 직원 데이터 읽기
          const employeeSheetName = workbook.SheetNames.includes('직원기본정보') 
            ? '직원기본정보' 
            : workbook.SheetNames.find(name => name.includes('직원')) || workbook.SheetNames[0]
          
          const worksheet = workbook.Sheets[employeeSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          const employees = convertFromExcelFormat(jsonData)
          cachedEmployeeData = employees
          console.log('기본 Excel 파일에서 데이터 로드 완료:', employees.length, '명')
          return employees
        } catch (fileError) {
          console.log('파일 로드 실패, 생성된 데이터 사용')
        }
      }
    } catch (error) {
      console.log('서버 사이드 파일 로드 오류:', error)
    }
  }
  
  // Excel 파일이 없으면 빈 배열 반환 (Excel 업로드 필수)
  console.log('Excel 파일 업로드 필요')
  return []
}

/**
 * AI 설정 가져오기
 */
export function getAISettings() {
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
 * C사 인상률 가져오기
 */
export function getCompetitorIncreaseRate(): number {
  return cachedCompetitorIncrease || 0
}

/**
 * 직급별 통계 계산 (대시보드용)
 */
export async function getLevelStatistics() {
  const employees = await getEmployeeData()
  
  const levels = ['Lv.4', 'Lv.3', 'Lv.2', 'Lv.1', '신입']
  
  return levels.map(level => {
    const levelEmployees = employees.filter(e => e.level === level)
    const totalSalary = levelEmployees.reduce((sum, e) => sum + e.currentSalary, 0)
    const avgSalary = levelEmployees.length > 0 ? totalSalary / levelEmployees.length : 0
    
    return {
      level,
      employeeCount: levelEmployees.length,
      averageSalary: Math.round(avgSalary),
      totalSalary,
      minSalary: levelEmployees.length > 0 ? Math.min(...levelEmployees.map(e => e.currentSalary)) : 0,
      maxSalary: levelEmployees.length > 0 ? Math.max(...levelEmployees.map(e => e.currentSalary)) : 0
    }
  }).filter(stat => stat.employeeCount > 0) // 인원이 0인 직급 제외
}

/**
 * 직군별 통계 계산 (Pay Band용)
 */
export async function getBandStatistics() {
  const employees = await getEmployeeData()
  return calculateBandStatistics(employees)
}

/**
 * 직군×직급 상세 데이터
 */
export async function getBandLevelDetails() {
  const employees = await getEmployeeData()
  const competitorData = getCompetitorData()
  const aiSettings = getAISettings()
  
  // 실제 데이터에서 유니크한 직군 추출
  const uniqueBands = Array.from(new Set(employees.map(e => e.band).filter(Boolean))).sort()
  
  const result: any[] = []
  
  // 각 직군별로 통계 계산
  for (const bandName of uniqueBands) {
    const bandEmployees = employees.filter(e => e.band === bandName)
    const levels = ['Lv.4', 'Lv.3', 'Lv.2', 'Lv.1', '신입']
    
    const levelStats = levels.map(level => {
      const levelEmployees = bandEmployees.filter(e => e.level === level)
      const salaries = levelEmployees.map(e => e.currentSalary)
      
      // 우리 회사 평균 급여
      const ourAvgSalary = salaries.length > 0 
        ? salaries.reduce((a, b) => a + b, 0) / salaries.length 
        : 0
      
      // C사 평균 급여 찾기
      const competitorEntry = competitorData.find(
        c => c.band === bandName && c.level === level
      )
      const competitorAvgSalary = competitorEntry?.averageSalary || 0
      
      // 경쟁력 계산 (우리 회사 / C사 * 100)
      const competitiveness = competitorAvgSalary > 0 
        ? Math.round((ourAvgSalary / competitorAvgSalary) * 100)
        : 0
      
      // Base-up 금액 계산 - 초기값은 0 (사용자가 조정할 때 계산됨)
      // Band 페이지에서는 사용자가 슬라이더로 조정한 값을 사용해야 함
      const baseUpAmount = 0 // 초기값 0
      
      return {
        level,
        headcount: levelEmployees.length,
        meanBasePay: ourAvgSalary,
        baseUpKRW: baseUpAmount,
        baseUpRate: 0, // 초기값 0
        sblIndex: competitiveness,  // 우리회사 vs C사 경쟁력
        caIndex: competitorAvgSalary,  // C사 평균 급여
        competitiveness: competitiveness,
        market: {
          min: salaries.length > 0 ? Math.min(...salaries) : 0,
          q1: calculatePercentile(salaries, 25),
          median: calculatePercentile(salaries, 50),
          q3: calculatePercentile(salaries, 75),
          max: salaries.length > 0 ? Math.max(...salaries) : 0
        },
        company: {
          median: calculatePercentile(salaries, 50),
          mean: ourAvgSalary,
          values: []
        },
        competitor: {
          median: competitorAvgSalary
        }
      }
    }).filter(level => level.level !== '신입') // 신입 제외
    
    const totalHeadcount = bandEmployees.length
    const avgSalary = totalHeadcount > 0
      ? bandEmployees.reduce((sum, e) => sum + e.currentSalary, 0) / totalHeadcount
      : 0
    
    // 직군 평균 SBL/CA 지수 계산
    const avgSBLIndex = levelStats.length > 0
      ? levelStats.reduce((sum, l) => sum + l.sblIndex * l.headcount, 0) / 
        levelStats.reduce((sum, l) => sum + l.headcount, 0)
      : 0
      
    const avgCAIndex = levelStats.length > 0  
      ? levelStats.reduce((sum, l) => sum + l.caIndex * l.headcount, 0) /
        levelStats.reduce((sum, l) => sum + l.headcount, 0)
      : 0
    
    // 직군별 총 예산 영향도 계산 (각 레벨의 base-up 금액 * 인원수 합계)
    const totalBudgetImpact = levelStats.reduce((sum, l) => {
      return sum + (l.baseUpKRW * l.headcount)
    }, 0)
    
    // 평균 Base-up 비율 (가중평균)
    const avgBaseUpRate = levelStats.length > 0
      ? levelStats.reduce((sum, l) => sum + l.baseUpRate * l.headcount, 0) /
        levelStats.reduce((sum, l) => sum + l.headcount, 0)
      : 0
    
    const bandData = {
      id: bandName.toLowerCase().replace(/[&\s]/g, '_'),
      name: bandName,
      totalHeadcount,
      avgBaseUpRate: avgBaseUpRate || 0,
      avgSBLIndex: avgSBLIndex || 0,
      avgCAIndex: avgCAIndex || 0,
      totalBudgetImpact: totalBudgetImpact,
      levels: levelStats
    }
    
    result.push(bandData)
  }
  
  return result
}

/**
 * 대시보드 데이터 가져오기 (AI 설정 포함)
 */
export async function getDashboardData() {
  const employees = await getEmployeeData()
  const aiSettings = getAISettings()
  const competitorRate = getCompetitorIncreaseRate()
  
  return {
    employees,
    aiRecommendation: aiSettings,
    competitorIncreaseRate: competitorRate,
    totalEmployees: employees.length
  }
}

/**
 * 대시보드용 요약 데이터
 */
export async function getDashboardSummary() {
  const employees = await getEmployeeData()
  
  // 데이터가 없으면 빈 응답 반환
  if (!employees || employees.length === 0) {
    return {
      summary: {
        totalEmployees: 0,
        averageSalary: 0,
        totalPayroll: 0,
        lastUpdated: new Date().toISOString()
      },
      aiRecommendation: null,
      budget: null,
      levelStatistics: [],
      departmentDistribution: [],
      performanceDistribution: [],
      industryComparison: null
    }
  }
  
  const levelStats = await getLevelStatistics()
  const competitorData = getCompetitorData()
  
  // 부서별 분포 계산
  const deptMap = new Map()
  employees.forEach(emp => {
    const dept = emp.department || '미지정'
    deptMap.set(dept, (deptMap.get(dept) || 0) + 1)
  })
  const departmentDistribution = Array.from(deptMap.entries()).map(([dept, count]) => ({
    department: dept,
    _count: { id: count }
  }))
  
  // 성과등급별 분포 계산
  const perfMap = new Map()
  employees.forEach(emp => {
    const rating = emp.performanceRating || 'N/A'
    perfMap.set(rating, (perfMap.get(rating) || 0) + 1)
  })
  const performanceDistribution = Array.from(perfMap.entries()).map(([rating, count]) => ({
    performanceRating: rating,
    _count: { id: count }
  }))
  
  // 전체 평균 급여
  const totalSalary = employees.reduce((sum, e) => sum + e.currentSalary, 0)
  const avgSalary = totalSalary / employees.length
  
  // 경쟁사 평균 급여 계산
  let competitorAvgSalary = 0
  if (competitorData && competitorData.length > 0) {
    const totalCompetitorSalary = competitorData.reduce((sum, c) => sum + c.averageSalary, 0)
    competitorAvgSalary = totalCompetitorSalary / competitorData.length
  }
  
  // AI 제안 인상률 (캐시된 값 또는 기본값)
  const aiRecommendation = cachedAISettings || {
    baseUpPercentage: 0,
    meritIncreasePercentage: 0,
    totalPercentage: 0,
    minRange: 0,
    maxRange: 0
  }
  
  // 예산 정보 - AI 설정값 기반으로 계산하되, 사용 예산은 0
  const directBudget = totalSalary * (aiRecommendation.totalPercentage / 100)
  const indirectCost = directBudget * 0.178 // 간접비용 17.8%
  const totalBudget = directBudget + indirectCost // 총예산
  
  return {
    summary: {
      totalEmployees: employees.length,
      averageSalary: Math.round(avgSalary),
      totalPayroll: totalSalary,
      lastUpdated: new Date().toISOString()
    },
    aiRecommendation,
    budget: {
      totalBudget: Math.round(totalBudget).toString(), // 총예산
      baseUpBudget: totalSalary * (aiRecommendation.baseUpPercentage / 100),
      meritBudget: totalSalary * (aiRecommendation.meritIncreasePercentage / 100),
      usedBudget: 0, // 초기 사용 예산은 0
      remainingBudget: totalBudget // 잔여 예산 = 총예산
    },
    levelStatistics: levelStats,
    departmentDistribution,
    performanceDistribution,
    industryComparison: {
      ourCompany: aiRecommendation.totalPercentage,
      competitor: cachedCompetitorIncrease || 0 // C사 인상률
    },
    competitorData: cachedCompetitorData // 경쟁사 데이터
  }
}

/**
 * 엑셀 파일 업로드 처리
 */
export async function uploadEmployeeExcel(file: File): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    const employees = await loadEmployeeDataFromExcel(file)
    
    if (employees.length === 0) {
      return {
        success: false,
        message: '유효한 데이터가 없습니다.'
      }
    }
    
    // 데이터 검증
    const requiredFields = ['employeeId', 'name', 'department', 'level', 'currentSalary']
    const invalidRows = employees.filter(emp => 
      requiredFields.some(field => !emp[field as keyof EmployeeRecord])
    )
    
    if (invalidRows.length > 0) {
      return {
        success: false,
        message: `${invalidRows.length}개 행에 필수 데이터가 누락되었습니다.`
      }
    }
    
    // 캐시에 새 데이터 저장
    cachedEmployeeData = employees
    modifiedEmployeeData = employees
    
    // 파일 저장은 API 라우트에서 처리 (서버 사이드에서만 가능)
    
    return {
      success: true,
      message: `${employees.length}명의 직원 데이터를 성공적으로 로드했습니다.`,
      data: {
        totalCount: employees.length,
        levelDistribution: await getLevelStatistics(),
        bandDistribution: await getBandStatistics()
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `파일 처리 중 오류가 발생했습니다: ${error}`
    }
  }
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
  
  // 수정된 데이터가 없으면 원본 복사
  if (!modifiedEmployeeData) {
    modifiedEmployeeData = [...employees]
  }
  
  // 업데이트
  modifiedEmployeeData[index] = {
    ...modifiedEmployeeData[index],
    ...updates
  }
  
  return modifiedEmployeeData[index]
}

/**
 * 직원 검색
 */
export async function searchEmployees(params: {
  page?: number
  limit?: number
  level?: string
  department?: string
  search?: string
}): Promise<{
  employees: EmployeeRecord[]
  total: number
  page: number
  totalPages: number
}> {
  const employees = await getEmployeeData()
  
  // 필터링
  let filtered = employees
  
  if (params.level) {
    filtered = filtered.filter(emp => emp.level === params.level)
  }
  
  if (params.department) {
    filtered = filtered.filter(emp => emp.department === params.department)
  }
  
  if (params.search) {
    const searchLower = params.search.toLowerCase()
    filtered = filtered.filter(emp => 
      emp.name.toLowerCase().includes(searchLower) ||
      emp.employeeId.toLowerCase().includes(searchLower)
    )
  }
  
  // 페이지네이션
  const page = params.page || 1
  const limit = params.limit || 20
  const start = (page - 1) * limit
  const end = start + limit
  
  const paginatedEmployees = filtered.slice(start, end)
  
  return {
    employees: paginatedEmployees,
    total: filtered.length,
    page,
    totalPages: Math.ceil(filtered.length / limit)
  }
}

/**
 * 직원별 급여 계산
 */
export async function calculateEmployeeSalary(
  employeeId: string,
  baseUpPercentage: number,
  meritPercentage: number
): Promise<{
  currentSalary: number
  baseUpAmount: number
  meritAmount: number
  suggestedSalary: number
  totalIncreasePercentage: number
} | null> {
  const employees = await getEmployeeData()
  const employee = employees.find(emp => emp.employeeId === employeeId)
  
  if (!employee) {
    return null
  }
  
  const baseUpAmount = Math.round(employee.currentSalary * (baseUpPercentage / 100))
  const meritAmount = Math.round(employee.currentSalary * (meritPercentage / 100))
  const suggestedSalary = employee.currentSalary + baseUpAmount + meritAmount
  const totalIncreasePercentage = ((suggestedSalary - employee.currentSalary) / employee.currentSalary) * 100
  
  return {
    currentSalary: employee.currentSalary,
    baseUpAmount,
    meritAmount,
    suggestedSalary,
    totalIncreasePercentage
  }
}


/**
 * 현재 메모리의 데이터를 엑셀로 내보내기
 */
export function exportCurrentData(): EmployeeRecord[] {
  return modifiedEmployeeData || cachedEmployeeData || []
}