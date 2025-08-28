'use client'

import React from 'react'
import { formatKoreanCurrency } from '@/lib/utils'
import { LevelRates, EmployeeData } from './types'

interface TableRowProps {
  level: string
  rates: LevelRates
  employeeData: EmployeeData
  enableAdditionalIncrease: boolean
  onRateChange: (level: string, field: keyof LevelRates, value: string) => void
}

export const TableRow: React.FC<TableRowProps> = ({
  level,
  rates,
  employeeData,
  enableAdditionalIncrease,
  onRateChange
}) => {
  const data = employeeData.levels[level]
  const totalRate = rates.baseUp + rates.merit + rates.additional
  const incrementAmount = data ? data.averageSalary * (totalRate / 100) : 0
  const newSalary = data ? data.averageSalary + incrementAmount : 0
  const levelAmount = data ? data.headcount * data.averageSalary * (totalRate / 100) : 0
  
  return (
    <tr className={level === 'Lv.1' ? 'border-b-2 border-gray-400' : ''}>
      {/* 직급 */}
      <td className="px-3 py-2 text-center font-medium bg-gray-50 border border-gray-300">
        <span className={`inline-flex items-center justify-center px-2 py-1 rounded ${
          level === 'Lv.4' ? 'bg-purple-100 text-purple-800' :
          level === 'Lv.3' ? 'bg-blue-100 text-blue-800' :
          level === 'Lv.2' ? 'bg-green-100 text-green-800' :
          'bg-orange-100 text-orange-800'
        }`}>
          {level}
        </span>
      </td>
      
      {/* 인원 */}
      <td className="px-3 py-2 text-center text-sm border border-gray-300">
        {data ? data.headcount.toLocaleString() : '-'}명
      </td>
      
      {/* 평균 연봉 */}
      <td className="px-3 py-2 text-center text-sm border border-gray-300">
        {data ? formatKoreanCurrency(data.averageSalary, '백만원', 1000000) : '-'}
      </td>
      
      {/* ① Base-up (고정값) */}
      <td className="px-3 py-2 text-center bg-blue-50 border border-gray-300">
        <span className="text-sm font-medium text-blue-700">
          {rates.baseUp.toFixed(1)}%
        </span>
      </td>
      
      {/* ② 성과 인상률 */}
      <td className="px-3 py-2 text-center border border-gray-300">
        <input
          type="number"
          value={rates.merit}
          onChange={(e) => onRateChange(level, 'merit', e.target.value)}
          className="w-16 px-2 py-1 text-center border rounded text-sm"
          step="0.1"
          min="0"
        />
        <span className="ml-1">%</span>
      </td>
      
      {/* 승급 인상률 */}
      <td className="px-3 py-2 text-center border border-gray-300">
        <input
          type="number"
          value={rates.promotion}
          onChange={(e) => onRateChange(level, 'promotion', e.target.value)}
          className="w-16 px-2 py-1 text-center border rounded text-sm"
          step="0.1"
          min="0"
        />
        <span className="ml-1">%</span>
      </td>
      
      {/* 승격 인상률 */}
      <td className="px-3 py-2 text-center border border-gray-300">
        <input
          type="number"
          value={rates.advancement}
          onChange={(e) => onRateChange(level, 'advancement', e.target.value)}
          className="w-16 px-2 py-1 text-center border rounded text-sm"
          step="0.1"
          min="0"
        />
        <span className="ml-1">%</span>
      </td>
      
      {/* ③ 추가 인상률 */}
      <td className="px-3 py-2 text-center border border-gray-300">
        {enableAdditionalIncrease ? (
          <>
            <input
              type="number"
              value={rates.additional}
              onChange={(e) => onRateChange(level, 'additional', e.target.value)}
              className="w-16 px-2 py-1 text-center border rounded text-sm"
              step="0.1"
              min="0"
            />
            <span className="ml-1">%</span>
          </>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      
      {/* 총 인상률 (① + ② + ③) */}
      <td className="px-3 py-2 text-center font-medium bg-yellow-50 border border-gray-300">
        <span className="text-sm font-bold text-yellow-700">
          {totalRate.toFixed(1)}%
        </span>
      </td>
      
      {/* 인상 금액 */}
      <td className="px-3 py-2 text-center text-sm border border-gray-300">
        {data ? formatKoreanCurrency(incrementAmount, '백만원', 1000000) : '-'}
      </td>
      
      {/* 인상 후 연봉 */}
      <td className="px-3 py-2 text-center text-sm border border-gray-300">
        {data ? formatKoreanCurrency(newSalary, '백만원', 1000000) : '-'}
      </td>
      
      {/* 직급별 예산 */}
      <td className="px-3 py-2 text-center font-medium bg-green-50 border border-gray-300">
        <span className="text-sm font-bold text-green-700">
          {data ? formatKoreanCurrency(levelAmount, '억원', 100000000) : '-'}
        </span>
      </td>
    </tr>
  )
}