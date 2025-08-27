/**
 * CompetitivenessView - 경쟁력 분석 뷰 컴포넌트
 * 직군별 급여 경쟁력 히트맵 및 분석 정보 표시
 */

'use client'

import React from 'react'

interface BandCompetitiveness {
  bandId: string
  bandName: string
  levels: {
    level: string
    headcount: number
    competitiveness: number
  }[]
  avgCompetitiveness: number
}

interface CompetitivenessViewProps {
  bands: BandCompetitiveness[]
  overallCompetitiveness: number
}

export function CompetitivenessView({ 
  bands, 
  overallCompetitiveness 
}: CompetitivenessViewProps) {
  // 경쟁력 색상 결정 함수
  const getCompetitivenessColor = (value: number) => {
    if (value >= 110) return 'bg-green-500'
    if (value >= 100) return 'bg-green-400'
    if (value >= 95) return 'bg-yellow-400'
    if (value >= 90) return 'bg-yellow-500'
    if (value >= 85) return 'bg-orange-400'
    if (value >= 80) return 'bg-orange-500'
    return 'bg-red-500'
  }
  
  const getTextColor = (value: number) => {
    if (value >= 95) return 'text-white'
    return 'text-gray-900'
  }
  
  // 전체 레벨 추출 (중복 제거)
  const allLevels = Array.from(
    new Set(bands.flatMap(band => band.levels.map(l => l.level)))
  ).sort((a, b) => {
    const order = ['A', 'SA', 'M', 'SM', 'PL', 'PM']
    return order.indexOf(b) - order.indexOf(a)
  })
  
  return (
    <div className="space-y-6">
      {/* 전체 경쟁력 요약 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">경쟁력 분석</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">전체 경쟁력 지수:</span>
            <span className={`text-2xl font-bold ${
              overallCompetitiveness >= 110 ? 'text-green-600' :
              overallCompetitiveness >= 90 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {overallCompetitiveness.toFixed(1)}%
            </span>
          </div>
        </div>
        
        {/* 경쟁력 지표 설명 */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">110% 이상 - 매우 우수</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
            <span className="text-sm text-gray-600">90-110% - 적정</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">90% 미만 - 개선 필요</span>
          </div>
        </div>
      </div>
      
      {/* 히트맵 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">직군별 경쟁력 히트맵</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">직군</th>
                {allLevels.map(level => (
                  <th key={level} className="text-center py-2 px-3 text-sm font-medium text-gray-700">
                    {level}
                  </th>
                ))}
                <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">평균</th>
              </tr>
            </thead>
            <tbody>
              {bands.map(band => (
                <tr key={band.bandId}>
                  <td className="py-2 px-3 font-medium text-gray-900">{band.bandName}</td>
                  {allLevels.map(level => {
                    const levelData = band.levels.find(l => l.level === level)
                    if (!levelData || levelData.headcount === 0) {
                      return (
                        <td key={level} className="py-2 px-3">
                          <div className="w-full h-10 bg-gray-100 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-400">-</span>
                          </div>
                        </td>
                      )
                    }
                    const color = getCompetitivenessColor(levelData.competitiveness)
                    const textColor = getTextColor(levelData.competitiveness)
                    return (
                      <td key={level} className="py-2 px-3">
                        <div className={`w-full h-10 ${color} rounded flex items-center justify-center transition-all hover:scale-105 cursor-pointer`}>
                          <span className={`text-xs font-medium ${textColor}`}>
                            {levelData.competitiveness.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    )
                  })}
                  <td className="py-2 px-3">
                    <div className={`w-full h-10 ${
                      getCompetitivenessColor(band.avgCompetitiveness)
                    } rounded flex items-center justify-center font-bold`}>
                      <span className={getTextColor(band.avgCompetitiveness)}>
                        {band.avgCompetitiveness.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 개선 우선순위 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">개선 우선순위</h3>
        <div className="space-y-3">
          {bands
            .filter(band => band.avgCompetitiveness < 95)
            .sort((a, b) => a.avgCompetitiveness - b.avgCompetitiveness)
            .slice(0, 5)
            .map((band, index) => (
              <div key={band.bandId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">{band.bandName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    현재 경쟁력: <span className="font-bold text-red-600">{band.avgCompetitiveness.toFixed(1)}%</span>
                  </span>
                  <span className="text-sm text-gray-600">
                    개선 필요: <span className="font-bold">{(95 - band.avgCompetitiveness).toFixed(1)}%p</span>
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}