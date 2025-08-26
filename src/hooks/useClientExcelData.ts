/**
 * 클라이언트 사이드 엑셀 데이터 관리 훅
 */

import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { saveExcelData, loadExcelData, clearExcelData, hasStoredData, generateFileId, getCurrentFileId } from '@/lib/clientStorage'

export interface ClientExcelData {
  employees: any[]
  competitorData: any[]
  competitorIncreaseRate: number
  aiSettings: {
    baseUpPercentage: number
    meritIncreasePercentage: number
    totalPercentage: number
    minRange: number
    maxRange: number
  }
  gradeOrder?: string[]  // 평가등급 순서 (높은순)
  levelOrder?: string[]  // 직급 순서 (높은순)
  fileName: string
  uploadedAt: string
  fileId?: string  // 파일 ID 추가
}

export function useClientExcelData() {
  const [data, setData] = useState<ClientExcelData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 컴포넌트 마운트 시 자동 로드 제거 - 수동 로드만 가능
  // useEffect(() => {
  //   loadStoredData()
  // }, [])

  const loadStoredData = async () => {
    try {
      setLoading(true)
      const storedData = await loadExcelData()
      if (storedData) {
        setData({
          employees: storedData.employees,
          competitorData: storedData.competitorData,
          competitorIncreaseRate: storedData.competitorIncreaseRate || 0,
          aiSettings: storedData.aiSettings,
          gradeOrder: storedData.gradeOrder,
          levelOrder: storedData.levelOrder,
          fileName: storedData.fileName,
          uploadedAt: storedData.uploadedAt,
          fileId: storedData.fileId
        })
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err)
      setError('저장된 데이터를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const uploadExcel = async (file: File) => {
    try {
      setLoading(true)
      setError(null)

      // 파일 읽기
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      // 평가등급순서 시트 읽기
      let gradeOrder: string[] = []
      if (workbook.SheetNames.includes('평가등급순서')) {
        const gradeOrderSheet = workbook.Sheets['평가등급순서']
        const gradeOrderData = XLSX.utils.sheet_to_json(gradeOrderSheet, { header: 1 })
        console.log('[클라이언트] 평가등급순서 시트 데이터:', gradeOrderData)
        
        // 첫 번째 행은 헤더, 두 번째 행부터 실제 데이터
        gradeOrder = gradeOrderData.slice(1)
          .filter((row: any) => row[0])  // 첫 번째 열에 값이 있는 행만
          .map((row: any) => String(row[0]).trim())
        console.log('[클라이언트] 평가등급 순서 (높은순):', gradeOrder)
      } else {
        console.log('[클라이언트] 평가등급순서 시트가 없음, 기본값 사용')
        gradeOrder = ['ST', 'AT', 'OT', 'BT']  // 기본값
      }
      
      // 직급순서 시트 읽기
      let levelOrder: string[] = []
      if (workbook.SheetNames.includes('직급순서')) {
        const levelOrderSheet = workbook.Sheets['직급순서']
        const levelOrderData = XLSX.utils.sheet_to_json(levelOrderSheet, { header: 1 })
        console.log('[클라이언트] 직급순서 시트 데이터:', levelOrderData)
        
        // 첫 번째 행은 헤더, 두 번째 행부터 실제 데이터
        levelOrder = levelOrderData.slice(1)
          .filter((row: any) => row[0])  // 첫 번째 열에 값이 있는 행만
          .map((row: any) => String(row[0]).trim())
        console.log('[클라이언트] 직급 순서 (높은순):', levelOrder)
      } else {
        console.log('[클라이언트] 직급순서 시트가 없음, 기본값 사용')
        levelOrder = ['Lv.5', 'Lv.4', 'Lv.3', 'Lv.2', 'Lv.1']  // 기본값
      }
      
      // AI설정 시트 읽기
      let aiSettings = {
        baseUpPercentage: 0,
        meritIncreasePercentage: 0,
        totalPercentage: 0,
        minRange: 0,
        maxRange: 0
      }
      
      if (workbook.SheetNames.includes('AI설정')) {
        const aiSheet = workbook.Sheets['AI설정']
        const aiData = XLSX.utils.sheet_to_json(aiSheet)
        console.log('[클라이언트] AI설정 시트 데이터:', aiData)
        
        const baseUpRow = aiData.find((row: any) => row['항목'] === 'Base-up(%)')
        const meritRow = aiData.find((row: any) => 
          row['항목'] === '성과 인상률(%)' || 
          row['항목'] === '성과인상률(%)' ||
          row['항목'] === '성과 인상률 (%)' ||
          row['항목'] === '성과인상률 (%)')
        
        console.log('[클라이언트] Base-up 행:', baseUpRow)
        console.log('[클라이언트] Merit 행:', meritRow)
        
        aiSettings = {
          baseUpPercentage: baseUpRow ? (baseUpRow as any)['값'] || 0 : 0,
          meritIncreasePercentage: meritRow ? (meritRow as any)['값'] || 0 : 0,
          totalPercentage: (aiData.find((row: any) => 
            row['항목'] === '총 인상률(%)' || 
            row['항목'] === '총인상률(%)' ||
            row['항목'] === '총 인상률 (%)' ||
            row['항목'] === '총인상률 (%)') as any)?.['값'] || 0,
          minRange: (aiData.find((row: any) => row['항목'] === '최소범위(%)') as any)?.['값'] || 0,
          maxRange: (aiData.find((row: any) => row['항목'] === '최대범위(%)') as any)?.['값'] || 0
        }
        console.log('[클라이언트] AI 설정 로드 완료:', aiSettings)
      } else {
        console.log('[클라이언트] AI설정 시트가 없음')
      }
      
      // C사인상률 시트 읽기
      let competitorIncreaseRate = 0
      console.log('엑셀 시트 목록:', workbook.SheetNames)
      
      if (workbook.SheetNames.includes('C사인상률')) {
        const competitorRateSheet = workbook.Sheets['C사인상률']
        const competitorRateData = XLSX.utils.sheet_to_json(competitorRateSheet)
        console.log('C사인상률 시트 데이터:', competitorRateData)
        const rateRow = competitorRateData.find((row: any) => row['항목'] === 'C사 인상률(%)')
        if (rateRow) {
          competitorIncreaseRate = (rateRow as any)['값'] || 0
          console.log('C사 인상률 찾음:', competitorIncreaseRate)
        }
      } else {
        console.log('C사인상률 시트를 찾을 수 없음')
      }
      
      // C사데이터 시트 읽기
      let competitorData: any[] = []
      if (workbook.SheetNames.includes('C사데이터')) {
        const competitorSheet = workbook.Sheets['C사데이터']
        const competitorRawData = XLSX.utils.sheet_to_json(competitorSheet)
        console.log('C사데이터 시트 원본:', competitorRawData)
        
        competitorRawData.forEach((row: any) => {
          const band = row['직군']
          if (band) {
            ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4'].forEach(level => {
              if (row[level]) {
                competitorData.push({
                  company: 'C사',
                  band: band,
                  level: level,
                  averageSalary: row[level] * 1000 // 천원 단위를 원 단위로
                })
              }
            })
          }
        })
        console.log('처리된 C사 데이터:', competitorData.length, '개 항목')
      } else {
        console.log('C사데이터 시트를 찾을 수 없음')
      }
      
      // 직원 데이터 읽기
      const employeeSheetName = workbook.SheetNames.includes('직원기본정보') 
        ? '직원기본정보' 
        : workbook.SheetNames.find(name => name.includes('직원')) || workbook.SheetNames[0]
      
      const worksheet = workbook.Sheets[employeeSheetName]
      const employees = XLSX.utils.sheet_to_json(worksheet)
      
      // 데이터 변환 (필요한 경우) - Lv0 제외
      const processedEmployees = employees
        .filter((emp: any) => emp['직급'] !== 'Lv0')  // Lv0 (외주인력) 제외
        .map((emp: any, index: number) => {
        // 평가등급 필드 찾기 - 여러 가능한 컬럼명 확인
        const rating = emp['평가등급'] || emp['평가'] || emp['성과등급'] || emp['성과'] || 
                      emp['performanceRating'] || emp['Performance'] || emp['Rating'] || 
                      emp['평가 등급'] || emp['성과 등급'] || ''
        
        // Pay Zone 필드 찾기 - 여러 가능한 컬럼명 확인
        const payZone = emp['Pay Zone'] || emp['PayZone'] || emp['pay zone'] || emp['payzone'] || 
                       emp['페이존'] || emp['페이 존'] || emp['Pay_Zone'] || emp['pay_zone'] || undefined
        
        // 디버깅: 처음 몇 개 직원의 평가등급 및 Pay Zone 확인
        if (index < 3) {
          console.log(`직원 ${index + 1} (${emp['이름'] || emp['name']}) 데이터 매핑:`, {
            원본데이터키: Object.keys(emp),
            최종평가등급: rating,
            PayZone: payZone,
            평가등급필드: emp['평가등급'],
            평가필드: emp['평가']
          })
        }
        
        return {
          employeeId: emp['사번'] || emp['employeeId'] || '',
          name: emp['이름'] || emp['name'] || '',
          level: emp['직급'] || emp['level'] || '',
          band: emp['직군'] || emp['band'] || '',
          department: emp['부서'] || emp['department'] || '',
          currentSalary: emp['현재연봉'] || emp['currentSalary'] || 0,
          performanceRating: rating || null,
          payZone: payZone,
          hireDate: emp['입사일'] || emp['hireDate'] || '',
          position: emp['직책'] || emp['position'] || ''
        }
      })
      
      // 파일 ID 생성
      const fileId = generateFileId(file.name, file.size)
      
      const newData: ClientExcelData = {
        employees: processedEmployees,
        competitorData,
        competitorIncreaseRate,
        aiSettings,
        gradeOrder: gradeOrder.length > 0 ? gradeOrder : undefined,
        levelOrder: levelOrder.length > 0 ? levelOrder : undefined,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        fileId
      }
      
      // IndexedDB에 저장 (fileId 포함)
      await saveExcelData({ ...newData, fileId })
      
      // 상태 업데이트
      setData(newData)
      
      return { success: true, data: newData }
    } catch (err) {
      console.error('엑셀 업로드 실패:', err)
      setError('엑셀 파일 처리 중 오류가 발생했습니다.')
      return { success: false, error: '파일 처리 실패' }
    } finally {
      setLoading(false)
    }
  }

  const clearData = async () => {
    try {
      await clearExcelData()
      setData(null)
    } catch (err) {
      console.error('데이터 삭제 실패:', err)
      setError('데이터 삭제 중 오류가 발생했습니다.')
    }
  }

  return {
    data,
    loading,
    error,
    uploadExcel,
    clearData,
    loadStoredData,
    hasData: hasStoredData()
  }
}