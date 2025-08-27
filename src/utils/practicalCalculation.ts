/**
 * 실무 추천안 가중평균 계산 유틸리티
 * 레벨 × PayZone × 직군별 평가등급 구조
 */

import { Employee } from '@/types/employee'
import { AdjustmentMatrix, RateValues } from '@/types/adjustmentMatrix'
import { payZoneService } from '@/services/payZoneService'

export interface PracticalCell {
  baseUp: number
  merit: number
  additional: number
  employeeCount: number
  totalSalary: number
  averageSalary: number
}

export interface PracticalRecommendationData {
  // 계층 구조: 레벨 → PayZone → 직군별 평가등급
  hierarchy: {
    [level: string]: {
      [payZone: string]: {  // 'all', 'zone1', 'zone2', ...
        total: {  // 전체 컬럼 (가중평균)
          [grade: string]: PracticalCell
        }
        byBand: {  // 직군별
          [band: string]: {
            [grade: string]: PracticalCell
          }
        }
      }
    }
  }
  
  // 메타데이터
  metadata: {
    bands: string[]
    levels: string[]
    grades: string[]
    payZones: string[]  // ['all', 'zone1', 'zone2', ...]
    totalEmployees: number
    totalSalarySum: number
  }
}

/**
 * 실무 추천안 데이터 초기화
 */
export function initializePracticalData(
  employees: Employee[],
  matrix: AdjustmentMatrix
): PracticalRecommendationData {
  // Pay Zone 목록 구성
  const maxZone = Math.max(...employees.map(e => payZoneService.assignPayZone(e)))
  const payZones = ['all']  // 전체
  for (let i = 1; i <= maxZone; i++) {
    payZones.push(`zone${i}`)
  }
  
  const data: PracticalRecommendationData = {
    hierarchy: {},
    metadata: {
      bands: matrix.bands,
      levels: matrix.levels,
      grades: matrix.grades,
      payZones,
      totalEmployees: employees.length,
      totalSalarySum: employees.reduce((sum, e) => sum + e.currentSalary, 0)
    }
  }
  
  // 레벨별로 초기화
  for (const level of matrix.levels) {
    data.hierarchy[level] = {}
    
    // PayZone별로 초기화
    for (const payZone of payZones) {
      data.hierarchy[level][payZone] = {
        total: {},
        byBand: {}
      }
      
      // 직군별 데이터 초기화
      for (const band of matrix.bands) {
        data.hierarchy[level][payZone].byBand[band] = {}
        
        for (const grade of matrix.grades) {
          // 직원 필터링
          let filteredEmployees: Employee[]
          if (payZone === 'all') {
            filteredEmployees = employees.filter(e =>
              e.band === band &&
              e.level === level &&
              e.performanceRating === grade
            )
          } else {
            const zoneNum = parseInt(payZone.replace('zone', ''))
            filteredEmployees = employees.filter(e =>
              e.band === band &&
              e.level === level &&
              e.performanceRating === grade &&
              payZoneService.assignPayZone(e) === zoneNum
            )
          }
          
          const employeeCount = filteredEmployees.length
          const totalSalary = filteredEmployees.reduce((sum, e) => sum + e.currentSalary, 0)
          const averageSalary = employeeCount > 0 ? totalSalary / employeeCount : 0
          
          // 매트릭스에서 현재 값 가져오기
          const cell = matrix.cellMap[band]?.[level]
          const rates = cell?.gradeRates[grade] || { baseUp: 0, merit: 0, additional: 0 }
          
          data.hierarchy[level][payZone].byBand[band][grade] = {
            baseUp: rates.baseUp,
            merit: rates.merit,
            additional: rates.additional,
            employeeCount,
            totalSalary,
            averageSalary
          }
        }
      }
      
      // 전체 컬럼 계산 (가중평균)
      for (const grade of matrix.grades) {
        data.hierarchy[level][payZone].total[grade] = calculateTotalFromBands(
          data,
          level,
          payZone,
          grade,
          matrix.bands
        )
      }
    }
  }
  
  return data
}

/**
 * 직군들의 가중평균 계산 (전체 컬럼용)
 */
