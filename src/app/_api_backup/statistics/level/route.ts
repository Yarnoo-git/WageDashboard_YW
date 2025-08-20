import { NextResponse } from 'next/server'
import { getLevelStatistics, getAISettings } from '@/services/employeeDataService'
import { apiConfig } from '@/lib/apiConfig'

export const dynamic = apiConfig.dynamic
export const runtime = apiConfig.runtime

export async function GET() {
  try {
    const currentYear = new Date().getFullYear()

    // employeeDataService에서 직급별 통계 가져오기
    const levelStats = await getLevelStatistics()
    const aiSettings = await getAISettings()
    
    // API 응답 형식에 맞게 변환
    const formattedStats = levelStats.map(stat => ({
      id: stat.level,
      level: stat.level,
      fiscalYear: currentYear,
      employeeCount: stat.employeeCount,
      averageSalary: BigInt(stat.averageSalary),
      totalSalary: BigInt(stat.totalSalary),
      avgBaseUpPercentage: aiSettings?.baseUpPercentage || 3.2,
      avgMeritPercentage: aiSettings?.meritIncreasePercentage || 2.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))

    return NextResponse.json(formattedStats)
  } catch (error) {
    console.error('Statistics API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}