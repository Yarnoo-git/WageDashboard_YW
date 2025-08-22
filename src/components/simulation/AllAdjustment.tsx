'use client'

import React from 'react'

interface AllAdjustmentProps {
  pendingLevelRates: any
  onRateChange: (field: 'baseUp' | 'merit' | 'additional', value: number) => void
  additionalType: 'percentage' | 'amount'
  onAdditionalTypeChange: (type: 'percentage' | 'amount') => void
}

export function AllAdjustment({
  pendingLevelRates,
  onRateChange,
  additionalType,
  onAdditionalTypeChange
}: AllAdjustmentProps) {
  // 전체 평균값 계산
  const calculateAverage = (field: 'baseUp' | 'merit' | 'additional') => {
    const values = Object.values(pendingLevelRates).map((rate: any) => rate[field] || 0)
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  }
  
  const avgBaseUp = calculateAverage('baseUp')
  const avgMerit = calculateAverage('merit')
  const avgAdditional = calculateAverage('additional')
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">전체 일괄 조정</h3>
        <span className="text-xs text-gray-500">모든 직원 동일 적용</span>
      </div>
      
      {/* 입력 필드들을 가로로 배치 */}
      <div className="grid grid-cols-3 gap-3 mb-2">
        {/* Base-up 입력 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Base-up</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={avgBaseUp}
              onChange={(e) => onRateChange('baseUp', Number(e.target.value))}
              step="0.1"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
        </div>
        
        {/* 성과 인상률 입력 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">성과</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={avgMerit}
              onChange={(e) => onRateChange('merit', Number(e.target.value))}
              step="0.1"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
        </div>
        
        {/* 추가 인상률 */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <label className="text-xs font-medium text-gray-600">추가</label>
            <div className="flex">
              <button
                onClick={() => onAdditionalTypeChange('percentage')}
                className={`px-1.5 py-0.5 text-xs rounded-l border ${
                  additionalType === 'percentage'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-300'
                }`}
              >
                %
              </button>
              <button
                onClick={() => onAdditionalTypeChange('amount')}
                className={`px-1.5 py-0.5 text-xs rounded-r border-t border-r border-b ${
                  additionalType === 'amount'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-300'
                }`}
              >
                만
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={avgAdditional}
              onChange={(e) => onRateChange('additional', Number(e.target.value))}
              step={additionalType === 'percentage' ? 0.1 : 10}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
            <span className="text-xs text-gray-500">
              {additionalType === 'percentage' ? '%' : '만'}
            </span>
          </div>
        </div>
      </div>
        
      {/* 총 인상률과 빠른 설정을 한 줄로 */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">총 인상률:</span>
            <span className="text-sm font-bold text-blue-600">
              {(avgBaseUp + avgMerit + (additionalType === 'percentage' ? avgAdditional : 0)).toFixed(1)}%
              {additionalType === 'amount' && avgAdditional > 0 && (
                <span className="text-xs font-normal text-gray-600 ml-1">+{avgAdditional}만</span>
              )}
            </span>
          </div>
        </div>
        
        {/* 빠른 설정 버튼 */}
        <div className="flex gap-1">
          <button
            onClick={() => {
              onRateChange('baseUp', 3.2)
              onRateChange('merit', 2.5)
              onRateChange('additional', 0)
            }}
            className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
          >
            AI
          </button>
          <button
            onClick={() => {
              onRateChange('baseUp', 5.0)
              onRateChange('merit', 2.0)
              onRateChange('additional', 0)
            }}
            className="px-2 py-0.5 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
          >
            업계
          </button>
          <button
            onClick={() => {
              onRateChange('baseUp', 0)
              onRateChange('merit', 0)
              onRateChange('additional', 0)
            }}
            className="px-2 py-0.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  )
}