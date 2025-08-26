/**
 * [개발/테스트 전용] 직군별 인원 및 급여 데이터 생성 유틸리티
 * 
 * ⚠️ 주의: 이 파일은 개발 및 테스트 목적으로만 사용됩니다.
 * 프로덕션 환경에서는 Excel 파일 데이터를 사용합니다.
 * 
 * 사용 시나리오:
 * - npm run generate:test-excel 실행 시
 * - 개발 환경에서 샘플 데이터 필요 시
 */

export interface EmployeeRecord {
  employeeId: string          // 사번
  name: string                 // 이름
  department: string           // 부서
  band: string                 // 직군
  level: string               // 직급 (Lv.1 ~ Lv.4)
  position?: string           // 직책
  hireDate: string            // 입사일
  currentSalary: number       // 현재 연봉
  performanceRating?: 'ST' | 'AT' | 'OT' | 'BT'  // 평가등급
  company?: string            // 회사 (SBL, C사 등)
  payZone?: number | string   // Pay Zone (0-5 또는 동적 범위)
}

// 직군 정의
export const BANDS = [
  { name: '생산', ratio: 0.30, salaryMultiplier: 0.95 },
  { name: '영업', ratio: 0.18, salaryMultiplier: 1.05 },
  { name: '생산기술', ratio: 0.14, salaryMultiplier: 1.02 },
  { name: '경영지원', ratio: 0.12, salaryMultiplier: 1.00 },
  { name: '품질보증', ratio: 0.09, salaryMultiplier: 0.98 },
  { name: '기획', ratio: 0.07, salaryMultiplier: 1.08 },
  { name: '구매&물류', ratio: 0.06, salaryMultiplier: 0.96 },
  { name: 'Facility', ratio: 0.04, salaryMultiplier: 0.92 }
]

// 직급별 기본 정보 (대시보드와 동일)
export const LEVEL_INFO = {
  'Lv.4': { 
    headcount: 61, 
    avgSalary: 108469574,
    ratio: 0.0124,
    minSalary: 95000000,
    maxSalary: 130000000
  },
  'Lv.3': { 
    headcount: 475, 
    avgSalary: 87599520,
    ratio: 0.0965,
    minSalary: 75000000,
    maxSalary: 100000000
  },
  'Lv.2': { 
    headcount: 1506, 
    avgSalary: 67376032,
    ratio: 0.3058,
    minSalary: 55000000,
    maxSalary: 80000000
  },
  'Lv.1': { 
    headcount: 2883, 
    avgSalary: 51977513,
    ratio: 0.5853,
    minSalary: 40000000,
    maxSalary: 65000000
  },
  '신입': { 
    headcount: 0, 
    avgSalary: 38000000,
    ratio: 0,
    minSalary: 35000000,
    maxSalary: 42000000
  }
}

// 부서 매핑 (여러 부서가 하나의 직군으로)
export const DEPARTMENT_BAND_MAPPING: Record<string, string> = {
  '생산1팀': '생산',
  '생산2팀': '생산',
  '생산3팀': '생산',
  '영업1팀': '영업',
  '영업2팀': '영업',
  '해외영업팀': '영업',
  '개발팀': '생산기술',
  '기술연구소': '생산기술',
  '인사팀': '경영지원',
  '재무팀': '경영지원',
  '총무팀': '경영지원',
  '품질관리팀': '품질보증',
  '품질보증팀': '품질보증',
  '전략기획팀': '기획',
  '사업기획팀': '기획',
  '구매팀': '구매&물류',
  '물류팀': '구매&물류',
  '시설관리팀': 'Facility',
  '안전환경팀': 'Facility'
}

// 정규분포를 사용한 급여 생성
function generateSalary(avgSalary: number, min: number, max: number, bandMultiplier: number = 1.0): number {
  // Box-Muller 변환을 사용한 정규분포 생성
  const u1 = Math.random()
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  
  // 표준편차를 평균의 15%로 설정
  const stdDev = avgSalary * 0.15
  let salary = avgSalary + z * stdDev
  
  // 직군별 조정 적용
  salary = salary * bandMultiplier
  
  // 최소/최대 범위 내로 제한
  salary = Math.max(min, Math.min(max, salary))
  
  // 만원 단위로 반올림
  return Math.round(salary / 10000) * 10000
}

