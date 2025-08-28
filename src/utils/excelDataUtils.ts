/**
 * 엑셀 데이터 유틸리티 함수들
 * 동적으로 밴드/직급 정보를 추출하고 통계 계산
 */

import { EmployeeRecord } from '@/services/employeeService'

/**
 * 직원 데이터에서 밴드 목록 추출
 */
export function extractBands(employees: EmployeeRecord[]): string[] {
  const bands = [...new Set(employees.map(e => e.band))].filter(Boolean)
  
  // 기본 순서가 있으면 그대로 유지, 없으면 알파벳 순
  const defaultOrder = ['생산', '영업', '생산기술', '경영지원', '품질보증', '기획', '구매&물류', 'Facility']
  const sortedBands = bands.sort((a, b) => {
    const indexA = defaultOrder.indexOf(a)
    const indexB = defaultOrder.indexOf(b)
    
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB
    }
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1
    return a.localeCompare(b)
  })
  
  return sortedBands
}

/**
 * 직원 데이터에서 직급 목록 추출
 */
export function extractLevels(employees: EmployeeRecord[]): string[] {
  const levels = [...new Set(employees.map(e => e.level))].filter(Boolean)
  
  // Lv.X 형식의 직급을 숫자로 정렬 (높은 것부터)
  return levels.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '0')
    const numB = parseInt(b.match(/\d+/)?.[0] || '0')
    return numB - numA // 높은 레벨부터
  })
}

/**
 * 직급 정보 객체 생성
 */
export function createLevelInfo(employees: EmployeeRecord[]) {
  const levels = extractLevels(employees)
  const levelInfo: Record<string, { order: number }> = {}
  
  levels.forEach((level) => {
    const order = parseInt(level.match(/\d+/)?.[0] || '0')
    levelInfo[level] = { order }
  })
  
  return levelInfo
}

/**
 * 백분위수 계산
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = (percentile / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index % 1
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

/**
 * 밴드별 통계 계산
 */
export function calculateBandStatistics(employees: EmployeeRecord[]) {
  const bands = extractBands(employees)
  
  return bands.map(band => {
    const bandEmployees = employees.filter(e => e.band === band)
    const salaries = bandEmployees.map(e => e.currentSalary)
    
    return {
      band,
      count: bandEmployees.length,
      avgSalary: salaries.length > 0 
        ? salaries.reduce((a, b) => a + b, 0) / salaries.length 
        : 0,
      median: calculatePercentile(salaries, 50),
      p75: calculatePercentile(salaries, 75),
      p25: calculatePercentile(salaries, 25),
      min: salaries.length > 0 ? Math.min(...salaries) : 0,
      max: salaries.length > 0 ? Math.max(...salaries) : 0
    }
  })
}

/**
 * 평가등급 목록 추출
 */
export function extractGrades(employees: EmployeeRecord[]): string[] {
  const grades = [...new Set(employees.map(e => e.performanceRating))].filter(Boolean)
  
  // 기본 순서가 있으면 그대로 유지
  const defaultOrder = ['ST', 'AT', 'OT', 'BT', 'S', 'A', 'B', 'C']
  return grades.sort((a, b) => {
    const indexA = defaultOrder.indexOf(a)
    const indexB = defaultOrder.indexOf(b)
    
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB
    }
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1
    return a.localeCompare(b)
  })
}