// WageContext 계산 로직 훅

import { useMemo } from 'react'
import { Employee } from '@/types/employee'
import { AdjustmentMatrix } from '@/types/adjustmentMatrix'
import { 
  WeightedAverageCalculator,
  calculateBudgetUsage,
  BudgetUsage
} from '@/utils/matrixCalculations'

interface UseWageComputedParams {
  matrix: AdjustmentMatrix | null
  pendingMatrix: AdjustmentMatrix | null
  employees: Employee[]
  budget: { available: number }
  additionalType: 'percentage' | 'amount'
}

export function useWageComputed({
  matrix,
  pendingMatrix,
  employees,
  budget,
  additionalType
}: UseWageComputedParams) {
  
  const budgetUsage = useMemo(() => {
    if (!matrix || employees.length === 0) {
      return {
        directCost: 0,
        indirectCost: 0,
        totalCost: 0,
        availableBudget: budget.available,
        usagePercentage: 0,
        remaining: budget.available,
        isOverBudget: false
      }
    }
    return calculateBudgetUsage(matrix, employees, budget.available, additionalType)
  }, [matrix, employees, budget.available, additionalType])
  
  const weightedAverage = useMemo(() => {
    if (!matrix || employees.length === 0) {
      return {
        totalAverage: { baseUp: 0, merit: 0, additional: 0 },
        details: [],
        summary: {
          totalEmployees: 0,
          totalSalary: 0,
          averageSalary: 0,
          effectiveRate: 0
        }
      }
    }
    const calculator = new WeightedAverageCalculator()
    return calculator.calculateMatrix(matrix, employees)
  }, [matrix, employees])
  
  const pendingBudgetUsage = useMemo(() => {
    if (!pendingMatrix || employees.length === 0) return undefined
    return calculateBudgetUsage(pendingMatrix, employees, budget.available, additionalType)
  }, [pendingMatrix, employees, budget.available, additionalType])
  
  const pendingWeightedAverage = useMemo(() => {
    if (!pendingMatrix || employees.length === 0) return undefined
    const calculator = new WeightedAverageCalculator()
    return calculator.calculateMatrix(pendingMatrix, employees)
  }, [pendingMatrix, employees])
  
  const statistics = useMemo(() => {
    const totalSalary = employees.reduce((sum, e) => sum + e.currentSalary, 0)
    const byLevel: Record<string, number> = {}
    const byBand: Record<string, number> = {}
    const byGrade: Record<string, number> = {}
    
    employees.forEach(emp => {
      if (emp.level) byLevel[emp.level] = (byLevel[emp.level] || 0) + 1
      if (emp.band) byBand[emp.band] = (byBand[emp.band] || 0) + 1
      if (emp.performanceRating) byGrade[emp.performanceRating] = (byGrade[emp.performanceRating] || 0) + 1
    })
    
    return {
      totalEmployees: employees.length,
      averageSalary: employees.length > 0 ? totalSalary / employees.length : 0,
      byLevel,
      byBand,
      byGrade
    }
  }, [employees])
  
  return {
    budgetUsage,
    weightedAverage,
    pendingBudgetUsage,
    pendingWeightedAverage,
    statistics
  }
}