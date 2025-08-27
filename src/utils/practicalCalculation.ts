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
  
  // 회사 전체 대표 값 (모든 레벨, PayZone, 직군의 가중평균)
  companyTotal: {
    baseUp: number
    merit: number
    additional: number
    employeeCount: number
    totalSalary: number
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
    companyTotal: {
      baseUp: 0,
      merit: 0,
      additional: 0,
      employeeCount: employees.length,
      totalSalary: employees.reduce((sum, e) => sum + e.currentSalary, 0)
    },
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
  
  // 회사 전체 값 계산 (모든 레벨의 all PayZone 가중평균)
  calculateCompanyTotal(data)
  
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
 * 전체 컬럼 값 변경 시 직군에 동일값 설정 (Top-down)
 */
export function distributeTotalToBands(
  data: PracticalRecommendationData,
  level: string,
  payZone: string,
  grade: string,
  field: 'baseUp' | 'merit' | 'additional',
  newValue: number,
  targetBands?: string[]  // 적용 대상 직군들 (없으면 전체)
): void {
  // 적용 대상 직군 결정
  const bandsToApply = targetBands || data.metadata.bands
  
  // 모든 직군에 동일한 값 설정 (Top-down)
  for (const band of bandsToApply) {
    const cell = data.hierarchy[level]?.[payZone]?.byBand[band]?.[grade]
    if (cell) {
      cell[field] = newValue  // 동일한 값으로 설정
    }
  }
  
  // 전체 컬럼도 업데이트
  const totalCell = data.hierarchy[level]?.[payZone]?.total[grade]
  if (totalCell) {
    totalCell[field] = newValue
  }
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
 * all PayZone 값을 개별 PayZone에 동일값 설정 (Top-down)
 */
export function distributeAllToPayZones(
  data: PracticalRecommendationData,
  level: string,
  band: string | 'total',  // 'total'이면 전체 컬럼, 아니면 특정 직군
  grade: string,
  field: 'baseUp' | 'merit' | 'additional',
  newValue: number
): void {
  // 모든 개별 PayZone에 동일한 값 설정
  for (const payZone of data.metadata.payZones) {
    if (payZone === 'all') continue  // all은 제외
    
    if (band === 'total') {
      // 전체 컬럼 업데이트
      const cell = data.hierarchy[level]?.[payZone]?.total[grade]
      if (cell) {
        cell[field] = newValue
      }
    } else {
      // 특정 직군 컬럼 업데이트
      const cell = data.hierarchy[level]?.[payZone]?.byBand[band]?.[grade]
      if (cell) {
        cell[field] = newValue
      }
    }
  }
}

/**
 * 개별 PayZone들의 가중평균으로 all PayZone 계산 (Bottom-up)
 */
export function calculateAllFromPayZones(
  data: PracticalRecommendationData,
  level: string,
  band: string | 'total',  // 'total'이면 전체 컬럼, 아니면 특정 직군
  grade: string
): void {
  let weightedBaseUp = 0
  let weightedMerit = 0
  let weightedAdditional = 0
  let totalWeight = 0
  let totalEmployeeCount = 0
  let totalSalarySum = 0
  
  // 개별 PayZone들의 가중평균 계산
  for (const payZone of data.metadata.payZones) {
    if (payZone === 'all') continue  // all은 제외
    
    let cell: PracticalCell | undefined
    if (band === 'total') {
      cell = data.hierarchy[level]?.[payZone]?.total[grade]
    } else {
      cell = data.hierarchy[level]?.[payZone]?.byBand[band]?.[grade]
    }
    
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
  
  // all PayZone 업데이트
  if (totalWeight > 0) {
    if (band === 'total') {
      const allCell = data.hierarchy[level]?.['all']?.total[grade]
      if (allCell) {
        allCell.baseUp = weightedBaseUp / totalWeight
        allCell.merit = weightedMerit / totalWeight
        allCell.additional = weightedAdditional / totalWeight
        // 인원수와 급여 합계는 그대로 유지 (이미 계산되어 있음)
      }
    } else {
      const allCell = data.hierarchy[level]?.['all']?.byBand[band]?.[grade]
      if (allCell) {
        allCell.baseUp = weightedBaseUp / totalWeight
        allCell.merit = weightedMerit / totalWeight
        allCell.additional = weightedAdditional / totalWeight
        // 인원수와 급여 합계는 그대로 유지
      }
    }
  }
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
 * 회사 전체 값 계산 (모든 셀의 가중평균)
 */
export function calculateCompanyTotal(data: PracticalRecommendationData): void {
  let weightedBaseUp = 0
  let weightedMerit = 0
  let weightedAdditional = 0
  let totalWeight = 0
  
  // 모든 레벨, 모든 등급의 all PayZone 값들의 가중평균
  for (const level of data.metadata.levels) {
    for (const grade of data.metadata.grades) {
      const cell = data.hierarchy[level]?.['all']?.total[grade]
      
      if (cell && cell.employeeCount > 0) {
        const weight = cell.totalSalary
        weightedBaseUp += cell.baseUp * weight
        weightedMerit += cell.merit * weight
        weightedAdditional += cell.additional * weight
        totalWeight += weight
      }
    }
  }
  
  // 회사 전체 값 업데이트
  if (totalWeight > 0) {
    data.companyTotal.baseUp = weightedBaseUp / totalWeight
    data.companyTotal.merit = weightedMerit / totalWeight
    data.companyTotal.additional = weightedAdditional / totalWeight
  }
}

/**
 * 회사 전체 값을 모든 하위에 적용 (Top-down)
 */
export function applyCompanyTotalToAll(
  data: PracticalRecommendationData,
  field: 'baseUp' | 'merit' | 'additional',
  value: number
): void {
  // 모든 레벨, PayZone, 직군, 등급에 동일값 설정
  for (const level of data.metadata.levels) {
    for (const payZone of data.metadata.payZones) {
      for (const grade of data.metadata.grades) {
        // 전체 컬럼
        const totalCell = data.hierarchy[level]?.[payZone]?.total[grade]
        if (totalCell) {
          totalCell[field] = value
        }
        
        // 각 직군
        for (const band of data.metadata.bands) {
          const bandCell = data.hierarchy[level]?.[payZone]?.byBand[band]?.[grade]
          if (bandCell) {
            bandCell[field] = value
          }
        }
      }
    }
  }
  
  // 회사 전체 값도 업데이트
  data.companyTotal[field] = value
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