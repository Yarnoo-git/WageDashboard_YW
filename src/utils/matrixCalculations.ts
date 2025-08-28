/**
 * 매트릭스 계산 유틸리티
 * 가중평균, 예산 계산, 통계 등 핵심 계산 로직 통합
 */

import { Employee } from '@/types/employee'
import {
  AdjustmentMatrix,
  MatrixCell,
  RateValues,
  WeightedAverageDetail,
  WeightedAverageResult,
  GradeRates
} from '@/types/adjustmentMatrix'
import { payZoneService } from '@/services/payZoneService'
import { INDIRECT_COST } from '@/config/constants'

// 상수 설정
export const BUDGET_CONSTANTS = {
  INDIRECT_COST_RATE: INDIRECT_COST.TOTAL,  // 간접비용 비율
  WELFARE_DEFAULT: 0,          // 기본 복리후생 예산
  MILLION: 10000,              // 만원 단위
  HUNDRED_MILLION: 100000000   // 억원 단위
}

/**
 * 가중평균 계산 클래스
 * 투명한 계산 과정과 상세 정보 제공
 */
export class WeightedAverageCalculator {
  private details: WeightedAverageDetail[] = []
  private totalWeight = 0
  private weightedSums = { baseUp: 0, merit: 0, additional: 0 }

  /**
   * 매트릭스 전체 가중평균 계산
   */
  calculateMatrix(
    matrix: AdjustmentMatrix,
    employees: Employee[]
  ): WeightedAverageResult {
    this.reset()
    
    // 각 셀(Band × Level × Grade)별 처리
    for (const band of matrix.bands) {
      for (const level of matrix.levels) {
        const cell = matrix.cellMap[band]?.[level]
        if (!cell) continue
        
        for (const grade of matrix.grades) {
          const gradeEmployees = employees.filter(e => 
            e.band === band && 
            e.level === level && 
            e.performanceRating === grade
          )
          
          if (gradeEmployees.length === 0) continue
          
          // Pay Zone별 세부 처리 (있을 경우)
          if (cell.payZoneOverrides?.[grade]) {
            this.processPayZoneDetails(
              gradeEmployees,
              cell.payZoneOverrides[grade],
              cell.gradeRates[grade] || { baseUp: 0, merit: 0, additional: 0 },
              { band, level, grade }
            )
          } else {
            // 일반 처리 (Pay Zone 구분 없음)
            const totalSalary = gradeEmployees.reduce(
              (sum, e) => sum + e.currentSalary, 0
            )
            const avgSalary = totalSalary / gradeEmployees.length
            const rates = cell.gradeRates[grade] || { baseUp: 0, merit: 0, additional: 0 }
            
            this.addDetail({
              path: `${band} × ${level} × ${grade}`,
              band,
              level,
              grade,
              employeeCount: gradeEmployees.length,
              averageSalary: avgSalary,
              totalSalary,
              rates,
              weight: totalSalary,
              contribution: 0 // 나중에 계산
            })
          }
        }
      }
    }
    
    // 최종 가중평균 계산
    return this.computeFinalAverage(employees)
  }

  /**
   * Pay Zone별 세부 처리
   */
  private processPayZoneDetails(
    employees: Employee[],
    payZoneOverrides: { [zoneId: number]: RateValues },
    defaultRates: RateValues,
    context: { band: string; level: string; grade: string }
  ): void {
    const byZone = new Map<number, Employee[]>()
    
    // Pay Zone별로 그룹핑
    employees.forEach(emp => {
      const zone = payZoneService.assignPayZone(emp)
      if (!byZone.has(zone)) byZone.set(zone, [])
      byZone.get(zone)!.push(emp)
    })
    
    // 각 Zone별 처리
    byZone.forEach((zoneEmployees, zoneId) => {
      const totalSalary = zoneEmployees.reduce(
        (sum, e) => sum + e.currentSalary, 0
      )
      const avgSalary = totalSalary / zoneEmployees.length
      const rates = payZoneOverrides[zoneId] || defaultRates
      
      this.addDetail({
        path: `${context.band} × ${context.level} × ${context.grade} × Zone${zoneId}`,
        band: context.band,
        level: context.level,
        grade: context.grade,
        payZone: zoneId,
        employeeCount: zoneEmployees.length,
        averageSalary: avgSalary,
        totalSalary,
        rates,
        weight: totalSalary,
        contribution: 0
      })
    })
  }

  /**
   * 상세 정보 추가
   */
  private addDetail(detail: WeightedAverageDetail): void {
    this.details.push(detail)
    this.totalWeight += detail.weight
    this.weightedSums.baseUp += detail.rates.baseUp * detail.weight
    this.weightedSums.merit += detail.rates.merit * detail.weight
    this.weightedSums.additional += detail.rates.additional * detail.weight
  }

