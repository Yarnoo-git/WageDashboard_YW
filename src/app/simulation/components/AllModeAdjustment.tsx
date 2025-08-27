/**
 * 전체 일괄 조정 컴포넌트
 * simulation 페이지에서 분리
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useWageContextNew } from '@/context/WageContextNew'
import { UI_CONFIG } from '@/config/constants'

export function AllModeAdjustment() {
  const { adjustment, actions, originalData } = useWageContextNew()
  const [gradeRates, setGradeRates] = useState<{ [grade: string]: any }>({})
  
  // 초기 값 설정
  useEffect(() => {
    const initialRates: { [grade: string]: any } = {}
    originalData.metadata.grades.forEach(grade => {
      initialRates[grade] = {
        baseUp: 0,
        merit: 0,
        additional: 0
      }
    })
    setGradeRates(initialRates)
  }, [originalData.metadata.grades])
  
  const handleGradeChange = (grade: string, field: string, value: number) => {
    setGradeRates(prev => ({
      ...prev,
      [grade]: {
        ...prev[grade],
        [field]: value
      }
    }))
  }
  
  const handleApplyAll = () => {
    actions.updateAllCells(gradeRates)
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">전체 일괄 조정</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                평가등급
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                Base-up (%)
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                Merit (%)
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                추가 (%/만원)
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                총 인상률
              </th>
            </tr>
          </thead>
          <tbody>
            {originalData.metadata.grades.map(grade => {
              const rates = gradeRates[grade] || { baseUp: 0, merit: 0, additional: 0 }
              const total = rates.baseUp + rates.merit
              
              return (
                <tr key={grade} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${
                      UI_CONFIG.GRADE_COLORS[grade as keyof typeof UI_CONFIG.GRADE_COLORS]?.bg || 'bg-gray-100'
                    } ${
                      UI_CONFIG.GRADE_COLORS[grade as keyof typeof UI_CONFIG.GRADE_COLORS]?.text || 'text-gray-700'
                    }`}>
                      {grade}등급
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={rates.baseUp}
                      onChange={(e) => handleGradeChange(grade, 'baseUp', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border rounded text-center"
                      step="0.1"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={rates.merit}
                      onChange={(e) => handleGradeChange(grade, 'merit', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border rounded text-center"
                      step="0.1"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={rates.additional}
                      onChange={(e) => handleGradeChange(grade, 'additional', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border rounded text-center"
                      step="0.1"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-blue-600">
                      {total.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleApplyAll}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          전체 적용
        </button>
      </div>
    </div>
  )
}