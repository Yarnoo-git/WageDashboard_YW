'use client'

import React from 'react'
import { formatKoreanCurrency } from '@/lib/utils'

interface LevelData {
  level: string
  caMedian: number
  sblMedian: number
  sblMedianAdjusted?: number  // 조정 후 값
}

interface ComparisonTableProps {
  data: LevelData[]
}

export function ComparisonTable({ data }: ComparisonTableProps) {
  // 보상 경쟁력 색상 결정
  const getCompetitivenessColor = (percentage: number) => {
    if (percentage < 95) return 'bg-red-100 text-red-700'
    if (percentage > 105) return 'bg-green-100 text-green-700'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="w-full overflow-x-auto -mx-2 px-2 md:mx-0 md:px-0">
      <table className="w-full text-xs md:text-base md:min-w-[600px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 font-semibold text-gray-700">구분</th>
            {data.map((item) => (
              <th key={item.level} className="text-center py-2 px-3 font-semibold text-gray-700">
                {item.level}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* C사 행 */}
          <tr className="border-b border-gray-100">
            <td className="py-2 px-3 font-medium text-blue-600">C사</td>
            {data.map((item) => (
              <td key={`ca-${item.level}`} className="text-center py-2 px-3">
                {formatKoreanCurrency(item.caMedian, '만원')}
              </td>
            ))}
          </tr>
          
          {/* SBL 현재 행 */}
          <tr className="border-b border-gray-100">
            <td className="py-2 px-3 font-medium text-red-300">SBL (현재)</td>
            {data.map((item) => (
              <td key={`sbl-${item.level}`} className="text-center py-2 px-3 text-gray-600">
                {formatKoreanCurrency(item.sblMedian, '만원')}
              </td>
            ))}
          </tr>
          
          {/* SBL 조정 후 행 */}
          {data[0]?.sblMedianAdjusted && (
            <tr className="border-b border-gray-200 bg-red-50">
              <td className="py-2 px-3 font-bold text-red-600">SBL (조정 후)</td>
              {data.map((item) => (
                <td key={`sbl-adj-${item.level}`} className="text-center py-2 px-3 font-semibold">
                  {formatKoreanCurrency(item.sblMedianAdjusted || item.sblMedian, '만원')}
                </td>
              ))}
            </tr>
          )}
          
          {/* 보상 경쟁력 행 (현재) */}
          <tr className="border-b border-gray-100">
            <td className="py-2 px-3 font-semibold text-gray-500">보상 경쟁력 (현재)</td>
            {data.map((item) => {
              const competitiveness = Math.round((item.sblMedian / item.caMedian) * 100 * 10) / 10
              return (
                <td key={`comp-${item.level}`} className="text-center py-2 px-1">
                  <span className={`inline-block px-2 py-1 rounded-md font-semibold text-sm opacity-60 ${getCompetitivenessColor(competitiveness)}`}>
                    {competitiveness.toFixed(1)}%
                  </span>
                </td>
              )
            })}
          </tr>
          
          {/* 보상 경쟁력 행 (조정 후) */}
          {data[0]?.sblMedianAdjusted && (
            <tr className="bg-yellow-50">
              <td className="py-2 px-3 font-bold text-gray-700">보상 경쟁력 (조정 후)</td>
              {data.map((item) => {
                const adjustedCompetitiveness = Math.round(((item.sblMedianAdjusted || item.sblMedian) / item.caMedian) * 100 * 10) / 10
                return (
                  <td key={`comp-adj-${item.level}`} className="text-center py-2 px-1">
                    <span className={`inline-block px-2 py-1 rounded-md font-bold text-sm ${getCompetitivenessColor(adjustedCompetitiveness)}`}>
                      {adjustedCompetitiveness.toFixed(1)}%
                    </span>
                  </td>
                )
              })}
            </tr>
          )}
        </tbody>
      </table>
      
      {/* 범례 */}
      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 rounded"></div>
          <span>&lt; 95% (경쟁력 부족)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-100 rounded"></div>
          <span>95-105% (적정)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 rounded"></div>
          <span>&gt; 105% (경쟁력 우위)</span>
        </div>
      </div>
    </div>
  )
}