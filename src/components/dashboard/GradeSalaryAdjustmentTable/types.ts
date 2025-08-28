// GradeSalaryAdjustmentTable 타입 정의

export interface EmployeeData {
  totalCount: number
  levels: {
    [level: string]: {
      headcount: number
      averageSalary: number
    }
  }
}

export interface LevelRates {
  baseUp: number      // Base-up
  merit: number       // 성과 인상률 (수정가능)
  promotion: number   // 승급 인상률 (수정가능)
  advancement: number // 승격 인상률 (수정가능)
  additional: number  // 추가 인상률 (수정가능)
}

export interface GradeSalaryAdjustmentTableProps {
  baseUpRate?: number         // AI 제안 Base-up (고정값)
  meritRate?: number          // AI 제안 성과인상률 기본값
  employeeData?: EmployeeData // 추후 엑셀에서 import된 데이터
  onRateChange?: (level: string, rates: LevelRates) => void
  onTotalBudgetChange?: (totalBudget: number) => void
  enableAdditionalIncrease?: boolean  // 추가 인상 활성화 여부
  onEnableAdditionalIncreaseChange?: (value: boolean) => void  // 추가 인상 활성화 콜백
  onAdditionalBudgetChange?: (additionalBudget: number) => void  // 추가 인상 총액 콜백
  onPromotionBudgetChange?: (levelBudgets: {[key: string]: number}) => void  // 승급/승격 예산 콜백
  onLevelTotalRatesChange?: (levelRates: {[key: string]: number}, weightedAverage: number) => void  // 직급별 총 인상률 및 가중평균 콜백
  onMeritWeightedAverageChange?: (weightedAverage: number) => void  // 성과인상률 가중평균 콜백
  initialRates?: { [key: string]: LevelRates }  // 초기 인상률 값
  onTotalSummaryChange?: (summary: { avgBaseUp: number; avgMerit: number; totalRate: number }) => void  // 전체 평균 콜백
}

export const EMPTY_EMPLOYEE_DATA: EmployeeData = {
  totalCount: 0,
  levels: {
    'Lv.4': { 
      headcount: 0, 
      averageSalary: 0
    },
    'Lv.3': { 
      headcount: 0, 
      averageSalary: 0
    },
    'Lv.2': { 
      headcount: 0, 
      averageSalary: 0
    },
    'Lv.1': { 
      headcount: 0, 
      averageSalary: 0
    }
  }
}

export const LEVELS = ['Lv.4', 'Lv.3', 'Lv.2', 'Lv.1'] as const