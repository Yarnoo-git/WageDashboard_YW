import { NextRequest, NextResponse } from 'next/server'
import { getBandLevelDetails } from '@/services/employeeDataService'
import { apiConfig } from '@/lib/apiConfig'

export const dynamic = apiConfig.dynamic
export const runtime = apiConfig.runtime

// GET: 모든 직군 및 직급별 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fiscalYear = searchParams.get('fiscalYear') 
      ? parseInt(searchParams.get('fiscalYear')!)
      : new Date().getFullYear()

    // employeeDataService에서 직군×직급 데이터 가져오기
    const bandLevelData = await getBandLevelDetails()
    
    // 최종 데이터 구성
    const bands = bandLevelData.map((band, index) => {
      // 직급별 데이터 정리
      const levels = band.levels.filter((l: any) => l.level !== '신입') // 신입 제외
      
      return {
        id: band.id,
        name: band.name,
        displayOrder: index + 1,
        totalHeadcount: band.totalHeadcount,
        avgBaseUpRate: band.avgBaseUpRate,
        avgSBLIndex: band.avgSBLIndex,
        avgCAIndex: band.avgCAIndex,
        totalBudgetImpact: band.totalBudgetImpact,
        levels
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        fiscalYear,
        bands,
        summary: {
          totalHeadcount: bands.reduce((sum, band) => sum + band.totalHeadcount, 0),
          totalBudgetImpact: bands.reduce((sum, band) => sum + band.totalBudgetImpact, 0),
          avgBaseUpRate: bands.length > 0
            ? bands.reduce((sum, band) => sum + band.avgBaseUpRate * band.totalHeadcount, 0) / 
              bands.reduce((sum, band) => sum + band.totalHeadcount, 0)
            : 0
        }
      }
    })
  } catch (error) {
    console.error('Error fetching bands:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bands data' },
      { status: 500 }
    )
  }
}

