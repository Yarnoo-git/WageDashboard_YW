'use client'

import React from 'react'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'

interface RaiseSliderPanelProps {
  bandId: string
  bandName?: string
  levelRates?: {  // 대시보드에서 설정한 직급별 인상률
    [level: string]: {
      baseUp: number
      merit: number
    }
  }
  baseUpAdjustment: number  // 직군별 Base-up 조정값
  meritAdjustment: number   // 직군별 성과 인상률 조정값
  onBaseUpAdjustmentChange: (value: number) => void
  onMeritAdjustmentChange: (value: number) => void
  onReset?: () => void
  budgetImpact?: number
}

export function RaiseSliderPanel({
  bandId,
  bandName = '',
  levelRates = {},
  baseUpAdjustment,
  meritAdjustment,
  onBaseUpAdjustmentChange,
  onMeritAdjustmentChange,
  onReset,
  budgetImpact = 0
}: RaiseSliderPanelProps) {
  // 직급별 최종 인상률 계산
  const calculateFinalRates = () => {
    const levels = ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4']
    return levels.map(level => ({
      level,
      baseUp: (levelRates[level]?.baseUp || 0) + baseUpAdjustment,
      merit: (levelRates[level]?.merit || 0) + meritAdjustment,
      total: (levelRates[level]?.baseUp || 0) + baseUpAdjustment + 
             (levelRates[level]?.merit || 0) + meritAdjustment
    }))
  }
  const finalRates = calculateFinalRates()

  return (
    <div className="w-full space-y-4">
      {/* 대시보드 기준 인상률 표시 */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">대시보드 기준 인상률</h4>
        <div className="space-y-1 text-sm">
          {['Lv.4', 'Lv.3', 'Lv.2', 'Lv.1'].map(level => (
            <div key={level} className="flex justify-between text-gray-700">
              <span>{level}:</span>
              <span className="font-medium">
                {formatPercentage((levelRates[level]?.baseUp || 0) + (levelRates[level]?.merit || 0))}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Base-up 조정 슬라이더 */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <label className="text-base font-semibold text-gray-700">Base-up 조정</label>
          <span className="text-base font-bold text-primary-600">
            {baseUpAdjustment > 0 ? '+' : ''}{formatPercentage(baseUpAdjustment)}
          </span>
        </div>
        <input
          type="range"
          min="-2"
          max="2"
          step="0.1"
          value={baseUpAdjustment}
          onChange={(e) => onBaseUpAdjustmentChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb-primary"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>-2%</span>
          <span>0%</span>
          <span>+2%</span>
        </div>
      </div>

      {/* 성과 인상률 조정 슬라이더 */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <label className="text-base font-semibold text-gray-700">성과 인상률 조정</label>
          <span className="text-base font-bold text-green-600">
            {meritAdjustment > 0 ? '+' : ''}{formatPercentage(meritAdjustment)}
          </span>
        </div>
        <input
          type="range"
          min="-2"
          max="2"
          step="0.1"
          value={meritAdjustment}
          onChange={(e) => onMeritAdjustmentChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #10b981 0%, #10b981 ${(meritAdjustment + 2) * 25}%, #e5e7eb ${(meritAdjustment + 2) * 25}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>-2%</span>
          <span>0%</span>
          <span>+2%</span>
        </div>
      </div>

      {/* 최종 인상률 표시 */}
      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
        <h4 className="text-sm font-semibold text-green-900 mb-2">
          최종 인상률 ({bandName})
        </h4>
        <div className="space-y-1 text-sm">
          {finalRates.reverse().map(rate => (
            <div key={rate.level} className="flex justify-between">
              <span className="text-gray-700">{rate.level}:</span>
              <div className="flex gap-3">
                <span className="text-gray-600">
                  Base-up: {formatPercentage(rate.baseUp)}
                </span>
                <span className="text-gray-600">
                  성과 인상률: {formatPercentage(rate.merit)}
                </span>
                <span className="font-bold text-green-700">
                  = {formatPercentage(rate.total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 예산 영향 표시 */}
      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex justify-between items-center">
          <span className="text-base font-semibold text-gray-700">예산 영향</span>
          <span className="text-xl font-bold text-yellow-700">
            +{formatKoreanCurrency(budgetImpact, '억원', 100000000)}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          인상률 조정에 따른 추가 예산
        </p>
      </div>
    </div>
  )
}