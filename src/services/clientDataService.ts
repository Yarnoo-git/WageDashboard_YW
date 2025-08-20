/**
 * 클라이언트 사이드 데이터 서비스
 * Electron 환경에서는 직접 서비스 호출, 브라우저에서는 API 호출
 */

import { 
  getDashboardSummary, 
  getEmployeeData,
  getLevelStatistics,
  getAISettings,
  getBandLevelDetails,
  searchEmployees,
  getDashboardData
} from './employeeDataService'

// Electron 환경 감지
const isElectron = () => {
  return typeof window !== 'undefined' && 
    (window as any).electronAPI !== undefined
}

// 정적 Export 환경 감지 (file:// 프로토콜)
const isStaticExport = () => {
  return typeof window !== 'undefined' && 
    window.location.protocol === 'file:'
}

/**
 * 대시보드 데이터 가져오기
 */
export const fetchDashboardData = async () => {
  // Electron 또는 정적 Export 환경에서는 직접 호출
  if (isElectron() || isStaticExport()) {
    const dashboardSummary = await getDashboardSummary()
    const currentYear = new Date().getFullYear()
    const aiRecommendation = dashboardSummary.aiRecommendation
    const budget = dashboardSummary.budget
    const levelStats = dashboardSummary.levelStatistics
    const totalEmployees = dashboardSummary.summary.totalEmployees
    const departmentStats = dashboardSummary.departmentDistribution || []
    const performanceStats = dashboardSummary.performanceDistribution || []
    
    return {
      summary: {
        totalEmployees,
        fiscalYear: currentYear,
        lastUpdated: dashboardSummary.summary.lastUpdated,
        averageSalary: dashboardSummary.summary.averageSalary,
        totalPayroll: dashboardSummary.summary.totalPayroll,
      },
      aiRecommendation: aiRecommendation,
      budget: budget ? {
        totalBudget: budget.totalBudget.toString(),
        usedBudget: budget.usedBudget.toString(),
        remainingBudget: budget.remainingBudget.toString(),
        usagePercentage: Math.round((Number(budget.usedBudget) / Number(budget.totalBudget)) * 100),
      } : null,
      levelStatistics: levelStats.map((stat: any) => ({
        level: stat.level,
        employeeCount: stat.employeeCount,
        averageSalary: stat.averageSalary.toString(),
        totalSalary: stat.totalSalary.toString(),
        avgBaseUpPercentage: aiRecommendation?.baseUpPercentage || 0,
        avgMeritPercentage: aiRecommendation?.meritIncreasePercentage || 0,
        totalIncreasePercentage: aiRecommendation?.totalPercentage || 0,
      })),
      departmentDistribution: departmentStats.map((dept: any) => ({
        department: dept.department,
        count: dept._count.id,
      })),
      performanceDistribution: performanceStats.map((perf: any) => ({
        rating: perf.performanceRating,
        count: perf._count.id,
      })),
      industryComparison: dashboardSummary.industryComparison,
      competitorData: dashboardSummary.competitorData,
    }
  }
  
  // 브라우저/Vercel에서는 API 호출
  const response = await fetch('/api/dashboard')
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data')
  }
  return await response.json()
}

/**
 * 직원 데이터 가져오기
 */
export const fetchEmployeeData = async (params?: any) => {
  // Electron 또는 정적 Export 환경에서는 직접 호출
  if (isElectron() || isStaticExport()) {
    const data = await getEmployeeData()
    
    // 필터링 로직 (필요시)
    if (params) {
      return filterEmployeeData(data, params)
    }
    return data
  }
  
  // 브라우저/Vercel에서는 API 호출
  const queryString = params ? new URLSearchParams(params).toString() : ''
  const response = await fetch(`/api/employees${queryString ? '?' + queryString : ''}`)
  if (!response.ok) {
    throw new Error('Failed to fetch employee data')
  }
  return await response.json()
}

/**
 * 밴드 데이터 가져오기
 */
export const fetchBandData = async (bandId?: string) => {
  // Electron 또는 정적 Export 환경에서는 직접 호출
  if (isElectron() || isStaticExport()) {
    // 클라이언트 데이터에서 밴드 정보 추출
    const employeeData = await getEmployeeData()
    const bands = extractBandData(employeeData)
    
    // 특정 밴드 필터링
    if (bandId) {
      return bands.filter((band: any) => band.id === bandId)
    }
    return bands
  }
  
  // 브라우저/Vercel에서는 API 호출
  const url = bandId ? `/api/bands/${bandId}` : '/api/bands'
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch band data')
  }
  return await response.json()
}

// 헬퍼 함수: 직원 데이터에서 밴드 정보 추출
function extractBandData(employees: any[]) {
  const bands = new Map()
  
  employees.forEach(emp => {
    if (emp.band) {
      if (!bands.has(emp.band)) {
        bands.set(emp.band, {
          id: emp.band,
          name: emp.band,
          employees: []
        })
      }
      bands.get(emp.band).employees.push(emp)
    }
  })
  
  return Array.from(bands.values())
}

/**
 * 시나리오 데이터 가져오기
 */
export const fetchScenarios = async () => {
  // Electron 또는 정적 Export 환경에서는 로컬스토리지 사용
  if (isElectron() || isStaticExport()) {
    const stored = localStorage.getItem('wage_scenarios')
    return stored ? JSON.parse(stored) : []
  }
  
  // 브라우저/Vercel에서는 API 호출
  const response = await fetch('/api/scenarios')
  if (!response.ok) {
    throw new Error('Failed to fetch scenarios')
  }
  return await response.json()
}

