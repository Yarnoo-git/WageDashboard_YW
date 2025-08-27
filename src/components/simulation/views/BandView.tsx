/**
 * BandView - 직군별 분석 뷰 컴포넌트
 * 특정 직군의 상세 분석 정보 표시
 */

'use client'

import React from 'react'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'

interface LevelData {
  level: string
  headcount: number
  meanBasePay: number
  baseUpRate: number
  meritRate?: number
  company: {
    median: number
    mean: number
  }
  competitor: {
    median: number
  }
  sblIndex?: number
  caIndex?: number
}

interface BandViewProps {
  bandName: string
  levels: LevelData[]
  totalEmployees: number
  averageSalary: number
  baseUpRate: number
  meritRate: number
  onAdjustmentChange?: (band: string, adjustments: any) => void
  isReadOnly?: boolean
}

export function BandView({
  bandName,
  levels,
  totalEmployees,
  averageSalary,
  baseUpRate,
  meritRate,
  onAdjustmentChange,
  isReadOnly = true
}: BandViewProps) {
  const activeLevels = levels.filter(l => l.headcount > 0)
  const avgCompetitiveness = activeLevels.reduce((sum, level) => {
    if (level.competitor.median > 0) {
      return sum + (level.company.median / level.competitor.median) * 100
    }
    return sum
  }, 0) / activeLevels.length || 100
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* 헤더 */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{bandName}</h2>
            <p className="text-sm text-gray-600 mt-1">
              직군 상세 분석 및 조정
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-600">인원</div>
              <div className="text-2xl font-bold text-gray-900">
                {totalEmployees.toLocaleString()}명
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">평균 급여</div>
              <div className="text-lg font-bold text-gray-900">
                {formatKoreanCurrency(averageSalary)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">경쟁력 지수</div>
              <div className={`text-2xl font-bold ${
                avgCompetitiveness >= 110 ? 'text-green-600' :
                avgCompetitiveness >= 90 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {avgCompetitiveness.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 인상률 요약 */}
      <div className="px-6 py-4 bg-blue-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-sm text-gray-600">Base-up: </span>
              <span className="font-bold text-blue-600">{formatPercentage(baseUpRate)}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Merit: </span>
              <span className="font-bold text-green-600">{formatPercentage(meritRate)}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">평균 인상률: </span>
              <span className="font-bold text-gray-900">
                {formatPercentage(baseUpRate + meritRate)}
              </span>
            </div>
          </div>
          {!isReadOnly && (
            <button
              onClick={() => onAdjustmentChange?.(bandName, { 
                baseUp: baseUpRate, 
                merit: meritRate 
              })}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              인상률 조정
            </button>
          )}
        </div>
      </div>
      
      {/* 레벨별 데이터 테이블 */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-sm text-gray-600">
                <th className="text-left py-3">직급</th>
                <th className="text-right py-3">인원</th>
                <th className="text-right py-3">평균급여</th>
                <th className="text-right py-3">우리회사</th>
                <th className="text-right py-3">C사</th>
                <th className="text-right py-3">경쟁력</th>
                <th className="text-right py-3">Base-up</th>
                <th className="text-right py-3">Merit</th>
                <th className="text-right py-3">총인상률</th>
              </tr>
            </thead>
            <tbody>
              {activeLevels.map(level => {
                const competitiveness = level.competitor.median > 0 
                  ? (level.company.median / level.competitor.median) * 100 
                  : 100
                  
                return (
                  <tr key={level.level} className="border-b hover:bg-gray-50">
                    <td className="py-4 font-medium">{level.level}</td>
                    <td className="text-right py-4">{level.headcount.toLocaleString()}</td>
                    <td className="text-right py-4">
                      {formatKoreanCurrency(level.meanBasePay || level.company.mean)}
                    </td>
                    <td className="text-right py-4">
                      {formatKoreanCurrency(level.company.median)}
                    </td>
                    <td className="text-right py-4">
                      {formatKoreanCurrency(level.competitor.median)}
                    </td>
                    <td className="text-right py-4">
                      <span className={`font-medium ${
                        competitiveness >= 110 ? 'text-green-600' :
                        competitiveness >= 90 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {competitiveness.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-4 text-blue-600">
                      {formatPercentage(level.baseUpRate || baseUpRate)}
                    </td>
                    <td className="text-right py-4 text-green-600">
                      {formatPercentage(level.meritRate || meritRate)}
                    </td>
                    <td className="text-right py-4 font-medium">
                      {formatPercentage((level.baseUpRate || baseUpRate) + (level.meritRate || meritRate))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 통계 요약 */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600">최고 급여</div>
            <div className="font-bold text-gray-900">
              {formatKoreanCurrency(
                Math.max(...activeLevels.map(l => l.company.median || 0))
              )}
            </div>
          </div>
          <div>
            <div className="text-gray-600">최저 급여</div>
            <div className="font-bold text-gray-900">
              {formatKoreanCurrency(
                Math.min(...activeLevels.filter(l => l.company.median > 0).map(l => l.company.median))
              )}
            </div>
          </div>
          <div>
            <div className="text-gray-600">급여 격차</div>
            <div className="font-bold text-gray-900">
              {(
                Math.max(...activeLevels.map(l => l.company.median || 0)) /
                Math.min(...activeLevels.filter(l => l.company.median > 0).map(l => l.company.median))
              ).toFixed(1)}배
            </div>
          </div>
          <div>
            <div className="text-gray-600">평균 경쟁력</div>
            <div className={`font-bold ${
              avgCompetitiveness >= 110 ? 'text-green-600' :
              avgCompetitiveness >= 90 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {avgCompetitiveness.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}