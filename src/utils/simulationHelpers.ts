// 시뮬레이션 계산 및 동기화 유틸리티 함수

import { Employee } from '@/types'
import { 
  AdjustmentRates, 
  BandFinalRates, 
  LevelRates, 
  PayZoneRates,
  DynamicStructure 
} from '@/types/simulation'

// 실제 조합 개수 계산
export const getActualCombinationCount = (
  contextEmployeeData: Employee[],
  adjustmentMode: string
): number => {
  if (!contextEmployeeData || contextEmployeeData.length === 0) return 0
  
  const combinations = new Set<string>()
  
  if (adjustmentMode === 'expert') {
    contextEmployeeData.forEach(emp => {
      if (emp.payZone !== undefined && emp.band && emp.level) {
        combinations.add(`${emp.payZone}-${emp.band}-${emp.level}`)
      }
    })
  } else if (adjustmentMode === 'advanced') {
    contextEmployeeData.forEach(emp => {
      if (emp.band && emp.level) {
        combinations.add(`${emp.band}-${emp.level}`)
      }
    })
  } else {
    contextEmployeeData.forEach(emp => {
      if (emp.level) {
        combinations.add(emp.level)
      }
    })
  }
  
  return combinations.size
}

// 직군 평균 계산
export const calculateBandAverage = (
  band: string,
  field: 'baseUp' | 'merit',
  contextEmployeeData: Employee[],
  dynamicStructure: DynamicStructure,
  bandFinalRates: BandFinalRates,
  levelRates: LevelRates
): number => {
  if (!contextEmployeeData || !band) return 0
  
  let total = 0
  let count = 0
  
  dynamicStructure.levels.forEach(level => {
    const empCount = contextEmployeeData.filter(emp => emp.band === band && emp.level === level).length
    if (empCount > 0) {
      const rate = bandFinalRates[band]?.[level]?.[field] || levelRates[level]?.[field] || 0
      total += rate * empCount
      count += empCount
    }
  })
  
  return count > 0 ? total / count : 0
}

// Pay Zone×Band 평균 급여 계산
export const calculateAverageSalary = (
  payZone: number,
  band: string,
  contextEmployeeData: Employee[]
): number => {
  if (!contextEmployeeData) return 0
  
  const employees = contextEmployeeData.filter(
    emp => emp.payZone === payZone && emp.band === band
  )
  
  if (employees.length === 0) return 0
  
  const totalSalary = employees.reduce((sum, emp) => sum + (emp.currentSalary || 0), 0)
  return totalSalary / employees.length
}

// Pay Zone×Band 예산 영향 계산
export const calculateZoneBandBudget = (
  payZone: number,
  band: string,
  contextEmployeeData: Employee[],
  payZoneRates: PayZoneRates,
  bandFinalRates: BandFinalRates,
  levelRates: LevelRates
): number => {
  if (!contextEmployeeData) return 0
  
  const employees = contextEmployeeData.filter(
    emp => emp.payZone === payZone && emp.band === band
  )
  
  let totalIncrease = 0
  
  employees.forEach(emp => {
    const rates = payZoneRates[payZone]?.[band]?.[emp.level] || 
                 bandFinalRates[band]?.[emp.level] || 
                 levelRates[emp.level] || 
                 { baseUp: 0, merit: 0, additional: 0 }
    
    const totalRate = (rates.baseUp + rates.merit + (rates.additional || 0)) / 100
    totalIncrease += emp.currentSalary * totalRate
  })
  
  return totalIncrease * 1.178 // 간접비용 포함
}

// PayZone 데이터로부터 Band×Level 평균 계산
export const updateBandRatesFromPayZones = (
  band: string,
  level: string,
  field: 'baseUp' | 'merit',
  contextEmployeeData: Employee[],
  dynamicStructure: DynamicStructure,
  payZoneRates: PayZoneRates,
  bandFinalRates: BandFinalRates,
  levelRates: LevelRates
): number | null => {
  if (!contextEmployeeData) return null
  
  let totalWeighted = 0
  let totalCount = 0
  
  dynamicStructure.payZones.forEach(zone => {
    const empCount = contextEmployeeData.filter(
      emp => emp.payZone === zone && emp.band === band && emp.level === level
    ).length
    
    if (empCount > 0) {
      const rate = payZoneRates[zone]?.[band]?.[level]?.[field] || 
                  bandFinalRates[band]?.[level]?.[field] || 
                  levelRates[level]?.[field] || 0
      totalWeighted += rate * empCount
      totalCount += empCount
    }
  })
  
  if (totalCount > 0) {
    return totalWeighted / totalCount
  }
  
  return null
}

