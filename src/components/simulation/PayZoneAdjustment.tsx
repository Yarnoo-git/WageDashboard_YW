'use client'

import React, { useMemo } from 'react'

interface PayZoneAdjustmentProps {
  levels: string[]
  payZones: number[]
  performanceGrades?: string[]
  pendingPayZoneRates: any
  onRateChange: (payZone: number, level: string, grade: string, field: 'baseUp' | 'merit' | 'additional', value: number) => void
  additionalType: 'percentage' | 'amount'
  selectedBands?: string[]
  employeeCounts?: { [key: string]: number }
  contextEmployeeData?: any[]
}

export function PayZoneAdjustment({
  levels,
  payZones,
  performanceGrades = ['S', 'A', 'B', 'C'],
  pendingPayZoneRates,
  onRateChange,
  additionalType,
  selectedBands = [],
  employeeCounts = {},
  contextEmployeeData = []
}: PayZoneAdjustmentProps) {
  
  // Pay Zone × Level × Grade별 인원수 계산
  const detailedCounts = useMemo(() => {
    const counts: { [key: string]: number } = {}
    contextEmployeeData.forEach(emp => {
      if (emp.level && emp.payZone && emp.performanceGrade) {
        if (selectedBands.length === 0 || selectedBands.includes(emp.band)) {
          const key = `${emp.level}-PZ${emp.payZone}-${emp.performanceGrade}`
          counts[key] = (counts[key] || 0) + 1
        }
      }
    })
    return counts
  }, [contextEmployeeData, selectedBands])
  
  // 레벨별로 PayZone 그룹핑
  const renderLevelGroup = (level: string) => {
    const levelEmployees = contextEmployeeData.filter(emp => 
      emp.level === level && 
      (selectedBands.length === 0 || selectedBands.includes(emp.band))
    )
    
    if (levelEmployees.length === 0) return null
    
    return (
      <div key={level} className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">
            {level} 레벨
          </h4>
          <span className="text-xs text-gray-500">
            {levelEmployees.length}명
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th rowSpan={2} className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                  Pay Zone
                </th>
                {performanceGrades.map(grade => (
                  <th key={grade} colSpan={3} className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-l border-gray-200">
                    {grade}등급
                  </th>
                ))}
              </tr>
              <tr className="border-b border-gray-200">
                {performanceGrades.map(grade => (
                  <React.Fragment key={grade}>
                    <th className="px-1 py-1 text-center text-xs text-gray-500 border-l border-gray-100">Base</th>
                    <th className="px-1 py-1 text-center text-xs text-gray-500 border-l border-gray-100">성과</th>
                    <th className="px-1 py-1 text-center text-xs text-gray-500 border-l border-gray-200">
                      추가{additionalType === 'percentage' ? '(%)' : '(만)'}
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {payZones.map(zone => {
                const zoneKey = `${level}-PZ${zone}`
                const zoneCount = employeeCounts[zoneKey] || 0
                
                if (zoneCount === 0) return null
                
                return (
                  <tr key={zone} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <span>Zone {zone}</span>
                        <span className="text-xs text-gray-400">({zoneCount})</span>
                      </div>
                    </td>
                    {performanceGrades.map(grade => {
                      const gradeKey = `${level}-PZ${zone}-${grade}`
                      const gradeCount = detailedCounts[gradeKey] || 0
                      const rates = pendingPayZoneRates[zone]?.[level]?.[grade] || { baseUp: 0, merit: 0, additional: 0 }
                      const hasValue = rates.baseUp > 0 || rates.merit > 0 || rates.additional > 0
                      
                      return (
                        <React.Fragment key={grade}>
                          <td className="px-1 py-1 border-l border-gray-100">
                            <div className="relative">
                              <input
                                type="number"
                                value={rates.baseUp || ''}
                                onChange={(e) => onRateChange(zone, level, grade, 'baseUp', Number(e.target.value))}
                                className={`w-full px-1 py-1 text-xs text-center border rounded ${
                                  gradeCount === 0 
                                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' 
                                    : hasValue 
                                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium' 
                                      : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                }`}
                                step="0.1"
                                placeholder="0"
                                disabled={gradeCount === 0}
                              />
                              {gradeCount > 0 && (
                                <span className="absolute -top-1 -right-1 text-[10px] text-gray-400">
                                  {gradeCount}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-1 py-1 border-l border-gray-100">
                            <input
                              type="number"
                              value={rates.merit || ''}
                              onChange={(e) => onRateChange(zone, level, grade, 'merit', Number(e.target.value))}
                              className={`w-full px-1 py-1 text-xs text-center border rounded ${
                                gradeCount === 0 
                                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' 
                                  : rates.merit > 0 
                                    ? 'bg-green-50 border-green-300 text-green-700 font-medium' 
                                    : 'border-gray-300 hover:border-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                              }`}
                              step="0.1"
                              placeholder="0"
                              disabled={gradeCount === 0}
                            />
                          </td>
                          <td className="px-1 py-1 border-l border-gray-200">
                            <input
                              type="number"
                              value={rates.additional || ''}
                              onChange={(e) => onRateChange(zone, level, grade, 'additional', Number(e.target.value))}
                              className={`w-full px-1 py-1 text-xs text-center border rounded ${
                                gradeCount === 0 
                                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' 
                                  : rates.additional > 0 
                                    ? 'bg-purple-50 border-purple-300 text-purple-700 font-medium' 
                                    : 'border-gray-300 hover:border-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                              }`}
                              step={additionalType === 'percentage' ? 0.1 : 10}
                              placeholder="0"
                              disabled={gradeCount === 0}
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
    <div>
      <div className="space-y-4">
        {levels.map(level => renderLevelGroup(level))}
      </div>
      
      {/* 일괄 조정 도구 - 우측 상단에 작은 카드로 */}
      <div className="fixed bottom-20 right-6 bg-white rounded-lg shadow-lg p-4 w-64">
        <p className="text-sm font-semibold text-gray-700 mb-3">일괄 조정</p>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-600">Base-up 일괄</label>
            <input
              type="number"
              placeholder="0"
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
              className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">성과 일괄</label>
            <input
              type="number"
              placeholder="0"
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
              className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">추가 일괄</label>
            <input
              type="number"
              placeholder="0"
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
              className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}