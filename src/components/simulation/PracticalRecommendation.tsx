/**
 * 실무 추천안 메인 컴포넌트
 * 개선: 직군 선택 방식 + 전체 컬럼 편집 가능
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useWageContextNew } from '@/context/WageContextNew'
import { PracticalRecommendationCell } from './PracticalRecommendationCell'
import {
  PracticalRecommendationData,
  initializePracticalData,
  updateBandValueAndRecalculateTotal,
  distributeTotalToBands,
  applyPracticalToMatrix
} from '@/utils/practicalCalculation'

export function PracticalRecommendation() {
  const context = useWageContextNew()
  const [practicalData, setPracticalData] = useState<PracticalRecommendationData | null>(null)
  const [selectedBands, setSelectedBands] = useState<string[]>([])
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set())
  const [showAllZones, setShowAllZones] = useState(false) // 기본적으로 전체 Zone만 표시
  const [isCompactMode, setIsCompactMode] = useState(true) // 기본값 컴팩트 모드
  
  // 실무 추천안 데이터 초기화
  useEffect(() => {
    if (context.originalData.employees.length > 0 && context.adjustment.matrix) {
      const data = initializePracticalData(
        context.originalData.employees,
        context.adjustment.matrix
      )
      setPracticalData(data)
      
      // 기본적으로 첫 2개 직군 선택, 모든 레벨 펼치기
      if (data.metadata.bands.length > 0) {
        setSelectedBands(data.metadata.bands.slice(0, Math.min(2, data.metadata.bands.length)))
      }
      setExpandedLevels(new Set(data.metadata.levels))
    }
  }, [context.originalData.employees, context.adjustment.matrix])
  
  // 직군 선택 토글
  const toggleBandSelection = (band: string) => {
    setSelectedBands(prev => {
      if (prev.includes(band)) {
        return prev.filter(b => b !== band)
      } else {
        return [...prev, band]
      }
    })
  }
  
  // 모든 직군 선택/해제
  const toggleAllBands = () => {
    if (selectedBands.length === practicalData?.metadata.bands.length) {
      setSelectedBands([])
    } else {
      setSelectedBands(practicalData?.metadata.bands || [])
    }
  }
  
  // 레벨 펼치기/접기 토글
  const toggleLevel = (level: string) => {
    setExpandedLevels(prev => {
      const newSet = new Set(prev)
      if (newSet.has(level)) {
        newSet.delete(level)
      } else {
        newSet.add(level)
      }
      return newSet
    })
  }
  
  // 직군 값 변경 핸들러
  const handleBandCellChange = (
    level: string,
    payZone: string,
    band: string,
    grade: string,
    field: 'baseUp' | 'merit' | 'additional',
    value: number
  ) => {
    if (!practicalData) return
    
    const newData = { ...practicalData }
    updateBandValueAndRecalculateTotal(newData, level, payZone, band, grade, field, value)
    setPracticalData(newData)
    
    // Context에 변경사항 적용 (전체 PayZone만)
    if (payZone === 'all') {
      context.actions.updateCellGradeRate(band, level, grade, field, value)
    }
  }
  
  // 전체 값 변경 핸들러 (직군에 비례 분배)
  const handleTotalCellChange = (
    level: string,
    payZone: string,
    grade: string,
    field: 'baseUp' | 'merit' | 'additional',
    value: number
  ) => {
    if (!practicalData) return
    
    const newData = { ...practicalData }
    distributeTotalToBands(newData, level, payZone, grade, field, value)
    setPracticalData(newData)
    
    // Context에 변경사항 적용 (전체 PayZone만)
    if (payZone === 'all') {
      for (const band of newData.metadata.bands) {
        const bandCell = newData.hierarchy[level]?.[payZone]?.byBand[band]?.[grade]
        if (bandCell) {
          context.actions.updateCellGradeRate(band, level, grade, field, bandCell[field])
        }
      }
    }
  }
  
  if (!practicalData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">데이터를 불러오는 중...</div>
      </div>
    )
  }
  
  // PayZone 표시 이름 변환
  const getPayZoneDisplayName = (payZone: string) => {
    if (payZone === 'all') return '전체'
    return `Zone ${payZone.replace('zone', '')}`
  }
  
  // 표시할 PayZone 목록
  const displayedPayZones = showAllZones ? practicalData.metadata.payZones : ['all']
  
  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* 직군 선택 바 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">표시할 직군 선택</h3>
          <div className="flex gap-2">
            <button
              onClick={toggleAllBands}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {selectedBands.length === practicalData.metadata.bands.length ? '모두 해제' : '모두 선택'}
            </button>
            <button
              onClick={() => setIsCompactMode(!isCompactMode)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                isCompactMode 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isCompactMode ? '📦 컴팩트' : '📊 상세'}
            </button>
            <button
              onClick={() => setShowAllZones(!showAllZones)}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {showAllZones ? 'Zone 숨기기' : 'Zone 보기'}
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {practicalData.metadata.bands.map(band => (
            <button
              key={band}
              onClick={() => toggleBandSelection(band)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                selectedBands.includes(band)
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {band}
            </button>
          ))}
        </div>
        
        {selectedBands.length === 0 && (
          <p className="text-xs text-gray-500 mt-2">최소 1개 이상의 직군을 선택해주세요</p>
        )}
      </div>
      
      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            {/* 첫 번째 헤더 행 - 직군별 그룹 */}
            <tr className="border-b-2 border-gray-300">
              <th className="sticky left-0 z-20 bg-gray-100 border border-gray-300 px-3 py-2" rowSpan={2}>
                <div className="text-sm font-semibold text-gray-700">레벨 × Zone</div>
              </th>
              
              {/* 전체 컬럼 */}
              <th className="bg-blue-100 border border-gray-300 text-center" colSpan={practicalData.metadata.grades.length}>
                <div className="text-xs font-bold text-blue-700 py-0.5">【전체】</div>
                {isCompactMode && <div className="text-[10px] text-blue-600">클릭 편집</div>}
              </th>
              
              {/* 선택된 직군별 컬럼들 */}
              {selectedBands.map(band => (
                <th key={band} className="bg-gray-100 border border-gray-300 text-center" colSpan={practicalData.metadata.grades.length}>
                  <div className="text-xs font-bold text-gray-700 py-0.5">【{band}】</div>
                </th>
              ))}
            </tr>
            
            {/* 두 번째 헤더 행 - 평가등급 */}
            <tr>
              {/* 전체 컬럼의 평가등급들 */}
              {practicalData.metadata.grades.map(grade => (
                <th key={`total-${grade}`} className={`bg-blue-50 border border-gray-300 px-0.5 py-0.5 ${isCompactMode ? 'min-w-[45px]' : 'min-w-[80px]'}`}>
                  <div className="text-[10px] font-semibold text-blue-700">{grade}</div>
                </th>
              ))}
              
              {/* 각 선택된 직군의 평가등급들 */}
              {selectedBands.map(band => 
                practicalData.metadata.grades.map(grade => (
                  <th key={`${band}-${grade}`} className={`bg-gray-50 border border-gray-300 px-0.5 py-0.5 ${isCompactMode ? 'min-w-[45px]' : 'min-w-[80px]'}`}>
                    <div className="text-[10px] font-semibold text-gray-700">{grade}</div>
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {practicalData.metadata.levels.map(level => {
              const isExpanded = expandedLevels.has(level)
              
              return (
                <React.Fragment key={level}>
                  {/* 레벨 헤더 행 */}
                  <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                    <td 
                      className="sticky left-0 z-10 bg-gray-50 border border-gray-300 px-3 py-2 cursor-pointer"
                      onClick={() => toggleLevel(level)}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 text-sm">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                        <span className="font-semibold text-gray-700">{level}</span>
                      </div>
                    </td>
                    
                    {/* 레벨 요약 (접혔을 때) */}
                    {!isExpanded && (
                      <>
                        {/* 전체 컬럼 */}
                        {practicalData.metadata.grades.map(grade => (
                          <td key={grade} className="border border-gray-300 bg-blue-50 text-center text-xs text-gray-500">
                            -
                          </td>
                        ))}
                        {/* 선택된 직군별 컬럼 */}
                        {selectedBands.map(band => 
                          practicalData.metadata.grades.map(grade => (
                            <td key={`${band}-${grade}`} className="border border-gray-300 text-center text-xs text-gray-500">
                              -
                            </td>
                          ))
                        )}
                      </>
                    )}
                    
                    {/* 빈 셀들 (펼쳐졌을 때) */}
                    {isExpanded && (
                      <>
                        {/* 전체 + 선택된 직군별 모든 등급 수만큼 빈 셀 */}
                        {[...Array(practicalData.metadata.grades.length * (1 + selectedBands.length))].map((_, i) => (
                          <td key={i} className="border border-gray-300"></td>
                        ))}
                      </>
                    )}
                  </tr>
                  
                  {/* PayZone별 상세 행들 (펼쳐졌을 때만) */}
                  {isExpanded && displayedPayZones.map(payZone => {
                    const zoneData = practicalData.hierarchy[level]?.[payZone]
                    if (!zoneData) return null
                    
                    return (
                      <tr key={`${level}-${payZone}`} className="hover:bg-gray-50 transition-colors">
                        <td className="sticky left-0 z-10 bg-white border border-gray-300 px-3 py-1">
                          <div className="text-sm text-gray-600 pl-5">
                            {getPayZoneDisplayName(payZone)}
                          </div>
                        </td>
                        
                        {/* 전체 컬럼 (편집 가능) */}
                        {practicalData.metadata.grades.map(grade => {
                          const totalCell = zoneData.total[grade]
                          
                          return (
                            <td key={grade} className="border border-gray-300 p-0">
                              {totalCell && (
                                <PracticalRecommendationCell
                                  baseUp={totalCell.baseUp}
                                  merit={totalCell.merit}
                                  additional={totalCell.additional}
                                  employeeCount={totalCell.employeeCount}
                                  isEditable={true}
                                  isTotal={true}
                                  isCompact={isCompactMode}
                                  onChange={(field, value) => handleTotalCellChange(level, payZone, grade, field, value)}
                                />
                              )}
                            </td>
                          )
                        })}
                        
                        {/* 선택된 직군별 컬럼들 */}
                        {selectedBands.map(band => 
                          practicalData.metadata.grades.map(grade => {
                            const bandCell = zoneData.byBand[band]?.[grade]
                            
                            return (
                              <td key={`${band}-${grade}`} className="border border-gray-300 p-0">
                                {bandCell && (
                                  <PracticalRecommendationCell
                                    baseUp={bandCell.baseUp}
                                    merit={bandCell.merit}
                                    additional={bandCell.additional}
                                    employeeCount={bandCell.employeeCount}
                                    isEditable={true}
                                    isTotal={false}
                                    isCompact={isCompactMode}
                                    onChange={(field, value) => handleBandCellChange(level, payZone, band, grade, field, value)}
                                    band={band}
                                    level={level}
                                    payZone={payZone}
                                    grade={grade}
                                  />
                                )}
                              </td>
                            )
                          })
                        )}
                      </tr>
                    )
                  })}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* 하단 안내 */}
      <div className="p-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-semibold text-gray-700 mb-1">💡 사용 방법</p>
            <ul className="space-y-0.5 text-gray-600">
              <li>• 상단에서 보고 싶은 직군을 선택하세요</li>
              <li>• 전체 컬럼도 직접 수정 가능합니다</li>
              <li>• 전체 수정 시 선택된 직군에 비례 분배됩니다</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">📊 인상률 구성</p>
            <p className="text-gray-600">
              <span className="text-blue-500">Base-up</span> + 
              <span className="text-green-500 ml-1">Merit</span> + 
              <span className="text-orange-500 ml-1">Additional</span> = 
              <span className="font-semibold ml-1">총 인상률</span>
            </p>
            <p className="text-gray-500 mt-1">가중치 = 인원수 × 평균급여</p>
          </div>
        </div>
      </div>
    </div>
  )
}