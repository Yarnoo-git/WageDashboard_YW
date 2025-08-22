'use client'

import React, { useMemo } from 'react'

interface PayZoneAdjustmentProps {
  levels: string[]
  payZones: number[]
  performanceGrades: string[]
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
  performanceGrades,
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
      <div key={level} className="bg-white rounded-lg shadow-sm p-2 mb-2">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs font-semibold text-gray-700">
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
                <th rowSpan={2} className="px-2 py-1 text-left text-xs font-medium text-gray-700">
                  PZ
                </th>
                {performanceGrades.map(grade => (
                  <th key={grade} colSpan={3} className="px-1 py-1 text-center text-xs font-medium text-gray-700 border-l border-gray-200">
                    {grade}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-gray-200">
                {performanceGrades.map(grade => (
                  <React.Fragment key={grade}>
                    <th className="px-0.5 py-0.5 text-center text-xs text-gray-500 border-l border-gray-100">B</th>
                    <th className="px-0.5 py-0.5 text-center text-xs text-gray-500 border-l border-gray-100">M</th>
                    <th className="px-0.5 py-0.5 text-center text-xs text-gray-500 border-l border-gray-200">
                      {additionalType === 'percentage' ? '%' : '만'}
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
                    <td className="px-2 py-1 text-xs font-medium text-gray-700">
                      <div className="flex items-center gap-1">
                        <span>{zone}</span>
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
                                className={`w-full px-1 py-0.5 text-xs text-center border rounded ${
                                  rates.baseUp > 0
                                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium' 
                                    : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                }`}
                                step="0.1"
                                placeholder="0"
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
                              className={`w-full px-1 py-0.5 text-xs text-center border rounded ${
                                rates.merit > 0 
                                  ? 'bg-green-50 border-green-300 text-green-700 font-medium' 
                                  : 'border-gray-300 hover:border-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                              }`}
                              step="0.1"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-1 py-1 border-l border-gray-200">
                            <input
                              type="number"
                              value={rates.additional || ''}
                              onChange={(e) => onRateChange(zone, level, grade, 'additional', Number(e.target.value))}
                              className={`w-full px-1 py-0.5 text-xs text-center border rounded ${
                                rates.additional > 0 
                                  ? 'bg-purple-50 border-purple-300 text-purple-700 font-medium' 
                                  : 'border-gray-300 hover:border-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                              }`}
                              step={additionalType === 'percentage' ? 0.1 : 10}
                              placeholder="0"
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
      {/* 일괄 조정 도구 - 상단에 인라인으로 배치 */}
      <div className="bg-white rounded-lg shadow-sm p-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">일괄 조정:</span>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="Base"
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
                  payZones.forEach(zone => {
                    levels.forEach(level => {
                      performanceGrades.forEach(grade => {
                        onRateChange(zone, level, grade, 'merit', value)
                      })
                    })
                  })
                }}
                step="0.1"
                className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded placeholder:text-gray-400"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="추가"
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
                className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded placeholder:text-gray-400"
              />
              <span className="text-xs text-gray-500">{additionalType === 'percentage' ? '%' : '만'}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 레벨별 그룹 표시 */}
      <div className="space-y-2">
        {levels.map(level => renderLevelGroup(level))}
      </div>
    </div>
  )
}