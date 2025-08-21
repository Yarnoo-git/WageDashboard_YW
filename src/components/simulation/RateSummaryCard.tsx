'use client'

import React from 'react'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'

interface RateSummaryCardProps {
  // AI 제안값
  aiBaseUp: number
  aiMerit: number
  
  // 현재 조정값 (가중평균)
  currentBaseUp: number
  currentMerit: number
  
  // 예산 정보
  totalBudget: number
  usedBudget: number
  
  // 인원 정보
  totalEmployees: number
  
  // 선택적: 상세 정보
  levelBreakdown?: {
    [level: string]: {
      count: number
      baseUp: number
      merit: number
    }
  }
}

export function RateSummaryCard({
  aiBaseUp,
  aiMerit,
  currentBaseUp,
  currentMerit,
  totalBudget,
  usedBudget,
  totalEmployees,
  levelBreakdown
}: RateSummaryCardProps) {
  // 총 인상률 계산
  const aiTotal = aiBaseUp + aiMerit
  const currentTotal = currentBaseUp + currentMerit
  
  // 예산 사용률
  const budgetUsagePercent = totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0
  
  // AI 대비 차이
  const baseUpDiff = currentBaseUp - aiBaseUp
  const meritDiff = currentMerit - aiMerit
  const totalDiff = currentTotal - aiTotal
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-200">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          전체 인상률 현황
        </h2>
        <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
          {totalEmployees.toLocaleString()}명 적용
        </span>
      </div>
      
      {/* 메인 메트릭스 */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Base-up */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Base-up</span>
            {baseUpDiff !== 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                baseUpDiff > 0 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {baseUpDiff > 0 ? '+' : ''}{formatPercentage(baseUpDiff)}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatPercentage(currentBaseUp)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            AI 제안: {formatPercentage(aiBaseUp)}
          </div>
        </div>
        
        {/* 성과인상률 */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">성과인상률</span>
            {meritDiff !== 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                meritDiff > 0 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {meritDiff > 0 ? '+' : ''}{formatPercentage(meritDiff)}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatPercentage(currentMerit)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            AI 제안: {formatPercentage(aiMerit)}
          </div>
        </div>
        
        {/* 총 인상률 */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-700 font-medium">총 인상률</span>
            {totalDiff !== 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                totalDiff > 0 ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {totalDiff > 0 ? '+' : ''}{formatPercentage(totalDiff)}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {formatPercentage(currentTotal)}
          </div>
          <div className="text-xs text-purple-600 mt-1">
            AI 제안: {formatPercentage(aiTotal)}
          </div>
        </div>
      </div>
      
      {/* 예산 사용 현황 */}
      <div className="bg-white rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">예산 사용률</span>
          <span className={`text-sm font-bold ${
            budgetUsagePercent <= 80 ? 'text-green-600' :
            budgetUsagePercent <= 100 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {formatPercentage(budgetUsagePercent)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${
              budgetUsagePercent <= 80 ? 'bg-gradient-to-r from-green-400 to-green-500' :
              budgetUsagePercent <= 100 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
              'bg-gradient-to-r from-red-400 to-red-500'
            }`}
            style={{width: `${Math.min(budgetUsagePercent, 100)}%`}}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>사용: {formatKoreanCurrency(usedBudget, '억원', 100000000)}</span>
          <span>총예산: {formatKoreanCurrency(totalBudget, '억원', 100000000)}</span>
        </div>
      </div>
      
      {/* 직급별 상세 (옵션) */}
      {levelBreakdown && (
        <div className="border-t border-blue-200 pt-3">
          <div className="text-xs font-medium text-gray-700 mb-2">직급별 현황</div>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(levelBreakdown).map(([level, data]) => (
              <div key={level} className="bg-white rounded-lg p-2 text-center">
                <div className="text-xs text-gray-600">{level}</div>
                <div className="text-sm font-bold text-gray-900 mt-1">
                  {formatPercentage(data.baseUp + data.merit)}
                </div>
                <div className="text-xs text-gray-500">
                  {data.count.toLocaleString()}명
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* AI 대비 상태 메시지 */}
      <div className="mt-3 p-2 bg-blue-100 rounded-lg">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-blue-800">
            {totalDiff === 0 
              ? 'AI 제안값과 동일하게 설정되어 있습니다.'
              : totalDiff > 0
              ? `AI 제안 대비 ${formatPercentage(Math.abs(totalDiff))} 높게 설정되어 있습니다.`
              : `AI 제안 대비 ${formatPercentage(Math.abs(totalDiff))} 낮게 설정되어 있습니다.`
            }
          </p>
        </div>
      </div>
    </div>
  )
}