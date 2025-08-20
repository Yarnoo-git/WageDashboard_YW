import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  try {
    const results: any = {}
    
    // 가능한 경로들
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'data', 'SBL_employee_data_comp.xlsx'),
      path.join(process.cwd(), 'data', 'SBL_employee_data_comp.xlsx'),
      path.join(process.cwd(), '.next/server/app', 'public', 'data', 'SBL_employee_data_comp.xlsx')
    ]
    
    for (const tryPath of possiblePaths) {
      try {
        await fs.promises.access(tryPath)
        const fileBuffer = await fs.promises.readFile(tryPath)
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
        
        results.path = tryPath
        results.sheets = workbook.SheetNames
        
        // C사인상률 시트 확인
        if (workbook.SheetNames.includes('C사인상률')) {
          const sheet = workbook.Sheets['C사인상률']
          const data = XLSX.utils.sheet_to_json(sheet)
          results.competitorRateData = data
          
          const rateRow = data.find((row: any) => row['항목'] === 'C사 인상률(%)')
          if (rateRow) {
            results.competitorRate = (rateRow as any)['값']
          }
        }
        
        break // 첫 번째 성공한 경로에서 멈춤
      } catch (e) {
        continue
      }
    }
    
    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}