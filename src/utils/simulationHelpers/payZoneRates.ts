// PayZone 관련 계산 함수들

import { Employee } from '@/types'
import { INDIRECT_COST } from '@/config/constants'
import { 
  BandFinalRates, 
  LevelRates, 
  PayZoneRates,
  DynamicStructure
} from '@/types/simulation'

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
  
  return totalIncrease * (1 + INDIRECT_COST.TOTAL) // 간접비용 포함
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

// PayZone×Band×Level 동기화
export const synchronizePayZoneToBand = (
  dynamicStructure: DynamicStructure,
  contextEmployeeData: Employee[],
  payZoneRates: PayZoneRates,
  setBandFinalRates: (rates: BandFinalRates | ((prev: BandFinalRates) => BandFinalRates)) => void,
  bandFinalRates: BandFinalRates,
  levelRates: LevelRates
): void => {
  const newBandRates: BandFinalRates = { ...bandFinalRates }
  
  dynamicStructure.bands.forEach(band => {
    dynamicStructure.levels.forEach(level => {
      const baseUpAvg = updateBandRatesFromPayZones(
        band, level, 'baseUp', contextEmployeeData, dynamicStructure,
        payZoneRates, bandFinalRates, levelRates
      )
      const meritAvg = updateBandRatesFromPayZones(
        band, level, 'merit', contextEmployeeData, dynamicStructure,
        payZoneRates, bandFinalRates, levelRates
      )
      
      if (baseUpAvg !== null || meritAvg !== null) {
        if (!newBandRates[band]) newBandRates[band] = {}
        newBandRates[band][level] = {
          baseUp: baseUpAvg ?? newBandRates[band][level]?.baseUp ?? 0,
          merit: meritAvg ?? newBandRates[band][level]?.merit ?? 0
        }
      }
    })
  })
  
  setBandFinalRates(newBandRates)
}

// Level에서 PayZone으로 전파
export const propagateLevelToPayZone = (
  level: string,
  field: 'baseUp' | 'merit',
  value: number,
  dynamicStructure: DynamicStructure,
  payZoneRates: PayZoneRates
): PayZoneRates => {
  const newPayZoneRates = { ...payZoneRates }
  
  dynamicStructure.payZones.forEach(zone => {
    if (!newPayZoneRates[zone]) newPayZoneRates[zone] = {}
    dynamicStructure.bands.forEach(band => {
      if (!newPayZoneRates[zone][band]) newPayZoneRates[zone][band] = {}
      if (!newPayZoneRates[zone][band][level]) {
        newPayZoneRates[zone][band][level] = { baseUp: 0, merit: 0 }
      }
      newPayZoneRates[zone][band][level][field] = value
    })
  })
  
  return newPayZoneRates
}