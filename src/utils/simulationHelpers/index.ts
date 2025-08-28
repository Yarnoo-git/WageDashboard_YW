// 시뮬레이션 헬퍼 함수들 - Re-export

// 기본 계산 함수들
export {
  calculateWeightedAverage,
  countEmployeesByGrade,
  getActualCombinationCount,
  calculateAverageSalary
} from './calculations'

// Band 관련 함수들
export {
  calculateBandAverage,
  updateLevelRatesFromBands,
  synchronizeBandToLevel,
  propagateBandToPayZone
} from './bandRates'

// PayZone 관련 함수들
export {
  calculateZoneBandBudget,
  updateBandRatesFromPayZones,
  synchronizePayZoneToBand,
  propagateLevelToPayZone
} from './payZoneRates'

// 평가등급 관련 함수들
export {
  propagateAllToLevel,
  propagateLevelToBand,
  propagateLevelToPayZoneGrades,
  propagateBandToPayZoneGrades,
  calculateGradeAverage
} from './gradeRates'

// 예산 관련 함수들
export {
  calculateBudgetUsage,
  calculateEmployeeBudgetImpact,
  calculateTotalBudgetImpact,
  calculateBudgetUtilization
} from './budget'

// 타입들도 re-export
export type {
  AdjustmentRates,
  BandFinalRates,
  LevelRates,
  PayZoneRates,
  DynamicStructure,
  GradeAdjustmentRates,
  AllAdjustmentRates,
  LevelGradeRates,
  BandGradeRates,
  PayZoneLevelGradeRates
} from '@/types/simulation'