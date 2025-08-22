// 시뮬레이션 페이지 타입 정의

export interface AdjustmentRates {
  baseUp: number
  merit: number
  additional: number
}

export interface DynamicStructure {
  levels: string[]
  bands: string[]
  payZones: number[]
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
  [zone: number]: {
    [band: string]: {
      [level: string]: AdjustmentRates
    }
  }
}