  /**
   * 최종 가중평균 계산
   */
  private computeFinalAverage(employees: Employee[]): WeightedAverageResult {
    // 가중평균 계산
    const totalAverage: RateValues = {
      baseUp: this.totalWeight > 0 ? this.weightedSums.baseUp / this.totalWeight : 0,
      merit: this.totalWeight > 0 ? this.weightedSums.merit / this.totalWeight : 0,
      additional: this.totalWeight > 0 ? this.weightedSums.additional / this.totalWeight : 0
    }
    
    // 각 상세 항목의 기여도 계산
    this.details.forEach(detail => {
      detail.contribution = this.totalWeight > 0
        ? (detail.weight / this.totalWeight) * 100
        : 0
    })
    
    // 요약 정보
    const totalSalary = employees.reduce((sum, e) => sum + e.currentSalary, 0)
    const effectiveRate = totalAverage.baseUp + totalAverage.merit + 
      (totalAverage.additional > 0 ? totalAverage.additional : 0)
    
    return {
      totalAverage,
      details: this.details,
      summary: {
        totalEmployees: employees.length,
        totalSalary,
        averageSalary: employees.length > 0 ? totalSalary / employees.length : 0,
        effectiveRate
      }
    }
  }

  /**
   * 계산기 초기화
   */
  private reset(): void {
    this.details = []
    this.totalWeight = 0
    this.weightedSums = { baseUp: 0, merit: 0, additional: 0 }
  }

  /**
   * 계산 과정 시각화 문자열 생성
   */
  getVisualization(): string {
    const lines: string[] = [
      '═════════════════════════════════════════════',
      '가중평균 계산 상세',
      '═════════════════════════════════════════════'
    ]
    
    this.details
      .sort((a, b) => b.contribution - a.contribution) // 기여도 높은 순
      .slice(0, 20) // 상위 20개만
      .forEach(d => {
        const baseUpContrib = (d.rates.baseUp * d.weight / this.totalWeight).toFixed(2)
        lines.push(
          `${d.path}: ${d.employeeCount}명 × ${d.rates.baseUp.toFixed(1)}% = ${baseUpContrib}% (가중치 ${d.contribution.toFixed(1)}%)`
        )
      })
    
    lines.push('═════════════════════════════════════════════')
    
    return lines.join('\n')
  }
}

/**
 * 예산 사용량 계산
 */
export interface BudgetUsage {
  directCost: number        // 직접 비용 (Base-up + Merit + 추가)
  indirectCost: number      // 간접 비용 (17.8%)
  totalCost: number         // 총 비용
  availableBudget: number   // 가용 예산
  usagePercentage: number   // 사용률 (%)
  remaining: number         // 잔여 예산
  isOverBudget: boolean     // 예산 초과 여부
}

export function calculateBudgetUsage(
  matrix: AdjustmentMatrix,
  employees: Employee[],
  availableBudget: number,
  additionalType: 'percentage' | 'amount' = 'percentage'
): BudgetUsage {
  let totalDirectCost = 0
  
  // 각 직원별 인상액 계산
  employees.forEach(emp => {
    const cell = matrix.cellMap[emp.band]?.[emp.level]
    if (!cell) return
    
    // 기본 rates 가져오기
    let finalRates = cell.gradeRates[emp.performanceRating] || 
      { baseUp: 0, merit: 0, additional: 0 }
    
    // Pay Zone 오버라이드 확인 (정의되어 있는 경우만)
    if (cell.payZoneOverrides?.[emp.performanceRating]) {
      const zone = payZoneService.assignPayZone(emp)
      const payZoneRates = cell.payZoneOverrides[emp.performanceRating][zone]
      if (payZoneRates) {
        finalRates = payZoneRates
      }
    }
    
    // 인상액 계산
    const baseUpAmount = emp.currentSalary * (finalRates.baseUp / 100)
    const meritAmount = emp.currentSalary * (finalRates.merit / 100)
    
    let additionalAmount = 0
    if (additionalType === 'percentage') {
      additionalAmount = emp.currentSalary * (finalRates.additional / 100)
    } else {
      // 정액: 만원 단위로 가정
      additionalAmount = finalRates.additional * BUDGET_CONSTANTS.MILLION
    }
    
    totalDirectCost += baseUpAmount + meritAmount + additionalAmount
  })
  
  // 간접 비용 계산
  const indirectCost = totalDirectCost * BUDGET_CONSTANTS.INDIRECT_COST_RATE
  const totalCost = totalDirectCost + indirectCost
  
  // 사용률 및 잔여 예산
  const usagePercentage = availableBudget > 0 
    ? (totalCost / availableBudget) * 100 
    : 0
  const remaining = availableBudget - totalCost
  
  return {
    directCost: totalDirectCost,
    indirectCost,
    totalCost,
    availableBudget,
    usagePercentage,
    remaining,
    isOverBudget: totalCost > availableBudget
  }
}

/**
 * 빈 매트릭스 생성
 */
