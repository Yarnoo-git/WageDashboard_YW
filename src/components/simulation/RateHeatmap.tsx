'use client'

import React from 'react'
import { formatPercentage } from '@/lib/utils'

interface RateHeatmapProps {
  data: {
    [key: string]: {
      [subKey: string]: {
        baseUp: number
        merit: number
        total: number
        count?: number
      }
    }
  }
  rows: string[]
  columns: string[]
  title?: string
  colorScale?: 'blue' | 'green' | 'purple'
  showCounts?: boolean
}

export function RateHeatmap({
  data,
  rows,
  columns,
  title = '인상률 히트맵',
  colorScale = 'blue',
  showCounts = false
}: RateHeatmapProps) {
  // 색상 강도 계산 (0-10% 범위)
  const getColorIntensity = (value: number) => {
    const maxValue = 10
    const intensity = Math.min(value / maxValue, 1)
    return Math.round(intensity * 9) // 0-9 scale for Tailwind
  }
  
  const getBackgroundColor = (value: number) => {
    const intensity = getColorIntensity(value)
    const colors = {
      blue: [
        'bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400',
        'bg-blue-500', 'bg-blue-600', 'bg-blue-700', 'bg-blue-800', 'bg-blue-900'
      ],
      green: [
        'bg-green-50', 'bg-green-100', 'bg-green-200', 'bg-green-300', 'bg-green-400',
        'bg-green-500', 'bg-green-600', 'bg-green-700', 'bg-green-800', 'bg-green-900'
      ],
      purple: [
        'bg-purple-50', 'bg-purple-100', 'bg-purple-200', 'bg-purple-300', 'bg-purple-400',
        'bg-purple-500', 'bg-purple-600', 'bg-purple-700', 'bg-purple-800', 'bg-purple-900'
      ]
    }
    
    return colors[colorScale][intensity]
  }
  
  const getTextColor = (value: number) => {
    const intensity = getColorIntensity(value)
    return intensity >= 5 ? 'text-white' : 'text-gray-900'
  }
  
  // 평균 계산
  const calculateAverage = (type: 'row' | 'column', key: string) => {
    let total = 0
    let count = 0
    
    if (type === 'row') {
      columns.forEach(col => {
        if (data[key]?.[col]) {
          total += data[key][col].total
          count++
        }
      })
    } else {
      rows.forEach(row => {
        if (data[row]?.[key]) {
          total += data[row][key].total
          count++
        }
      })
    }
    
    return count > 0 ? total / count : 0
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 px-3 py-2 bg-gray-50 text-sm font-semibold text-left">
                구분
              </th>
              {columns.map(col => (
                <th key={col} className="border border-gray-300 px-3 py-2 bg-gray-50 text-sm font-semibold text-center">
                  {col}
                </th>
              ))}
              <th className="border border-gray-300 px-3 py-2 bg-yellow-50 text-sm font-semibold text-center">
                평균
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const rowAvg = calculateAverage('row', row)
              
              return (
                <tr key={row}>
                  <td className="border border-gray-300 px-3 py-2 bg-gray-50 text-sm font-semibold">
                    {row}
                  </td>
                  {columns.map(col => {
                    const cellData = data[row]?.[col]
                    if (!cellData) {
                      return (
                        <td key={col} className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-400">
                          -
                        </td>
                      )
                    }
                    
                    const bgColor = getBackgroundColor(cellData.total)
                    const textColor = getTextColor(cellData.total)
                    
                    return (
                      <td 
                        key={col} 
                        className={`border border-gray-300 px-3 py-2 text-center ${bgColor} ${textColor} transition-all duration-200 hover:ring-2 hover:ring-inset hover:ring-gray-400`}
                      >
                        <div className="font-bold text-sm">
                          {formatPercentage(cellData.total)}
                        </div>
                        <div className="text-xs opacity-80 mt-0.5">
                          B: {formatPercentage(cellData.baseUp)} / M: {formatPercentage(cellData.merit)}
                        </div>
                        {showCounts && cellData.count !== undefined && (
                          <div className="text-xs opacity-70 mt-0.5">
                            {cellData.count.toLocaleString()}명
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td className="border border-gray-300 px-3 py-2 bg-yellow-50 text-center">
                    <div className="font-bold text-sm text-yellow-700">
                      {formatPercentage(rowAvg)}
                    </div>
                  </td>
                </tr>
              )
            })}
            
            {/* 열 평균 행 */}
            <tr>
              <td className="border border-gray-300 px-3 py-2 bg-yellow-50 text-sm font-semibold">
                평균
              </td>
              {columns.map(col => {
                const colAvg = calculateAverage('column', col)
                return (
                  <td key={col} className="border border-gray-300 px-3 py-2 bg-yellow-50 text-center">
                    <div className="font-bold text-sm text-yellow-700">
                      {formatPercentage(colAvg)}
                    </div>
                  </td>
                )
              })}
              <td className="border border-gray-300 px-3 py-2 bg-orange-100 text-center">
                <div className="font-bold text-base text-orange-700">
                  {formatPercentage(
                    rows.reduce((sum, row) => sum + calculateAverage('row', row), 0) / rows.length
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* 범례 */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
        <span className="font-medium">범례:</span>
        <div className="flex items-center gap-1">
          <div className={`w-4 h-4 ${colorScale === 'blue' ? 'bg-blue-100' : colorScale === 'green' ? 'bg-green-100' : 'bg-purple-100'} rounded`}></div>
          <span>낮음 (0-3%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-4 h-4 ${colorScale === 'blue' ? 'bg-blue-400' : colorScale === 'green' ? 'bg-green-400' : 'bg-purple-400'} rounded`}></div>
          <span>중간 (3-6%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-4 h-4 ${colorScale === 'blue' ? 'bg-blue-700' : colorScale === 'green' ? 'bg-green-700' : 'bg-purple-700'} rounded`}></div>
          <span>높음 (6%+)</span>
        </div>
      </div>
    </div>
  )
}