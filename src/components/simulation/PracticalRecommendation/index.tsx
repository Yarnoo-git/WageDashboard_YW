/**
 * 실무 추천안 메인 컴포넌트 (리팩토링됨)
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useWageContextNew } from '@/context/WageContextNew'
import { BandSelector } from './BandSelector'
import { DisplayControls } from './DisplayControls'
import {
  PracticalRecommendationData,
  initializePracticalData,
  applyPracticalToMatrix
} from '@/utils/practicalCalculation'

export function PracticalRecommendation() {
  const context = useWageContextNew()
  const [practicalData, setPracticalData] = useState<PracticalRecommendationData | null>(null)
  const [selectedBands, setSelectedBands] = useState<string[]>([])
  const [_expandedLevels, _setExpandedLevels] = useState<Set<string>>(new Set())
  const [showAllZones, setShowAllZones] = useState(false)
  const [isCompactMode, setIsCompactMode] = useState(true)

  // 데이터 초기화
  useEffect(() => {
    if (context.originalData.employees.length > 0 && context.adjustment.matrix) {
      const data = initializePracticalData(
        context.originalData.employees,
        context.adjustment.matrix
      )
      setPracticalData(data)
    }
  }, [context.originalData.employees, context.adjustment.matrix])

  // 직군 토글
  const handleBandToggle = (band: string) => {
    setSelectedBands(prev => 
      prev.includes(band) 
        ? prev.filter(b => b !== band)
        : [...prev, band]
    )
  }

  // 전체 선택
  const handleSelectAll = () => {
    if (practicalData) {
      setSelectedBands(practicalData.metadata.bands)
    }
  }

  // 전체 해제
  const handleClearAll = () => {
    setSelectedBands([])
  }

  // 값 업데이트 핸들러 - TODO: 구현 필요
  // const handleCellUpdate = (params: {
  //   band?: string
  //   level?: string
  //   payZone?: number
  //   field: 'baseUp' | 'merit' | 'additional'
  //   value: number
  //   scope: 'company' | 'band' | 'level' | 'payZone'
  // }) => {
  //   if (!practicalData) return
    
  //   const { scope, field, value } = params
    
  //   switch (scope) {
  //     case 'company':
  //       // 회사 전체 적용
  //       applyCompanyTotalToAll(practicalData, field, value)
  //       setPracticalData({ ...practicalData })
  //       break
        
  //     case 'band':
  //     case 'level':
  //     case 'payZone':
  //       // TODO: 구현 필요
  //       console.warn(`${scope} level update not implemented yet`)
  //       break
  //   }
  // }

  // 매트릭스에 적용
  const handleApplyToMatrix = () => {
    if (!practicalData || !context.adjustment.matrix) return
    
    applyPracticalToMatrix(
      practicalData,
      context.adjustment.matrix
    )
    
    // Context에 업데이트된 매트릭스 적용
    context.actions.applyPendingChanges()
  }

  if (!practicalData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <span className="text-gray-500">데이터를 불러오는 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">실무 추천안</h2>
          <div className="flex items-center gap-4">
            <BandSelector
              availableBands={practicalData.metadata.bands}
              selectedBands={selectedBands}
              onBandToggle={handleBandToggle}
              onSelectAll={handleSelectAll}
              onClearAll={handleClearAll}
            />
            <DisplayControls
              showAllZones={showAllZones}
              onToggleShowAllZones={() => setShowAllZones(!showAllZones)}
              isCompactMode={isCompactMode}
              onToggleCompactMode={() => setIsCompactMode(!isCompactMode)}
              selectedBandsCount={selectedBands.length}
            />
            <button
              onClick={handleApplyToMatrix}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              매트릭스 적용
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                구분
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                인원
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Base-up (%)
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Merit (%)
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                추가 (%)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                실무 추천안 기능을 준비 중입니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}