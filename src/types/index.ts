// 직급 레벨 - 동적으로 확장 가능
export type EmployeeLevel = string  // 엑셀에서 읽어온 직급 사용 (예: Lv.1, Lv.2, ...)

// 평가 등급 - 동적으로 확장 가능
export type PerformanceRating = string  // 엑셀에서 읽어온 등급 사용 (예: ST, AT, OT, BT, ...)

// 직원 정보
export interface Employee {
  id: string
  name: string
  level: EmployeeLevel
  department: string
  band?: string
  payZone?: number
  performanceRating: PerformanceRating
  currentSalary: number
  baseUpAmount: number
  meritIncreaseAmount: number
  totalIncreaseAmount: number
  increasePercentage: number
}

// 인상률 정보
export interface WageIncrease {
  baseUpPercentage: number
  meritIncreasePercentage: number
  totalPercentage: number
  minRange: number
  maxRange: number
}

// 예산 정보
export interface Budget {
  totalBudget: number
  usedBudget: number
  remainingBudget: number
  usagePercentage: number
}

// 직급별 통계
export interface LevelStatistics {
  level: EmployeeLevel
  employeeCount: number
  averageSalary: number
  totalSalary: number
  baseUpPercentage: number
  meritIncreasePercentage: number
  totalIncreasePercentage: number
}