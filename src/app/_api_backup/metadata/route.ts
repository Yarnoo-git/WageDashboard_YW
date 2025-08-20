import { NextResponse } from 'next/server'
import { getEmployeeData, getDashboardData } from '@/services/employeeDataService'
import { apiConfig } from '@/lib/apiConfig'

export const dynamic = apiConfig.dynamic
export const runtime = apiConfig.runtime

export async function GET() {
  try {
    // 직원 데이터에서 실제 부서 목록 추출
    const employees = await getEmployeeData()
    // 대시보드 데이터에서 AI 설정 가져오기
    const dashboardData = await getDashboardData()
    
    // 중복 제거하여 유니크한 부서 목록 생성
    const departmentsSet = new Set<string>()
    const bandsSet = new Set<string>()
    
    employees.forEach(emp => {
      if (emp.department) {
        departmentsSet.add(emp.department)
      }
      if (emp.band) {
        bandsSet.add(emp.band)
      }
    })
    
    // 부서 목록 정렬
    const departments = Array.from(departmentsSet).sort()
    // 직군 목록 정렬
    const bands = Array.from(bandsSet).sort()
    
    // 직급은 고정 (순서 중요)
    const levels = ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4']
    
    // 평가등급도 고정 (순서 중요)
    const ratings = ['S', 'A', 'B', 'C']
    
    // 통계 정보 추가
    const statistics = {
      totalEmployees: employees.length,
      departmentCount: departments.length,
      levelDistribution: levels.map(level => ({
        level,
        count: employees.filter(emp => emp.level === level).length
      })),
      ratingDistribution: ratings.map(rating => ({
        rating,
        count: employees.filter(emp => emp.performanceRating === rating).length
      }))
    }
    
    return NextResponse.json({
      success: true,
      data: {
        departments,
        bands,
        levels,
        ratings,
        statistics
      },
      // AI 설정 추가
      aiRecommendation: dashboardData.aiRecommendation
    })
  } catch (error) {
    console.error('Metadata API Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch metadata',
        // 에러 시에도 기본값 제공
        data: {
          departments: ['생산', '영업', '생산기술', '경영지원', '품질보증', '기획', '구매&물류', 'Facility'],
          bands: ['생산', '영업', '생산기술', '경영지원', '품질보증', '기획', '구매&물류', 'Facility'],
          levels: ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4'],
          ratings: ['S', 'A', 'B', 'C']
        },
        // 기본 AI 설정값
        aiRecommendation: {
          baseUpPercentage: 3.2,
          meritIncreasePercentage: 2.5,
          totalPercentage: 5.7,
          minRange: 3.0,
          maxRange: 9.0
        }
      },
      { status: 500 }
    )
  }
}