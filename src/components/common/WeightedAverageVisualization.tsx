/**
 * 가중평균 계산 시각화 컴포넌트
 * 가중평균 계산 과정을 투명하게 표시
 */

'use client'

import React, { useState } from 'react'
import { WeightedAverageResult } from '@/types/adjustmentMatrix'
import { UI_CONFIG, UNITS } from '@/config/constants'

interface WeightedAverageVisualizationProps {
  result: WeightedAverageResult
  title?: string
  showFullDetails?: boolean
}

export function WeightedAverageVisualization({
  result,
  title = '가중평균 계산 상세',
  showFullDetails = false
}: WeightedAverageVisualizationProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [sortBy, setSortBy] = useState<'contribution' | 'count' | 'rate'>('contribution')
  const [filterBand, setFilterBand] = useState<string>('all')
  const [filterLevel, setFilterLevel] = useState<string>('all')
  
  // 고유한 Band와 Level 추출
  const uniqueBands = [...new Set(result.details.map(d => d.band))]
  const uniqueLevels = [...new Set(result.details.map(d => d.level))]
  
  // 필터링된 상세 데이터
  let filteredDetails = result.details.filter(d => {
    if (filterBand !== 'all' && d.band !== filterBand) return false
    if (filterLevel !== 'all' && d.level !== filterLevel) return false
    return true
  })
  
  // 정렬
  filteredDetails.sort((a, b) => {
    switch (sortBy) {
      case 'contribution':
        return b.contribution - a.contribution
      case 'count':
        return b.employeeCount - a.employeeCount
      case 'rate':
        return (b.rates.baseUp + b.rates.merit) - (a.rates.baseUp + a.rates.merit)
      default:
        return 0
    }
  })
  
  // 상위 N개만 표시
  const displayDetails = showFullDetails ? filteredDetails : filteredDetails.slice(0, 10)
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-indigo-100 text-sm mt-1">
              전체 {result.summary.totalEmployees.toLocaleString()}명 ·
              평균 연봉 {(result.summary.averageSalary / UNITS.MAN_WON).toFixed(0)}만원
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
          >
            {isExpanded ? '접기 ▲' : '펼치기 ▼'}
          </button>
        </div>
      </div>
      
      {/* 요약 */}
      <div className="px-6 py-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {result.totalAverage.baseUp.toFixed(2)}%
            </div>
            <div className="text-sm text-gray-600">Base-up 평균</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {result.totalAverage.merit.toFixed(2)}%
            </div>
            <div className="text-sm text-gray-600">Merit 평균</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {result.totalAverage.additional.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">추가 평균</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {result.summary.effectiveRate.toFixed(2)}%
            </div>
            <div className="text-sm text-gray-600">총 인상률</div>
          </div>
        </div>
      </div>
      
      {/* 상세 내용 (확장 시) */}
      {isExpanded && (
        <div className="px-6 py-4 border-t">
          {/* 필터 및 정렬 */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <select
                value={filterBand}
                onChange={(e) => setFilterBand(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="all">모든 직군</option>
                {uniqueBands.map(band => (
                  <option key={band} value={band}>{band}</option>
                ))}
              </select>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="all">모든 레벨</option>
                {uniqueLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('contribution')}
                className={`px-3 py-1 text-sm rounded ${
                  sortBy === 'contribution' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                기여도순
              </button>
              <button
                onClick={() => setSortBy('count')}
                className={`px-3 py-1 text-sm rounded ${
                  sortBy === 'count' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                인원순
              </button>
              <button
                onClick={() => setSortBy('rate')}
                className={`px-3 py-1 text-sm rounded ${
                  sortBy === 'rate' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                인상률순
              </button>
            </div>
          </div>
          
          {/* 가중평균 계산 표 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">
                    그룹
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">
                    인원
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">
                    평균연봉
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">
                    Base-up
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">
                    Merit
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">
                    총인상률
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">
                    가중치
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">
                    기여도
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayDetails.map((detail, index) => {
                  const totalRate = detail.rates.baseUp + detail.rates.merit
                  const gradeColor = UI_CONFIG.GRADE_COLORS[
                    detail.grade as keyof typeof UI_CONFIG.GRADE_COLORS
                  ]
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {detail.band} × {detail.level}
                          </span>
                          <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${
                            gradeColor?.bg || 'bg-gray-100'
                          } ${
                            gradeColor?.text || 'text-gray-700'
                          }`}>
                            {detail.grade}
                          </span>
                          {detail.payZone && (
                            <span className="text-xs text-gray-500">
                              Zone{detail.payZone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {detail.employeeCount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {(detail.averageSalary / UNITS.MAN_WON).toFixed(0)}만원
                      </td>
                      <td className="px-3 py-2 text-center">
                        {detail.rates.baseUp.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 text-center">
                        {detail.rates.merit.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 text-center font-semibold">
                        <span className={`${
                          totalRate > 5 ? 'text-red-600' :
                          totalRate > 3 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {totalRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {(detail.weight / result.summary.totalSalary * 100).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="relative">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${detail.contribution}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 mt-0.5">
                            {detail.contribution.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* 더 보기 */}
          {!showFullDetails && filteredDetails.length > 10 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                총 {filteredDetails.length}건 중 상위 10건만 표시
              </p>
            </div>
          )}
          
          {/* 계산 수식 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">가중평균 계산 수식</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <div>
                가중평균 = Σ([각 그룹의 인상률] × [각 그룹의 총 연봉]) / [전체 총 연봉]
              </div>
              <div className="mt-2 font-mono text-xs bg-white p-2 rounded">
                Base-up = {result.details.slice(0, 3).map(d => 
                  `(${d.rates.baseUp.toFixed(1)}% × ${(d.weight / 100000000).toFixed(1)}억)`
                ).join(' + ')} ... / {(result.summary.totalSalary / 100000000).toFixed(0)}억
                = {result.totalAverage.baseUp.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}