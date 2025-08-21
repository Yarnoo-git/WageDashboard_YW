import { useState, useEffect } from 'react'
import { loadExcelData, hasStoredData } from '@/lib/clientStorage'
import { fetchDashboardData } from '@/services/clientDataService'

interface DashboardData {
  summary: {
    totalEmployees: number
    fiscalYear: number
    lastUpdated: string
    averageSalary?: number
    totalPayroll?: number
  }
  aiRecommendation: {
    baseUpPercentage: number
    meritIncreasePercentage: number
    totalPercentage: number
    minRange: number
    maxRange: number
  } | null
  budget: {
    totalBudget: string
    usedBudget: string
    remainingBudget: string
    usagePercentage: number
  } | null
  levelStatistics: Array<{
    level: string
    employeeCount: number
    averageSalary: string
    totalSalary: string
    avgBaseUpPercentage: number
    avgMeritPercentage: number
    totalIncreasePercentage: number
  }>
  departmentDistribution: Array<{
    department: string
    count: number
  }>
  performanceDistribution: Array<{
    rating: string
    count: number
  }>
  competitorData?: Array<{
    company: string
    band: string
    level: string
    averageSalary: number
  }> | null
  competitorIncreaseRate?: number
  industryComparison?: {
    ourCompany: number
    competitor: number
  }
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // 먼저 클라이언트 데이터 확인
        if (hasStoredData()) {
          const clientData = await loadExcelData()
          if (clientData) {
            // 디버그: 클라이언트 데이터 확인
            console.log('useDashboardData - 클라이언트 데이터:', {
              competitorData: clientData.competitorData,
              competitorIncreaseRate: clientData.competitorIncreaseRate,
              aiSettings: clientData.aiSettings,
              employees: clientData.employees?.length || 0
            })
            
            // 클라이언트 데이터를 대시보드 형식으로 변환
            const dashboardData: DashboardData = {
              summary: {
                totalEmployees: clientData.employees.length,
                fiscalYear: new Date().getFullYear(),
                lastUpdated: clientData.uploadedAt,
                averageSalary: Math.round(clientData.employees.reduce((sum: number, e: any) => sum + (e.currentSalary || 0), 0) / clientData.employees.length),
                totalPayroll: clientData.employees.reduce((sum: number, e: any) => sum + (e.currentSalary || 0), 0)
              },
              aiRecommendation: clientData.aiSettings,
              budget: {
                totalBudget: Math.round(clientData.employees.reduce((sum: number, e: any) => sum + (e.currentSalary || 0), 0) * (clientData.aiSettings.totalPercentage / 100) * 1.178).toString(),
                usedBudget: '0', // 초기 사용 예산은 0
                remainingBudget: Math.round(clientData.employees.reduce((sum: number, e: any) => sum + (e.currentSalary || 0), 0) * (clientData.aiSettings.totalPercentage / 100) * 1.178).toString(),
                usagePercentage: 0
              },
              levelStatistics: [],
              departmentDistribution: [],
              performanceDistribution: [],
              competitorData: clientData.competitorData,
              competitorIncreaseRate: clientData.competitorIncreaseRate || 0,
              industryComparison: {
                ourCompany: clientData.aiSettings?.totalPercentage || 0,
                competitor: clientData.competitorIncreaseRate || 0
              }
            }
            
            // 직급별 통계 계산
            const levels = ['Lv.4', 'Lv.3', 'Lv.2', 'Lv.1']
            levels.forEach(level => {
              const levelEmployees = clientData.employees.filter((e: any) => e.level === level)
              if (levelEmployees.length > 0) {
                const avgSalary = Math.round(levelEmployees.reduce((sum: number, e: any) => sum + (e.currentSalary || 0), 0) / levelEmployees.length)
                dashboardData.levelStatistics.push({
                  level,
                  employeeCount: levelEmployees.length,
                  averageSalary: avgSalary.toString(),
                  totalSalary: levelEmployees.reduce((sum: number, e: any) => sum + (e.currentSalary || 0), 0).toString(),
                  avgBaseUpPercentage: clientData.aiSettings.baseUpPercentage,
                  avgMeritPercentage: clientData.aiSettings.meritIncreasePercentage,
                  totalIncreasePercentage: clientData.aiSettings.totalPercentage
                })
              }
            })
            
            setData(dashboardData)
            setLoading(false)
            return
          }
        }
        
        // 클라이언트 데이터가 없으면 서버에서 가져오기
        const result = await fetchDashboardData()
        
        // 디버그: 서버 데이터 확인
        console.log('useDashboardData - 서버 데이터:', {
          competitorData: result.competitorData,
          industryComparison: result.industryComparison
        })
        
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const refresh = async () => {
    setLoading(true)
    try {
      // 먼저 클라이언트 데이터 확인
      if (hasStoredData()) {
        const clientData = await loadExcelData()
        if (clientData) {
          // 클라이언트 데이터를 대시보드 형식으로 변환
          const dashboardData: DashboardData = {
            summary: {
              totalEmployees: clientData.employees.length,
              fiscalYear: new Date().getFullYear(),
              lastUpdated: clientData.uploadedAt,
              averageSalary: Math.round(clientData.employees.reduce((sum: number, e: any) => sum + (e.currentSalary || 0), 0) / clientData.employees.length),
              totalPayroll: clientData.employees.reduce((sum: number, e: any) => sum + (e.currentSalary || 0), 0)
            },
            aiRecommendation: clientData.aiSettings,
            budget: {
              totalBudget: Math.round(clientData.employees.reduce((sum: number, e: any) => sum + (e.currentSalary || 0), 0) * (clientData.aiSettings.totalPercentage / 100) * 1.178).toString(),
              usedBudget: '0', // 초기 사용 예산은 0
              remainingBudget: Math.round(clientData.employees.reduce((sum: number, e: any) => sum + (e.currentSalary || 0), 0) * (clientData.aiSettings.totalPercentage / 100) * 1.178).toString(),
              usagePercentage: 0
            },
            levelStatistics: [],
            departmentDistribution: [],
            performanceDistribution: [],
            competitorData: clientData.competitorData,
            industryComparison: {
              ourCompany: clientData.aiSettings?.totalPercentage || 0,
              competitor: clientData.competitorIncreaseRate || 0
            }
          }
          
          // 직급별 통계 계산
          const levels = ['Lv.4', 'Lv.3', 'Lv.2', 'Lv.1']
          levels.forEach(level => {
            const levelEmployees = clientData.employees.filter((e: any) => e.level === level)
            if (levelEmployees.length > 0) {
              const avgSalary = Math.round(levelEmployees.reduce((sum: number, e: any) => sum + (e.currentSalary || 0), 0) / levelEmployees.length)
              dashboardData.levelStatistics.push({
                level,
                employeeCount: levelEmployees.length,
                averageSalary: avgSalary.toString(),
                totalSalary: levelEmployees.reduce((sum: number, e: any) => sum + (e.currentSalary || 0), 0).toString(),
                avgBaseUpPercentage: clientData.aiSettings.baseUpPercentage,
                avgMeritPercentage: clientData.aiSettings.meritIncreasePercentage,
                totalIncreasePercentage: clientData.aiSettings.totalPercentage
              })
            }
          })
          
          setData(dashboardData)
          setError(null)
          setLoading(false)
          return
        }
      }
      
      // 클라이언트 데이터가 없으면 서버에서 가져오기
      // Electron 환경에서는 직접 서비스 호출, 브라우저에서는 API 호출
      const result = await fetchDashboardData()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refresh }
}