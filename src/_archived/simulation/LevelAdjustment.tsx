'use client'

import React, { useState, useMemo } from 'react'
import { GRADE_COLORS, LevelGradeRates } from '@/types/simulation'
import { Employee } from '@/types/employee'
import { useWageContext } from '@/context/WageContext'
import { calculateWeightedAverage } from '@/utils/simulationHelpers'

interface LevelAdjustmentProps {
  levels: string[]
  levelGradeRates: LevelGradeRates
  onLevelGradeChange: (level: string, grade: string, field: 'baseUp' | 'merit' | 'additional', value: number) => void
  onApply?: () => void
  onReset?: () => void
  additionalType: 'percentage' | 'amount'
  contextEmployeeData?: Employee[]
  performanceGrades?: string[]
  hasPendingChanges?: boolean
  aiSettings?: any
}

export function LevelAdjustment({
  levels,
  levelGradeRates,
  onLevelGradeChange,
  onApply,
  onReset,
  additionalType,
  contextEmployeeData = [],
  performanceGrades = [],
  hasPendingChanges = false,
  aiSettings
}: LevelAdjustmentProps) {
  const { performanceWeights } = useWageContext()
  const [expandedLevels, setExpandedLevels] = useState<string[]>(levels) // 모두 펼친 상태로 시작
  
  
  // 레벨 토글
  const toggleLevel = (level: string) => {
    setExpandedLevels(prev => 
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    )
  }
  
  // 레벨-평가등급별 값 변경 핸들러
  const handleGradeRateChange = (level: string, grade: string, field: 'baseUp' | 'merit' | 'additional', value: number) => {
    onLevelGradeChange(level, grade, field, value)
  }
  
  // 레벨별 가중평균 계산
  const calculateLevelAverage = (level: string, field: 'baseUp' | 'merit' | 'additional') => {
    const items: { value: number; count: number }[] = []
    const levelData = levelGradeRates[level]
    
    if (levelData) {
      performanceGrades.forEach(grade => {
        const gradeCount = levelData.employeeCount?.byGrade[grade] || 0
        if (gradeCount > 0 && levelData.byGrade[grade]) {
          items.push({
            value: levelData.byGrade[grade][field] || 0,
            count: gradeCount
          })
        }
      })
    }
    
    return items.length > 0 ? calculateWeightedAverage(items).toFixed(1) : '0.0'
  }
  
  // 총 인상률 계산 (가중치 없이)
  const calculateTotalRate = (baseUp: number, merit: number, additional: number) => {
    return (baseUp + merit + (additionalType === 'percentage' ? additional : 0)).toFixed(1)
  }
  
  
  return (
    <div className="space-y-2">
      {/* 컨트롤 바 */}
      <div className="bg-white rounded-lg shadow-sm px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900">레벨별 조정</h3>
          <span className="text-xs text-gray-500">레벨-평가등급별 세분화 조정</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setExpandedLevels(levels)}
            className="px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            모두 펼치기
          </button>
          <button
            onClick={() => setExpandedLevels([])}
            className="px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
          >
            모두 접기
          </button>
        </div>
      </div>
      
      {/* 레벨별 테이블 */}
      {levels.map((level, levelIndex) => {
        const levelData = levelGradeRates[level]
        const levelCounts = levelData?.employeeCount || { total: 0, byGrade: {} }
        const isExpanded = expandedLevels.includes(level)
        
        return (
          <div 
            key={level} 
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            {/* 레벨 헤더 */}
            <div 
              className={`px-3 py-2 bg-gradient-to-r ${
                levelIndex === 0 ? 'from-purple-50 to-purple-100' :
                levelIndex === 1 ? 'from-blue-50 to-blue-100' :
                levelIndex === 2 ? 'from-green-50 to-green-100' :
                'from-orange-50 to-orange-100'
              } border-b cursor-pointer hover:opacity-90 transition-opacity`}
              onClick={() => toggleLevel(level)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r
                    ${levelIndex === 0 ? 'from-purple-500 to-purple-600' :
                      levelIndex === 1 ? 'from-blue-500 to-blue-600' :
                      levelIndex === 2 ? 'from-green-500 to-green-600' :
                      'from-orange-500 to-orange-600'}
                  `}>
                    {level}
                  </span>
                  <span className="text-xs text-gray-600">
                    {levelCounts.total.toLocaleString()}명
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-gray-600">평균 인상률:</span>
                    <span className="font-bold text-blue-600">
                      {calculateTotalRate(
                        Number(calculateLevelAverage(level, 'baseUp')),
                        Number(calculateLevelAverage(level, 'merit')),
                        Number(calculateLevelAverage(level, 'additional'))
                      )}%
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
                              {levelCounts.byGrade[grade]?.toLocaleString() || 0}명
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
                          {calculateLevelAverage(level, 'baseUp')}
                        </span>
                      </td>
                      {performanceGrades.map(grade => (
                        <td key={grade} className={`px-2 py-2 text-center ${
                          GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || ''
                        }`}>
                          <input
                            type="number"
                            value={levelData?.byGrade?.[grade]?.baseUp || ''}
                            onChange={(e) => handleGradeRateChange(level, grade, 'baseUp', Number(e.target.value))}
                            step="0.1"
                            className="w-16 px-1 py-1 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="0.0"
                          />
                        </td>
                      ))}
                    </tr>
                    
                    {/* Merit 행 */}
                    <tr className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 text-xs font-medium text-gray-700">
                        Merit (%)
                      </td>
                      <td className="px-2 py-2 text-center bg-gray-100">
                        <span className="text-xs font-semibold text-gray-600">
                          {calculateLevelAverage(level, 'merit')}
                        </span>
                      </td>
                      {performanceGrades.map(grade => (
                        <td key={grade} className={`px-2 py-2 text-center ${
                          GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || ''
                        }`}>
                          <input
                            type="number"
                            value={levelData?.byGrade?.[grade]?.merit || ''}
                            onChange={(e) => handleGradeRateChange(level, grade, 'merit', Number(e.target.value))}
                            step="0.1"
                            className="w-16 px-1 py-1 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all"
                            placeholder="0.0"
                          />
                        </td>
                      ))}
                    </tr>
                    
                    {/* 추가 행 */}
                    <tr className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 text-xs font-medium text-gray-700">
                        추가 ({additionalType === 'percentage' ? '%' : '만원'})
                      </td>
                      <td className="px-2 py-2 text-center bg-gray-100">
                        <span className="text-xs font-semibold text-gray-600">
                          {calculateLevelAverage(level, 'additional')}
                        </span>
                      </td>
                      {performanceGrades.map(grade => (
                        <td key={grade} className={`px-2 py-2 text-center ${
                          GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || ''
                        }`}>
                          <input
                            type="number"
                            value={levelData?.byGrade?.[grade]?.additional || ''}
                            onChange={(e) => handleGradeRateChange(level, grade, 'additional', Number(e.target.value))}
                            step={additionalType === 'percentage' ? 0.1 : 10}
                            className="w-16 px-1 py-1 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            placeholder="0"
                          />
                        </td>
                      ))}
                    </tr>
                    
                    {/* 총 인상률 행 */}
                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 font-semibold">
                      <td className="px-3 py-2 text-xs font-bold text-gray-900">
                        총 인상률 (%)
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className="text-sm font-bold text-blue-600">
                          {calculateTotalRate(
                            Number(calculateLevelAverage(level, 'baseUp')),
                            Number(calculateLevelAverage(level, 'merit')),
                            Number(calculateLevelAverage(level, 'additional'))
                          )}
                        </span>
                        {additionalType === 'amount' && Number(calculateLevelAverage(level, 'additional')) > 0 && (
                          <div className="text-xs text-gray-600 mt-0.5">+{calculateLevelAverage(level, 'additional')}만</div>
                        )}
                      </td>
                      {performanceGrades.map(grade => (
                        <td key={grade} className={`px-2 py-2 text-center ${
                          GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || ''
                        }`}>
                          <span className={`text-sm font-bold ${
                            GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.text || 'text-gray-700'
                          }`}>
                            {calculateTotalRate(
                              levelData?.byGrade?.[grade]?.baseUp || 0,
                              levelData?.byGrade?.[grade]?.merit || 0,
                              levelData?.byGrade?.[grade]?.additional || 0
                            )}
                          </span>
                          {additionalType === 'amount' && (levelData?.byGrade?.[grade]?.additional || 0) > 0 && (
                            <div className="text-xs text-gray-600 mt-0.5">+{levelData?.byGrade?.[grade]?.additional}만</div>
                        )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
      
      {/* 일괄 조정 도구 */}
      <div className="bg-white rounded-lg shadow-sm px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">전체 레벨 일괄 설정</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const baseUp = aiSettings?.baseUpPercentage || 0
              const merit = aiSettings?.meritIncreasePercentage || 0
              
              levels.forEach(level => {
                performanceGrades.forEach(grade => {
                  onLevelGradeChange(level, grade, 'baseUp', baseUp)
                  onLevelGradeChange(level, grade, 'merit', merit)
                  onLevelGradeChange(level, grade, 'additional', 0)
                })
              })
            }}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium"
          >
            AI 권장값으로 설정
          </button>
        </div>
      </div>
    </div>
  )
}