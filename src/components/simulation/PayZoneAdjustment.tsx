'use client'

import React from 'react'

interface PayZoneAdjustmentProps {
  levels: string[]
  payZones: number[]
  performanceGrades?: string[]
  pendingPayZoneRates: any
  onRateChange: (payZone: number, level: string, grade: string, field: 'baseUp' | 'merit' | 'additional', value: number) => void
  additionalType: 'percentage' | 'amount'
  selectedBands?: string[]
  employeeCounts?: { [key: string]: number }
}

export function PayZoneAdjustment({
  levels,
  payZones,
  performanceGrades = ['S', 'A', 'B', 'C'],
  pendingPayZoneRates,
  onRateChange,
  additionalType,
  selectedBands = [],
  employeeCounts = {}
}: PayZoneAdjustmentProps) {
  
  // 레벨별로 PayZone 그룹핑
  const renderLevelGroup = (level: string) => {
    return (
      <div key={level} className="mb-8">
        <h4 className="text-md font-semibold text-gray-900 mb-3 sticky top-0 bg-white z-10 py-2">
          {level} 레벨
        </h4>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th rowSpan={2} className="border border-gray-300 px-3 py-2 bg-gray-50 text-sm font-semibold text-left sticky left-0 z-20">
                  Pay Zone
                </th>
                {performanceGrades.map(grade => (
                  <th key={grade} colSpan={3} className="border border-gray-300 px-3 py-2 bg-gray-50 text-sm font-semibold text-center">
                    {grade}등급
                  </th>
                ))}
              </tr>
              <tr>
                {performanceGrades.map(grade => (
                  <React.Fragment key={grade}>
                    <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-xs text-center">Base</th>
                    <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-xs text-center">성과</th>
                    <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-xs text-center">
                      추가{additionalType === 'percentage' ? '(%)' : '(만원)'}
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {payZones.map(zone => {
                const empKey = `${level}-PZ${zone}`
                const empCount = employeeCounts[empKey] || 0
                
                return (
                  <tr key={zone}>
                    <td className="border border-gray-300 px-3 py-2 bg-gray-50 text-sm font-medium sticky left-0">
                      <div className="flex items-center justify-between">
                        <span>Zone {zone}</span>
                        {empCount > 0 && (
                          <span className="text-xs text-gray-500 ml-2">({empCount}명)</span>
                        )}
                      </div>
                    </td>
                    {performanceGrades.map(grade => {
                      const rates = pendingPayZoneRates[zone]?.[level]?.[grade] || { baseUp: 0, merit: 0, additional: 0 }
                      
                      return (
                        <React.Fragment key={grade}>
                          <td className="border border-gray-300 p-1">
                            <input
                              type="number"
                              value={rates.baseUp}
                              onChange={(e) => onRateChange(zone, level, grade, 'baseUp', Number(e.target.value))}
                              className="w-full px-1 py-0.5 text-sm text-center border-0 focus:ring-1 focus:ring-blue-500"
                              step="0.1"
                            />
                          </td>
                          <td className="border border-gray-300 p-1">
                            <input
                              type="number"
                              value={rates.merit}
                              onChange={(e) => onRateChange(zone, level, grade, 'merit', Number(e.target.value))}
                              className="w-full px-1 py-0.5 text-sm text-center border-0 focus:ring-1 focus:ring-blue-500"
                              step="0.1"
                            />
                          </td>
                          <td className="border border-gray-300 p-1">
                            <input
                              type="number"
                              value={rates.additional}
                              onChange={(e) => onRateChange(zone, level, grade, 'additional', Number(e.target.value))}
                              className="w-full px-1 py-0.5 text-sm text-center border-0 focus:ring-1 focus:ring-blue-500"
                              step={additionalType === 'percentage' ? 0.1 : 10}
                            />
                          </td>
                        </React.Fragment>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Pay Zone별 조정</h3>
        <p className="text-sm text-gray-600 mt-1">
          레벨별 Pay Zone과 평가등급에 따른 세분화된 인상률 조정
        </p>
        {selectedBands.length > 0 && (
          <p className="text-xs text-blue-600 mt-2">
            선택된 직군: {selectedBands.join(', ')}
          </p>
        )}
      </div>
      
      <div className="space-y-6">
        {levels.map(level => renderLevelGroup(level))}
      </div>
      
      {/* 일괄 조정 도구 */}
      <div className="mt-6 pt-4 border-t sticky bottom-0 bg-white">
        <p className="text-sm font-medium text-gray-700 mb-3">일괄 조정 도구</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600">모든 Base-up:</label>
            <input
              type="number"
              placeholder="일괄 적용"
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
              className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">모든 성과:</label>
            <input
              type="number"
              placeholder="일괄 적용"
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
              className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">모든 추가:</label>
            <input
              type="number"
              placeholder="일괄 적용"
              onChange={(e) => {
                const value = Number(e.target.value)
                payZones.forEach(zone => {
                  levels.forEach(level => {
                    performanceGrades.forEach(grade => {
                      onRateChange(zone, level, grade, 'additional', value)
                    })
                  })
                })
              }}
              step={additionalType === 'percentage' ? 0.1 : 10}
              className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  )
}