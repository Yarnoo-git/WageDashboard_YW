// 예산 관련 계산 함수들

import { Employee } from '@/types'
import { INDIRECT_COST } from '@/config/constants'
import { 
  AdjustmentRates,
  BandFinalRates, 
  LevelRates, 
  PayZoneRates
} from '@/types/simulation'

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
  
  const totalIndirect = totalDirect * INDIRECT_COST.TOTAL // 간접비용
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

// 개별 직원 예산 영향 계산
export const calculateEmployeeBudgetImpact = (
  employee: Employee,
  rates: AdjustmentRates
): number => {
  const totalRate = (rates.baseUp + rates.merit + (rates.additional || 0)) / 100
  const directCost = employee.currentSalary * totalRate
  return directCost * (1 + INDIRECT_COST.TOTAL)
}

// 총 예산 영향 계산
export const calculateTotalBudgetImpact = (
  employees: Employee[],
  getRatesForEmployee: (emp: Employee) => AdjustmentRates
): number => {
  let totalDirect = 0
  
  employees.forEach(emp => {
    const rates = getRatesForEmployee(emp)
    const totalRate = (rates.baseUp + rates.merit + (rates.additional || 0)) / 100
    totalDirect += emp.currentSalary * totalRate
  })
  
  return totalDirect * (1 + INDIRECT_COST.TOTAL)
}

// 예산 활용률 계산
export const calculateBudgetUtilization = (
  usedBudget: number,
  totalBudget: number
): { percentage: number; status: 'under' | 'optimal' | 'over' } => {
  const percentage = totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0
  
  let status: 'under' | 'optimal' | 'over'
  if (percentage < 90) {
    status = 'under'
  } else if (percentage <= 100) {
    status = 'optimal'
  } else {
    status = 'over'
  }
  
  return { percentage: Math.min(percentage, 200), status }
}