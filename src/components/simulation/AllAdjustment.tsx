'use client'

import React, { useMemo } from 'react'
import { GRADE_COLORS } from '@/types/simulation'
import { Employee } from '@/types/employee'
import { useWageContext } from '@/context/WageContext'

interface AllAdjustmentProps {
  pendingLevelRates: any
  onRateChange: (field: 'baseUp' | 'merit' | 'additional', value: number, grade?: string) => void
  additionalType: 'percentage' | 'amount'
  onAdditionalTypeChange: (type: 'percentage' | 'amount') => void
  contextEmployeeData?: Employee[]
  performanceGrades?: string[]
}

export function AllAdjustment({
  pendingLevelRates,
  onRateChange,
  additionalType,
  onAdditionalTypeChange,
  contextEmployeeData = [],
  performanceGrades = ['ST', 'AT', 'OT', 'BT']
}: AllAdjustmentProps) {
  const { performanceWeights } = useWageContext()
  
  // 평가등급별 인원수 계산
  const employeeCountByGrade = useMemo(() => {
    const counts: { [grade: string]: number } = {}
    let total = 0
    
    performanceGrades.forEach(grade => {
      counts[grade] = 0
    })
    
    contextEmployeeData.forEach(emp => {
      if (emp.performanceRating && performanceGrades.includes(emp.performanceRating)) {
        counts[emp.performanceRating]++
        total++
      }
    })
    
    return { ...counts, total }
  }, [contextEmployeeData, performanceGrades])
  
  // 전체 평균값 계산
  const calculateAverage = (field: 'baseUp' | 'merit' | 'additional') => {
    const values = Object.values(pendingLevelRates).map((rate: any) => rate[field] || 0)
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  }
  
  const avgBaseUp = calculateAverage('baseUp')
  const avgMerit = calculateAverage('merit')
  const avgAdditional = calculateAverage('additional')
  
  // 평가등급별 Merit 계산 (가중치 적용)
  const calculateMeritByGrade = (baseMerit: number, grade: string) => {
    const weight = performanceWeights[grade] || 1.0
    return (baseMerit * weight).toFixed(2)
  }
  
  // 총 인상률 계산
  const calculateTotalRate = (baseUp: number, merit: number, additional: number, grade?: string) => {
    const effectiveMerit = grade ? Number(calculateMeritByGrade(merit, grade)) : merit
    return (baseUp + effectiveMerit + (additionalType === 'percentage' ? additional : 0)).toFixed(1)
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-gray-900">전체 일괄 조정</h3>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {employeeCountByGrade.total.toLocaleString()}명
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* 추가 타입 선택 */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600">추가:</span>
              <div className="flex">
                <button
                  onClick={() => onAdditionalTypeChange('percentage')}
                  className={`px-2 py-1 text-xs rounded-l border transition-all ${
                    additionalType === 'percentage'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  %
                </button>
                <button
                  onClick={() => onAdditionalTypeChange('amount')}
                  className={`px-2 py-1 text-xs rounded-r border-t border-r border-b transition-all ${
                    additionalType === 'amount'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  만원
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 w-32">구분</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 w-24 bg-gray-100">
                전체
                <div className="text-xs font-normal text-gray-500 mt-0.5">평균</div>
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
              <td className="px-3 py-3 text-center">
                <input
                  type="number"
                  value={avgBaseUp}
                  onChange={(e) => onRateChange('baseUp', Number(e.target.value))}
                  step="0.1"
                  className="w-20 px-2 py-1.5 text-sm text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="0.0"
                />
              </td>
              {performanceGrades.map(grade => (
                <td key={grade} className={`px-3 py-3 text-center ${GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || ''}`}>
                  <span className="text-sm text-gray-500">-</span>
                </td>
              ))}
              <td className="px-3 py-3 text-xs text-center text-gray-500">전체 동일</td>
            </tr>
            
            {/* Merit 행 */}
            <tr className="border-b hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-gray-700">
                Merit (%)
                <div className="text-xs text-gray-500 mt-0.5">기본값</div>
              </td>
              <td className="px-3 py-3 text-center">
                <input
                  type="number"
                  value={avgMerit}
                  onChange={(e) => onRateChange('merit', Number(e.target.value))}
                  step="0.1"
                  className="w-20 px-2 py-1.5 text-sm text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="0.0"
                />
              </td>
              {performanceGrades.map(grade => {
                const weight = performanceWeights[grade] || 1.0
                return (
                  <td key={grade} className={`px-3 py-3 text-center ${GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || ''}`}>
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-semibold text-gray-700">
                        {calculateMeritByGrade(avgMerit, grade)}
                      </span>
                      <span className="text-xs text-gray-500">×{weight}</span>
                    </div>
                  </td>
                )
              })}
              <td className="px-3 py-3 text-xs text-center text-gray-500">가중치 적용</td>
            </tr>
            
            {/* 추가 행 */}
            <tr className="border-b hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-gray-700">
                추가 ({additionalType === 'percentage' ? '%' : '만원'})
              </td>
              <td className="px-3 py-3 text-center">
                <input
                  type="number"
                  value={avgAdditional}
                  onChange={(e) => onRateChange('additional', Number(e.target.value))}
                  step={additionalType === 'percentage' ? 0.1 : 10}
                  className="w-20 px-2 py-1.5 text-sm text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="0"
                />
              </td>
              {performanceGrades.map(grade => (
                <td key={grade} className={`px-3 py-3 text-center ${GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || ''}`}>
                  <span className="text-sm text-gray-500">-</span>
                </td>
              ))}
              <td className="px-3 py-3 text-xs text-center text-gray-500">선택사항</td>
            </tr>
            
            {/* 총 인상률 행 */}
            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 font-semibold">
              <td className="px-4 py-3 text-sm font-bold text-gray-900">
                총 인상률 (%)
              </td>
              <td className="px-3 py-3 text-center">
                <span className="text-base font-bold text-blue-600">
                  {calculateTotalRate(avgBaseUp, avgMerit, avgAdditional)}
                </span>
                {additionalType === 'amount' && avgAdditional > 0 && (
                  <div className="text-xs text-gray-600 mt-0.5">+{avgAdditional}만</div>
                )}
              </td>
              {performanceGrades.map(grade => (
                <td key={grade} className={`px-3 py-3 text-center ${GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.bg || ''}`}>
                  <span className={`text-base font-bold ${GRADE_COLORS[grade as keyof typeof GRADE_COLORS]?.text || 'text-gray-700'}`}>
                    {calculateTotalRate(avgBaseUp, avgMerit, avgAdditional, grade)}
                  </span>
                  {additionalType === 'amount' && avgAdditional > 0 && (
                    <div className="text-xs text-gray-600 mt-0.5">+{avgAdditional}만</div>
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
          * Merit는 평가등급별 가중치가 자동 적용됩니다
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onRateChange('baseUp', 3.2)
              onRateChange('merit', 2.5)
              onRateChange('additional', 0)
            }}
            className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors font-medium"
          >
            AI 권장값
          </button>
          <button
            onClick={() => {
              onRateChange('baseUp', 5.0)
              onRateChange('merit', 2.0)
              onRateChange('additional', 0)
            }}
            className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors font-medium"
          >
            업계 평균
          </button>
          <button
            onClick={() => {
              onRateChange('baseUp', 0)
              onRateChange('merit', 0)
              onRateChange('additional', 0)
            }}
            className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors font-medium"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  )
}