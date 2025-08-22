'use client'

import React from 'react'

interface PayZoneGroupedViewProps {
  payZones: number[]
  levels: string[]
  performanceGrades: string[]
  selectedBands: string[]
  pendingPayZoneRates: any
  additionalType: 'percentage' | 'amount'
  onRateChange: (payZone: number, level: string, grade: string, field: 'baseUp' | 'merit' | 'additional', value: number) => void
}

export function PayZoneGroupedView({
  payZones,
  levels,
  performanceGrades,
  selectedBands,
  pendingPayZoneRates,
  additionalType,
  onRateChange
}: PayZoneGroupedViewProps) {
  const grades = performanceGrades || ['S', 'A', 'B', 'C']
  
  return (
    <div className="space-y-6">
      {payZones.map(zone => (
        <div key={zone} className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-4">Pay Zone {zone}</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-3 py-2 bg-gray-50 text-sm font-semibold text-left">
                    레벨
                  </th>
                  {grades.map(grade => (
                    <th key={grade} className="border border-gray-300 px-3 py-2 bg-gray-50 text-sm font-semibold text-center" colSpan={3}>
                      {grade}등급
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="border border-gray-300 px-3 py-2 bg-gray-100 text-xs"></th>
                  {grades.map(grade => (
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
                {levels.map(level => (
                  <tr key={level}>
                    <td className="border border-gray-300 px-3 py-2 bg-gray-50 text-sm font-medium">
                      {level}
                    </td>
                    {grades.map(grade => {
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}