// 시뮬레이션 페이지 타입 정의

export interface AdjustmentRates {
  baseUp: number
  merit: number
  additional: number
}

export interface DynamicStructure {
  levels: string[]
  bands: string[]
  payZones: (string | number)[]  // 'Lv.1', 'Lv.2' 또는 숫자
  grades: string[]
}

export interface BudgetUsage {
  direct: number
  indirect: number
  total: number
  remaining: number
  percentage: number
}

export type ViewMode = 'adjustment' | 'all' | 'band' | 'payzone' | 'competitiveness'

export type AdjustmentMode = 'simple' | 'advanced' | 'expert'

export type LevelRates = {
  [level: string]: {
    baseUp: number
    merit: number
    additional: number
  }
}

export type BandFinalRates = {
  [band: string]: {
    [level: string]: {
      baseUp: number
      merit: number
      additional: number
    }
  }
}

export type PayZoneRates = {
  [zone: string | number]: {
    [band: string]: {
      [level: string]: AdjustmentRates
    }
  }
}

// 평가등급별 인상률 타입
export interface GradeAdjustmentRates {
  [grade: string]: {
    baseUp: number
    merit: number
    additional: number
  }
}

// 전체 조정 모드용 (평가등급별)
export interface AllAdjustmentRates {
  average: AdjustmentRates
  byGrade: GradeAdjustmentRates
}

// 레벨별 조정 모드용 (레벨-평가등급별)
export interface LevelGradeRates {
  [level: string]: {
    average: AdjustmentRates
    byGrade: GradeAdjustmentRates
    employeeCount: {
      total: number
      byGrade: { [grade: string]: number }
    }
  }
}

// Pay Zone별 조정 모드용 (PayZone-레벨-평가등급별)
export interface BandGradeRates {
  [band: string]: {
    average: AdjustmentRates
    byGrade: GradeAdjustmentRates
    employeeCount: {
      total: number
      byGrade: { [grade: string]: number }
    }
  }
}

export interface PayZoneLevelGradeRates {
  [zone: string]: {
    [level: string]: {
      average: AdjustmentRates
      byGrade: GradeAdjustmentRates
      employeeCount: {
        total: number
        byGrade: { [grade: string]: number }
      }
    }
  }
}

// 평가등급 색상 테마
export const GRADE_COLORS = {
  ST: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    hover: 'hover:bg-purple-100',
    gradient: 'from-purple-500 to-purple-600'
  },
  AT: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    hover: 'hover:bg-blue-100',
    gradient: 'from-blue-500 to-blue-600'
  },
  OT: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    hover: 'hover:bg-green-100',
    gradient: 'from-green-500 to-green-600'
  },
  BT: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    hover: 'hover:bg-orange-100',
    gradient: 'from-orange-500 to-orange-600'
  }
}