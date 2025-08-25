'use client'

import { useState } from 'react'
import { useMetadata } from '@/hooks/useMetadata'
import { useWageContext } from '@/context/WageContext'
import { VirtualizedEmployeeTable } from '@/components/employees/VirtualizedEmployeeTable'
import { SimpleExportButton } from '@/components/ExportButton'
import { ScenarioManager } from '@/components/ScenarioManager'
import { PerformanceWeightModal } from '@/components/employees/PerformanceWeightModal'
import { RateInfoCard } from '@/components/common/RateInfoCard'

export default function EmployeesPage() {
  const { departments, levels, ratings, loading: metadataLoading } = useMetadata()
  const { 
    baseUpRate, 
    meritRate, 
    levelRates,
    scenarios,
    activeScenarioId,
    saveScenario,
    loadScenario,
    deleteScenario,
    renameScenario
  } = useWageContext()
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedRating, setSelectedRating] = useState<string>('')
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false)

  // 메타데이터 로딩 중일 때 로딩 화면 표시
  if (metadataLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-lg shadow h-96"></div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 네비게이션 바 아래에 버튼 영역 추가 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-end items-center h-12 gap-2">
            <ScenarioManager
              scenarios={scenarios}
              activeScenarioId={activeScenarioId}
              onSave={saveScenario}
              onLoad={loadScenario}
              onDelete={deleteScenario}
              onRename={renameScenario}
              isNavigation={true}
            />
            <button
              onClick={() => setIsWeightModalOpen(true)}
              className="h-8 md:h-9 px-2 md:px-4 text-xs md:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              평가등급 가중치
            </button>
            <SimpleExportButton isNavigation={true} />
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <RateInfoCard />
        </div>

        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">필터</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                직급
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">전체</option>
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                부서
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">전체</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                평가등급
              </label>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">전체</option>
                {ratings.map(rating => (
                  <option key={rating} value={rating}>
                    {rating}등급
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <VirtualizedEmployeeTable 
          level={selectedLevel} 
          department={selectedDepartment}
          performanceRating={selectedRating}
        />
      </div>
      
      <PerformanceWeightModal 
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
      />
    </main>
  )
}