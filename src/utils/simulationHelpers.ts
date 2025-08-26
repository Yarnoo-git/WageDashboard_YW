// 시뮬레이션 계산 및 동기화 유틸리티 함수

import { Employee } from '@/types'
import { 
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

// 가중평균 계산 헬퍼
export const calculateWeightedAverage = (
  items: { value: number; count: number }[]
): number => {
  const totalWeight = items.reduce((sum, item) => sum + item.count, 0)
  if (totalWeight === 0) return 0
  
  const weightedSum = items.reduce(
    (sum, item) => sum + (item.value * item.count), 
    0
  )
  return weightedSum / totalWeight
}

// 평가등급별 인원수 계산
export const countEmployeesByGrade = (
  employees: Employee[],
  filter?: { level?: string; payZone?: number }
): { [grade: string]: number } => {
  const counts: { [grade: string]: number } = {}
  
  employees.forEach(emp => {
    if (filter?.level && emp.level !== filter.level) return
    if (filter?.payZone !== undefined && emp.payZone !== filter.payZone) return
    
    const grade = emp.performanceRating
    if (grade) {
      counts[grade] = (counts[grade] || 0) + 1
    }
  })
  
  return counts
}

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

// 레벨별 → PayZone별 평가등급 전파
export const propagateLevelToPayZone = (
  levelGradeRates: LevelGradeRates,
  payZones: number[]
): PayZoneLevelGradeRates => {
  const payZoneRates: PayZoneLevelGradeRates = {}
  
  payZones.forEach(zone => {
    payZoneRates[zone.toString()] = {}
    Object.keys(levelGradeRates).forEach(level => {
      payZoneRates[zone.toString()][level] = { ...levelGradeRates[level] }
    })
  })
  
  return payZoneRates
}

// 우선순위 기반 직원별 Rate 계산 (payzone > level > band > all)
export const getEffectiveRatesForEmployee = (
  employee: Employee,
  adjustmentScope: 'all' | 'band' | 'level' | 'payzone',
  allGradeRates: AllAdjustmentRates,
  bandGradeRates: BandGradeRates,
  levelGradeRates: LevelGradeRates,
  payZoneLevelGradeRates: PayZoneLevelGradeRates
): AdjustmentRates => {
  const grade = employee.performanceRating
  if (!grade) return { baseUp: 0, merit: 0, additional: 0 }
  
  // 우선순위에 따른 rate 결정
  if (adjustmentScope === 'payzone') {
    // PayZone 우선
    const payZoneRate = payZoneLevelGradeRates[employee.payZone || '']?.[employee.level]?.byGrade[grade]
    if (payZoneRate) return payZoneRate
    
    // PayZone 없으면 Level로 fallback
    const levelRate = levelGradeRates[employee.level]?.byGrade[grade]
    if (levelRate) return levelRate
    
    // Level도 없으면 Band로 fallback
    const bandRate = bandGradeRates[employee.band]?.byGrade[grade]
    if (bandRate) return bandRate
    
    // 모두 없으면 All로 fallback
    return allGradeRates.byGrade[grade] || { baseUp: 0, merit: 0, additional: 0 }
  }
  
  if (adjustmentScope === 'level') {
    // Level 우선
    const levelRate = levelGradeRates[employee.level]?.byGrade[grade]
    if (levelRate) return levelRate
    
    // Level 없으면 Band로 fallback
    const bandRate = bandGradeRates[employee.band]?.byGrade[grade]
    if (bandRate) return bandRate
    
    // Band도 없으면 All로 fallback
    return allGradeRates.byGrade[grade] || { baseUp: 0, merit: 0, additional: 0 }
  }
  
  if (adjustmentScope === 'band') {
    // Band 우선
    const bandRate = bandGradeRates[employee.band]?.byGrade[grade]
    if (bandRate) return bandRate
    
    // Band 없으면 All로 fallback
    return allGradeRates.byGrade[grade] || { baseUp: 0, merit: 0, additional: 0 }
  }
  
  // All scope
  return allGradeRates.byGrade[grade] || { baseUp: 0, merit: 0, additional: 0 }
}

// PayZone별 → 레벨별 역전파 (가중평균)
export const aggregatePayZoneToLevel = (
  payZoneRates: PayZoneLevelGradeRates,
  employees: Employee[],
  levels: string[],
  grades: string[]
): LevelGradeRates => {
  const levelGradeRates: LevelGradeRates = {}
  
  levels.forEach(level => {
    const levelEmployees = employees.filter(emp => emp.level === level)
    const gradeRates: GradeAdjustmentRates = {}
    
    grades.forEach(grade => {
      const items: { value: { baseUp: number; merit: number; additional: number }; count: number }[] = []
      
      // 각 PayZone별 값과 인원수 수집
      Object.keys(payZoneRates).forEach(zoneStr => {
        const zone = parseInt(zoneStr)
        const gradeEmployees = levelEmployees.filter(
          emp => emp.payZone === zone && emp.performanceRating === grade
        )
        
        if (gradeEmployees.length > 0 && payZoneRates[zoneStr][level]?.byGrade?.[grade]) {
          items.push({
            value: payZoneRates[zoneStr][level].byGrade[grade],
            count: gradeEmployees.length
          })
        }
      })
      
      // 가중평균 계산
      if (items.length > 0) {
        gradeRates[grade] = {
          baseUp: calculateWeightedAverage(items.map(i => ({ value: i.value.baseUp, count: i.count }))),
          merit: calculateWeightedAverage(items.map(i => ({ value: i.value.merit, count: i.count }))),
          additional: calculateWeightedAverage(items.map(i => ({ value: i.value.additional, count: i.count })))
        }
      } else {
        gradeRates[grade] = { baseUp: 0, merit: 0, additional: 0 }
      }
    })
    
    // 평균 계산
    const gradeCounts = countEmployeesByGrade(levelEmployees)
    const average = calculateAverageFromGrades(gradeRates, gradeCounts)
    
    levelGradeRates[level] = {
      average,
      byGrade: gradeRates,
      employeeCount: {
        total: levelEmployees.length,
        byGrade: gradeCounts
      }
    }
  })
  
  return levelGradeRates
}

// 레벨별 → 전체 역전파 (가중평균)
export const aggregateLevelToAll = (
  levelGradeRates: LevelGradeRates,
  employees: Employee[],
  grades: string[]
): AllAdjustmentRates => {
  const gradeRates: GradeAdjustmentRates = {}
  
  grades.forEach(grade => {
    const items: { value: AdjustmentRates; count: number }[] = []
    
    // 각 레벨별 값과 인원수 수집
    Object.keys(levelGradeRates).forEach(level => {
      const gradeCount = levelGradeRates[level].employeeCount.byGrade[grade] || 0
      
      if (gradeCount > 0 && levelGradeRates[level].byGrade[grade]) {
        items.push({
          value: levelGradeRates[level].byGrade[grade],
          count: gradeCount
        })
      }
    })
    
    // 가중평균 계산
    if (items.length > 0) {
      gradeRates[grade] = {
        baseUp: calculateWeightedAverage(items.map(i => ({ value: i.value.baseUp, count: i.count }))),
        merit: calculateWeightedAverage(items.map(i => ({ value: i.value.merit, count: i.count }))),
        additional: calculateWeightedAverage(items.map(i => ({ value: i.value.additional, count: i.count })))
      }
    } else {
      gradeRates[grade] = { baseUp: 0, merit: 0, additional: 0 }
    }
  })
  
  // 전체 평균 계산
  const gradeCounts = countEmployeesByGrade(employees)
  const average = calculateAverageFromGrades(gradeRates, gradeCounts)
  
  return {
    average,
    byGrade: gradeRates
  }
}

// 평가등급별 값으로부터 가중평균 계산
export const calculateAverageFromGrades = (
  gradeRates: GradeAdjustmentRates,
  gradeCounts: { [grade: string]: number }
): AdjustmentRates => {
  const items: { value: AdjustmentRates; count: number }[] = []
  
  Object.keys(gradeRates).forEach(grade => {
    const count = gradeCounts[grade] || 0
    if (count > 0) {
      items.push({
        value: gradeRates[grade],
        count
      })
    }
  })
  
  if (items.length === 0) {
    return { baseUp: 0, merit: 0, additional: 0 }
  }
  
  return {
    baseUp: calculateWeightedAverage(items.map(i => ({ value: i.value.baseUp, count: i.count }))),
    merit: calculateWeightedAverage(items.map(i => ({ value: i.value.merit, count: i.count }))),
    additional: calculateWeightedAverage(items.map(i => ({ value: i.value.additional, count: i.count })))
  }
}