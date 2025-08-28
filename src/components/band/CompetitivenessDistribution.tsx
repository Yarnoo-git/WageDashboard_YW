'use client'

import React, { useMemo } from 'react'

interface BandData {
  id: string
  name: string
  levels: Array<{
    level: string
    headcount: number
    meanBasePay: number
    company: {
      median: number
    }
    competitor: {
      median: number
    }
  }>
}

interface CompetitivenessDistributionProps {
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

export function CompetitivenessDistribution({
  bands,
  bandAdjustments,
  levelRates
}: CompetitivenessDistributionProps) {
  // 각 직군별 경쟁력 계산
  const competitivenessData = useMemo(() => {
    const levelNames = ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4']
    
    const result: {
      [level: string]: {
        insufficient: number // 부족 (< 95%)
        appropriate: number  // 적정 (95-105%)
        superior: number     // 우위 (> 105%)
      }
    } = {}
    
    // 각 레벨별로 집계
    levelNames.forEach(levelName => {
      let insufficient = 0
      let appropriate = 0
      let superior = 0
      
      // 각 밴드별로 경쟁력 계산
      bands.forEach(band => {
        const levelData = band.levels.find(l => l.level === levelName)
        if (!levelData || levelData.headcount === 0) return
        
        const adjustment = bandAdjustments[band.name] || { baseUpAdjustment: 0, meritAdjustment: 0 }
        const levelRate = levelRates?.[levelName]
        
        // 최종 인상률 계산 (대시보드 기준 + 직군 조정)
        const totalRaiseRate = levelRate 
          ? ((levelRate.baseUp + adjustment.baseUpAdjustment) / 100 + 
             (levelRate.merit + adjustment.meritAdjustment) / 100)
          : ((adjustment.baseUpAdjustment + adjustment.meritAdjustment) / 100)
        
        // 조정 후 SBL 중위값
        const adjustedSblMedian = levelData.company.median * (1 + totalRaiseRate)
        
        // CA 대비 경쟁력 계산
        const competitiveness = levelData.competitor.median > 0 
          ? (adjustedSblMedian / levelData.competitor.median) * 100
          : 0
        
        // 카테고리 분류
        if (competitiveness < 95) {
          insufficient++
        } else if (competitiveness <= 105) {
          appropriate++
        } else {
          superior++
        }
      })
      
      result[levelName] = { insufficient, appropriate, superior }
    })
    
    return result
  }, [bands, bandAdjustments, levelRates])
  
  // 전체 합계 계산
  const totalCounts = useMemo(() => {
    const total = { insufficient: 0, appropriate: 0, superior: 0 }
    Object.values(competitivenessData).forEach(level => {
      total.insufficient += level.insufficient
      total.appropriate += level.appropriate
      total.superior += level.superior
    })
    return total
  }, [competitivenessData])
  
  const totalBands = totalCounts.insufficient + totalCounts.appropriate + totalCounts.superior
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">To-be 경쟁력 분포</h4>
      
      {/* 전체 요약 */}
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-red-700">부족</span>
              <span className="text-xs text-red-600">{'< 95%'}</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {totalCounts.insufficient}
              <span className="text-sm font-normal text-gray-600 ml-1">
                ({totalBands > 0 ? Math.round((totalCounts.insufficient / totalBands) * 100) : 0}%)
              </span>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-yellow-700">적정</span>
              <span className="text-xs text-yellow-600">95-105%</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {totalCounts.appropriate}
              <span className="text-sm font-normal text-gray-600 ml-1">
                ({totalBands > 0 ? Math.round((totalCounts.appropriate / totalBands) * 100) : 0}%)
              </span>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-green-700">우위</span>
              <span className="text-xs text-green-600">{'> 105%'}</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {totalCounts.superior}
              <span className="text-sm font-normal text-gray-600 ml-1">
                ({totalBands > 0 ? Math.round((totalCounts.superior / totalBands) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 직급별 상세 분포 */}
      <div className="space-y-3">
        <h5 className="text-sm font-semibold text-gray-700">직급별 분포</h5>
        {['Lv.4', 'Lv.3', 'Lv.2', 'Lv.1'].map(level => {
          const data = competitivenessData[level]
          if (!data) return null
          const levelTotal = data.insufficient + data.appropriate + data.superior
          
          return (
            <div key={level} className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{level}</span>
                <span className="text-xs text-gray-500">{levelTotal}개 직군</span>
              </div>
              
              {/* 시각적 바 */}
              <div className="flex h-6 rounded-lg overflow-hidden bg-gray-100">
                {data.insufficient > 0 && (
                  <div 
                    className="bg-red-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${levelTotal > 0 ? (data.insufficient / levelTotal) * 100 : 0}%` }}
                  >
                    {data.insufficient}
                  </div>
                )}
                {data.appropriate > 0 && (
                  <div 
                    className="bg-yellow-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${levelTotal > 0 ? (data.appropriate / levelTotal) * 100 : 0}%` }}
                  >
                    {data.appropriate}
                  </div>
                )}
                {data.superior > 0 && (
                  <div 
                    className="bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${levelTotal > 0 ? (data.superior / levelTotal) * 100 : 0}%` }}
                  >
                    {data.superior}
                  </div>
                )}
                {levelTotal === 0 && (
                  <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
                    데이터 없음
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* 범례 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
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