import { NextRequest, NextResponse } from 'next/server'
import { uploadEmployeeExcel, clearCache, getEmployeeData } from '@/services/employeeDataService'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 없습니다.' },
        { status: 400 }
      )
    }

    // 파일 형식 검증
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { success: false, error: '엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.' },
        { status: 400 }
      )
    }

    // 파일 처리
    const result = await uploadEmployeeExcel(file)
    
    if (result.success) {
      // 서버 사이드 캐시 초기화 (새로운 데이터로 다시 로드되도록)
      clearCache()
      
      // 파일 저장 (Vercel에서는 /tmp 사용)
      try {
        const tempDir = process.env.VERCEL === '1' ? '/tmp' : path.join(process.cwd(), 'temp')
        
        // temp 폴더가 없으면 생성
        await fs.mkdir(tempDir, { recursive: true })
        
        // 현재 업로드된 파일을 current_data.xlsx로 저장
        const targetPath = path.join(tempDir, 'current_data.xlsx')
        const arrayBuffer = await file.arrayBuffer()
        await fs.writeFile(targetPath, Buffer.from(arrayBuffer))
        
        console.log('업로드된 파일 저장 완료:', targetPath)
      } catch (saveError) {
        console.log('파일 저장 실패 (캐시만 사용):', saveError)
      }
      
      // 업로드된 데이터를 메모리에서 직접 가져오기
      const employees = await getEmployeeData()
      
      return NextResponse.json({
        success: true,
        message: result.message,
        data: {
          ...result.data,
          employees // 업로드된 직원 데이터도 반환
        }
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}