// Band 데이터로부터 Level 평균 계산
export const updateLevelRatesFromBands = (
  level: string,
  field: 'baseUp' | 'merit',
  contextEmployeeData: Employee[],
  dynamicStructure: DynamicStructure,
  bandFinalRates: BandFinalRates,
  levelRates: LevelRates
): number | null => {
  if (!contextEmployeeData) return null
  
  let totalWeighted = 0
  let totalCount = 0
  
  dynamicStructure.bands.forEach(band => {
    const empCount = contextEmployeeData.filter(emp => emp.band === band && emp.level === level).length
    if (empCount > 0) {
      const rate = bandFinalRates[band]?.[level]?.[field] || levelRates[level]?.[field] || 0
      totalWeighted += rate * empCount
      totalCount += empCount
    }
  })
  
  if (totalCount > 0) {
    return totalWeighted / totalCount
  }
  
  return null
}

// Expert → Advanced 동기화 (Pay Zone별 가중평균)
export const calculateAdvancedFromExpert = (
  expertRates: PayZoneRates,
  contextEmployeeData: Employee[],
  dynamicStructure: DynamicStructure
): BandFinalRates => {
  if (!contextEmployeeData) return {}
  
  const newBandRates: BandFinalRates = {}
  
  dynamicStructure.bands.forEach(band => {
    newBandRates[band] = {}
    dynamicStructure.levels.forEach(level => {
      let totalBaseUp = 0
      let totalMerit = 0
      let totalCount = 0
      
      dynamicStructure.payZones.forEach(zone => {
        const empCount = contextEmployeeData.filter(emp => 
          emp.payZone === zone && emp.band === band && emp.level === level
        ).length
        
        if (empCount > 0) {
          const rates = expertRates[zone]?.[band]?.[level] || { baseUp: 0, merit: 0 }
          totalBaseUp += rates.baseUp * empCount
          totalMerit += rates.merit * empCount
          totalCount += empCount
        }
      })
      
      if (totalCount > 0) {
        newBandRates[band][level] = {
          baseUp: totalBaseUp / totalCount,
          merit: totalMerit / totalCount
        }
      }
    })
  })
  
  return newBandRates
}

// Expert → Simple 동기화 (전체 가중평균)
export const calculateSimpleFromExpert = (
  expertRates: PayZoneRates,
  contextEmployeeData: Employee[],
  dynamicStructure: DynamicStructure
): LevelRates => {
  if (!contextEmployeeData) return {}
  
  const newLevelRates: LevelRates = {}
  
  dynamicStructure.levels.forEach(level => {
    let totalBaseUp = 0
    let totalMerit = 0
    let totalCount = 0
    
    dynamicStructure.payZones.forEach(zone => {
      dynamicStructure.bands.forEach(band => {
        const empCount = contextEmployeeData.filter(emp => 
          emp.payZone === zone && emp.band === band && emp.level === level
        ).length
        
        if (empCount > 0) {
          const rates = expertRates[zone]?.[band]?.[level] || { baseUp: 0, merit: 0 }
          totalBaseUp += rates.baseUp * empCount
          totalMerit += rates.merit * empCount
          totalCount += empCount
        }
      })
    })
    
    if (totalCount > 0) {
      newLevelRates[level] = {
        baseUp: totalBaseUp / totalCount,
        merit: totalMerit / totalCount
      }
    }
  })
  
  return newLevelRates
}

// 예산 계산 헬퍼
export const calculateBudgetUsage = (
  contextEmployeeData: Employee[],
  adjustmentMode: string,
  levelRates: LevelRates,
  bandFinalRates: BandFinalRates,
  payZoneRates: PayZoneRates,
  availableBudget: number,
  welfareBudget: number
) => {
  if (!contextEmployeeData || contextEmployeeData.length === 0) {
    return {
      direct: 0,
      indirect: 0,
      total: 0,
      remaining: 0,
      percentage: 0
    }
  }
  
  let totalDirect = 0
  
  contextEmployeeData.forEach(emp => {
    const level = emp.level
    const band = emp.band
    const payZone = emp.payZone
    
    let rates: AdjustmentRates = { baseUp: 0, merit: 0, additional: 0 }
    
    // 모드에 따른 인상률 적용
    if (adjustmentMode === 'expert' && payZone !== undefined && band && payZoneRates[payZone]?.[band]?.[level]) {
      rates = payZoneRates[payZone][band][level]
    } else if (adjustmentMode === 'advanced' && band && bandFinalRates[band]?.[level]) {
      rates = {
        baseUp: bandFinalRates[band][level].baseUp,
        merit: bandFinalRates[band][level].merit,
        additional: 0
      }
    } else if (levelRates[level]) {
      rates = {
        baseUp: levelRates[level].baseUp,
        merit: levelRates[level].merit,
        additional: 0
      }
    }
    
    const totalRate = rates.baseUp + rates.merit + rates.additional
    const increase = emp.currentSalary * (totalRate / 100)
    totalDirect += increase
  })
  
  const totalIndirect = totalDirect * 0.178 // 간접비용 17.8%
  const total = totalDirect + totalIndirect
  const actualBudget = availableBudget - welfareBudget
  const remaining = actualBudget - total
  const percentage = actualBudget > 0 ? (total / actualBudget) * 100 : 0
  
  return {
    direct: totalDirect,
    indirect: totalIndirect,
    total,
    remaining,
    percentage: Math.min(percentage, 200) // 최대 200%까지 표시
  }
}