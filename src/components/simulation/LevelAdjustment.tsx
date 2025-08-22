'use client'

import React from 'react'

interface LevelAdjustmentProps {
  levels: string[]
  pendingLevelRates: any
  onRateChange: (level: string, field: 'baseUp' | 'merit' | 'additional', value: number) => void
  additionalType: 'percentage' | 'amount'
  employeeCounts?: { [level: string]: number }
}

export function LevelAdjustment({
  levels,
  pendingLevelRates,
  onRateChange,
  additionalType,
  employeeCounts = {}
}: LevelAdjustmentProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">레벨별 조정</h3>
      <p className="text-sm text-gray-600 mb-6">
        각 레벨별로 다른 인상률을 적용할 수 있습니다
      </p>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">레벨</th>
              <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">인원</th>
              <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Base-up (%)</th>
              <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">성과 (%)</th>
              <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">
                추가 {additionalType === 'percentage' ? '(%)' : '(만원)'}
              </th>
              <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">총 인상률</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level, index) => {
              const rates = pendingLevelRates[level] || { baseUp: 0, merit: 0, additional: 0 }
              const total = rates.baseUp + rates.merit + (additionalType === 'percentage' ? rates.additional : 0)
              const empCount = employeeCounts[level] || 0
              
              return (
                <tr key={level} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-3 px-3 text-sm font-medium text-gray-900">{level}</td>
                  <td className="py-3 px-3 text-sm text-center text-gray-600">
                    {empCount.toLocaleString()}명
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      value={rates.baseUp}
                      onChange={(e) => onRateChange(level, 'baseUp', Number(e.target.value))}
                      step="0.1"
                      className="w-20 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      value={rates.merit}
                      onChange={(e) => onRateChange(level, 'merit', Number(e.target.value))}
                      step="0.1"
                      className="w-20 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      value={rates.additional}
                      onChange={(e) => onRateChange(level, 'additional', Number(e.target.value))}
                      step={additionalType === 'percentage' ? 0.1 : 10}
                      className="w-20 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {total.toFixed(1)}%
                      {additionalType === 'amount' && rates.additional > 0 && (
                        <span className="ml-1 text-xs">+ {rates.additional}만원</span>
                      )}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* 일괄 조정 도구 */}
      <div className="mt-6 pt-4 border-t">
        <p className="text-sm font-medium text-gray-700 mb-3">일괄 조정</p>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Base-up:</label>
            <input
              type="number"
              placeholder="일괄 적용"
              onChange={(e) => {
                const value = Number(e.target.value)
                levels.forEach(level => onRateChange(level, 'baseUp', value))
              }}
              step="0.1"
              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">성과:</label>
            <input
              type="number"
              placeholder="일괄 적용"
              onChange={(e) => {
                const value = Number(e.target.value)
                levels.forEach(level => onRateChange(level, 'merit', value))
              }}
              step="0.1"
              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>
      </div>
    </div>
  )
}