/**
 * 시나리오 저장
 */
export const saveScenario = async (scenario: any) => {
  // Electron 또는 정적 Export 환경에서는 로컬스토리지 사용
  if (isElectron() || isStaticExport()) {
    const stored = localStorage.getItem('wage_scenarios')
    const scenarios = stored ? JSON.parse(stored) : []
    
    if (scenario.id) {
      // 업데이트
      const index = scenarios.findIndex((s: any) => s.id === scenario.id)
      if (index >= 0) {
        scenarios[index] = scenario
      }
    } else {
      // 새로 추가
      scenario.id = Date.now().toString()
      scenarios.push(scenario)
    }
    
    localStorage.setItem('wage_scenarios', JSON.stringify(scenarios))
    return scenario
  }
  
  // 브라우저/Vercel에서는 API 호출
  const response = await fetch('/api/scenarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scenario)
  })
  if (!response.ok) {
    throw new Error('Failed to save scenario')
  }
  return await response.json()
}

/**
 * 엑셀 파일 업로드
 */
export const uploadExcelFile = async (file: File) => {
  // 모든 환경에서 API 호출 사용 (파일 업로드는 특별 처리 필요)
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    throw new Error('Failed to upload file')
  }
  return await response.json()
}

// 헬퍼 함수: 직원 데이터 필터링
function filterEmployeeData(data: any[], params: any) {
  let filtered = [...data]
  
  if (params.department) {
    filtered = filtered.filter(e => e.department === params.department)
  }
  
  if (params.level) {
    filtered = filtered.filter(e => e.level === params.level)
  }
  
  if (params.search) {
    const searchLower = params.search.toLowerCase()
    filtered = filtered.filter(e => 
      e.name.toLowerCase().includes(searchLower) ||
      e.employeeNumber.toLowerCase().includes(searchLower)
    )
  }
  
  return filtered
}

/**
 * 메타데이터 가져오기
 */
export const fetchMetadata = async () => {
  // Electron 또는 정적 Export 환경에서는 직접 호출
  if (isElectron() || isStaticExport()) {
    const employees = await getEmployeeData()
    const dashboardData = await getDashboardData()
    
    const departmentsSet = new Set<string>()
    const bandsSet = new Set<string>()
    
    employees.forEach((emp: any) => {
      if (emp.department) {
        departmentsSet.add(emp.department)
      }
      if (emp.band) {
        bandsSet.add(emp.band)
      }
    })
    
    const departments = Array.from(departmentsSet).sort()
    const bands = Array.from(bandsSet).sort()
    const levels = ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4']
    const ratings = ['S', 'A', 'B', 'C']
    
    const statistics = {
      totalEmployees: employees.length,
      departmentCount: departments.length,
      levelDistribution: levels.map(level => ({
        level,
        count: employees.filter((emp: any) => emp.level === level).length
      })),
      ratingDistribution: ratings.map(rating => ({
        rating,
        count: employees.filter((emp: any) => emp.performanceRating === rating).length
      }))
    }
    
    return {
      success: true,
      data: {
        departments,
        bands,
        levels,
        ratings,
        statistics
      },
      aiRecommendation: dashboardData.aiRecommendation
    }
  }
  
  // 브라우저/Vercel에서는 API 호출
  const response = await fetch('/api/metadata')
  if (!response.ok) {
    throw new Error('Failed to fetch metadata')
  }
  return await response.json()
}

/**
 * 분석 데이터 가져오기
 */
export const fetchAnalyticsData = async () => {
  // Electron 또는 정적 Export 환경에서는 직접 호출
  if (isElectron() || isStaticExport()) {
    const currentYear = new Date().getFullYear()
    const employees = await getEmployeeData()
    
    // 분석 데이터 생성 로직 (API 라우트와 동일)
    const salaryRanges = [
      { min: 0, max: 40000000, label: '4천만 미만' },
      { min: 40000000, max: 60000000, label: '4-6천만' },
      { min: 60000000, max: 80000000, label: '6-8천만' },
      { min: 80000000, max: 100000000, label: '8천만-1억' },
      { min: 100000000, max: 150000000, label: '1-1.5억' },
      { min: 150000000, max: Infinity, label: '1.5억 이상' },
    ]
    
    const salaryDistribution = salaryRanges.map(range => {
      const count = employees.filter((emp: any) => {
        return emp.currentSalary >= range.min && 
               (range.max === Infinity || emp.currentSalary < range.max)
      }).length
      
      return {
        range: range.label,
        count,
        min: range.min,
        max: range.max,
      }
    })
    
    // 추가 분석 데이터도 필요시 구현
    return {
      salaryDistribution,
      // 다른 분석 데이터들...
    }
  }
  
  // 브라우저/Vercel에서는 API 호출
  const response = await fetch('/api/analytics')
  if (!response.ok) {
    throw new Error('Failed to fetch analytics data')
  }
  return await response.json()
}

export default {
  fetchDashboardData,
  fetchEmployeeData,
  fetchBandData,
  fetchScenarios,
  saveScenario,
  uploadExcelFile,
  fetchMetadata,
  fetchAnalyticsData
}