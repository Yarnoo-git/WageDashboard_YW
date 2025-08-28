'use client'

import React from 'react'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'

interface BudgetResourceCardProps {
  totalBudget?: number // 원 단위
  baseUpRate?: number
  meritRate?: number
  totalEmployees?: number
  averageSalary?: number
  levelRates?: Record<string, { baseUp: number; merit: number }>
  levelStatistics?: Array<{
    level: string
    employeeCount: number
    averageSalary: string
  }>
  customTotalBudget?: number | null
  onTotalBudgetChange?: (value: number | null) => void
  budgetDetails?: {
    aiRecommendation: number
    promotion: number
    additional: number
    indirect: number
  }
}

function BudgetResourceCardComponent({ 
  totalBudget = 0, // 기본값
  levelRates,
  levelStatistics,
  customTotalBudget,
  onTotalBudgetChange,
  budgetDetails
}: BudgetResourceCardProps) {
  
  // customTotalBudget을 그대로 사용 (원 단위)
  const actualBudget = customTotalBudget !== null && customTotalBudget !== undefined 
    ? customTotalBudget
    : totalBudget
  
  // 예산 계산 로직 - budgetDetails가 있으면 사용, 없으면 0
  let aiRecommendationBudget = budgetDetails?.aiRecommendation || 0 // 카드 1: AI 적정 인상률 예산
  let promotionBudget = budgetDetails?.promotion || 0 // 카드 2: 승급/승격 예산
  let additionalBudget = budgetDetails?.additional || 0 // 카드 3: 추가 인상
  let indirectCostBudget = budgetDetails?.indirect || 0 // 카드 4: 간접비용
  
  // 레벨별 계산이 있고 budgetDetails가 없을 경우만 계산
  if (levelRates && levelStatistics && !budgetDetails) {
    aiRecommendationBudget = 0
    levelStatistics.forEach((level) => {
      const levelRate = levelRates[level.level]
      if (levelRate) {
        const levelAvgSalary = parseFloat(level.averageSalary)
        const levelBudget = level.employeeCount * levelAvgSalary * (levelRate.baseUp + levelRate.merit) / 100
        aiRecommendationBudget += levelBudget
      }
    })
  }
  
  // 총 사용 예산
  const totalUsedBudget = aiRecommendationBudget + promotionBudget + additionalBudget + indirectCostBudget
  const usageRate = Math.round((totalUsedBudget / actualBudget) * 100 * 10) / 10
  
  // 각 항목의 비율 계산
  const aiPercent = Math.round((aiRecommendationBudget / actualBudget) * 100 * 10) / 10
  const promotionPercent = Math.round((promotionBudget / actualBudget) * 100 * 10) / 10
  const additionalPercent = Math.round((additionalBudget / actualBudget) * 100 * 10) / 10
  const indirectPercent = Math.round((indirectCostBudget / actualBudget) * 100 * 10) / 10
  
  return (
    <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">인상 재원 예산 현황</h2>
      
      <div className="flex-1 flex flex-col justify-between">
        {/* 상단: 총예산, 사용예산, 활용률 */}
        <div className="bg-blue-50 rounded-lg p-5 mb-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-lg text-gray-700 font-medium">총 예산</span>
              <div className="flex items-center gap-2">
                {onTotalBudgetChange ? (
                  <div className="flex items-center gap-1 bg-white rounded-lg border-2 border-blue-300 px-3 py-1.5">
                    <input
                      type="text"
                      value={customTotalBudget !== null && customTotalBudget !== undefined ? customTotalBudget.toLocaleString('ko-KR') : actualBudget.toLocaleString('ko-KR')}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '')
                        // 빈 문자열이거나 0을 포함한 모든 숫자를 허용
                        if (value === '' || value === '0') {
                          onTotalBudgetChange(0)
                        } else if (value) {
                          onTotalBudgetChange(parseFloat(value))
                        }
                      }}
                      className="w-44 text-xl font-bold text-blue-600 outline-none text-right"
                      placeholder="0"
                    />
                    <span className="text-base font-medium text-gray-600">원</span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-gray-900">
                    {formatKoreanCurrency(actualBudget, '억원')}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-lg text-gray-700">사용 예산</span>
              <span className="text-xl font-bold text-blue-600">
                {formatKoreanCurrency(totalUsedBudget, '억원')}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-blue-200">
              <span className="text-lg text-gray-700">활용률</span>
              <span className="text-xl font-bold text-green-600">
                {formatPercentage(usageRate)}
              </span>
            </div>
          </div>
        </div>
        
        {/* 하단: 고정급 인상(3줄), 간접비용 인상 */}
        <div className="space-y-3">
          {/* 고정급 인상 섹션 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-base font-semibold text-gray-700 mb-3">고정급 인상</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center relative pl-10">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <span className="text-base text-gray-700">AI 적정 인상률</span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900 text-base">
                    {formatKoreanCurrency(aiRecommendationBudget, '백만원', 1000000)}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">{formatPercentage(aiPercent)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center relative pl-10">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 bg-green-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <span className="text-base text-gray-700">승급/승격 인상</span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900 text-base">
                    {formatKoreanCurrency(promotionBudget, '백만원', 1000000)}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">{formatPercentage(promotionPercent)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center relative pl-10">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 bg-purple-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <span className="text-base text-gray-700">추가 인상</span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900 text-base">
                    {formatKoreanCurrency(additionalBudget, '백만원', 1000000)}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">{formatPercentage(additionalPercent)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 간접비용 인상 섹션 */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex justify-between items-center relative pl-10">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 bg-orange-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                4
              </div>
              <span className="text-base font-semibold text-gray-700">간접비용 인상</span>
              <div className="text-right">
                <span className="font-bold text-orange-600 text-lg">
                  {formatKoreanCurrency(indirectCostBudget, '백만원', 1000000)}
                </span>
                <span className="text-sm text-gray-500 ml-1">{formatPercentage(indirectPercent)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const BudgetResourceCard = React.memo(BudgetResourceCardComponent)