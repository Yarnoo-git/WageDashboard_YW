'use client'

import React from 'react'

interface TableHeaderProps {
  enableAdditionalIncrease: boolean
  onEnableAdditionalIncreaseChange?: (value: boolean) => void
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  enableAdditionalIncrease,
  onEnableAdditionalIncreaseChange
}) => {
  return (
    <thead className="bg-gray-100">
      <tr>
        <th rowSpan={2} className="px-3 py-2 text-center font-semibold text-sm border border-gray-300 bg-gray-200">
          직급
        </th>
        <th rowSpan={2} className="px-3 py-2 text-center font-semibold text-sm border border-gray-300 bg-gray-200">
          인원
        </th>
        <th rowSpan={2} className="px-3 py-2 text-center font-semibold text-sm border border-gray-300 bg-gray-200">
          평균 연봉
        </th>
        <th colSpan={5} className="px-3 py-2 text-center font-semibold text-sm border border-gray-300 bg-gray-200">
          인상률 조정
        </th>
        <th rowSpan={2} className="px-3 py-2 text-center font-semibold text-sm border border-gray-300 bg-yellow-100">
          총 인상률
        </th>
        <th rowSpan={2} className="px-3 py-2 text-center font-semibold text-sm border border-gray-300 bg-gray-200">
          인상 금액
        </th>
        <th rowSpan={2} className="px-3 py-2 text-center font-semibold text-sm border border-gray-300 bg-gray-200">
          인상 후 연봉
        </th>
        <th rowSpan={2} className="px-3 py-2 text-center font-semibold text-sm border border-gray-300 bg-green-100">
          직급별 예산
        </th>
      </tr>
      <tr>
        <th className="px-3 py-2 text-center text-sm border border-gray-300 bg-blue-100">
          <span className="font-semibold">① Base-up</span>
          <div className="text-xs text-gray-500 mt-1">(AI 제안)</div>
        </th>
        <th className="px-3 py-2 text-center text-sm border border-gray-300 bg-gray-100">
          <span className="font-semibold">② 성과</span>
          <div className="text-xs text-gray-500 mt-1">(조정가능)</div>
        </th>
        <th className="px-3 py-2 text-center text-sm border border-gray-300 bg-gray-100">
          <span className="font-semibold">승급</span>
          <div className="text-xs text-gray-500 mt-1">(별도계산)</div>
        </th>
        <th className="px-3 py-2 text-center text-sm border border-gray-300 bg-gray-100">
          <span className="font-semibold">승격</span>
          <div className="text-xs text-gray-500 mt-1">(별도계산)</div>
        </th>
        <th className="px-3 py-2 text-center text-sm border border-gray-300 bg-purple-100">
          <div className="flex items-center justify-center">
            <span className="font-semibold mr-2">③ 추가</span>
            {onEnableAdditionalIncreaseChange && (
              <input
                type="checkbox"
                checked={enableAdditionalIncrease}
                onChange={(e) => onEnableAdditionalIncreaseChange(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                title="추가 인상률 활성화"
              />
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">(선택사항)</div>
        </th>
      </tr>
    </thead>
  )
}