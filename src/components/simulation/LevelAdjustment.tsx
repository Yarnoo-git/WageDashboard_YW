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
    <div className="bg-white rounded-lg shadow-sm p-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">레벨별 조정</h3>
        <span className="text-xs text-gray-500">레벨별 차등 적용</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-1 px-2 text-xs font-medium text-gray-700">레벨</th>
              <th className="text-center py-1 px-2 text-xs font-medium text-gray-700">인원</th>
              <th className="text-center py-1 px-2 text-xs font-medium text-gray-700">Base-up (%)</th>
              <th className="text-center py-1 px-2 text-xs font-medium text-gray-700">성과 (%)</th>
              <th className="text-center py-1 px-2 text-xs font-medium text-gray-700">
                추가 {additionalType === 'percentage' ? '(%)' : '(만원)'}
              </th>
              <th className="text-center py-1 px-2 text-xs font-medium text-gray-700">총 인상률</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level, index) => {
              const rates = pendingLevelRates[level] || { baseUp: 0, merit: 0, additional: 0 }
              const total = rates.baseUp + rates.merit + (additionalType === 'percentage' ? rates.additional : 0)
              const empCount = employeeCounts[level] || 0
              
              return (
                <tr key={level} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-1 px-1.5 text-xs font-medium text-gray-900">{level}</td>
                  <td className="py-1 px-1.5 text-xs text-center text-gray-600">
                    {empCount.toLocaleString()}
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="number"
                      value={rates.baseUp}
                      onChange={(e) => onRateChange(level, 'baseUp', Number(e.target.value))}
                      step="0.1"
                      className="w-14 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="number"
                      value={rates.merit}
                      onChange={(e) => onRateChange(level, 'merit', Number(e.target.value))}
                      step="0.1"
                      className="w-14 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="number"
                      value={rates.additional}
                      onChange={(e) => onRateChange(level, 'additional', Number(e.target.value))}
                      step={additionalType === 'percentage' ? 0.1 : 10}
                      className="w-14 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-1 px-1.5 text-center">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
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
      <div className="mt-2 pt-2 border-t flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">일괄:</span>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="Base"
              onChange={(e) => {
                const value = Number(e.target.value)
                levels.forEach(level => onRateChange(level, 'baseUp', value))
              }}
              step="0.1"
              className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded placeholder:text-gray-400"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="성과"
              onChange={(e) => {
                const value = Number(e.target.value)
                levels.forEach(level => onRateChange(level, 'merit', value))
              }}
              step="0.1"
              className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded placeholder:text-gray-400"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
        </div>
      </div>
    </div>
  )
}