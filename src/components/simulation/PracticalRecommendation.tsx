/**
 * 실무 추천안 메인 컴포넌트
 * 개선: 직군 선택 방식 + 전체 컬럼 편집 가능
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useWageContextNew } from '@/context/WageContextNew'
import { PracticalRecommendationCell } from './PracticalRecommendationCell'
import {
  PracticalRecommendationData,
  initializePracticalData,
  updateBandValueAndRecalculateTotal,
  distributeTotalToBands,
  distributeAllToPayZones,
  calculateAllFromPayZones,
  applyPracticalToMatrix
} from '@/utils/practicalCalculation'

export function PracticalRecommendation() {
  const context = useWageContextNew()
  const [practicalData, setPracticalData] = useState<PracticalRecommendationData | null>(null)
  const [selectedBands, setSelectedBands] = useState<string[]>([])
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set())
  const [showAllZones, setShowAllZones] = useState(false) // 기본적으로 전체 Zone만 표시
  const [isCompactMode, setIsCompactMode] = useState(true) // 기본값 컴팩트 모드
  const [showDropdown, setShowDropdown] = useState(false) // 드롭다운 표시 여부
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // 동적 컴팩트 모드 - 직군 수에 따라 자동 조정
  const getAutoCompactMode = () => {
    if (selectedBands.length >= 3) return true  // 3개 이상은 무조건 컴팩트
    return isCompactMode  // 2개 이하는 사용자 설정 따름
  }
  
  const effectiveCompactMode = getAutoCompactMode()
  
  // 실무 추천안 데이터 초기화
  useEffect(() => {
    if (context.originalData.employees.length > 0 && context.adjustment.matrix) {
      const data = initializePracticalData(
        context.originalData.employees,
        context.adjustment.matrix
      )
      setPracticalData(data)
      
      // 기본적으로 직군 선택 안 함 (전체 모드)
      setSelectedBands([])
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
  
  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])
  
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
  
  // 직군 값 변경 핸들러 (전체 재계산 + PayZone 처리)
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
    
    // 1. 직군 값 업데이트
    const cell = newData.hierarchy[level]?.[payZone]?.byBand[band]?.[grade]
    if (cell) {
      cell[field] = value
    }
    
    // 2. 가로 방향: 직군 → 전체 (가중평균 재계산)
    updateBandValueAndRecalculateTotal(newData, level, payZone, band, grade, field, value)
    
    // 3. 세로 방향 처리
    if (payZone === 'all') {
      // all PayZone 수정 시 → 개별 PayZone들에 동일값 설정
      distributeAllToPayZones(newData, level, band, grade, field, value)
      
      // Context에 변경사항 적용
      context.actions.updateCellGradeRate(band, level, grade, field, value)
    } else {
      // 개별 PayZone 수정 시 → all PayZone 재계산 (가중평균)
      calculateAllFromPayZones(newData, level, band, grade)
      // 전체 컬럼의 all PayZone도 재계산
      calculateAllFromPayZones(newData, level, 'total', grade)
    }
    
    setPracticalData(newData)
  }
  
  // 선택된 직군 또는 전체 직군 가져오기
  const getEffectiveBands = () => {
    return selectedBands.length === 0 ? practicalData?.metadata.bands || [] : selectedBands
  }
  
  // 전체 값 변경 핸들러 (직군에 동일값 설정 + PayZone 처리)
  const handleTotalCellChange = (
    level: string,
    payZone: string,
    grade: string,
    field: 'baseUp' | 'merit' | 'additional',
    value: number
  ) => {
    if (!practicalData) return
    
    const newData = { ...practicalData }
    const bandsToApply = getEffectiveBands()
    
    // 1. 가로 방향: 전체 → 직군들 (동일값 설정)
    distributeTotalToBands(newData, level, payZone, grade, field, value, bandsToApply)
    
    // 2. 세로 방향: all PayZone이면 → 개별 PayZone들에도 동일값 설정
    if (payZone === 'all') {
      // 전체 컬럼을 모든 PayZone에 적용
      distributeAllToPayZones(newData, level, 'total', grade, field, value)
      
      // 각 직군 컬럼도 모든 PayZone에 적용
      for (const band of bandsToApply) {
        distributeAllToPayZones(newData, level, band, grade, field, value)
      }
      
      // Context에 변경사항 적용
      for (const band of bandsToApply) {
        context.actions.updateCellGradeRate(band, level, grade, field, value)
      }
    } else {
      // 3. 개별 PayZone 수정 시 → all PayZone 재계산 (가중평균)
      calculateAllFromPayZones(newData, level, 'total', grade)
      for (const band of bandsToApply) {
        calculateAllFromPayZones(newData, level, band, grade)
      }
    }
    
    setPracticalData(newData)
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
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* 직군 선택 바 */}
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">실무 추천안 설정</h3>
          <div className="flex gap-2">
            {/* 직군 선택 드롭다운 */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="px-3 py-1 text-xs bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1"
              >
                <span>직군 선택 ({selectedBands.length}개)</span>
                <span className="text-gray-400">{showDropdown ? '▲' : '▼'}</span>
              </button>
              
              {showDropdown && (
                <div className="absolute top-full mt-1 left-0 bg-white border border-gray-300 rounded-lg shadow-lg p-2 min-w-[180px] z-30">
                  <div className="flex justify-between items-center pb-2 mb-2 border-b border-gray-200">
                    <span className="text-xs font-semibold text-gray-700">직군 선택</span>
                    <button
                      onClick={toggleAllBands}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      {selectedBands.length === practicalData.metadata.bands.length ? '모두 해제' : '모두 선택'}
                    </button>
                  </div>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {practicalData.metadata.bands.map(band => (
                      <label
                        key={band}
                        className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBands.includes(band)}
                          onChange={() => toggleBandSelection(band)}
                          className="w-3 h-3"
                        />
                        <span className="text-sm text-gray-700">{band}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setIsCompactMode(!isCompactMode)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                effectiveCompactMode 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${selectedBands.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={selectedBands.length >= 3}
              title={selectedBands.length >= 3 ? '3개 이상 직군 선택 시 자동 컴팩트 모드' : ''}
            >
              {effectiveCompactMode ? '📦 컴팩트' : '📊 상세'}
              {selectedBands.length >= 3 && ' (자동)'}
            </button>
            <button
              onClick={() => setShowAllZones(!showAllZones)}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {showAllZones ? 'Zone 숨기기' : 'Zone 보기'}
            </button>
          </div>
        </div>
        
        {selectedBands.length === 0 && (
          <p className="text-xs text-gray-500 mt-2">직군을 선택하여 상세 비교 및 편집이 가능합니다</p>
        )}
      </div>
      
      {/* 테이블 */}
      <div className={`overflow-x-auto mt-4 ${selectedBands.length === 0 ? 'flex justify-center' : ''}`}>
        <table className={`${selectedBands.length === 0 ? 'w-auto' : 'w-full'} border-collapse`}>
          <thead>
            {/* 첫 번째 헤더 행 - 직군별 그룹 */}
            <tr className="border-b-2 border-gray-300">
              <th className="sticky left-0 z-20 bg-gray-100 border border-gray-300 px-3 py-2" rowSpan={2}>
                <div className="text-sm font-semibold text-gray-700">레벨 × Zone</div>
              </th>
              
              {/* 전체 컬럼 */}
              <th className="bg-blue-100 border border-gray-300 text-center" colSpan={practicalData.metadata.grades.length}>
                <div className={`${selectedBands.length === 0 ? 'text-sm' : 'text-xs'} font-bold text-blue-700 py-0.5`}>
                  {selectedBands.length === 0 ? '【전체 직군】' : '【가중평균】'}
                </div>
                <div className="text-[10px] text-blue-600">클릭하여 편집</div>
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
                <th key={`total-${grade}`} className={`bg-blue-50 border border-gray-300 px-0.5 py-0.5 ${
                  selectedBands.length === 0 ? 'min-w-[100px]' : 
                  effectiveCompactMode ? 'min-w-[45px]' : 'min-w-[80px]'
                }`}>
                  <div className={`${selectedBands.length === 0 ? 'text-xs' : 'text-[10px]'} font-semibold text-blue-700`}>{grade}</div>
                </th>
              ))}
              
              {/* 각 선택된 직군의 평가등급들 */}
              {selectedBands.map(band => 
                practicalData.metadata.grades.map(grade => (
                  <th key={`${band}-${grade}`} className={`bg-gray-50 border border-gray-300 px-0.5 py-0.5 ${effectiveCompactMode ? 'min-w-[45px]' : 'min-w-[80px]'}`}>
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
                    
                    {/* 레벨 요약 (접혔을 때) - 실제 값 표시 및 편집 가능 */}
                    {!isExpanded && (
                      <>
                        {/* 전체 컬럼 - 레벨 전체 값 */}
                        {practicalData.metadata.grades.map(grade => {
                          const totalCell = practicalData.hierarchy[level]?.['all']?.total[grade]
                          
                          return (
                            <td key={grade} className="border border-gray-300 p-0">
                              {totalCell ? (
                                <PracticalRecommendationCell
                                  baseUp={totalCell.baseUp}
                                  merit={totalCell.merit}
                                  additional={totalCell.additional}
                                  employeeCount={totalCell.employeeCount}
                                  isEditable={true}
                                  isTotal={true}
                                  isCompact={true}  // 접힌 상태에서는 항상 컴팩트
                                  onChange={(field, value) => handleTotalCellChange(level, 'all', grade, field, value)}
                                />
                              ) : (
                                <div className="h-full flex items-center justify-center p-1">
                                  <span className="text-xs text-gray-400">-</span>
                                </div>
                              )}
                            </td>
                          )
                        })}
                        
                        {/* 선택된 직군별 컬럼 - 레벨별 직군 값 */}
                        {selectedBands.map(band => 
                          practicalData.metadata.grades.map(grade => {
                            const bandCell = practicalData.hierarchy[level]?.['all']?.byBand[band]?.[grade]
                            
                            return (
                              <td key={`${band}-${grade}`} className="border border-gray-300 p-0">
                                {bandCell ? (
                                  <PracticalRecommendationCell
                                    baseUp={bandCell.baseUp}
                                    merit={bandCell.merit}
                                    additional={bandCell.additional}
                                    employeeCount={bandCell.employeeCount}
                                    isEditable={true}
                                    isTotal={false}
                                    isCompact={true}  // 접힌 상태에서는 항상 컴팩트
                                    onChange={(field, value) => handleBandCellChange(level, 'all', band, grade, field, value)}
                                    band={band}
                                    level={level}
                                    payZone={'all'}
                                    grade={grade}
                                  />
                                ) : (
                                  <div className="h-full flex items-center justify-center p-1">
                                    <span className="text-xs text-gray-400">-</span>
                                  </div>
                                )}
                              </td>
                            )
                          })
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
                                  isCompact={selectedBands.length === 0 ? false : effectiveCompactMode}
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
                                    isCompact={effectiveCompactMode}
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
      <div className="pt-4 border-t border-gray-200 mt-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-semibold text-gray-700 mb-1">💡 현재 모드</p>
            <ul className="space-y-0.5 text-gray-600">
              {selectedBands.length === 0 ? (
                <>
                  <li>• <strong>전체 통합 모드:</strong> 모든 직군 일괄 조정</li>
                  <li>• 전체 직군 수정 시 모든 직군에 비례 분배</li>
                  <li>• 개별 직군 편집이 필요하면 상단에서 선택</li>
                </>
              ) : (
                <>
                  <li>• <strong>상세 편집 모드:</strong> {selectedBands.length}개 직군 개별 조정</li>
                  <li>• 가중평균 컬럼과 선택 직군 동시 편집 가능</li>
                  <li>• 양방향 자동 계산 (가중평균 ↔ 개별 직군)</li>
                </>
              )}
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