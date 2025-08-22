'use client'

import React from 'react'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'

interface FixedSummaryBarProps {
  totalEmployees: number
  currentBaseUp: number
  currentMerit: number
  aiBaseUp: number
  aiMerit: number
  totalBudget: number
  usedBudget: number
  budgetPercentage: number
}

export function FixedSummaryBar({
  totalEmployees,
  currentBaseUp,
  currentMerit,
  aiBaseUp,
  aiMerit,
  totalBudget,
  usedBudget,
  budgetPercentage
}: FixedSummaryBarProps) {
  const totalRate = currentBaseUp + currentMerit
  const aiTotalRate = aiBaseUp + aiMerit
  const remainingBudget = totalBudget - usedBudget
  
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
                {Math.abs(currentMerit - aiMerit) > 0.01 && (
                  <span className={`text-xs ${currentMerit > aiMerit ? 'text-orange-600' : 'text-blue-600'}`}>
                    ({currentMerit > aiMerit ? '+' : ''}{(currentMerit - aiMerit).toFixed(1)})
                  </span>
                )}
              </div>
              <div className="w-px h-4 bg-gray-300"/>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">총:</span>
                <span className="font-bold text-blue-900">{totalRate.toFixed(1)}%</span>
                {Math.abs(totalRate - aiTotalRate) > 0.01 && (
                  <span className={`text-xs ${totalRate > aiTotalRate ? 'text-orange-600' : 'text-blue-600'}`}>
                    ({totalRate > aiTotalRate ? '+' : ''}{(totalRate - aiTotalRate).toFixed(1)})
                  </span>
                )}
              </div>
            </div>
            
            {/* AI 제안값 참고 */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>AI 제안: {aiTotalRate.toFixed(1)}%</span>
            </div>
          </div>
          
          {/* 예산 사용 현황 */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-600 mb-1">예산 사용</div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">
                  {formatKoreanCurrency(usedBudget, '억원', 100000000)}
                </span>
                <span className="text-xs text-gray-500">
                  / {formatKoreanCurrency(totalBudget, '억원', 100000000)}
                </span>
              </div>
            </div>
            
            {/* 프로그레스 바 */}
            <div className="w-32">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">사용률</span>
                <span className={`font-bold ${
                  budgetPercentage <= 80 ? 'text-green-600' :
                  budgetPercentage <= 100 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {formatPercentage(budgetPercentage)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    budgetPercentage <= 80 ? 'bg-green-500' :
                    budgetPercentage <= 100 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{width: `${Math.min(budgetPercentage, 100)}%`}}
                />
              </div>
            </div>
            
            {/* 잔여 예산 */}
            <div className={`px-3 py-1 rounded-lg ${
              remainingBudget >= 0 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="text-xs text-gray-600">잔여</div>
              <div className={`font-bold ${
                remainingBudget >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {formatKoreanCurrency(Math.abs(remainingBudget), '억원', 100000000)}
                {remainingBudget < 0 && ' 초과'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}