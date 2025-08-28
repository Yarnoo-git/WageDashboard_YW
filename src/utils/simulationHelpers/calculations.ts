// 기본 계산 관련 함수들

import { Employee } from '@/types'

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