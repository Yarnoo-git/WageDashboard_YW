'use client'

import React, { useMemo } from 'react'

interface BandData {
  id: string
  name: string
  levels: Array<{
    level: string
    headcount: number
    meanBasePay: number
    sblIndex: number
    caIndex: number
    company: {
      median: number
    }
    competitor: {
      median: number
    }
  }>
}

interface CompetitivenessComparisonProps {
  bands: BandData[]
  bandAdjustments: {
    [bandName: string]: {
      baseUpAdjustment: number
      meritAdjustment: number
    }
  }
  levelRates?: {
    [level: string]: {
      baseUp: number
      merit: number
    }
  }
}

export function CompetitivenessComparison({
  bands,
  bandAdjustments,
  levelRates
}: CompetitivenessComparisonProps) {
  
  // As-is와 To-be 경쟁력 데이터 계산
  const competitivenessData = useMemo(() => {
    const levelNames = ['Lv.4', 'Lv.3', 'Lv.2', 'Lv.1']
    
    const result = levelNames.map(levelName => {
      // 각 직군의 해당 레벨 데이터 수집
      const levelDataList = bands.map(band => {
        const levelData = band.levels.find(l => l.level === levelName)
        if (!levelData || levelData.headcount === 0) return null
        
        const adjustment = bandAdjustments[band.name] || { baseUpAdjustment: 0, meritAdjustment: 0 }
        const levelRate = levelRates?.[levelName]
        
        // 최종 인상률 계산 (대시보드 기준 + 직군 조정)
        const totalRaiseRate = levelRate 
          ? ((levelRate.baseUp + adjustment.baseUpAdjustment) / 100 + 
             (levelRate.merit + adjustment.meritAdjustment) / 100)
          : ((adjustment.baseUpAdjustment + adjustment.meritAdjustment) / 100)
        
        return {
          bandName: band.name,
          headcount: levelData.headcount,
          asIsSalary: levelData.company.median,
          toBeSalary: levelData.company.median * (1 + totalRaiseRate),
          competitorSalary: levelData.competitor.median,
          asIsCompetitiveness: levelData.competitor.median > 0 
            ? (levelData.company.median / levelData.competitor.median) * 100
            : 100,
          toBeCompetitiveness: levelData.competitor.median > 0 
            ? (levelData.company.median * (1 + totalRaiseRate) / levelData.competitor.median) * 100
            : 100
        }
      }).filter(d => d !== null)
      
      // 가중평균 계산
      const totalHeadcount = levelDataList.reduce((sum, d) => sum + d.headcount, 0)
      if (totalHeadcount === 0) {
        return {
          level: levelName,
          asIs: 100,
          toBe: 100,
          change: 0
        }
      }
      
      const weightedAsIs = levelDataList.reduce((sum, d) => 
        sum + (d.asIsCompetitiveness * d.headcount), 0) / totalHeadcount
      const weightedToBe = levelDataList.reduce((sum, d) => 
        sum + (d.toBeCompetitiveness * d.headcount), 0) / totalHeadcount
      
      return {
        level: levelName,
        asIs: Math.round(weightedAsIs),
        toBe: Math.round(weightedToBe),
        change: Math.round(weightedToBe - weightedAsIs)
      }
    })
    
    return result
  }, [bands, bandAdjustments, levelRates])
  
  // 색상 결정 함수
  const getCompetitivenessColor = (value: number) => {
    if (value < 95) return 'text-red-600'
    if (value <= 105) return 'text-yellow-600'
    return 'text-green-600'
  }
  
  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-blue-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }
  
  // 전체 평균 계산
  const overallData = useMemo(() => {
    const validData = competitivenessData.filter(d => d.asIs > 0)
    if (validData.length === 0) return { asIs: 100, toBe: 100, change: 0 }
    
    const avgAsIs = validData.reduce((sum, d) => sum + d.asIs, 0) / validData.length
    const avgToBe = validData.reduce((sum, d) => sum + d.toBe, 0) / validData.length
    
    return {
      asIs: Math.round(avgAsIs),
      toBe: Math.round(avgToBe),
      change: Math.round(avgToBe - avgAsIs)
    }
  }, [competitivenessData])
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">경쟁력 변화 분석</h4>
      
      {/* 전체 요약 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">AS-IS</div>
            <div className={`text-2xl font-bold ${getCompetitivenessColor(overallData.asIs)}`}>
              {overallData.asIs}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">TO-BE</div>
            <div className={`text-2xl font-bold ${getCompetitivenessColor(overallData.toBe)}`}>
              {overallData.toBe}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">변화</div>
            <div className={`text-2xl font-bold ${getChangeColor(overallData.change)}`}>
              {overallData.change > 0 ? '+' : ''}{overallData.change}%p
            </div>
          </div>
        </div>
      </div>
      
      {/* 직급별 비교 차트 */}
      <div className="space-y-4">
        <h5 className="text-sm font-semibold text-gray-700">직급별 경쟁력 현황</h5>
        
        {competitivenessData.map(levelData => {
          const maxValue = Math.max(120, levelData.asIs, levelData.toBe)
          const asIsWidth = (levelData.asIs / maxValue) * 100
          const toBeWidth = (levelData.toBe / maxValue) * 100
          
          return (
            <div key={levelData.level} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 w-12">{levelData.level}</span>
                <div className="flex-1 mx-3">
                  {/* AS-IS 바 */}
                  <div className="mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-12">AS-IS</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                        <div 
                          className={`h-6 rounded-full flex items-center justify-end pr-2 ${
                            levelData.asIs < 95 ? 'bg-red-400' :
                            levelData.asIs <= 105 ? 'bg-yellow-400' :
                            'bg-green-400'
                          }`}
                          style={{ width: `${asIsWidth}%` }}
                        >
                          <span className="text-xs font-medium text-white">
                            {levelData.asIs}%
                          </span>
                        </div>
                        {/* 95% 및 105% 기준선 */}
                        <div className="absolute top-0 h-6 w-0.5 bg-gray-400" style={{ left: `${(95 / maxValue) * 100}%` }}></div>
                        <div className="absolute top-0 h-6 w-0.5 bg-gray-400" style={{ left: `${(105 / maxValue) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* TO-BE 바 */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-12">TO-BE</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                        <div 
                          className={`h-6 rounded-full flex items-center justify-end pr-2 ${
                            levelData.toBe < 95 ? 'bg-red-500' :
                            levelData.toBe <= 105 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${toBeWidth}%` }}
                        >
                          <span className="text-xs font-medium text-white">
                            {levelData.toBe}%
                          </span>
                        </div>
                        {/* 95% 및 105% 기준선 */}
                        <div className="absolute top-0 h-6 w-0.5 bg-gray-400" style={{ left: `${(95 / maxValue) * 100}%` }}></div>
                        <div className="absolute top-0 h-6 w-0.5 bg-gray-400" style={{ left: `${(105 / maxValue) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-medium w-16 text-right ${getChangeColor(levelData.change)}`}>
                  {levelData.change > 0 ? '+' : ''}{levelData.change}%p
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* 범례 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-around text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">부족 (&lt;95%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-gray-600">적정 (95-105%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">우위 (&gt;105%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}