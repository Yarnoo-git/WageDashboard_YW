/**
 * 실무 추천안 메인 컴포넌트 (리팩토링됨)
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useWageContextNew } from '@/context/WageContextNew'
import { PracticalRecommendationCell } from '../PracticalRecommendationCell'
import { BandSelector } from './BandSelector'
import { DisplayControls } from './DisplayControls'
import {
  PracticalRecommendationData,
  initializePracticalData,
  updateBandValueAndRecalculateTotal,
  distributeTotalToBands,
  distributeAllToPayZones,
  calculateAllFromPayZones,
  calculateCompanyTotal,
  applyCompanyTotalToAll,
  applyPracticalToMatrix
} from '@/utils/practicalCalculation'

export function PracticalRecommendation() {
  const context = useWageContextNew()
  const [practicalData, setPracticalData] = useState<PracticalRecommendationData | null>(null)
  const [selectedBands, setSelectedBands] = useState<string[]>([])
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set())
  const [showAllZones, setShowAllZones] = useState(false)
  const [isCompactMode, setIsCompactMode] = useState(true)
  
  // 동적 컴팩트 모드
  const getAutoCompactMode = () => {
    if (selectedBands.length >= 3) return true
    return isCompactMode
  }
  
  const effectiveCompactMode = getAutoCompactMode()
  
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
      setSelectedBands(practicalData.bands.map(b => b.band))
    }
  }
  
  // 전체 해제
  const handleClearAll = () => {
    setSelectedBands([])
  }
  
  // Level 확장/축소 토글
  const toggleLevelExpansion = (band: string, level: string) => {
    const key = `${band}-${level}`
    setExpandedLevels(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }
  
  // 값 업데이트 핸들러
  const handleCellUpdate = (params: {
    band?: string
    level?: string
    payZone?: number
    field: 'baseUp' | 'merit' | 'additional'
    value: number
    scope: 'company' | 'band' | 'level' | 'payZone'
  }) => {
    if (!practicalData) return
    
    const { scope, field, value } = params
    
    switch (scope) {
      case 'company':
        // 회사 전체 적용
        const companyTotal = calculateCompanyTotal(practicalData)
        const updatedDataForCompany = applyCompanyTotalToAll(
          practicalData,
          { ...companyTotal, [field]: value }
        )
        setPracticalData(updatedDataForCompany)
        break
        
      case 'band':
        if (params.band) {
          // Band 전체 값 변경 후 PayZone으로 분배
          const updatedAfterBand = updateBandValueAndRecalculateTotal(
            practicalData,
            params.band,
            field,
            value
          )
          const finalDataForBand = distributeAllToPayZones(updatedAfterBand, params.band)
          setPracticalData(finalDataForBand)
        }
        break
        
      case 'level':
        if (params.band && params.level) {
          // Level별 값 변경
          const updatedData = { ...practicalData }
          const bandData = updatedData.bands.find(b => b.band === params.band)
          if (bandData) {
            const levelData = bandData.levels.find(l => l.level === params.level)
            if (levelData) {
              levelData.rates[field] = value
              // PayZone으로 분배
              levelData.payZones.forEach(pz => {
                pz.rates[field] = value
              })
            }
          }
          // Band 전체 재계산
          const finalData = calculateAllFromPayZones(updatedData)
          setPracticalData(finalData)
        }
        break
        
      case 'payZone':
        if (params.band && params.level && params.payZone !== undefined) {
          // PayZone별 값 직접 수정
          const updatedData = { ...practicalData }
          const bandData = updatedData.bands.find(b => b.band === params.band)
          if (bandData) {
            const levelData = bandData.levels.find(l => l.level === params.level)
            if (levelData) {
              const payZoneData = levelData.payZones.find(pz => pz.zone === params.payZone)
              if (payZoneData) {
                payZoneData.rates[field] = value
              }
              // Level 평균 재계산
              const avgValue = levelData.payZones.reduce((sum, pz) => 
                sum + pz.rates[field] * pz.headcount, 0
              ) / (levelData.headcount || 1)
              levelData.rates[field] = avgValue
            }
          }
          // Band와 Company 전체 재계산
          const finalData = calculateAllFromPayZones(updatedData)
          setPracticalData(finalData)
        }
        break
    }
  }
  
  // 매트릭스에 적용
  const handleApplyToMatrix = () => {
    if (!practicalData || !context.adjustment.matrix) return
    
    const updatedMatrix = applyPracticalToMatrix(
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
  
  // 표시할 데이터 결정
  const displayData = selectedBands.length > 0
    ? practicalData.bands.filter(b => selectedBands.includes(b.band))
    : practicalData.bands
  
  // 회사 전체 합계 계산
  const companyTotal = calculateCompanyTotal(practicalData)
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">실무 추천안</h2>
          <div className="flex items-center gap-4">
            <BandSelector
              availableBands={practicalData.bands.map(b => b.band)}
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
              {!effectiveCompactMode && (
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  합계 (%)
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* 회사 전체 행 */}
            <tr className="bg-blue-50">
              <td className="px-4 py-3 font-semibold text-blue-900">
                회사 전체
              </td>
              <td className="px-4 py-3 text-center text-blue-900">
                {practicalData.totalHeadcount.toLocaleString()}
              </td>
              <PracticalRecommendationCell
                value={companyTotal.baseUp}
                onChange={(value) => handleCellUpdate({
                  field: 'baseUp',
                  value,
                  scope: 'company'
                })}
                isCompact={effectiveCompactMode}
                className="bg-blue-100"
              />
              <PracticalRecommendationCell
                value={companyTotal.merit}
                onChange={(value) => handleCellUpdate({
                  field: 'merit',
                  value,
                  scope: 'company'
                })}
                isCompact={effectiveCompactMode}
                className="bg-blue-100"
              />
              <PracticalRecommendationCell
                value={companyTotal.additional}
                onChange={(value) => handleCellUpdate({
                  field: 'additional',
                  value,
                  scope: 'company'
                })}
                isCompact={effectiveCompactMode}
                className="bg-blue-100"
              />
              {!effectiveCompactMode && (
                <td className="px-4 py-3 text-center font-semibold text-blue-900">
                  {(companyTotal.baseUp + companyTotal.merit + companyTotal.additional).toFixed(1)}
                </td>
              )}
            </tr>
            
            {/* Band별 데이터 */}
            {displayData.map(bandData => (
              <React.Fragment key={bandData.band}>
                {/* Band 헤더 */}
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-semibold">{bandData.band}</td>
                  <td className="px-4 py-3 text-center">
                    {bandData.headcount.toLocaleString()}
                  </td>
                  <PracticalRecommendationCell
                    value={bandData.rates.baseUp}
                    onChange={(value) => handleCellUpdate({
                      band: bandData.band,
                      field: 'baseUp',
                      value,
                      scope: 'band'
                    })}
                    isCompact={effectiveCompactMode}
                  />
                  <PracticalRecommendationCell
                    value={bandData.rates.merit}
                    onChange={(value) => handleCellUpdate({
                      band: bandData.band,
                      field: 'merit',
                      value,
                      scope: 'band'
                    })}
                    isCompact={effectiveCompactMode}
                  />
                  <PracticalRecommendationCell
                    value={bandData.rates.additional}
                    onChange={(value) => handleCellUpdate({
                      band: bandData.band,
                      field: 'additional',
                      value,
                      scope: 'band'
                    })}
                    isCompact={effectiveCompactMode}
                  />
                  {!effectiveCompactMode && (
                    <td className="px-4 py-3 text-center font-semibold">
                      {(bandData.rates.baseUp + bandData.rates.merit + bandData.rates.additional).toFixed(1)}
                    </td>
                  )}
                </tr>
                
                {/* Level별 데이터 */}
                {bandData.levels.map(levelData => {
                  const isExpanded = expandedLevels.has(`${bandData.band}-${levelData.level}`)
                  return (
                    <React.Fragment key={`${bandData.band}-${levelData.level}`}>
                      <tr>
                        <td className="px-4 py-2 pl-8">
                          <button
                            onClick={() => toggleLevelExpansion(bandData.band, levelData.level)}
                            className="flex items-center gap-1 hover:text-blue-600"
                          >
                            {showAllZones && (
                              <svg 
                                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                            {levelData.level}
                          </button>
                        </td>
                        <td className="px-4 py-2 text-center text-sm">
                          {levelData.headcount.toLocaleString()}
                        </td>
                        <PracticalRecommendationCell
                          value={levelData.rates.baseUp}
                          onChange={(value) => handleCellUpdate({
                            band: bandData.band,
                            level: levelData.level,
                            field: 'baseUp',
                            value,
                            scope: 'level'
                          })}
                          isCompact={effectiveCompactMode}
                        />
                        <PracticalRecommendationCell
                          value={levelData.rates.merit}
                          onChange={(value) => handleCellUpdate({
                            band: bandData.band,
                            level: levelData.level,
                            field: 'merit',
                            value,
                            scope: 'level'
                          })}
                          isCompact={effectiveCompactMode}
                        />
                        <PracticalRecommendationCell
                          value={levelData.rates.additional}
                          onChange={(value) => handleCellUpdate({
                            band: bandData.band,
                            level: levelData.level,
                            field: 'additional',
                            value,
                            scope: 'level'
                          })}
                          isCompact={effectiveCompactMode}
                        />
                        {!effectiveCompactMode && (
                          <td className="px-4 py-2 text-center text-sm">
                            {(levelData.rates.baseUp + levelData.rates.merit + levelData.rates.additional).toFixed(1)}
                          </td>
                        )}
                      </tr>
                      
                      {/* PayZone별 데이터 (선택적) */}
                      {showAllZones && isExpanded && levelData.payZones.map(payZoneData => (
                        <tr key={`${bandData.band}-${levelData.level}-${payZoneData.zone}`} className="bg-gray-50">
                          <td className="px-4 py-1 pl-12 text-sm text-gray-600">
                            Zone {payZoneData.zone}
                          </td>
                          <td className="px-4 py-1 text-center text-sm text-gray-600">
                            {payZoneData.headcount.toLocaleString()}
                          </td>
                          <PracticalRecommendationCell
                            value={payZoneData.rates.baseUp}
                            onChange={(value) => handleCellUpdate({
                              band: bandData.band,
                              level: levelData.level,
                              payZone: payZoneData.zone,
                              field: 'baseUp',
                              value,
                              scope: 'payZone'
                            })}
                            isCompact={effectiveCompactMode}
                            size="small"
                          />
                          <PracticalRecommendationCell
                            value={payZoneData.rates.merit}
                            onChange={(value) => handleCellUpdate({
                              band: bandData.band,
                              level: levelData.level,
                              payZone: payZoneData.zone,
                              field: 'merit',
                              value,
                              scope: 'payZone'
                            })}
                            isCompact={effectiveCompactMode}
                            size="small"
                          />
                          <PracticalRecommendationCell
                            value={payZoneData.rates.additional}
                            onChange={(value) => handleCellUpdate({
                              band: bandData.band,
                              level: levelData.level,
                              payZone: payZoneData.zone,
                              field: 'additional',
                              value,
                              scope: 'payZone'
                            })}
                            isCompact={effectiveCompactMode}
                            size="small"
                          />
                          {!effectiveCompactMode && (
                            <td className="px-4 py-1 text-center text-sm text-gray-600">
                              {(payZoneData.rates.baseUp + payZoneData.rates.merit + payZoneData.rates.additional).toFixed(1)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  )
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}