/**
 * FixedSummaryBar - 상단 고정 요약 바
 * 새로운 WageContextNew 시스템과 통합
 */

'use client'

import React from 'react'
import { formatKoreanCurrency } from '@/lib/utils'
import { WeightedAverageResult } from '@/types/adjustmentMatrix'
import { BudgetUsage } from '@/utils/matrixCalculations'

interface FixedSummaryBarProps {
  totalEmployees: number
  weightedAverage: WeightedAverageResult
  budgetUsage: BudgetUsage
  aiSettings: {
    baseUpPercentage: number
    meritIncreasePercentage: number
  }
  pendingWeightedAverage?: WeightedAverageResult
  pendingBudgetUsage?: BudgetUsage
  additionalType: 'percentage' | 'amount'
  hasChanges: boolean
}

export function FixedSummaryBar({
  totalEmployees,
  weightedAverage,
  budgetUsage,
  aiSettings,
  pendingWeightedAverage,
  pendingBudgetUsage,
  additionalType,
  hasChanges
}: FixedSummaryBarProps) {
  const currentBaseUp = weightedAverage.totalAverage.baseUp
  const currentMerit = weightedAverage.totalAverage.merit
  const currentAdditional = weightedAverage.totalAverage.additional
  const currentTotal = weightedAverage.summary.effectiveRate
  
  const aiBaseUp = aiSettings.baseUpPercentage
  const aiMerit = aiSettings.meritIncreasePercentage
  const aiTotal = aiBaseUp + aiMerit
  
  // Pending 값들
  const pendingBaseUp = pendingWeightedAverage?.totalAverage.baseUp
  const pendingMerit = pendingWeightedAverage?.totalAverage.merit
  const pendingAdditional = pendingWeightedAverage?.totalAverage.additional
  const pendingTotal = pendingWeightedAverage?.summary.effectiveRate
  
  return (
    <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
      <div className="px-6 py-3">
        {/* 상단 요약 정보 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">총 인원:</span>
              <span className="font-bold text-gray-900">{totalEmployees.toLocaleString()}명</span>
            </div>
            
            {/* 현재 인상률 */}
            <div className="flex items-center gap-4 px-4 py-1 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Base-up:</span>
                <span className="font-bold text-blue-700">{currentBaseUp.toFixed(1)}%</span>
                {hasChanges && pendingBaseUp !== undefined && (
                  <span className="text-xs text-orange-600">
                    → {pendingBaseUp.toFixed(1)}%
                  </span>
                )}
                {Math.abs(currentBaseUp - aiBaseUp) > 0.01 && (
                  <span className={`text-xs ${currentBaseUp > aiBaseUp ? 'text-orange-600' : 'text-blue-600'}`}>
                    ({currentBaseUp > aiBaseUp ? '+' : ''}{(currentBaseUp - aiBaseUp).toFixed(1)})
                  </span>
                )}
              </div>
              <div className="w-px h-4 bg-gray-300"/>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">성과:</span>
                <span className="font-bold text-blue-700">{currentMerit.toFixed(1)}%</span>
                {hasChanges && pendingMerit !== undefined && (
                  <span className="text-xs text-orange-600">
                    → {pendingMerit.toFixed(1)}%
                  </span>
                )}
                {Math.abs(currentMerit - aiMerit) > 0.01 && (
                  <span className={`text-xs ${currentMerit > aiMerit ? 'text-orange-600' : 'text-blue-600'}`}>
                    ({currentMerit > aiMerit ? '+' : ''}{(currentMerit - aiMerit).toFixed(1)})
                  </span>
                )}
              </div>
              {currentAdditional > 0 && (
                <>
                  <div className="w-px h-4 bg-gray-300"/>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">추가:</span>
                    <span className="font-bold text-purple-700">
                      {additionalType === 'percentage' 
                        ? `${currentAdditional.toFixed(1)}%`
                        : `${currentAdditional.toFixed(0)}만원`
                      }
                    </span>
                    {hasChanges && pendingAdditional !== undefined && (
                      <span className="text-xs text-orange-600">
                        → {additionalType === 'percentage' 
                          ? `${pendingAdditional.toFixed(1)}%`
                          : `${pendingAdditional.toFixed(0)}만원`
                        }
                      </span>
                    )}
                  </div>
                </>
              )}
              <div className="w-px h-4 bg-gray-300"/>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">총:</span>
                <span className="font-bold text-blue-900">{currentTotal.toFixed(1)}%</span>
                {hasChanges && pendingTotal !== undefined && (
                  <span className="text-xs text-orange-600">
                    → {pendingTotal.toFixed(1)}%
                  </span>
                )}
                {Math.abs(currentTotal - aiTotal) > 0.01 && (
                  <span className={`text-xs ${currentTotal > aiTotal ? 'text-orange-600' : 'text-blue-600'}`}>
                    ({currentTotal > aiTotal ? '+' : ''}{(currentTotal - aiTotal).toFixed(1)})
                  </span>
                )}
              </div>
            </div>
            
            {/* AI 제안값 참고 */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>AI 제안: {aiTotal.toFixed(1)}%</span>
            </div>
          </div>
          
          {/* 예산 현황 */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 px-4 py-1 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">예산 사용:</span>
                <span className={`font-bold ${
                  budgetUsage.isOverBudget ? 'text-red-600' :
                  budgetUsage.usagePercentage > 80 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {budgetUsage.usagePercentage.toFixed(1)}%
                </span>
                {hasChanges && pendingBudgetUsage && (
                  <span className={`text-xs ${
                    pendingBudgetUsage.isOverBudget ? 'text-red-600' :
                    pendingBudgetUsage.usagePercentage > 80 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    → {pendingBudgetUsage.usagePercentage.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="w-px h-4 bg-gray-300"/>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">잔여:</span>
                <span className="font-bold text-gray-900">
                  {formatKoreanCurrency(budgetUsage.remaining)}
                </span>
                {hasChanges && pendingBudgetUsage && (
                  <span className="text-xs text-gray-600">
                    → {formatKoreanCurrency(pendingBudgetUsage.remaining)}
                  </span>
                )}
              </div>
            </div>
            
            {hasChanges && (
              <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                미적용 변경사항
              </div>
            )}
          </div>
        </div>
        
        {/* 하단 진행 바 */}
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all ${
                budgetUsage.isOverBudget ? 'bg-red-500' :
                budgetUsage.usagePercentage > 80 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, budgetUsage.usagePercentage)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}