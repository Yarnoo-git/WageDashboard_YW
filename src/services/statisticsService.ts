/**
 * 통계 및 대시보드 데이터 서비스
 * 레벨별, 밴드별, 대시보드 통계 계산
 */

import { 
  EmployeeRecord,
  calculateBandStatistics,
  calculatePercentile,
  LEVEL_INFO
} from '@/lib/bandDataGenerator'
import { getEmployeeData } from './employeeService'
import { getCompetitorData, getAISettings } from './excelService'

/**
 * 레벨별 통계 계산
 */
export async function getLevelStatistics() {
  const employees = await getEmployeeData()
  const competitorData = getCompetitorData()
  const aiSettings = getAISettings()
  
  // 레벨별로 그룹화
  const levelGroups = new Map<string, EmployeeRecord[]>()
  employees.forEach(emp => {
    if (!levelGroups.has(emp.level)) {
      levelGroups.set(emp.level, [])
    }
    levelGroups.get(emp.level)!.push(emp)
  })
  
  // 레벨별 통계 계산
  return Array.from(levelGroups.entries()).map(([level, emps]) => ({
    level,
    count: emps.length,
    averageSalary: emps.reduce((sum, e) => sum + e.currentSalary, 0) / emps.length,
    minSalary: Math.min(...emps.map(e => e.currentSalary)),
    maxSalary: Math.max(...emps.map(e => e.currentSalary)),
    baseUpPercentage: aiSettings.baseUpPercentage,
    meritIncreasePercentage: aiSettings.meritIncreasePercentage,
    competitorAverage: competitorData
      .filter(c => c.level === level)
      .reduce((sum, c) => sum + c.averageSalary, 0) / 
      (competitorData.filter(c => c.level === level).length || 1)
  }))
}

/**
 * 밴드별 통계 계산
 */
export async function getBandStatistics() {
  const employees = await getEmployeeData()
  const stats = calculateBandStatistics(employees)
  return stats.filter(s => s.count > 0) // 직원이 있는 밴드만 반환
}

/**
 * 밴드×레벨 상세 데이터 계산
 */
export async function getBandLevelDetails() {
  const employees = await getEmployeeData()
  const competitorData = getCompetitorData()
  
  // 밴드별 데이터 생성
  const bands = ['생산', '영업', '생산기술', '경영지원', '품질보증', '기획', '구매&물류', 'Facility']
  const levels = Object.keys(LEVEL_INFO).sort((a, b) => {
    const orderA = LEVEL_INFO[a].order
    const orderB = LEVEL_INFO[b].order
    return orderB - orderA // 높은 직급부터
  })
  
  return bands.map(bandName => {
    const bandEmployees = employees.filter(emp => emp.band === bandName)
    
    // 레벨별 데이터 계산
    const levelData = levels.map(level => {
      const levelEmployees = bandEmployees.filter(emp => emp.level === level)
      
      // 우리 회사 통계
      const salaries = levelEmployees.map(emp => emp.currentSalary)
      const companyStats = salaries.length > 0 ? {
        min: Math.min(...salaries),
        max: Math.max(...salaries),
        median: calculatePercentile(salaries, 50),
        avg: salaries.reduce((sum, s) => sum + s, 0) / salaries.length,
        p25: calculatePercentile(salaries, 25),
        p75: calculatePercentile(salaries, 75)
      } : { min: 0, max: 0, median: 0, avg: 0, p25: 0, p75: 0 }
      
      // 경쟁사 데이터
      const competitorEntry = competitorData.find(c => 
        c.band === bandName && c.level === level
      )
      const competitorAvg = competitorEntry?.averageSalary || 0
      
      // 경쟁력 지수 계산
      const competitiveness = competitorAvg > 0 
        ? (companyStats.median / competitorAvg) * 100
        : 100
      
      return {
        level,
        headcount: levelEmployees.length,
        company: companyStats,
        competitor: {
          min: competitorAvg * 0.85, // 추정값
          max: competitorAvg * 1.15, // 추정값
          median: competitorAvg,
          avg: competitorAvg,
          p25: competitorAvg * 0.9,
          p75: competitorAvg * 1.1
        },
        competitiveness,
        performanceDistribution: {
          S: levelEmployees.filter(e => e.performanceRating === 'S').length,
          A: levelEmployees.filter(e => e.performanceRating === 'A').length,
          B: levelEmployees.filter(e => e.performanceRating === 'B').length,
          C: levelEmployees.filter(e => e.performanceRating === 'C').length
        }
      }
    })
    
    // 밴드 전체 통계
    const bandSalaries = bandEmployees.map(emp => emp.currentSalary)
    const totalSalary = bandSalaries.reduce((sum, s) => sum + s, 0)
    const avgSalary = bandSalaries.length > 0 ? totalSalary / bandSalaries.length : 0
    
    return {
      bandId: bandName.toLowerCase().replace(/[&\s]/g, ''),
      bandName,
      totalEmployees: bandEmployees.length,
      averageSalary: avgSalary,
      levels: levelData
    }
  }).filter(band => band.totalEmployees > 0) // 직원이 있는 밴드만 반환
}

