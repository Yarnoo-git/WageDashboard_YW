'use client'

import { useState } from 'react'
import { ExportData } from '@/lib/exportHelpers'

interface ExportButtonProps {
  exportData?: ExportData
  scenarioName?: string
  className?: string
  isNavigation?: boolean // 네비게이션 바에서 사용하는지 여부
}

export function ExportButton({ exportData, scenarioName, className = '', isNavigation = false }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!exportData) {
      alert('내보낼 데이터가 없습니다.')
      return
    }

    setExporting(true)
    try {
      // POST 요청으로 데이터 전송
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: exportData,
          format: 'xlsx'
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wage-dashboard-${scenarioName || 'export'}-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      // 성공 알림
      alert('Excel 파일이 다운로드되었습니다.')
    } catch (error) {
      alert(`내보내기에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setExporting(false)
    }
  }

  const buttonClass = isNavigation 
    ? `h-9 px-4 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors ${className}`
    : `h-10 px-4 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors ${className}`

  return (
    <button
      onClick={handleExport}
      className={buttonClass}
      disabled={exporting || !exportData}
    >
      {exporting ? '내보내는 중...' : 'Excel 내보내기'}
    </button>
  )
}

// SimpleExportButton을 ExportButton으로 통합
export const SimpleExportButton = ExportButton