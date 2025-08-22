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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">전체 일괄 조정</h3>
      <p className="text-sm text-gray-600 mb-6">
        모든 직원에게 동일한 인상률을 적용합니다
      </p>
      
      <div className="space-y-4">
        {/* Base-up 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base-up 인상률
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={avgBaseUp}
              onChange={(e) => onRateChange('baseUp', Number(e.target.value))}
              step="0.1"
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>
        
        {/* 성과 인상률 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            성과 인상률
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={avgMerit}
              onChange={(e) => onRateChange('merit', Number(e.target.value))}
              step="0.1"
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>
        
        {/* 추가 인상률 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              추가 인상률
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => onAdditionalTypeChange('percentage')}
                className={`px-3 py-1 text-xs rounded ${
                  additionalType === 'percentage'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                %
              </button>
              <button
                onClick={() => onAdditionalTypeChange('amount')}
                className={`px-3 py-1 text-xs rounded ${
                  additionalType === 'amount'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                만원
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={avgAdditional}
              onChange={(e) => onRateChange('additional', Number(e.target.value))}
              step={additionalType === 'percentage' ? 0.1 : 10}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-gray-500">
              {additionalType === 'percentage' ? '%' : '만원'}
            </span>
          </div>
        </div>
        
        {/* 총 인상률 표시 */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">총 인상률</span>
            <span className="text-lg font-bold text-blue-700">
              {(avgBaseUp + avgMerit + (additionalType === 'percentage' ? avgAdditional : 0)).toFixed(1)}%
              {additionalType === 'amount' && avgAdditional > 0 && (
                <span className="text-sm font-normal text-gray-600 ml-1">
                  + {avgAdditional}만원
                </span>
              )}
            </span>
          </div>
        </div>
        
        {/* 빠른 설정 버튼 */}
        <div className="pt-4">
          <p className="text-xs text-gray-500 mb-2">빠른 설정</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onRateChange('baseUp', 3.2)
                onRateChange('merit', 2.5)
                onRateChange('additional', 0)
              }}
              className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              AI 제안
            </button>
            <button
              onClick={() => {
                onRateChange('baseUp', 5.0)
                onRateChange('merit', 2.0)
                onRateChange('additional', 0)
              }}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              업계 평균
            </button>
            <button
              onClick={() => {
                onRateChange('baseUp', 0)
                onRateChange('merit', 0)
                onRateChange('additional', 0)
              }}
              className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              초기화
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}