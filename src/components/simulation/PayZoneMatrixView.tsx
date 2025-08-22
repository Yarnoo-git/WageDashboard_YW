'use client'

import React from 'react'

interface PayZoneMatrixViewProps {
  payZones: number[]
  levels: string[]
  pendingPayZoneRates: any
  additionalType: 'percentage' | 'amount'
  onRateChange: (payZone: number, level: string, field: 'baseUp' | 'merit' | 'additional', value: number) => void
}

export function PayZoneMatrixView({
  payZones,
  levels,
  pendingPayZoneRates,
  additionalType,
  onRateChange
}: PayZoneMatrixViewProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-4">Pay Zone × 레벨 매트릭스</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th rowSpan={2} className="border border-gray-300 px-3 py-2 bg-gray-50 text-sm font-semibold">
                레벨
              </th>
              {payZones.map(zone => (
                <th key={zone} colSpan={3} className="border border-gray-300 px-3 py-2 bg-gray-50 text-sm font-semibold text-center">
                  Pay Zone {zone}
                </th>
              ))}
            </tr>
            <tr>
              {payZones.map(zone => (
                <React.Fragment key={zone}>
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
                {payZones.map(zone => {
                  const rates = pendingPayZoneRates[zone]?.[level] || { baseUp: 0, merit: 0, additional: 0 }
                  
                  return (
                    <React.Fragment key={zone}>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="number"
                          value={rates.baseUp}
                          onChange={(e) => onRateChange(zone, level, 'baseUp', Number(e.target.value))}
                          className="w-full px-1 py-0.5 text-sm text-center border-0 focus:ring-1 focus:ring-blue-500"
                          step="0.1"
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="number"
                          value={rates.merit}
                          onChange={(e) => onRateChange(zone, level, 'merit', Number(e.target.value))}
                          className="w-full px-1 py-0.5 text-sm text-center border-0 focus:ring-1 focus:ring-blue-500"
                          step="0.1"
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="number"
                          value={rates.additional}
                          onChange={(e) => onRateChange(zone, level, 'additional', Number(e.target.value))}
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
  )
}