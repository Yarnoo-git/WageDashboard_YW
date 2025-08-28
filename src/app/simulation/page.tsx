/**
 * 시뮬레이션 페이지
 * 원본 UI 구조 복원 + 새로운 Matrix 시스템 통합
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWageContextNew } from '@/context/WageContextNew'
// useWageContextAdapter removed - using WageContextNew directly
import { useBandData } from './hooks/useBandData'
import { ApplyResetBar } from '@/components/common/ApplyResetBar'
import { FixedSummaryBar } from '@/components/simulation/FixedSummaryBar'
import { IndustryComparisonSection } from '@/components/dashboard/IndustryComparisonSection'
import { PayBandCard } from '@/components/band/PayBandCard'
import { PayBandCompetitivenessHeatmap } from '@/components/analytics/PayBandCompetitivenessHeatmap'
import { ViewModeSelector } from './components/ViewModeSelector'
import { PracticalRecommendation } from '@/components/simulation/PracticalRecommendation'
import { formatKoreanCurrency } from '@/lib/utils'

type ViewMode = 'adjustment' | 'all' | 'competitiveness' | 'band'

function SimulationContent() {
  const router = useRouter()
  const newContext = useWageContextNew()
  // Using newContext directly instead of adapter
  const adapter = {
    baseUpRate: newContext.computed.weightedAverage.totalAverage?.baseUp || 0,
    meritRate: newContext.computed.weightedAverage.totalAverage?.merit || 0,
    levelRates: {},  // Level rates from matrix cells
    levelTotalRates: {},
    weightedAverageRate: (newContext.computed.weightedAverage.totalAverage?.baseUp || 0) + (newContext.computed.weightedAverage.totalAverage?.merit || 0),
    levelStatistics: [],  // Level statistics from computed data
    competitorData: newContext.originalData.competitorData,
    competitorIncreaseRate: 0  // Competitor increase rate
  }
  const { bandsData, totalBandData } = useBandData()
  
  const [viewMode, setViewMode] = useState<ViewMode>('adjustment')
  const [selectedBand, setSelectedBand] = useState<string | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ band: string; level: string } | null>(null)
  const [bandAdjustments, setBandAdjustments] = useState<Record<string, { baseUpAdjustment: number; meritAdjustment: number }>>({})
  
  // 데이터 없으면 홈으로
  useEffect(() => {
    if (!newContext.isLoading && newContext.originalData.employees.length === 0) {
      router.push('/home')
    }
  }, [newContext.isLoading, newContext.originalData.employees, router])
  
  if (newContext.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }
  
  if (!newContext.adjustment.matrix) {
    return null
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Fixed Summary Bar - 인상률 조정 모드일 때만 표시 */}
      {viewMode === 'adjustment' && (
        <FixedSummaryBar
          totalEmployees={newContext.computed.statistics.totalEmployees}
          weightedAverage={newContext.computed.weightedAverage}
          budgetUsage={newContext.computed.budgetUsage}
          aiSettings={newContext.originalData.aiSettings}
          pendingWeightedAverage={newContext.computed.pendingWeightedAverage}
          pendingBudgetUsage={newContext.computed.pendingBudgetUsage}
          additionalType={newContext.config.additionalType}
          hasChanges={newContext.hasChanges}
        />
      )}
      
      <main className={`${viewMode === 'adjustment' ? 'pt-20' : 'pt-6'} pb-8`}>
        <div className="flex gap-3">
          {/* 좌측 메뉴 */}
          <ViewModeSelector
            viewMode={viewMode}
            selectedBand={selectedBand}
            bands={newContext.originalData.metadata.bands}
            onViewModeChange={setViewMode}
            onBandSelect={setSelectedBand}
          />
          
          {/* 오른쪽 콘텐츠 영역 */}
          <div className="flex-1 pr-3">
            {/* 헤더 섹션 */}
            <div className="mb-3">
              <h1 className="text-xl font-bold text-gray-900">
                시뮬레이션 센터
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {viewMode === 'adjustment' ? '인상률 조정 및 예산 시뮬레이션' :
                 viewMode === 'all' ? '전체 직군 통합 집계 현황' :
                 viewMode === 'band' ? `${selectedBand} 직군 상세 분석` :
                 '직군별 경쟁력 분석'}
                <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {newContext.computed.statistics.totalEmployees.toLocaleString()}명
                </span>
              </p>
            </div>
            
            {/* 인상률 조정 뷰 */}
            {viewMode === 'adjustment' && (
              <>
                {/* C사 대비 비교 섹션 */}
                <div className="mb-3">
                  <IndustryComparisonSection 
                    baseUpRate={adapter.baseUpRate}
                    meritRate={adapter.meritRate}
                    levelTotalRates={adapter.levelTotalRates}
                    weightedAverageRate={adapter.weightedAverageRate}
                    levelStatistics={adapter.levelStatistics}
                    competitorData={adapter.competitorData}
                    competitorIncreaseRate={adapter.competitorIncreaseRate}
                  />
                </div>
                
                {/* 예산 요약 한 줄 */}
                <div className="bg-white rounded-lg shadow-sm px-3 py-1.5 mb-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-6">
                    <span className="text-gray-600">
                      예산: <span className="font-semibold text-gray-900">{formatKoreanCurrency(newContext.config.budget.available)}</span>
                    </span>
                    <span className="text-gray-600">
                      사용: <span className="font-semibold text-gray-900">{formatKoreanCurrency(newContext.computed.budgetUsage.totalCost)}</span>
                      <span className={`ml-1 font-semibold ${
                        newContext.computed.budgetUsage.usagePercentage > 90 ? 'text-red-600' : 
                        newContext.computed.budgetUsage.usagePercentage > 70 ? 'text-yellow-600' : 'text-blue-600'
                      }`}>
                        ({newContext.computed.budgetUsage.usagePercentage.toFixed(1)}%)
                      </span>
                    </span>
                    <span className="text-gray-600">
                      잔여: <span className="font-semibold text-green-600">{formatKoreanCurrency(newContext.computed.budgetUsage.remaining)}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {newContext.hasChanges && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                        미적용 변경사항
                      </span>
                    )}
                    <button 
                      onClick={() => router.push('/dashboard')}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      예산 설정 →
                    </button>
                  </div>
                </div>
                
                {/* 추가 인상 타입 선택 */}
                <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
                  <div className="flex justify-end items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">추가 인상:</span>
                      <button
                        onClick={() => newContext.actions.setAdditionalType('percentage')}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          newContext.config.additionalType === 'percentage'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        비율(%)
                      </button>
                      <button
                        onClick={() => newContext.actions.setAdditionalType('amount')}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                          newContext.config.additionalType === 'amount'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        정액(만원)
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* 실무 추천안 테이블 */}
                <PracticalRecommendation />
              </>
            )}
            
            {/* 종합 현황 뷰 - 527b284 디자인: 전체 데이터를 PayBandCard로 표시 */}
            {viewMode === 'all' && totalBandData && (() => {
              // 전체 직급별 데이터를 하나의 PayBandCard로 표시
              const levelsForCard = totalBandData.levels.map(level => ({
                level: level.level,
                headcount: level.headcount,
                meanBasePay: level.company.mean,
                baseUpKRW: 0,
                baseUpRate: adapter.levelRates[level.level]?.baseUp || 0,
                sblIndex: 100,
                caIndex: level.competitor.median > 0 
                  ? (level.company.median / level.competitor.median) * 100 
                  : 100,
                company: {
                  median: level.company.median,
                  mean: level.company.mean,
                  values: []
                },
                competitor: {
                  median: level.competitor.median
                }
              }))

              return (
                <PayBandCard
                  bandId="total"
                  bandName="전체"
                  levels={levelsForCard}
                  initialBaseUp={adapter.baseUpRate}
                  initialMerit={adapter.meritRate}
                  levelRates={adapter.levelRates}
                  onRateChange={(bandId, updatedData) => {
                    // 전체 조정값 업데이트
                  }}
                  isReadOnly={true}
                  bands={bandsData.map(band => ({
                    id: band!.bandId,
                    name: band!.bandName,
                    levels: band!.levels.map(level => ({
                      level: level.level,
                      headcount: level.headcount,
                      meanBasePay: level.company.mean,
                      sblIndex: 100,
                      caIndex: level.competitor.median > 0
                        ? (level.company.median / level.competitor.median) * 100
                        : 100
                    }))
                  }))}
                />
              )
            })()}
            
            {/* 직군별 분석 뷰 - 527b284 디자인 유지 */}
            {viewMode === 'band' && selectedBand && (
              <div>
                {bandsData
                  .filter(band => band!.bandName === selectedBand)
                  .map(band => {
                    // PayBandCard용 레벨 데이터 준비
                    const levelsForCard = band!.levels.map(level => ({
                      level: level.level,
                      headcount: level.headcount,
                      meanBasePay: level.company.mean,
                      baseUpKRW: 0, // 계산된 값
                      baseUpRate: adapter.levelRates[level.level]?.baseUp || 0,
                      sblIndex: 100, // 기본값
                      caIndex: level.competitor.median > 0 
                        ? (level.company.median / level.competitor.median) * 100 
                        : 100,
                      company: {
                        median: level.company.median,
                        mean: level.company.mean,
                        values: []
                      },
                      competitor: {
                        median: level.competitor.median
                      }
                    }))

                    return (
                      <PayBandCard
                        key={band!.bandId}
                        bandId={band!.bandId}
                        bandName={band!.bandName}
                        levels={levelsForCard}
                        initialBaseUp={adapter.baseUpRate}
                        initialMerit={adapter.meritRate}
                        levelRates={adapter.levelRates}
                        onRateChange={(bandId, updatedData) => {
                          // 조정값 업데이트는 이미 WageContext에서 처리됨
                        }}
                        isReadOnly={true}  // 직군별 분석에서는 읽기 전용
                      />
                    )
                  })}
              </div>
            )}
            
            {/* 경쟁력 분석 뷰 - 527b284 디자인: PayBandCompetitivenessHeatmap 사용 */}
            {viewMode === 'competitiveness' && (
              <PayBandCompetitivenessHeatmap 
                bands={bandsData.map(band => ({
                  id: band!.bandId,
                  name: band!.bandName,
                  levels: band!.levels.map(level => ({
                    level: level.level,
                    headcount: level.headcount,
                    meanBasePay: level.company.mean,
                    sblIndex: 100,
                    caIndex: level.competitor.median > 0
                      ? (level.company.median / level.competitor.median) * 100
                      : 100
                  }))
                }))}
                bandRates={Object.fromEntries(
                  bandsData.map(band => [
                    band!.bandName,
                    {
                      baseUpAdjustment: bandAdjustments[band!.bandName]?.baseUpAdjustment || 0,
                      meritAdjustment: bandAdjustments[band!.bandName]?.meritAdjustment || 0
                    }
                  ])
                )}
                levelRates={adapter.levelRates}
                onBandRateChange={(bandName, adjustments) => {
                  setBandAdjustments(prev => ({
                    ...prev,
                    [bandName]: adjustments
                  }))
                }}
                aiSettings={newContext.originalData.aiSettings}
                showDifference={true}
                selectedBands={[]}
              />
            )}
          </div>
        </div>
      </main>
      
      {/* Apply/Reset 바 - 인상률 조정 모드일 때만 표시 */}
      {viewMode === 'adjustment' && (
        <ApplyResetBar
          hasChanges={newContext.hasChanges}
          onApply={newContext.actions.applyPendingChanges}
          onReset={newContext.actions.discardPendingChanges}
          canUndo={newContext.canUndo}
          canRedo={newContext.canRedo}
          onUndo={newContext.actions.undo}
          onRedo={newContext.actions.redo}
        />
      )}
    </div>
  )
}


import { WageContextNewProvider } from '@/context/WageContextNew'

export default function SimulationPage() {
  return (
    <WageContextNewProvider>
      <SimulationContent />
    </WageContextNewProvider>
  )
}