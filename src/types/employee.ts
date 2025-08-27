// 직원 관련 타입 정의

// 기본 직원 정보
export interface BaseEmployee {
  id: string
  name: string
  employeeNumber?: string
  department: string
  team?: string
  position?: string
  joinDate?: string
  hireDate?: string
}

// 급여 정보
export interface SalaryInfo {
  currentSalary: number
  baseSalary?: number
  previousSalary?: number
  salaryGrade?: string
  payStep?: number
}

// 인상 정보
export interface IncreaseInfo {
  baseUpAmount: number
  baseUpPercentage: number
  meritAmount: number
  meritPercentage: number
  promotionAmount?: number
  promotionPercentage?: number
  advancementAmount?: number
  advancementPercentage?: number
  additionalAmount?: number
  additionalPercentage?: number
  totalAmount: number
  totalPercentage: number
}

// 직급 및 평가 정보
export interface GradeInfo {
  level: string  // 직급 (Lv.1, Lv.2, ...)
  band: string   // 직군 (생산, 영업, ...)
  payZone?: string | number  // Pay Zone ('Lv.1', 'Lv.2' 또는 1-8)
  performanceRating: string  // 평가등급 (ST, AT, OT, BT, ...)
  performanceWeight?: number  // 평가 가중치
}

// 경쟁사 비교 정보
export interface CompetitorComparison {
  competitorSalary?: number
  sblIndex?: number  // SBL 지수
  caIndex?: number   // CA 지수
  marketPosition?: 'above' | 'at' | 'below'
}

// 통합 직원 타입
export interface Employee extends BaseEmployee, SalaryInfo, GradeInfo {
  increaseInfo?: IncreaseInfo
  competitorComparison?: CompetitorComparison
  metadata?: Record<string, any>  // 추가 메타데이터
}

// 직원 목록 응답 타입
export interface EmployeeListResponse {
  employees: Employee[]
  totalCount: number
  page?: number
  pageSize?: number
}

// 직원 필터 타입
export interface EmployeeFilter {
  department?: string
  band?: string
  level?: string
  payZone?: string | number
  performanceRating?: string
  salaryRange?: {
    min?: number
    max?: number
  }
}

// 직원 정렬 옵션
export interface EmployeeSort {
  field: keyof Employee | 'increaseAmount' | 'increasePercentage'
  direction: 'asc' | 'desc'
}

// 엑셀에서 읽은 원본 직원 데이터
export interface RawEmployeeData {
  이름?: string
  사번?: string
  부서?: string
  직급?: string
  직군?: string
  'Pay Zone'?: string | number  // 'Lv.1', 'Lv.2' 또는 숫자
  평가등급?: string
  기본급?: number
  현재급여?: number
  [key: string]: string | number | undefined  // 엑셀의 다양한 컬럼 허용
}

// 직원 통계 타입
export interface EmployeeStatistics {
  totalCount: number
  averageSalary: number
  totalSalary: number
  averageIncrease: number
  totalIncrease: number
  byLevel: Record<string, {
    count: number
    averageSalary: number
    averageIncrease: number
  }>
  byDepartment: Record<string, {
    count: number
    averageSalary: number
    averageIncrease: number
  }>
  byPerformance: Record<string, {
    count: number
    averageSalary: number
    averageIncrease: number
  }>
}