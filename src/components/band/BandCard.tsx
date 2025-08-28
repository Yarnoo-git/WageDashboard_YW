'use client'

import { useState } from 'react'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'
import { BandLevel, LevelType } from '@/types/band'
import { Line } from 'recharts'
import { 
  LineChart, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts'

interface BandCardProps {
  bandName: string
  bandId: string
  levels: BandLevel[]
  totalBudgetImpact: number
  onLevelAdjust: (bandId: string, level: LevelType, baseUpRate: number) => void
  competitivenessTarget: 'SBL' | 'CA'
}

export function BandCard({
  bandName,
  bandId,
  levels,
  totalBudgetImpact,
  onLevelAdjust,
  competitivenessTarget = 'SBL'
}: BandCardProps) {
  const [expandedLevel, setExpandedLevel] = useState<LevelType | null>(null)

  // 차트 데이터 준비
  const chartData = levels.map(level => ({
    level: level.level,
    baseUpRate: level.baseUpRate * 100,
    competitiveness: competitivenessTarget === 'SBL' ? level.sblIndex : level.caIndex
  }))

  // 레벨별 색상
  const levelColors = {
    'Lv.1': 'text-purple-600 bg-purple-50',
    'Lv.2': 'text-blue-600 bg-blue-50',
    'Lv.3': 'text-green-600 bg-green-50',
    'Lv.4': 'text-orange-600 bg-orange-50'
  }

  // 경쟁력 지수 색상 결정
  const getCompetitivenessColor = (value: number) => {
    if (value < 95) return 'text-red-600 bg-red-50'
    if (value > 105) return 'text-green-600 bg-green-50'
    return 'text-gray-600 bg-gray-50'
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow">
      {/* 헤더 */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{bandName}</h3>
          <p className="text-sm text-gray-500">
            총 {levels.reduce((sum, l) => sum + l.headcount, 0)}명
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">총액 영향</p>
          <p className="font-bold text-lg text-primary-600">
            {formatKoreanCurrency(totalBudgetImpact, '억원', 100000000)}
          </p>
        </div>
      </div>

      {/* 미니 라인 차트 - 데이터가 있을 때만 표시 */}
      {levels.some(l => l.headcount > 0) && (
        <div className="h-20 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <Line 
                type="monotone" 
                dataKey="baseUpRate" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <XAxis dataKey="level" hide />
              <YAxis hide />
              <Tooltip 
                formatter={(value: any) => `${value.toFixed(2)}%`}
                labelFormatter={(label) => `${label}`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 레벨별 테이블 */}
      <div className="space-y-2">
        {levels.map((level) => {
          const isExpanded = expandedLevel === level.level
          const competitiveness = competitivenessTarget === 'SBL' ? level.sblIndex : level.caIndex
          const colorClass = levelColors[level.level as keyof typeof levelColors]
          const compColorClass = getCompetitivenessColor(competitiveness)

          return (
            <div key={level.level} className="border rounded-lg">
              {/* 레벨 요약 행 */}
              <div 
                className="px-3 py-2 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedLevel(isExpanded ? null : level.level)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colorClass}`}>
                      {level.level}
                    </span>
                    <span className="text-xs text-gray-600">{level.headcount}명</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Base-up</p>
                      <p className="font-semibold text-sm">{formatPercentage(level.baseUpRate)}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${compColorClass}`}>
                      {competitiveness.toFixed(1)}
                    </div>
                    <svg 
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 확장된 상세 정보 */}
              {isExpanded && (
                <div className="px-3 py-3 border-t bg-gray-50">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">평균 고정급</p>
                      <p className="font-semibold">{formatKoreanCurrency(level.meanBasePay, '만원')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">인상액</p>
                      <p className="font-semibold">{formatKoreanCurrency(level.baseUpKRW, '만원')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">SBL 지수</p>
                      <p className={`font-semibold ${level.sblIndex < 95 ? 'text-red-600' : level.sblIndex > 105 ? 'text-green-600' : 'text-gray-700'}`}>
                        {level.sblIndex.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">CA 지수</p>
                      <p className={`font-semibold ${level.caIndex < 95 ? 'text-red-600' : level.caIndex > 105 ? 'text-green-600' : 'text-gray-700'}`}>
                        {level.caIndex.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* 슬라이더 */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs font-medium text-gray-700">Base-up 조정</p>
                      <p className="text-xs font-bold text-primary-600">
                        {formatPercentage(level.baseUpRate)}
                      </p>
                    </div>
                    <input
                      type="range"
                      min="-5"
                      max="10"
                      step="0.1"
                      value={level.baseUpRate * 100}
                      onChange={(e) => onLevelAdjust(bandId, level.level, parseFloat(e.target.value) / 100)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb-primary"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>-5%</span>
                      <span>0%</span>
                      <span>10%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 하단 요약 */}
      <div className="mt-3 pt-3 border-t flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500">평균 인상률</p>
          <p className="font-bold text-sm">
            {formatPercentage(
              levels.reduce((sum, l) => sum + l.baseUpRate * l.headcount, 0) / 
              levels.reduce((sum, l) => sum + l.headcount, 0)
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">평균 {competitivenessTarget}</p>
          <p className="font-bold text-sm">
            {(
              levels.reduce((sum, l) => sum + (competitivenessTarget === 'SBL' ? l.sblIndex : l.caIndex) * l.headcount, 0) / 
              levels.reduce((sum, l) => sum + l.headcount, 0)
            ).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  )
}