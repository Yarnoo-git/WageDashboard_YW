import { NextRequest, NextResponse } from 'next/server'
import { apiConfig } from '@/lib/apiConfig'

export const dynamic = apiConfig.dynamic
export const runtime = apiConfig.runtime

// GET: 시나리오 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fiscalYear = searchParams.get('fiscalYear') 
      ? parseInt(searchParams.get('fiscalYear')!)
      : new Date().getFullYear()

    // 임시로 빈 배열 반환 (Vercel 빌드를 위해)
    return NextResponse.json({
      success: true,
      data: []
    })
  } catch (error) {
    console.error('Error fetching scenarios:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scenarios' },
      { status: 500 }
    )
  }
}

// POST: 새 시나리오 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 임시로 성공 응답 반환 (Vercel 빌드를 위해)
    return NextResponse.json({
      success: true,
      message: 'Scenario creation temporarily disabled',
      data: {
        scenarioId: `SCN_${Date.now()}`,
        ...body
      }
    })
  } catch (error) {
    console.error('Error creating scenario:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create scenario' },
      { status: 500 }
    )
  }
}