/**
 * 대시보드 데이터 계산
 */
export async function getDashboardData() {
  const employees = await getEmployeeData()
  const aiSettings = getAISettings()
  
  // 통계 계산
  const totalEmployees = employees.length
  const totalSalary = employees.reduce((sum, emp) => sum + emp.currentSalary, 0)
  const averageSalary = totalSalary / totalEmployees
  
  return {
    totalEmployees,
    totalSalary,
    averageSalary,
    aiSettings,
    performanceDistribution: {
      S: employees.filter(e => e.performanceRating === 'S').length,
      A: employees.filter(e => e.performanceRating === 'A').length,
      B: employees.filter(e => e.performanceRating === 'B').length,
      C: employees.filter(e => e.performanceRating === 'C').length
    }
  }
}

/**
 * 대시보드 요약 데이터 계산
 */
export async function getDashboardSummary() {
  const employees = await getEmployeeData()
  const aiSettings = getAISettings()
  
  // 레벨별 데이터 그룹화
  const levelData = new Map<string, {
    employees: EmployeeRecord[]
    avgSalary: number
    totalSalary: number
  }>()
  
  employees.forEach(emp => {
    if (!levelData.has(emp.level)) {
      levelData.set(emp.level, {
        employees: [],
        avgSalary: 0,
        totalSalary: 0
      })
    }
    const data = levelData.get(emp.level)!
    data.employees.push(emp)
    data.totalSalary += emp.currentSalary
  })
  
  // 평균 계산
  levelData.forEach((data, level) => {
    data.avgSalary = data.totalSalary / data.employees.length
  })
  
  // 레벨 순서대로 정렬
  const sortedLevels = Array.from(levelData.entries())
    .sort((a, b) => {
      const orderA = LEVEL_INFO[a[0]]?.order || 0
      const orderB = LEVEL_INFO[b[0]]?.order || 0
      return orderB - orderA
    })
  
  // 전체 통계
  const totalSalary = employees.reduce((sum, emp) => sum + emp.currentSalary, 0)
  const averageSalary = totalSalary / employees.length
  
  // 예산 계산 (AI 설정 기반)
  const baseUpAmount = totalSalary * (aiSettings.baseUpPercentage / 100)
  const meritAmount = totalSalary * (aiSettings.meritIncreasePercentage / 100)
  const totalIncreaseAmount = baseUpAmount + meritAmount
  
  // 간접비용 (17.8%)
  const indirectCost = totalIncreaseAmount * 0.178
  const totalBudgetRequired = totalIncreaseAmount + indirectCost
  
  return {
    employeeCount: employees.length,
    totalPayroll: totalSalary,
    averageSalary,
    aiSettings: {
      baseUpPercentage: aiSettings.baseUpPercentage,
      meritIncreasePercentage: aiSettings.meritIncreasePercentage,
      totalPercentage: aiSettings.totalPercentage
    },
    budgetProjection: {
      baseUpAmount,
      meritAmount,
      totalIncreaseAmount,
      indirectCost,
      totalBudgetRequired
    },
    levelDistribution: sortedLevels.map(([level, data]) => ({
      level,
      headcount: data.employees.length,
      averageSalary: data.avgSalary,
      totalSalary: data.totalSalary,
      percentage: (data.employees.length / employees.length) * 100
    })),
    performanceDistribution: {
      S: {
        count: employees.filter(e => e.performanceRating === 'S').length,
        percentage: (employees.filter(e => e.performanceRating === 'S').length / employees.length) * 100
      },
      A: {
        count: employees.filter(e => e.performanceRating === 'A').length,
        percentage: (employees.filter(e => e.performanceRating === 'A').length / employees.length) * 100
      },
      B: {
        count: employees.filter(e => e.performanceRating === 'B').length,
        percentage: (employees.filter(e => e.performanceRating === 'B').length / employees.length) * 100
      },
      C: {
        count: employees.filter(e => e.performanceRating === 'C').length,
        percentage: (employees.filter(e => e.performanceRating === 'C').length / employees.length) * 100
      }
    }
  }
}