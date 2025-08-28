'use client'

import React, { useState, useMemo } from 'react'
import { useWageContextNew } from '@/context/WageContextNew'

interface BandData {
  id: string
  name: string
  levels: Array<{
    level: string
    headcount: number
    meanBasePay: number
    sblIndex: number
    caIndex: number
  }>
}

interface Props {
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

export function PayBandCompetitivenessHeatmapCards({ 
  bands, 
  bandAdjustments,
  levelRates 
}: Props) {
  const context = useWageContextNew()
  const contextBaseUp = context.computed.weightedAverage.totalAverage?.baseUp || 0
  const contextMerit = context.computed.weightedAverage.totalAverage?.merit || 0
  const initialBaseUp = contextBaseUp || 3.2
  const initialMerit = contextMerit || 2.5
  const [viewMode, setViewMode] = useState<'AS-IS' | 'TO-BE'>('TO-BE')
  
  // TO-BE 경쟁력 계산 함수 (원본과 동일)
  const calculateToBECompetitiveness = (band: BandData, level: any) => {
    let totalRate = 0
    
    // 1. 우선순위: 대시보드에서 설정한 직급별 인상률 사용
    if (levelRates && levelRates[level.level]) {
      const levelRate = levelRates[level.level]
      if (levelRate) {
        totalRate = levelRate.baseUp / 100 + levelRate.merit / 100
      }
      
      // 2. Pay Band에서 조정한 값이 있으면 추가 적용
      const rate = bandAdjustments[band.name]
      if (rate) {
        totalRate += (rate.baseUpAdjustment || 0) / 100 + (rate.meritAdjustment || 0) / 100
      }
    } 
    // 3. 차선책: 기본값 사용
    else {
      totalRate = (initialBaseUp / 100) + (initialMerit / 100)
    }
    
    if (!level.meanBasePay) return level.sblIndex
    
    // 조정된 급여 계산
    const adjustedSalary = level.meanBasePay * (1 + totalRate)
    
    // 새로운 경쟁력 계산 (조정된 급여 / C사 급여 * 100)
    if (level.caIndex > 0) {
      return Math.round((adjustedSalary / level.caIndex) * 100)
    }
    return level.sblIndex
  }
  
  // 요약 통계 계산 (원본과 동일)
  const summary = useMemo(() => {
    let totalUnder = 0
    let totalFit = 0
    let totalOver = 0
    
    bands.forEach(band => {
      band.levels.forEach(level => {
        const value = viewMode === 'TO-BE' 
          ? calculateToBECompetitiveness(band, level)
          : level.sblIndex  // AS-IS는 원본 경쟁력 사용
        if (level.headcount > 0) {
          if (value < 95) {
            totalUnder += level.headcount
          } else if (value >= 95 && value <= 105) {
            totalFit += level.headcount
          } else {
            totalOver += level.headcount
          }
        }
      })
    })
    
    return { totalUnder, totalFit, totalOver }
  }, [bands, bandAdjustments, levelRates, viewMode])
  
  return (
    <div className="flex flex-col h-full">
      {/* 헤더와 토글 버튼 */}
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-gray-900">경쟁력 현황</h4>
        {/* AS-IS / TO-BE 토글 버튼 - 우측 */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('AS-IS')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'AS-IS'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            AS-IS
          </button>
          <button
            onClick={() => setViewMode('TO-BE')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'TO-BE'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            TO-BE
          </button>
        </div>
      </div>
      
      <div className="space-y-4 flex flex-col flex-1">
      {/* 경쟁력 부족 - 원본과 완전 동일 */}
      <div className="bg-red-50 rounded-lg p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-red-900">경쟁력 부족 (&lt;95%)</h4>
          <span className="text-lg font-bold text-red-600">{summary.totalUnder}명</span>
        </div>
        <div className="space-y-1.5">
          {bands.map(band => {
            const underLevels = band.levels
              .filter(level => {
                const value = viewMode === 'TO-BE'
                  ? calculateToBECompetitiveness(band, level)
                  : level.sblIndex
                return level.headcount > 0 && value < 95
              })
              .map(level => level.level)
            
            if (underLevels.length === 0) return null
            
            return (
              <div key={band.id} className="text-sm text-red-700">
                <span className="font-semibold">{band.name}:</span> {underLevels.join(', ')}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* 적정 - 원본과 완전 동일 */}
      <div className="bg-green-50 rounded-lg p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-green-900">적정 (95-105%)</h4>
          <span className="text-lg font-bold text-green-600">{summary.totalFit}명</span>
        </div>
        <div className="space-y-1.5">
          {bands.map(band => {
            const fitLevels = band.levels
              .filter(level => {
                const value = viewMode === 'TO-BE'
                  ? calculateToBECompetitiveness(band, level)
                  : level.sblIndex
                return level.headcount > 0 && value >= 95 && value <= 105
              })
              .map(level => level.level)
            
            if (fitLevels.length === 0) return null
            
            return (
              <div key={band.id} className="text-sm text-green-700">
                <span className="font-semibold">{band.name}:</span> {fitLevels.join(', ')}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* 경쟁력 우위 - 원본과 완전 동일 */}
      <div className="bg-blue-50 rounded-lg p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-blue-900">경쟁력 우위 (&gt;105%)</h4>
          <span className="text-lg font-bold text-blue-600">{summary.totalOver}명</span>
        </div>
        <div className="space-y-1.5">
          {bands.map(band => {
            const overLevels = band.levels
              .filter(level => {
                const value = viewMode === 'TO-BE'
                  ? calculateToBECompetitiveness(band, level)
                  : level.sblIndex
                return level.headcount > 0 && value > 105
              })
              .map(level => level.level)
            
            if (overLevels.length === 0) return null
            
            return (
              <div key={band.id} className="text-sm text-blue-700">
                <span className="font-semibold">{band.name}:</span> {overLevels.join(', ')}
              </div>
            )
          })}
        </div>
      </div>
      </div>
    </div>
  )
}