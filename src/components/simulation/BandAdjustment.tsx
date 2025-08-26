'use client'

import React, { useMemo } from 'react'
import { GRADE_COLORS, AllAdjustmentRates } from '@/types/simulation'
import { Employee } from '@/types/employee'
import { useWageContext } from '@/context/WageContext'
import { calculateWeightedAverage } from '@/utils/simulationHelpers'

interface BandAdjustmentProps {
  band: string
  bandGradeRates: AllAdjustmentRates
  onGradeChange: (grade: string, field: 'baseUp' | 'merit' | 'additional', value: number) => void
  contextEmployeeData?: Employee[]
  performanceGrades?: string[]
  aiSettings?: any
}

export function BandAdjustment({
  band,
  bandGradeRates,
  onGradeChange,
  contextEmployeeData = [],
  performanceGrades = [],
  aiSettings
}: BandAdjustmentProps) {
  const { performanceWeights } = useWageContext()
  
  // 해당 직군의 직원 데이터만 필터링
  const bandEmployees = useMemo(() => {
    return contextEmployeeData.filter(emp => emp.band === band)
  }, [contextEmployeeData, band])
  
  // 평가등급별 인원수 계산 (직군 내)
  const employeeCountByGrade = useMemo(() => {
    const counts: { [grade: string]: number } = {}
    let total = 0
    
    performanceGrades.forEach(grade => {
      counts[grade] = 0
    })
    
    bandEmployees.forEach(emp => {
      if (emp.performanceRating && performanceGrades.includes(emp.performanceRating)) {
        counts[emp.performanceRating]++
        total++
      }
    })
    
    return { ...counts, total }
  }, [bandEmployees, performanceGrades])
  
  // 가중평균 계산
  const calculateAverage = (field: 'baseUp' | 'merit' | 'additional') => {
    const items: { value: number; count: number }[] = []
    
    performanceGrades.forEach(grade => {
      const gradeCount = employeeCountByGrade[grade] || 0
      if (gradeCount > 0) {
        items.push({
          value: bandGradeRates.byGrade[grade]?.[field] || 0,
          count: gradeCount
        })
      }
    })
    
    return items.length > 0 ? calculateWeightedAverage(items).toFixed(1) : '0.0'
  }
  
  // 총 인상률 계산 (추가는 만원 단위이므로 %에 포함 안 함)
  const calculateTotalRate = (baseUp: number, merit: number) => {
    return (baseUp + merit).toFixed(1)
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-gray-900">{band} 직군 조정</h3>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              {employeeCountByGrade.total.toLocaleString()}명
            </span>
          </div>
        </div>
      </div>
      
      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 w-32">구분</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 w-24 bg-purple-50">
                직군 평균
                <div className="text-xs font-normal text-gray-500 mt-0.5">가중평균</div>
              </th>
              {performanceGrades.map(grade => (
                <th 
                  key={grade}
                  className={`px-3 py-3 text-center text-xs font-semibold ${GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.text || 'text-gray-700'} ${GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || 'bg-gray-50'}`}
                >
                  <div className="flex flex-col items-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r ${GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.gradient || 'from-gray-500 to-gray-600'} text-white`}>
                      {grade}
                    </span>
                    <div className="text-xs font-normal mt-1 text-gray-600">
                      {employeeCountByGrade[grade]?.toLocaleString() || 0}명
                    </div>
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 w-32">비고</th>
            </tr>
          </thead>
          <tbody>
            {/* Base-up 행 */}
            <tr className="border-b hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-gray-700">
                Base-up (%)
              </td>
              <td className="px-3 py-3 text-center bg-purple-50">
                <span className="text-sm font-semibold text-purple-600">
                  {calculateAverage('baseUp')}
                </span>
              </td>
              {performanceGrades.map(grade => (
                <td key={grade} className={`px-3 py-3 text-center ${GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || ''}`}>
                  <input
                    type="number"
                    value={bandGradeRates.byGrade[grade]?.baseUp || ''}
                    onChange={(e) => onGradeChange(grade, 'baseUp', Number(e.target.value))}
                    step="0.1"
                    className="w-20 px-2 py-1.5 text-sm text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="0.0"
                  />
                </td>
              ))}
              <td className="px-3 py-3 text-xs text-center text-gray-500">개별 설정</td>
            </tr>
            
            {/* Merit 행 */}
            <tr className="border-b hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-gray-700">
                Merit (%)
              </td>
              <td className="px-3 py-3 text-center bg-purple-50">
                <span className="text-sm font-semibold text-purple-600">
                  {calculateAverage('merit')}
                </span>
              </td>
              {performanceGrades.map(grade => (
                <td key={grade} className={`px-3 py-3 text-center ${GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || ''}`}>
                  <input
                    type="number"
                    value={bandGradeRates.byGrade[grade]?.merit || ''}
                    onChange={(e) => onGradeChange(grade, 'merit', Number(e.target.value))}
                    step="0.1"
                    className="w-20 px-2 py-1.5 text-sm text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    placeholder="0.0"
                  />
                </td>
              ))}
              <td className="px-3 py-3 text-xs text-center text-gray-500">개별 설정</td>
            </tr>
            
            {/* 추가 행 */}
            <tr className="border-b hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-gray-700">
                추가 (만원)
              </td>
              <td className="px-3 py-3 text-center bg-purple-50">
                <span className="text-sm font-semibold text-purple-600">
                  {calculateAverage('additional')}
                </span>
              </td>
              {performanceGrades.map(grade => (
                <td key={grade} className={`px-3 py-3 text-center ${GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || ''}`}>
                  <input
                    type="number"
                    value={bandGradeRates.byGrade[grade]?.additional || ''}
                    onChange={(e) => onGradeChange(grade, 'additional', Number(e.target.value))}
                    step={10}
                    className="w-20 px-2 py-1.5 text-sm text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="0"
                  />
                </td>
              ))}
              <td className="px-3 py-3 text-xs text-center text-gray-500">선택사항</td>
            </tr>
            
            {/* 총 인상률 행 */}
            <tr className="bg-gradient-to-r from-purple-50 to-pink-50 font-semibold">
              <td className="px-4 py-3 text-sm font-bold text-gray-900">
                총 인상률 (%)
              </td>
              <td className="px-3 py-3 text-center">
                <span className="text-base font-bold text-purple-600">
                  {calculateTotalRate(
                    Number(calculateAverage('baseUp')),
                    Number(calculateAverage('merit'))
                  )}
                </span>
                {Number(calculateAverage('additional')) > 0 && (
                  <div className="text-xs text-gray-600 mt-0.5">+{calculateAverage('additional')}만</div>
                )}
              </td>
              {performanceGrades.map(grade => (
                <td key={grade} className={`px-3 py-3 text-center ${GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || ''}`}>
                  <span className={`text-base font-bold ${GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.text || 'text-gray-700'}`}>
                    {calculateTotalRate(
                      bandGradeRates.byGrade[grade]?.baseUp || 0,
                      bandGradeRates.byGrade[grade]?.merit || 0
                    )}
                  </span>
                  {(bandGradeRates.byGrade[grade]?.additional || 0) > 0 && (
                    <div className="text-xs text-gray-600 mt-0.5">+{bandGradeRates.byGrade[grade]?.additional}만</div>
                  )}
                </td>
              ))}
              <td className="px-3 py-3 text-xs text-center text-gray-600">자동계산</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* 하단 빠른 설정 버튼 */}
      <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t flex justify-between items-center">
        <div className="text-xs text-gray-600">
          * {band} 직군 평가등급별로 개별 설정 가능합니다
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const baseUp = aiSettings?.baseUpPercentage || 0
              const merit = aiSettings?.meritIncreasePercentage || 0
              
              performanceGrades.forEach(grade => {
                onGradeChange(grade, 'baseUp', baseUp)
                onGradeChange(grade, 'merit', merit)
                onGradeChange(grade, 'additional', 0)
              })
            }}
            className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors font-medium"
          >
            AI 권장값으로 설정
          </button>
        </div>
      </div>
    </div>
  )
}