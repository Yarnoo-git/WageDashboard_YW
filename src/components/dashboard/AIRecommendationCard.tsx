'use client'

import React from 'react'
import { formatPercentage } from '@/lib/utils'

interface AIRecommendationCardProps {
  data: {
    baseUpPercentage: number
    meritIncreasePercentage: number
    totalPercentage: number
    minRange: number
    maxRange: number
  } | null
  totalEmployees?: number
  baseUpRate?: number
  meritRate?: number
  meritWeightedAverage?: number  // 성과인상률 가중평균
  onBaseUpChange?: (value: number) => void
  onMeritChange?: (value: number) => void
  onReset?: () => void
}

function AIRecommendationCardComponent({ 
  data, 
  totalEmployees // props로 전달받음
}: AIRecommendationCardProps) {
  // 엑셀에서 가져온 AI 설정 데이터 사용
  const displayBaseUp = data?.baseUpPercentage ?? 0
  const displayMerit = data?.meritIncreasePercentage ?? 0
  const displayTotal = data?.totalPercentage ?? 0

  return (
    <div className="bg-white rounded-lg shadow p-3 h-full flex flex-col">
      <h2 className="text-sm font-semibold mb-2">
        AI 제안 적정 인상률
      </h2>
      
      {/* 중앙 상단: 총 인원 표시 */}
      <div className="text-center mb-3 pb-3 border-b">
        <span className="text-xs text-gray-600">총 인원</span>
        <p className="text-lg font-bold text-gray-900 mt-0.5">
          {(totalEmployees || 0).toLocaleString('ko-KR')}명
        </p>
        <span className="text-xs text-gray-500">({new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')} 기준)</span>
      </div>
      
      {/* 좌측: 최적 인상률, 우측: Base-up과 성과인상률 */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {/* 좌측: 최적 인상률 */}
        <div className="bg-blue-50 rounded-lg p-3 flex items-center">
          <div className="text-center w-full">
            <p className="text-sm font-semibold text-gray-700 mb-1">최적 인상률</p>
            <p className="text-3xl font-bold text-blue-600 font-tabular">
              {formatPercentage(displayTotal)}
            </p>
          </div>
        </div>
        
        {/* 우측: Base-up과 성과인상률 */}
        <div className="flex flex-col justify-between h-full">
          {/* Base-up */}
          <div className="bg-gray-50 rounded-lg p-2 flex-1 flex items-center">
            <div className="flex justify-between items-center w-full">
              <span className="text-sm text-gray-700 font-medium">Base-up</span>
              <span className="text-xl font-bold text-purple-600 font-tabular">
                {formatPercentage(displayBaseUp)}
              </span>
            </div>
          </div>
          
          <div className="h-2"></div>
          
          {/* 성과 인상률 */}
          <div className="bg-gray-50 rounded-lg p-2 flex-1 flex items-center">
            <div className="flex justify-between items-center w-full">
              <span className="text-sm text-gray-700 font-medium">성과 인상률</span>
              <span className="text-xl font-bold text-pink-600 font-tabular">
                {formatPercentage(displayMerit)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const AIRecommendationCard = React.memo(AIRecommendationCardComponent)