import { NextRequest, NextResponse } from 'next/server'
import { apiConfig } from '@/lib/apiConfig'

export const dynamic = apiConfig.dynamic
export const runtime = apiConfig.runtime

// POST: 외부 벤치마크 데이터 업로드 (CSV 형식)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, fiscalYear = new Date().getFullYear(), source } = body

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format' },
        { status: 400 }
      )
    }

    // 임시로 빈 응답 반환 (Vercel 빌드를 위해)
    return NextResponse.json({
      success: true,
      message: 'Benchmark upload temporarily disabled',
      data: []
    })
  } catch (error) {
    console.error('Error uploading benchmarks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload benchmark data' },
      { status: 500 }
    )
  }
}

// GET: 벤치마크 데이터 조회
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
    console.error('Error fetching benchmarks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch benchmark data' },
      { status: 500 }
    )
  }
}