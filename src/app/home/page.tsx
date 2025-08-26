'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useClientExcelData } from '@/hooks/useClientExcelData'
import { getStoredFileInfo } from '@/lib/clientStorage'

export default function HomePage() {
  const router = useRouter()
  const { data, loading, uploadExcel, clearData, loadStoredData, hasData } = useClientExcelData()
  const [uploading, setUploading] = useState(false)
  const [fileInfo, setFileInfo] = useState<{ fileName: string; uploadedAt: string } | null>(null)
  const [loadingStoredData, setLoadingStoredData] = useState(false)

  useEffect(() => {
    const info = getStoredFileInfo()
    setFileInfo(info)
  }, [data])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    const result = await uploadExcel(file)
    
    if (result.success) {
      // 업로드 성공 시 대시보드로 이동
      router.push('/dashboard')
    } else {
      alert('파일 업로드에 실패했습니다. 올바른 엑셀 파일인지 확인해주세요.')
    }
    setUploading(false)
  }

  const handleClearData = async () => {
    if (confirm('저장된 데이터를 삭제하시겠습니까?')) {
      await clearData()
      setFileInfo(null)
    }
  }

  const handleLoadStoredData = async () => {
    setLoadingStoredData(true)
    await loadStoredData()
    setLoadingStoredData(false)
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터 확인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-2xl w-full">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            인건비 대시보드
          </h1>
          <p className="text-gray-500 mb-8">Wage Dashboard System</p>
          
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              사용 방법
            </h2>
            <ol className="text-left text-sm text-gray-700 space-y-2">
              <li>1. 엑셀 파일(.xlsx)을 준비합니다</li>
              <li>2. 아래 버튼을 클릭하여 파일을 업로드합니다</li>
            </ol>
          </div>

          {/* 메인 업로드 영역 */}
          <div className="mb-8">
            <p className="text-gray-600 mb-6">
              엑셀 파일을 업로드하여 시작하세요
            </p>
            <label className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer">
              {uploading ? '업로드 중...' : '새 엑셀 파일 선택'}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          {/* 저장된 데이터 섹션 */}
          {hasData && fileInfo && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                이전 데이터
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-600 mb-1">
                  <span className="font-medium">파일명:</span> {fileInfo.fileName}
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-medium">업로드 시간:</span> {new Date(fileInfo.uploadedAt).toLocaleString('ko-KR')}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={handleLoadStoredData}
                  disabled={loadingStoredData}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {loadingStoredData ? '불러오는 중...' : '이전 데이터 불러오기'}
                </button>
                <button
                  onClick={handleClearData}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors"
                >
                  저장된 데이터 삭제
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}