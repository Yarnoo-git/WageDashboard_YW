'use client'

import React, { useState, useMemo } from 'react'
import { GRADE_COLORS } from '@/types/simulation'
import { Employee } from '@/types/employee'
import { useWageContext } from '@/context/WageContext'

interface PayZoneAdjustmentProps {
  levels: string[]
  payZones: number[]
  performanceGrades: string[]
  pendingPayZoneRates: any
  onRateChange: (payZone: number, level: string, grade: string, field: 'baseUp' | 'merit' | 'additional', value: number) => void
  additionalType: 'percentage' | 'amount'
  selectedBands?: string[]
  employeeCounts?: { [key: string]: number }
  contextEmployeeData?: Employee[]
}

export function PayZoneAdjustment({
  levels,
  payZones,
  performanceGrades,
  pendingPayZoneRates,
  onRateChange,
  additionalType,
  selectedBands = [],
  employeeCounts = {},
  contextEmployeeData = []
}: PayZoneAdjustmentProps) {
  const { performanceWeights } = useWageContext()
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    // 첫 번째 레벨의 모든 PayZone을 기본으로 펼침
    if (levels.length > 0 && payZones.length > 0) {
      return payZones.map(zone => `PZ${zone}-${levels[0]}`)
    }
    return []
  })
  
  // Pay Zone × Level × Grade별 인원수 계산
  const detailedCounts = useMemo(() => {
    const counts: { 
      [payZone: number]: {
        [level: string]: {
          [grade: string]: number
          total: number
        }
      }
    } = {}
    
    // 디버깅 로그
    console.log('[PayZoneAdjustment] performanceGrades:', performanceGrades)
    console.log('[PayZoneAdjustment] payZones:', payZones)
    console.log('[PayZoneAdjustment] levels:', levels)
    console.log('[PayZoneAdjustment] Sample employee:', contextEmployeeData[0])
    
    // 초기화
    payZones.forEach(zone => {
      counts[zone] = {}
      levels.forEach(level => {
        counts[zone][level] = { total: 0 }
        performanceGrades.forEach(grade => {
          counts[zone][level][grade] = 0
        })
      })
    })
    
    // 카운트
    contextEmployeeData.forEach(emp => {
      if (emp.level && emp.payZone !== undefined && emp.performanceRating && 
          levels.includes(emp.level) && 
          payZones.includes(emp.payZone) &&
          performanceGrades.includes(emp.performanceRating) &&
          (selectedBands.length === 0 || (emp.band && selectedBands.includes(emp.band)))) {
        counts[emp.payZone][emp.level][emp.performanceRating]++
        counts[emp.payZone][emp.level].total++
      }
    })
    
    console.log('[PayZoneAdjustment] Final counts:', counts)
    return counts
  }, [contextEmployeeData, levels, payZones, performanceGrades, selectedBands])
  
  // 그룹 토글
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupKey)
        ? prev.filter(g => g !== groupKey)
        : [...prev, groupKey]
    )
  }
  
  // 평가등급별 Merit 계산
  const calculateMeritByGrade = (baseMerit: number, grade: string) => {
    const weight = performanceWeights[grade] || 1.0
    return (baseMerit * weight).toFixed(2)
  }
  
  // 총 인상률 계산
  const calculateTotalRate = (baseUp: number, merit: number, additional: number, grade?: string) => {
    const effectiveMerit = grade ? Number(calculateMeritByGrade(merit, grade)) : merit
    return (baseUp + effectiveMerit + (additionalType === 'percentage' ? additional : 0)).toFixed(1)
  }

  
  // PayZone-Level 조합별 렌더링
  const renderPayZoneLevelGroup = (payZone: number, level: string) => {
    const groupKey = `PZ${payZone}-${level}`
    const isExpanded = expandedGroups.includes(groupKey)
    const groupCounts = detailedCounts[payZone]?.[level] || { total: 0 }
    
    // 해당 그룹에 직원이 없으면 표시하지 않음
    if (groupCounts.total === 0) return null
    
    // 현재 인상률 계산 (평균)
    let avgBaseUp = 0, avgMerit = 0, avgAdditional = 0, gradeCount = 0
    performanceGrades.forEach(grade => {
      const rates = pendingPayZoneRates[payZone]?.[level]?.[grade]
      if (rates && groupCounts[grade] > 0) {
        avgBaseUp += rates.baseUp || 0
        avgMerit += rates.merit || 0
        avgAdditional += rates.additional || 0
        gradeCount++
      }
    })
    if (gradeCount > 0) {
      avgBaseUp /= gradeCount
      avgMerit /= gradeCount
      avgAdditional /= gradeCount
    }

    // PayZone별 색상 선택
    const payZoneIndex = payZones.indexOf(payZone) % 4
    const payZoneColorClass = payZoneIndex === 0 ? 'from-purple-50 to-purple-100' :
                              payZoneIndex === 1 ? 'from-blue-50 to-blue-100' :
                              payZoneIndex === 2 ? 'from-green-50 to-green-100' :
                              'from-orange-50 to-orange-100'
    const payZoneGradientClass = payZoneIndex === 0 ? 'from-purple-500 to-purple-600' :
                                 payZoneIndex === 1 ? 'from-blue-500 to-blue-600' :
                                 payZoneIndex === 2 ? 'from-green-500 to-green-600' :
                                 'from-orange-500 to-orange-600'
    
    return (
      <div key={groupKey} className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* 헤더 */}
        <div 
          className={`px-3 py-2 bg-gradient-to-r ${payZoneColorClass} border-b cursor-pointer hover:opacity-90 transition-opacity`}
          onClick={() => toggleGroup(groupKey)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full text-xs font-bold">
                {level}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${payZoneGradientClass}`}>
                PZ{payZone}
              </span>
              <span className="text-xs text-gray-600">
                {groupCounts.total.toLocaleString()}명
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-600">현재 인상률:</span>
                <span className="font-bold text-blue-600">
                  {calculateTotalRate(avgBaseUp, avgMerit, avgAdditional)}%
                </span>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  isExpanded ? 'transform rotate-180' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* 평가등급별 테이블 (펼쳤을 때) */}
        {isExpanded && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 w-28">구분</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-20 bg-gray-100">
                    평균
                  </th>
                  {performanceGrades.map(grade => (
                    <th 
                      key={grade}
                      className={`px-2 py-2 text-center text-xs font-semibold ${
                        GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.text || 'text-gray-700'
                      } ${GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || 'bg-gray-50'}`}
                    >
                      <div className="flex flex-col items-center">
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r ${
                          GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.gradient || 'from-gray-500 to-gray-600'
                        } text-white`}>
                          {grade}
                        </span>
                        <div className="text-xs font-normal mt-0.5 text-gray-600">
                          {groupCounts[grade]?.toLocaleString() || 0}명
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Base-up 행 */}
                <tr className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 text-xs font-medium text-gray-700">
                    Base-up (%)
                  </td>
                  <td className="px-2 py-2 text-center bg-gray-100">
                    <span className="text-xs font-semibold text-gray-600">
                      {avgBaseUp.toFixed(1)}
                    </span>
                  </td>
                  {performanceGrades.map(grade => {
                    const rates = pendingPayZoneRates[payZone]?.[level]?.[grade] || { baseUp: 0, merit: 0, additional: 0 }
                    return (
                      <td key={grade} className={`px-2 py-2 text-center ${
                        GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || ''
                      }`}>
                        <input
                          type="number"
                          value={rates.baseUp || ''}
                          onChange={(e) => onRateChange(payZone, level, grade, 'baseUp', Number(e.target.value))}
                          step="0.1"
                          className="w-16 px-1 py-1 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="0.0"
                        />
                      </td>
                    )
                  })}
                </tr>
                
                {/* Merit 행 */}
                <tr className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 text-xs font-medium text-gray-700">
                    Merit (%)
                    <div className="text-xs text-gray-500 mt-0.5">기본값</div>
                  </td>
                  <td className="px-2 py-2 text-center bg-gray-100">
                    <span className="text-xs font-semibold text-gray-600">
                      {avgMerit.toFixed(1)}
                    </span>
                  </td>
                  {performanceGrades.map(grade => {
                    const rates = pendingPayZoneRates[payZone]?.[level]?.[grade] || { baseUp: 0, merit: 0, additional: 0 }
                    const weight = performanceWeights[grade] || 1.0
                    return (
                      <td key={grade} className={`px-2 py-2 text-center ${
                        GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || ''
                      }`}>
                        <input
                          type="number"
                          value={rates.merit || ''}
                          onChange={(e) => onRateChange(payZone, level, grade, 'merit', Number(e.target.value))}
                          step="0.1"
                          className="w-16 px-1 py-1 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all"
                          placeholder="0.0"
                        />
                        <div className="text-xs text-gray-500 mt-0.5">
                          ×{weight} = {calculateMeritByGrade(rates.merit, grade)}
                        </div>
                      </td>
                    )
                  })}
                </tr>
                
                {/* 추가 행 */}
                <tr className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 text-xs font-medium text-gray-700">
                    추가 ({additionalType === 'percentage' ? '%' : '만원'})
                  </td>
                  <td className="px-2 py-2 text-center bg-gray-100">
                    <span className="text-xs font-semibold text-gray-600">
                      {avgAdditional.toFixed(additionalType === 'percentage' ? 1 : 0)}
                    </span>
                  </td>
                  {performanceGrades.map(grade => {
                    const rates = pendingPayZoneRates[payZone]?.[level]?.[grade] || { baseUp: 0, merit: 0, additional: 0 }
                    return (
                      <td key={grade} className={`px-2 py-2 text-center ${
                        GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || ''
                      }`}>
                        <input
                          type="number"
                          value={rates.additional || ''}
                          onChange={(e) => onRateChange(payZone, level, grade, 'additional', Number(e.target.value))}
                          step={additionalType === 'percentage' ? 0.1 : 10}
                          className="w-16 px-1 py-1 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="0"
                        />
                      </td>
                    )
                  })}
                </tr>
                
                {/* 총 인상률 행 */}
                <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 font-semibold">
                  <td className="px-3 py-2 text-xs font-bold text-gray-900">
                    총 인상률 (%)
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span className="text-sm font-bold text-blue-600">
                      {calculateTotalRate(avgBaseUp, avgMerit, avgAdditional)}
                    </span>
                    {additionalType === 'amount' && avgAdditional > 0 && (
                      <div className="text-xs text-gray-600 mt-0.5">+{avgAdditional.toFixed(0)}만</div>
                    )}
                  </td>
                  {performanceGrades.map(grade => {
                    const rates = pendingPayZoneRates[payZone]?.[level]?.[grade] || { baseUp: 0, merit: 0, additional: 0 }
                    return (
                      <td key={grade} className={`px-2 py-2 text-center ${
                        GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || ''
                      }`}>
                        <span className={`text-sm font-bold ${
                          GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.text || 'text-gray-700'
                        }`}>
                          {calculateTotalRate(rates.baseUp, rates.merit, rates.additional, grade)}
                        </span>
                        {additionalType === 'amount' && rates.additional > 0 && (
                          <div className="text-xs text-gray-600 mt-0.5">+{rates.additional}만</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      {/* 컨트롤 바 */}
      <div className="bg-white rounded-lg shadow-sm px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900">Pay Zone별 조정</h3>
          <span className="text-xs text-gray-500">PayZone-레벨-평가등급별 세분화 조정</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const allGroups = payZones.flatMap(zone => 
                levels.map(level => `PZ${zone}-${level}`)
              )
              setExpandedGroups(allGroups)
            }}
            className="px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            모두 펼치기
          </button>
          <button
            onClick={() => setExpandedGroups([])}
            className="px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
          >
            모두 접기
          </button>
        </div>
      </div>
      
      {/* Level별 그룹 렌더링 (Level 우선) */}
      {levels.map(level => (
        <div key={level} className="mb-4">
          {/* Level 헤더 */}
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1.5 rounded-t-lg mb-2">
            <h4 className="text-sm font-bold text-gray-800">
              【 {level} 레벨 】
              <span className="ml-2 text-xs font-normal text-gray-600">
                전체 {contextEmployeeData.filter(emp => emp.level === level && 
                  (selectedBands.length === 0 || (emp.band && selectedBands.includes(emp.band)))
                ).length}명
              </span>
            </h4>
          </div>
          {/* PayZone별 테이블 */}
          <div className="space-y-2">
            {payZones.map(payZone => renderPayZoneLevelGroup(payZone, level))}
          </div>
        </div>
      ))}
      
      {/* 일괄 조정 도구 */}
      <div className="bg-white rounded-lg shadow-sm px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">전체 PayZone 일괄 설정</span>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-600">Base-up:</label>
            <input
              type="number"
              placeholder="0.0"
              onChange={(e) => {
                const value = Number(e.target.value)
                payZones.forEach(zone => {
                  levels.forEach(level => {
                    performanceGrades.forEach(grade => {
                      onRateChange(zone, level, grade, 'baseUp', value)
                    })
                  })
                })
              }}
              step="0.1"
              className="w-16 px-1 py-1 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-600">Merit:</label>
            <input
              type="number"
              placeholder="0.0"
              onChange={(e) => {
                const value = Number(e.target.value)
                payZones.forEach(zone => {
                  levels.forEach(level => {
                    performanceGrades.forEach(grade => {
                      onRateChange(zone, level, grade, 'merit', value)
                    })
                  })
                })
              }}
              step="0.1"
              className="w-16 px-1 py-1 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
          <button
            onClick={() => {
              payZones.forEach(zone => {
                levels.forEach(level => {
                  performanceGrades.forEach(grade => {
                    onRateChange(zone, level, grade, 'baseUp', 0)
                    onRateChange(zone, level, grade, 'merit', 0)
                    onRateChange(zone, level, grade, 'additional', 0)
                  })
                })
              })
            }}
            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-medium"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  )
}