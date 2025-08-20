import { NextResponse } from 'next/server'
import { getCompetitorIncreaseRate, getDashboardSummary, clearCache, getEmployeeData } from '@/services/employeeDataService'

export async function GET() {
  try {
    // 캐시 초기화하고 다시 로드
    clearCache()
    
    // 데이터 다시 로드 (이 과정에서 C사인상률도 읽어옴)
    await getEmployeeData()
    
    // C사 인상률 가져오기
    const competitorRate = getCompetitorIncreaseRate()
    console.log('API - C사 인상률:', competitorRate)
    
    // 대시보드 데이터에서도 확인
    const dashboardData = await getDashboardSummary()
    console.log('API - 대시보드 industryComparison:', dashboardData.industryComparison)
    
    return NextResponse.json({
      competitorRate,
      industryComparison: dashboardData.industryComparison
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}