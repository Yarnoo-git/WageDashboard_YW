// Band 관련 계산 함수들

import { Employee } from '@/types'
import { 
  BandFinalRates, 
  LevelRates, 
  PayZoneRates,
  DynamicStructure
} from '@/types/simulation'

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
    const empCount = contextEmployeeData.filter(
      emp => emp.band === band && emp.level === level
    ).length
    
    if (empCount > 0) {
      const rate = bandFinalRates[band]?.[level]?.[field] || 
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

// Band×Level 동기화 함수
export const synchronizeBandToLevel = (
  dynamicStructure: DynamicStructure,
  contextEmployeeData: Employee[],
  bandFinalRates: BandFinalRates,
  setLevelRates: (rates: LevelRates | ((prev: LevelRates) => LevelRates)) => void,
  levelRates: LevelRates
): void => {
  const newLevelRates: LevelRates = { ...levelRates }
  
  dynamicStructure.levels.forEach(level => {
    const baseUpAvg = updateLevelRatesFromBands(
      level, 'baseUp', contextEmployeeData, dynamicStructure, 
      bandFinalRates, levelRates
    )
    const meritAvg = updateLevelRatesFromBands(
      level, 'merit', contextEmployeeData, dynamicStructure, 
      bandFinalRates, levelRates
    )
    
    if (baseUpAvg !== null || meritAvg !== null) {
      newLevelRates[level] = {
        ...newLevelRates[level],
        baseUp: baseUpAvg ?? newLevelRates[level]?.baseUp ?? 0,
        merit: meritAvg ?? newLevelRates[level]?.merit ?? 0
      }
    }
  })
  
  setLevelRates(newLevelRates)
}

// Band에서 PayZone으로 전파
export const propagateBandToPayZone = (
  band: string,
  level: string,
  field: 'baseUp' | 'merit',
  value: number,
  dynamicStructure: DynamicStructure,
  payZoneRates: PayZoneRates
): PayZoneRates => {
  const newPayZoneRates = { ...payZoneRates }
  
  dynamicStructure.payZones.forEach(zone => {
    if (!newPayZoneRates[zone]) newPayZoneRates[zone] = {}
    if (!newPayZoneRates[zone][band]) newPayZoneRates[zone][band] = {}
    if (!newPayZoneRates[zone][band][level]) {
      newPayZoneRates[zone][band][level] = { baseUp: 0, merit: 0, additional: 0 }
    }
    newPayZoneRates[zone][band][level][field] = value
  })
  
  return newPayZoneRates
}