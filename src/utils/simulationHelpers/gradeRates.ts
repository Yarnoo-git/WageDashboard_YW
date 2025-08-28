// 평가등급 관련 계산 함수들

import { 
  GradeAdjustmentRates,
  AllAdjustmentRates,
  LevelGradeRates,
  BandGradeRates,
  PayZoneLevelGradeRates
} from '@/types/simulation'

// 전체 → 레벨별 평가등급 전파
export const propagateAllToLevel = (
  allGradeRates: GradeAdjustmentRates,
  levels: string[]
): LevelGradeRates => {
  const levelGradeRates: LevelGradeRates = {}
  
  levels.forEach(level => {
    levelGradeRates[level] = {
      average: { baseUp: 0, merit: 0, additional: 0 },
      byGrade: { ...allGradeRates },
      employeeCount: { total: 0, byGrade: {} }
    }
  })
  
  return levelGradeRates
}

// 레벨별 → Band별 평가등급 전파
export const propagateLevelToBand = (
  levelGradeRates: LevelGradeRates,
  bands: string[]
): BandGradeRates => {
  const bandGradeRates: BandGradeRates = {}
  
  bands.forEach(band => {
    bandGradeRates[band] = {}
    Object.entries(levelGradeRates).forEach(([level, levelData]) => {
      bandGradeRates[band][level] = {
        average: { ...levelData.average },
        byGrade: { ...levelData.byGrade },
        employeeCount: { ...levelData.employeeCount }
      }
    })
  })
  
  return bandGradeRates
}

// 레벨별 → PayZone별 평가등급 전파
export const propagateLevelToPayZoneGrades = (
  levelGradeRates: LevelGradeRates,
  payZones: number[]
): PayZoneLevelGradeRates => {
  const payZoneGradeRates: PayZoneLevelGradeRates = {}
  
  payZones.forEach(zone => {
    payZoneGradeRates[zone] = {}
    Object.entries(levelGradeRates).forEach(([level, levelData]) => {
      payZoneGradeRates[zone][level] = {
        average: { ...levelData.average },
        byGrade: { ...levelData.byGrade },
        employeeCount: { ...levelData.employeeCount }
      }
    })
  })
  
  return payZoneGradeRates
}

// Band별 → PayZone별 평가등급 전파
export const propagateBandToPayZoneGrades = (
  bandGradeRates: BandGradeRates,
  payZones: number[]
): { [payZone: number]: BandGradeRates } => {
  const payZoneBandGradeRates: { [payZone: number]: BandGradeRates } = {}
  
  payZones.forEach(zone => {
    payZoneBandGradeRates[zone] = { ...bandGradeRates }
  })
  
  return payZoneBandGradeRates
}

// 평가등급 평균 계산
export const calculateGradeAverage = (
  gradeRates: GradeAdjustmentRates,
  employeeCountByGrade: { [grade: string]: number }
): { baseUp: number; merit: number; additional: number } => {
  let totalWeight = 0
  let weightedBaseUp = 0
  let weightedMerit = 0
  let weightedAdditional = 0
  
  Object.entries(employeeCountByGrade).forEach(([grade, count]) => {
    if (gradeRates[grade]) {
      totalWeight += count
      weightedBaseUp += gradeRates[grade].baseUp * count
      weightedMerit += gradeRates[grade].merit * count
      weightedAdditional += gradeRates[grade].additional * count
    }
  })
  
  if (totalWeight === 0) {
    return { baseUp: 0, merit: 0, additional: 0 }
  }
  
  return {
    baseUp: weightedBaseUp / totalWeight,
    merit: weightedMerit / totalWeight,
    additional: weightedAdditional / totalWeight
  }
}