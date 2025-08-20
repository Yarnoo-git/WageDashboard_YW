import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { ExportData, formatExportDataForExcel } from '@/lib/exportHelpers'

// POST 요청으로 변경 - 화면의 state 데이터를 받아서 처리
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, format = 'xlsx' } = body as { data: ExportData, format?: string }

    if (!data) {
      return NextResponse.json(
        { error: 'Export data is required' },
        { status: 400 }
      )
    }

    // Excel 데이터 포맷팅
    const excelData = formatExportDataForExcel(data)

    if (format === 'json') {
      return NextResponse.json(excelData)
    }

    // Excel 파일 생성
    const wb = XLSX.utils.book_new()
    
    // 각 시트 생성
    Object.entries(excelData).forEach(([sheetName, sheetData]) => {
      const ws = XLSX.utils.json_to_sheet(sheetData as any[])
      
      // 컬럼 너비 자동 조정
      const colWidths: any[] = []
      if (Array.isArray(sheetData) && sheetData.length > 0) {
        Object.keys(sheetData[0]).forEach((key, index) => {
          const maxLength = Math.max(
            key.length,
            ...sheetData.map((row: any) => 
              row[key] ? String(row[key]).length : 0
            )
          )
          colWidths[index] = { wch: Math.min(maxLength + 2, 50) }
        })
      }
      ws['!cols'] = colWidths
      
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })

    // Excel 파일 생성 옵션
    const buffer = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'buffer',
      bookSST: true,
      compression: true
    })

    // 파일명에 시나리오 이름과 날짜 포함
    const fileName = `wage-dashboard-${data.scenarioInfo.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Export API Error:', error)
    return NextResponse.json(
      { error: 'Failed to export report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET 요청은 더 이상 사용하지 않지만 호환성을 위해 유지
export async function GET() {
  return NextResponse.json(
    { error: 'Please use POST method with export data' },
    { status: 405 }
  )
}