export function createEmptyMatrix(
  bands: string[],
  levels: string[],
  grades: string[]
): AdjustmentMatrix {
  const cells: MatrixCell[][] = []
  const cellMap: AdjustmentMatrix['cellMap'] = {}
  
  // 각 Band×Level 셀 생성
  bands.forEach((band, bandIndex) => {
    cells[bandIndex] = []
    cellMap[band] = {}
    
    levels.forEach((level, levelIndex) => {
      // 기본 평가등급별 인상률
      const gradeRates: GradeRates = {}
      grades.forEach(grade => {
        gradeRates[grade] = { baseUp: 0, merit: 0, additional: 0 }
      })
      
      const cell: MatrixCell = {
        band,
        level,
        gradeRates,
        statistics: {
          employeeCount: 0,
          averageSalary: 0,
          totalSalaryAmount: 0,
          gradeDistribution: {},
          payZoneDistribution: {}
        },
        weightedAverage: {
          baseUp: 0,
          merit: 0,
          additional: 0,
          total: 0,
          weightInMatrix: 0
        }
      }
      
      cells[bandIndex][levelIndex] = cell
      cellMap[band][level] = cell
    })
  })
  
  return {
    bands,
    levels,
    grades,
    cells,
    cellMap,
    aggregated: {
      total: {
        baseUp: 0,
        merit: 0,
        additional: 0,
        total: 0,
        employeeCount: 0,
        totalSalary: 0
      },
      byBand: {},
      byLevel: {},
      byGrade: {}
    },
    metadata: {
      lastUpdated: new Date(),
      version: 1
    }
  }
}

/**
 * 매트릭스 통계 업데이트
 */
export function updateMatrixStatistics(
  matrix: AdjustmentMatrix,
  employees: Employee[]
): void {
  // 초기화
  matrix.cells.forEach(row => {
    row.forEach(cell => {
      cell.statistics = {
        employeeCount: 0,
        averageSalary: 0,
        totalSalaryAmount: 0,
        gradeDistribution: {},
        payZoneDistribution: {}
      }
      cell.weightedAverage = {
        baseUp: 0,
        merit: 0,
        additional: 0,
        total: 0,
        weightInMatrix: 0
      }
    })
  })
  
  // 집계 초기화
  const initAggregated = () => ({
    baseUp: 0, merit: 0, additional: 0, total: 0,
    employeeCount: 0, totalSalary: 0, averageSalary: 0
  })
  
  matrix.aggregated = {
    total: { ...initAggregated(), totalSalary: 0 },
    byBand: {},
    byLevel: {},
    byGrade: {}
  }
  
  // 각 직원 처리
  employees.forEach(emp => {
    const cell = matrix.cellMap[emp.band]?.[emp.level]
    if (!cell) return
    
    // 셀 통계 업데이트
    cell.statistics.employeeCount++
    cell.statistics.totalSalaryAmount += emp.currentSalary
    
    // 평가등급 분포
    const grade = emp.performanceRating
    cell.statistics.gradeDistribution[grade] = 
      (cell.statistics.gradeDistribution[grade] || 0) + 1
    
    // Pay Zone 분포
    const zone = payZoneService.assignPayZone(emp)
    cell.statistics.payZoneDistribution![zone] = 
      (cell.statistics.payZoneDistribution![zone] || 0) + 1
  })
  
  // 평균 및 가중평균 계산
  let totalMatrixWeight = 0
  
  matrix.cells.forEach(row => {
    row.forEach(cell => {
      if (cell.statistics.employeeCount > 0) {
        cell.statistics.averageSalary = 
          cell.statistics.totalSalaryAmount / cell.statistics.employeeCount
        
        // 각 평가등급별 가중평균
        let cellWeightedSum = { baseUp: 0, merit: 0, additional: 0 }
        let cellTotalWeight = 0
        
        Object.entries(cell.statistics.gradeDistribution).forEach(([grade, count]) => {
          const rates = cell.gradeRates[grade]
          if (rates && count > 0) {
            const weight = count * cell.statistics.averageSalary
            cellWeightedSum.baseUp += rates.baseUp * weight
            cellWeightedSum.merit += rates.merit * weight
            cellWeightedSum.additional += rates.additional * weight
            cellTotalWeight += weight
          }
        })
        
        if (cellTotalWeight > 0) {
          cell.weightedAverage.baseUp = cellWeightedSum.baseUp / cellTotalWeight
          cell.weightedAverage.merit = cellWeightedSum.merit / cellTotalWeight
          cell.weightedAverage.additional = cellWeightedSum.additional / cellTotalWeight
          cell.weightedAverage.total = 
            cell.weightedAverage.baseUp + 
            cell.weightedAverage.merit + 
            cell.weightedAverage.additional
        }
        
        totalMatrixWeight += cell.statistics.totalSalaryAmount
      }
    })
  })
  
  // 전체 매트릭스에서의 비중 계산
  if (totalMatrixWeight > 0) {
    matrix.cells.forEach(row => {
      row.forEach(cell => {
        cell.weightedAverage.weightInMatrix = 
          cell.statistics.totalSalaryAmount / totalMatrixWeight
      })
    })
  }
}