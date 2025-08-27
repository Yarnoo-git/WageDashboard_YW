/**
 * WageContext Adapter Hook
 * 기존 UI 컴포넌트들이 사용하던 WageContext 인터페이스를
 * 새로운 WageContextNew와 연동하는 어댑터
 */

import { useMemo } from 'react'
import { useWageContextNew } from '@/context/WageContextNew'
import { Employee } from '@/types/employee'

export function useWageContextAdapter() {
  const newContext = useWageContextNew()
  
  // 직급별 통계 계산
  const levelStatistics = useMemo(() => {
    const stats: Array<{
      level: string
      employeeCount: number
      averageSalary: string
    }> = []
    
    const levelMap = new Map<string, { count: number; totalSalary: number }>()
    
    newContext.originalData.employees.forEach(emp => {
      const existing = levelMap.get(emp.level) || { count: 0, totalSalary: 0 }
      levelMap.set(emp.level, {
        count: existing.count + 1,
        totalSalary: existing.totalSalary + emp.currentSalary
      })
    })
    
    levelMap.forEach((value, level) => {
      stats.push({
        level,
        employeeCount: value.count,
        averageSalary: (value.totalSalary / value.count).toString()
      })
    })
    
    return stats
  }, [newContext.originalData.employees])
  
  // 직급별 인상률 계산
  const levelRates = useMemo(() => {
    const rates: Record<string, { baseUp: number; merit: number }> = {}
    
    if (newContext.adjustment.matrix) {
      newContext.originalData.metadata.levels.forEach(level => {
        // 해당 레벨의 모든 셀에서 평균 계산
        let totalBaseUp = 0
        let totalMerit = 0
        let cellCount = 0
        
        newContext.adjustment.matrix!.cells.forEach(row => {
          row.forEach(cell => {
            if (cell.level === level) {
              // 평가등급별 평균 계산
              const gradeCount = Object.keys(cell.gradeRates).length
              if (gradeCount > 0) {
                let cellBaseUp = 0
                let cellMerit = 0
                
                Object.values(cell.gradeRates).forEach(rate => {
                  cellBaseUp += rate.baseUp
                  cellMerit += rate.merit
                })
                
                totalBaseUp += cellBaseUp / gradeCount
                totalMerit += cellMerit / gradeCount
                cellCount++
              }
            }
          })
        })
        
        if (cellCount > 0) {
          rates[level] = {
            baseUp: totalBaseUp / cellCount,
            merit: totalMerit / cellCount
          }
        } else {
          rates[level] = { baseUp: 0, merit: 0 }
        }
      })
    }
    
    return rates
  }, [newContext.adjustment.matrix, newContext.originalData.metadata.levels])
  
  // 직급별 총 인상률
  const levelTotalRates = useMemo(() => {
    const totalRates: Record<string, number> = {}
    Object.entries(levelRates).forEach(([level, rate]) => {
      totalRates[level] = rate.baseUp + rate.merit
    })
    return totalRates
  }, [levelRates])
  
  // 경쟁사 데이터 변환
  const competitorData = useMemo(() => {
    // 새로운 형식의 competitorData를 기존 형식으로 변환
    const data = newContext.originalData.competitorData
    if (!data || data.length === 0) return null
    
    // 직군×직급별 C사 데이터 형식으로 반환
    return data.map((item: any) => ({
      company: item.company || 'C사',
      band: item.band || '',
      level: item.level || '',
      averageSalary: item.averageSalary || 0
    }))
  }, [newContext.originalData.competitorData])
  
  // 평균 급여 계산
  const averageSalary = useMemo(() => {
    const employees = newContext.originalData.employees
    if (employees.length === 0) return 0
    const total = employees.reduce((sum, emp) => sum + emp.currentSalary, 0)
    return total / employees.length
  }, [newContext.originalData.employees])
  
  // 예산 관련
  const budget = newContext.config.budget
  const budgetUsage = newContext.computed.budgetUsage
  
  return {
    // 직원 데이터
    contextEmployeeData: newContext.originalData.employees,
    totalEmployees: newContext.originalData.employees.length,
    averageSalary,
    
    // 인상률 (AI 설정 값 또는 가중평균)
    baseUpRate: newContext.originalData.aiSettings?.baseUpPercentage || newContext.adjustment.matrix?.aggregated?.total?.baseUp || 0,
    meritRate: newContext.originalData.aiSettings?.meritIncreasePercentage || newContext.adjustment.matrix?.aggregated?.total?.merit || 0,
    levelRates,
    levelTotalRates,
    weightedAverageRate: newContext.computed.weightedAverage.summary.effectiveRate,
    
    // 통계
    levelStatistics,
    
    // 경쟁사 데이터
    competitorData,
    competitorIncreaseRate: newContext.originalData.competitorIncreaseRate || 0,
    
    // 예산
    totalBudget: budget.total,
    availableBudget: budget.available,
    welfareBudget: budget.welfare,
    
    // 예산 사용량
    budgetData: {
      totalBudget: budget.total.toString(),
      usedBudget: budgetUsage.totalCost.toString(),
      remainingBudget: budgetUsage.remaining.toString(),
      usagePercentage: budgetUsage.usagePercentage
    },
    
    // AI 설정
    aiSettings: newContext.originalData.aiSettings,
    
    // 로딩 상태
    loading: newContext.isLoading,
    
    // 액션 (필요한 경우 추가)
    setAvailableBudget: (value: number) => {
      newContext.actions.updateBudget(value + budget.welfare, budget.welfare)
    },
    setWelfareBudget: (value: number) => {
      newContext.actions.updateBudget(budget.available + value, value)
    }
  }
}