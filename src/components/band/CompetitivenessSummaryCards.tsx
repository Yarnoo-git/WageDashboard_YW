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

interface CompetitivenessSummaryCardsProps {
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
  viewMode?: 'AS-IS' | 'TO-BE'
}

export function CompetitivenessSummaryCards({
  bands,
  bandAdjustments,
  levelRates,
  viewMode = 'TO-BE'
}: CompetitivenessSummaryCardsProps) {
  
  // TO-BE 경쟁력 계산 함수
  const calculateToBECompetitiveness = (band: BandData, level: any) => {
    const adjustment = bandAdjustments[band.name] || { baseUpAdjustment: 0, meritAdjustment: 0 }
    const levelRate = levelRates?.[level.level]
    
    // 최종 인상률 계산 (대시보드 기준 + 직군 조정)
    const totalRaiseRate = levelRate 
      ? ((levelRate.baseUp + adjustment.baseUpAdjustment) / 100 + 
         (levelRate.merit + adjustment.meritAdjustment) / 100)
      : ((adjustment.baseUpAdjustment + adjustment.meritAdjustment) / 100)
    
    if (!level.meanBasePay && !level.company?.median) return level.sblIndex
    
    // 조정된 급여 계산
    const baseSalary = level.company?.median || level.meanBasePay
    const adjustedSalary = baseSalary * (1 + totalRaiseRate)
    
    // 새로운 경쟁력 계산
    const competitorSalary = level.competitor?.median || level.caIndex
    if (competitorSalary > 0) {
      return Math.round((adjustedSalary / competitorSalary) * 100)
    }
    return level.sblIndex
  }
  
  // 요약 데이터 계산
  const summary = useMemo(() => {
    let totalUnder = 0
    let totalFit = 0
    let totalOver = 0
    const underBands: { [key: string]: string[] } = {}
    const fitBands: { [key: string]: string[] } = {}
    const overBands: { [key: string]: string[] } = {}
    
    bands.forEach(band => {
      band.levels.forEach(level => {
        if (level.headcount > 0) {
          const value = viewMode === 'TO-BE'
            ? calculateToBECompetitiveness(band, level)
            : level.sblIndex
          
          if (value < 95) {
            totalUnder += level.headcount
            if (!underBands[band.name]) underBands[band.name] = []
            underBands[band.name]!.push(level.level)
          } else if (value <= 105) {
            totalFit += level.headcount
            if (!fitBands[band.name]) fitBands[band.name] = []
            fitBands[band.name]!.push(level.level)
          } else {
            totalOver += level.headcount
            if (!overBands[band.name]) overBands[band.name] = []
            overBands[band.name]!.push(level.level)
          }
        }
      })
    })
    
    return { 
      totalUnder, 
      totalFit, 
      totalOver,
      underBands,
      fitBands,
      overBands
    }
  }, [bands, bandAdjustments, levelRates, viewMode])
  
  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* 경쟁력 부족 */}
      <div className="bg-red-50 rounded-lg p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-red-900">경쟁력 부족 (&lt;95%)</h4>
          <span className="text-lg font-bold text-red-600">{summary.totalUnder}명</span>
        </div>
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {Object.entries(summary.underBands).map(([bandName, levels]) => (
            <div key={bandName} className="text-sm text-red-700">
              <span className="font-semibold">{bandName}:</span> {levels.join(', ')}
            </div>
          ))}
          {Object.keys(summary.underBands).length === 0 && (
            <div className="text-sm text-gray-500">해당 없음</div>
          )}
        </div>
      </div>
      
      {/* 적정 */}
      <div className="bg-green-50 rounded-lg p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-green-900">적정 (95-105%)</h4>
          <span className="text-lg font-bold text-green-600">{summary.totalFit}명</span>
        </div>
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {Object.entries(summary.fitBands).map(([bandName, levels]) => (
            <div key={bandName} className="text-sm text-green-700">
              <span className="font-semibold">{bandName}:</span> {levels.join(', ')}
            </div>
          ))}
          {Object.keys(summary.fitBands).length === 0 && (
            <div className="text-sm text-gray-500">해당 없음</div>
          )}
        </div>
      </div>
      
      {/* 경쟁력 우위 */}
      <div className="bg-blue-50 rounded-lg p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-blue-900">경쟁력 우위 (&gt;105%)</h4>
          <span className="text-lg font-bold text-blue-600">{summary.totalOver}명</span>
        </div>
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {Object.entries(summary.overBands).map(([bandName, levels]) => (
            <div key={bandName} className="text-sm text-blue-700">
              <span className="font-semibold">{bandName}:</span> {levels.join(', ')}
            </div>
          ))}
          {Object.keys(summary.overBands).length === 0 && (
            <div className="text-sm text-gray-500">해당 없음</div>
          )}
        </div>
      </div>
    </div>
  )
}