export function calculateTotalFromBands(
  data: PracticalRecommendationData,
  level: string,
  payZone: string,
  grade: string,
  bands: string[]
): PracticalCell {
  let weightedBaseUp = 0
  let weightedMerit = 0
  let weightedAdditional = 0
  let totalWeight = 0
  let totalEmployeeCount = 0
  let totalSalarySum = 0
  
  for (const band of bands) {
    const cell = data.hierarchy[level]?.[payZone]?.byBand[band]?.[grade]
    
    if (cell && cell.employeeCount > 0) {
      const weight = cell.totalSalary
      weightedBaseUp += cell.baseUp * weight
      weightedMerit += cell.merit * weight
      weightedAdditional += cell.additional * weight
      totalWeight += weight
      totalEmployeeCount += cell.employeeCount
      totalSalarySum += cell.totalSalary
    }
  }
  
  return {
    baseUp: totalWeight > 0 ? weightedBaseUp / totalWeight : 0,
    merit: totalWeight > 0 ? weightedMerit / totalWeight : 0,
    additional: totalWeight > 0 ? weightedAdditional / totalWeight : 0,
    employeeCount: totalEmployeeCount,
    totalSalary: totalSalarySum,
    averageSalary: totalEmployeeCount > 0 ? totalSalarySum / totalEmployeeCount : 0
  }
}

/**
 * 전체 컬럼 값 변경 시 직군별 비례 분배
 */
export function distributeTotalToBands(
  data: PracticalRecommendationData,
  level: string,
  payZone: string,
  grade: string,
  field: 'baseUp' | 'merit' | 'additional',
  newValue: number,
  targetBands?: string[]  // 분배 대상 직군들 (없으면 전체)
): void {
  const currentTotal = data.hierarchy[level]?.[payZone]?.total[grade]
  if (!currentTotal) return
  
  const currentValue = currentTotal[field]
  const delta = newValue - currentValue
  
  // 분배 대상 직군 결정
  const bandsToDistribute = targetBands || data.metadata.bands
  
  // 전체 가중치 계산
  let totalWeight = 0
  for (const band of bandsToDistribute) {
    const cell = data.hierarchy[level]?.[payZone]?.byBand[band]?.[grade]
    if (cell && cell.employeeCount > 0) {
      totalWeight += cell.totalSalary
    }
  }
  
  if (totalWeight === 0) return
  
  // 비례 분배
  for (const band of bandsToDistribute) {
    const cell = data.hierarchy[level]?.[payZone]?.byBand[band]?.[grade]
    if (cell && cell.employeeCount > 0) {
      const ratio = cell.totalSalary / totalWeight
      cell[field] += delta * ratio
    }
  }
  
  // 전체 컬럼 업데이트
  data.hierarchy[level][payZone].total[grade][field] = newValue
}

/**
 * 직군 값 업데이트 후 전체 재계산
 */
export function updateBandValueAndRecalculateTotal(
  data: PracticalRecommendationData,
  level: string,
  payZone: string,
  band: string,
  grade: string,
  field: 'baseUp' | 'merit' | 'additional',
  newValue: number
): void {
  // 직군 값 업데이트
  const cell = data.hierarchy[level]?.[payZone]?.byBand[band]?.[grade]
  if (cell) {
    cell[field] = newValue
  }
  
  // 전체 컬럼 재계산
  const totalCell = calculateTotalFromBands(
    data,
    level,
    payZone,
    grade,
    data.metadata.bands
  )
  data.hierarchy[level][payZone].total[grade] = totalCell
}

/**
 * 모든 전체 컬럼 재계산
 */
export function recalculateAllTotals(data: PracticalRecommendationData): void {
  for (const level of data.metadata.levels) {
    for (const payZone of data.metadata.payZones) {
      for (const grade of data.metadata.grades) {
        const totalCell = calculateTotalFromBands(
          data,
          level,
          payZone,
          grade,
          data.metadata.bands
        )
        data.hierarchy[level][payZone].total[grade] = totalCell
      }
    }
  }
}

/**
 * 실무 추천안 데이터를 매트릭스로 변환
 */
export function applyPracticalToMatrix(
  data: PracticalRecommendationData,
  matrix: AdjustmentMatrix
): AdjustmentMatrix {
  const updatedMatrix = { ...matrix }
  
  // 각 직군별 값을 매트릭스에 적용 (전체 PayZone만)
  for (const band of data.metadata.bands) {
    for (const level of data.metadata.levels) {
      const cell = updatedMatrix.cellMap[band]?.[level]
      if (!cell) continue
      
      for (const grade of data.metadata.grades) {
        const practicalCell = data.hierarchy[level]?.['all']?.byBand[band]?.[grade]
        if (practicalCell) {
          cell.gradeRates[grade] = {
            baseUp: practicalCell.baseUp,
            merit: practicalCell.merit,
            additional: practicalCell.additional
          }
        }
      }
    }
  }
  
  return updatedMatrix
}