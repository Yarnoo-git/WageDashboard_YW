import { NextResponse } from 'next/server'
import { getDashboardSummary } from '@/services/employeeDataService'
import { apiConfig } from '@/lib/apiConfig'

export const dynamic = apiConfig.dynamic
export const runtime = apiConfig.runtime

export async function GET() {
  try {
    // 현재 회계연도
    const currentYear = new Date().getFullYear()

    // employeeDataService에서 데이터 가져오기
    const dashboardSummary = await getDashboardSummary()

    // AI 추천 설정 가져오기 (employeeDataService에서 가져온 값 사용)
    const aiRecommendation = dashboardSummary.aiRecommendation

    // 예산 정보 가져오기 (employeeDataService에서 계산된 값 사용)
    const budget = dashboardSummary.budget

    // 전체 직원 수 및 직급별 통계
    const levelStats = dashboardSummary.levelStatistics
    const totalEmployees = dashboardSummary.summary.totalEmployees

    // 부서별 직원 분포 (엑셀 데이터에서 계산)
    const departmentStats = dashboardSummary.departmentDistribution || []

    // 성과 등급별 분포 (엑셀 데이터에서 계산)
    const performanceStats = dashboardSummary.performanceDistribution || []

    // 응답 데이터 구성
    const dashboardData = {
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
      departmentDistribution: departmentStats.map(dept => ({
        department: dept.department,
        count: dept._count.id,
      })),
      performanceDistribution: performanceStats.map(perf => ({
        rating: perf.performanceRating,
        count: perf._count.id,
      })),
      industryComparison: dashboardSummary.industryComparison,
      competitorData: dashboardSummary.competitorData,  // C사 데이터 추가
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Dashboard API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}