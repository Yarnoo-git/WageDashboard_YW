import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { clearCache } from '@/services/employeeDataService'
import { apiConfig } from '@/lib/apiConfig'

export const dynamic = apiConfig.dynamic

export async function DELETE() {
  try {
    // 쿠키에서 파일명 삭제
    const cookieStore = cookies()
    cookieStore.delete('loadedExcelFile')
    
    // 서버 사이드 캐시 클리어
    clearCache()
    
    // 응답 헤더에 캐시 방지 설정
    const response = NextResponse.json({ 
      success: true, 
      message: '데이터가 삭제되었습니다.' 
    })
    
    // 캐시 방지 헤더 추가
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    
    return response
  } catch (error) {
    console.error('Failed to delete data:', error)
    return NextResponse.json(
      { success: false, message: '데이터 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}