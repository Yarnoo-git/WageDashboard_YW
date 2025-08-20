import { NextRequest, NextResponse } from 'next/server'
import { apiConfig } from '@/lib/apiConfig'

export const dynamic = apiConfig.dynamic
export const runtime = apiConfig.runtime

// GET: 특정 직군의 직급별 데이터 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { bandId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fiscalYear = searchParams.get('fiscalYear') 
      ? parseInt(searchParams.get('fiscalYear')!)
      : new Date().getFullYear()

    // 임시로 빈 응답 반환 (Vercel 빌드를 위해)
    return NextResponse.json({
      success: true,
      data: {
        bandId: params.bandId,
        fiscalYear,
        levels: []
      }
    })
  } catch (error) {
    console.error('Error fetching band levels:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch band levels' },
      { status: 500 }
    )
  }
}

// PUT: 직군×직급별 인상률 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { bandId: string } }
) {
  try {
    const body = await request.json()
    
    // 임시로 성공 응답 반환 (Vercel 빌드를 위해)
    return NextResponse.json({
      success: true,
      message: 'Update temporarily disabled',
      data: body
    })
  } catch (error) {
    console.error('Error updating band level:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update band level' },
      { status: 500 }
    )
  }
}