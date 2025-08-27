/**
 * 실무 추천안 메인 컴포넌트
 * 레벨 × PayZone × (전체 + 직군별) 구조
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
// Remove heroicons import - use text symbols instead

export function PracticalRecommendation() {
  const context = useWageContextNew()
  const [practicalData, setPracticalData] = useState<PracticalRecommendationData | null>(null)
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set())
  
  // 실무 추천안 데이터 초기화
  useEffect(() => {
    if (context.originalData.employees.length > 0 && context.adjustment.matrix) {
      const data = initializePracticalData(
        context.originalData.employees,
        context.adjustment.matrix
      )
      setPracticalData(data)
      
      // 기본적으로 모든 레벨 펼치기
      setExpandedLevels(new Set(data.metadata.levels))
    }
  }, [context.originalData.employees, context.adjustment.matrix])
  
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
  
  return (
    <div className="bg-white rounded-lg shadow-lg">
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
                <div className="text-sm font-bold text-blue-700 py-1">【전체】</div>
                <div className="text-xs text-blue-600">가중평균</div>
              </th>
              
              {/* 직군별 컬럼들 */}
              {practicalData.metadata.bands.map(band => (
                <th key={band} className="bg-gray-100 border border-gray-300 text-center" colSpan={practicalData.metadata.grades.length}>
                  <div className="text-sm font-bold text-gray-700 py-1">【{band}】</div>
                </th>
              ))}
            </tr>
            
            {/* 두 번째 헤더 행 - 평가등급 */}
            <tr>
              {/* 전체 컬럼의 평가등급들 */}
              {practicalData.metadata.grades.map(grade => (
                <th key={`total-${grade}`} className="bg-blue-50 border border-gray-300 px-1 py-1 min-w-[80px]">
                  <div className="text-xs font-semibold text-blue-700">{grade}</div>
                </th>
              ))}
              
              {/* 각 직군의 평가등급들 */}
              {practicalData.metadata.bands.map(band => 
                practicalData.metadata.grades.map(grade => (
                  <th key={`${band}-${grade}`} className="bg-gray-50 border border-gray-300 px-1 py-1 min-w-[80px]">
                    <div className="text-xs font-semibold text-gray-700">{grade}</div>
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
                        {/* 직군별 컬럼 */}
                        {practicalData.metadata.bands.map(band => 
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
                        {/* 전체 + 직군별 모든 등급 수만큼 빈 셀 */}
                        {[...Array(practicalData.metadata.grades.length * (1 + practicalData.metadata.bands.length))].map((_, i) => (
                          <td key={i} className="border border-gray-300"></td>
                        ))}
                      </>
                    )}
                  </tr>
                  
                  {/* PayZone별 상세 행들 (펼쳐졌을 때만) */}
                  {isExpanded && practicalData.metadata.payZones.map(payZone => {
                    const zoneData = practicalData.hierarchy[level]?.[payZone]
                    if (!zoneData) return null
                    
                    return (
                      <tr key={`${level}-${payZone}`} className="hover:bg-gray-50 transition-colors">
                        <td className="sticky left-0 z-10 bg-white border border-gray-300 px-3 py-1">
                          <div className="text-sm text-gray-600 pl-5">
                            {getPayZoneDisplayName(payZone)}
                          </div>
                        </td>
                        
                        {/* 전체 컬럼 (가중평균) */}
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
                                  onChange={(field, value) => handleTotalCellChange(level, payZone, grade, field, value)}
                                />
                              )}
                            </td>
                          )
                        })}
                        
                        {/* 직군별 컬럼들 */}
                        {practicalData.metadata.bands.map(band => 
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
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <p className="font-semibold text-gray-700 mb-1">📊 인상률 구성</p>
            <p className="text-gray-600">
              <span className="text-blue-500">Base-up</span> + 
              <span className="text-green-500 ml-1">Merit</span> + 
              <span className="text-orange-500 ml-1">Additional</span> = 
              <span className="font-semibold ml-1">총 인상률</span>
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">💡 사용 방법</p>
            <p className="text-gray-600">직군별 셀의 각 값을 클릭하여 수정 가능</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">🔄 가중평균</p>
            <p className="text-gray-600">전체 컬럼은 직군별 값의 가중평균으로 자동 계산</p>
          </div>
        </div>
      </div>
    </div>
  )
}