// 직급별 직군 내 분포 조정 (직군 특성 반영)
function getAdjustedLevelRatio(band: string, level: string): number {
  const baseRatio = LEVEL_INFO[level as keyof typeof LEVEL_INFO]?.ratio || 0
  
  // 직군별 특성에 따른 조정 (미세 조정)
  if (band === '기획' || band === '경영지원') {
    // 기획/경영지원은 상위 직급 비중이 약간 높음
    if (level === 'Lv.4' || level === 'Lv.3') return baseRatio * 1.2
    if (level === 'Lv.1' || level === '신입') return baseRatio * 0.9
  } else if (band === '생산' || band === '영업') {
    // 생산/영업은 하위 직급 비중이 약간 높음
    if (level === 'Lv.1' || level === 'Lv.2') return baseRatio * 1.05
    if (level === 'Lv.4') return baseRatio * 0.8
  }
  
  return baseRatio
}

// 테스트용 직원 데이터 생성 (개발 환경 전용)
export function generateEmployeeData(totalCount: number = 1000): EmployeeRecord[] {
  // 개발 환경이 아니면 경고
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ generateEmployeeData는 개발 환경 전용입니다. 프로덕션에서는 Excel 데이터를 사용하세요.')
    return []
  }
  const employees: EmployeeRecord[] = []
  const departments = Object.keys(DEPARTMENT_BAND_MAPPING)
  const levels = ['Lv.4', 'Lv.3', 'Lv.2', 'Lv.1', '신입']
  
  let employeeCounter = 1
  
  // 각 직군별로 인원 생성
  for (const band of BANDS) {
    const bandHeadcount = Math.round(totalCount * band.ratio)
    
    // 직군 내 직급별 인원 분배
    const levelDistribution: Record<string, number> = {}
    let totalAssigned = 0
    
    for (const level of levels) {
      const adjustedRatio = getAdjustedLevelRatio(band.name, level)
      const count = Math.round(bandHeadcount * adjustedRatio)
      levelDistribution[level] = count
      totalAssigned += count
    }
    
    // 차이 조정 (가장 큰 그룹에 추가/제거)
    const diff = bandHeadcount - totalAssigned
    if (diff !== 0) {
      const maxLevel = 'Lv.1' // 가장 큰 그룹
      levelDistribution[maxLevel] += diff
    }
    
    // 직급별로 직원 생성
    for (const level of levels) {
      const count = levelDistribution[level]
      const levelInfo = LEVEL_INFO[level as keyof typeof LEVEL_INFO]
      
      // 해당 직군의 부서들
      const bandDepartments = departments.filter(dept => 
        DEPARTMENT_BAND_MAPPING[dept] === band.name
      )
      
      for (let i = 0; i < count; i++) {
        // 랜덤하게 부서 선택
        const department = bandDepartments[Math.floor(Math.random() * bandDepartments.length)]
        
        // 입사일 생성 (직급이 높을수록 오래됨)
        const yearsAgo = level === 'Lv.4' ? 10 + Math.random() * 10 :
                        level === 'Lv.3' ? 5 + Math.random() * 8 :
                        level === 'Lv.2' ? 2 + Math.random() * 5 :
                        level === 'Lv.1' ? 1 + Math.random() * 3 :
                        Math.random() * 1
        
        const hireDate = new Date()
        hireDate.setFullYear(hireDate.getFullYear() - Math.floor(yearsAgo))
        hireDate.setMonth(Math.floor(Math.random() * 12))
        hireDate.setDate(Math.floor(Math.random() * 28) + 1)
        
        // 평가등급 분포 생성 (S:10%, A:30%, B:50%, C:10%)
        const performanceRand = Math.random()
        const performanceRating = performanceRand < 0.1 ? 'ST' :
                                  performanceRand < 0.4 ? 'AT' :
                                  performanceRand < 0.9 ? 'OT' : 'BT'
        
        const employee: EmployeeRecord = {
          employeeId: `EMP${String(employeeCounter).padStart(5, '0')}`,
          name: `직원${employeeCounter}`,
          department,
          band: band.name,
          level,
          position: level === 'Lv.4' ? '부장' :
                   level === 'Lv.3' ? '차장' :
                   level === 'Lv.2' ? '과장' :
                   level === 'Lv.1' ? '대리' : '사원',
          hireDate: hireDate.toISOString().split('T')[0],
          currentSalary: generateSalary(
            levelInfo.avgSalary,
            levelInfo.minSalary,
            levelInfo.maxSalary,
            band.salaryMultiplier
          ),
          performanceRating
        }
        
        employees.push(employee)
        employeeCounter++
      }
    }
  }
  
  return employees
}

// 직군별 통계 계산
export function calculateBandStatistics(employees: EmployeeRecord[]) {
  const bandStats: Record<string, any> = {}
  
  for (const band of BANDS) {
    const bandEmployees = employees.filter(e => e.band === band.name)
    const levels = ['Lv.4', 'Lv.3', 'Lv.2', 'Lv.1', '신입']
    
    const levelStats = levels.map(level => {
      const levelEmployees = bandEmployees.filter(e => e.level === level)
      const salaries = levelEmployees.map(e => e.currentSalary)
      
      return {
        level,
        headcount: levelEmployees.length,
        meanSalary: salaries.length > 0 
          ? salaries.reduce((a, b) => a + b, 0) / salaries.length 
          : 0,
        minSalary: salaries.length > 0 ? Math.min(...salaries) : 0,
        maxSalary: salaries.length > 0 ? Math.max(...salaries) : 0,
        q1Salary: calculatePercentile(salaries, 25),
        medianSalary: calculatePercentile(salaries, 50),
        q3Salary: calculatePercentile(salaries, 75)
      }
    })
    
    bandStats[band.name] = {
      name: band.name,
      totalHeadcount: bandEmployees.length,
      levels: levelStats,
      avgSalary: bandEmployees.length > 0
        ? bandEmployees.reduce((sum, e) => sum + e.currentSalary, 0) / bandEmployees.length
        : 0
    }
  }
  
  return bandStats
}

// 백분위수 계산 헬퍼
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  
  const sorted = [...values].sort((a, b) => a - b)
  const index = (percentile / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower
  
  if (lower === upper) {
    return sorted[lower]
  }
  
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

// 엑셀 데이터 형식으로 변환
export function convertToExcelFormat(employees: EmployeeRecord[]) {
  return employees.map(emp => ({
    '사번': emp.employeeId,
    '이름': emp.name,
    '부서': emp.department,
    '직군': emp.band,
    '직급': emp.level,
    '직책': emp.position || '',
    '입사일': emp.hireDate,
    '현재연봉': emp.currentSalary,
    '평가등급': emp.performanceRating || 'OT'
  }))
}

// 엑셀에서 읽은 데이터를 내부 형식으로 변환
export function convertFromExcelFormat(excelData: any[]): EmployeeRecord[] {
  // 첫 번째 행의 컬럼명 확인을 위한 디버깅
  if (excelData.length > 0) {
    console.log('Excel 데이터 첫 번째 행 컬럼:', Object.keys(excelData[0]))
    console.log('Excel 데이터 샘플:', excelData[0])
  }
  
  return excelData
    .filter(row => row['직급'] !== 'Lv0')  // Lv0 (외주인력) 제외
    .map((row, index) => {
      // 평가등급 데이터 체크 - 여러 가능한 컬럼명 확인
      const rating = row['평가등급'] || row['평가'] || row['성과등급'] || row['성과'] || row['Performance'] || row['Rating']
      
      // Pay Zone 데이터 체크 - 여러 가능한 컬럼명 확인 (문자열 그대로 사용)
      const payZone = row['Pay Zone'] || row['PayZone'] || row['pay zone'] || row['payzone'] || row['페이존'] || row['페이 존']
      
      if (index < 5) {
        console.log(`직원 ${index + 1} 데이터 매핑:`, {
          '평가등급': rating,
          'Pay Zone': payZone,
          '직군': row['직군'],
          '직급': row['직급']
        })
      }
      
      return {
        employeeId: row['사번'] || '',
        name: row['이름'] || '',
        department: row['부서'] || '',
        band: row['직군'] || '',
        level: row['직급'] || '',
        performanceRating: rating as 'ST' | 'AT' | 'OT' | 'BT' | undefined,
        position: row['직책'] || undefined,
        hireDate: row['입사일'] || '',
        currentSalary: Number(row['현재연봉']) || 0,
        payZone: payZone  // 문자열 그대로 사용
      }
    })
}