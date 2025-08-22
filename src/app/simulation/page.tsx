'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSimulationLogic } from '@/hooks/useSimulationLogic'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'
import { IndustryComparisonSection } from '@/components/dashboard/IndustryComparisonSection'
import { PayBandCard } from '@/components/simulation/PayBandCard'
import { RaiseSliderPanel } from '@/components/simulation/RaiseSliderPanel'
import { PayBandCompetitivenessHeatmap } from '@/components/analytics/PayBandCompetitivenessHeatmap'
import { useBandData } from '@/hooks/useBandData'
import { PerformanceWeightModal } from '@/components/employees/PerformanceWeightModal'
import { RateSummaryCard } from '@/components/simulation/RateSummaryCard'
import { RateInputWithIndicator } from '@/components/simulation/RateChangeIndicator'
import { RateHeatmap } from '@/components/simulation/RateHeatmap'
import { FixedSummaryBar } from '@/components/simulation/FixedSummaryBar'
import { AdjustmentScope } from '@/components/simulation/AdjustmentScope'
import { BandFilter } from '@/components/simulation/BandFilter'
import { ApplyBar } from '@/components/simulation/ApplyBar'
import { AllAdjustment } from '@/components/simulation/AllAdjustment'
import { LevelAdjustment } from '@/components/simulation/LevelAdjustment'
import { PayZoneAdjustment } from '@/components/simulation/PayZoneAdjustment'

export default function SimulationPage() {
  const router = useRouter()
  const { bands: bandsData } = useBandData()
  
  // 먼저 초기 로드 상태를 설정
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  
  const {
    // Context data
    loading,
    dashboardData,
    contextEmployeeData,
    availableBudget,
    welfareBudget,
    contextBaseUpRate,
    contextMeritRate,
    levelRates,
    bandFinalRates,
    payZoneRates,
    performanceWeights,
    
    // Pending states
    pendingLevelRates,
    pendingBandFinalRates,
    pendingPayZoneRates,
    hasPendingChanges,
    pendingChangeCount,
    applyPendingChanges,
    resetPendingChanges,
    
    // Adjustment controls
    adjustmentScope,
    setAdjustmentScope,
    additionalType,
    setAdditionalType,
    
    // Band filter
    selectedBands,
    handleBandToggle,
    handleSelectAllBands,
    handleClearAllBands,
    
    // Local state
    dynamicStructure,
    budgetUsage,
    viewMode,
    setViewMode,
    selectedViewBand,
    setSelectedViewBand,
    isWeightModalOpen,
    setIsWeightModalOpen,
    
    // Handlers
    handleLevelRateChange,
    handleGlobalAdjustment,
    handlePayZoneLevelGradeChange,
    
    // Helper functions
    calculateBandAverage,
    
    // Total employees
    totalEmployees
  } = useSimulationLogic()
  
  // 디버깅을 위한 로그
  useEffect(() => {
    console.log('[SimulationPage] Component mounted')
    console.log('[SimulationPage] contextEmployeeData:', contextEmployeeData)
    console.log('[SimulationPage] loading:', loading)
    console.log('[SimulationPage] totalEmployees:', totalEmployees)
  }, [])
  
  // 초기 로드 타이밍 관리
  useEffect(() => {
    // 3초 대기 후 초기 로드 완료
    const timer = setTimeout(() => {
      setIsInitialLoad(false)
      console.log('[SimulationPage] Initial load timeout complete')
      console.log('[SimulationPage] contextEmployeeData at timeout:', contextEmployeeData)
      console.log('[SimulationPage] totalEmployees at timeout:', totalEmployees)
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [contextEmployeeData, totalEmployees])
  
  // 데이터 체크 및 초기화
  useEffect(() => {
    console.log('[SimulationPage] Data check - isInitialLoad:', isInitialLoad, 'loading:', loading, 'data length:', contextEmployeeData?.length)
    
    if (!isInitialLoad) {
      if (contextEmployeeData && contextEmployeeData.length > 0) {
        console.log('[SimulationPage] Data initialized with', contextEmployeeData.length, 'employees')
        setHasInitialized(true)
      } else if (!loading) {
        // 로딩도 끝났는데 데이터가 없으면 1초 더 기다림
        const checkTimer = setTimeout(() => {
          console.log('[SimulationPage] Final check - contextEmployeeData:', contextEmployeeData)
          if (!contextEmployeeData || contextEmployeeData.length === 0) {
            console.log('[SimulationPage] No data after extended wait, redirecting to home')
            router.push('/home')
          }
        }, 1000)
        
        return () => clearTimeout(checkTimer)
      }
    }
  }, [contextEmployeeData, loading, isInitialLoad, router])
  
  // 로딩 중이거나 초기 로드 중일 때 표시
  if (isInitialLoad || (loading && !hasInitialized)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
          <p className="mt-2 text-sm text-gray-500">
            {contextEmployeeData && contextEmployeeData.length > 0 
              ? `${contextEmployeeData.length}명의 직원 데이터 처리 중...` 
              : '엑셀 데이터 확인 중...'}
          </p>
        </div>
      </div>
    )
  }
  
  // 데이터가 없으면 렌더링하지 않음
  if (!contextEmployeeData || contextEmployeeData.length === 0) {
    return null
  }
  
  // 전체 인상률 계산 (가중평균)
  const calculateWeightedAverageRates = () => {
    if (!contextEmployeeData || contextEmployeeData.length === 0) {
      return { baseUp: 0, merit: 0, additional: 0, total: 0 }
    }
    
    let totalBaseUp = 0
    let totalMerit = 0
    let totalAdditional = 0
    let totalCount = 0
    
    // 조정 모드에 따라 다른 인상률 적용
    contextEmployeeData.forEach(emp => {
      const level = emp.level
      const band = emp.bandName
      const payZone = emp.payZone
      
      let baseUp = 0
      let merit = 0
      let additional = 0
      
      if (adjustmentScope === 'payzone' && payZone && emp.performanceGrade) {
        // PayZone별 조정: PayZone-Level-Grade별 인상률 (pending rates 사용)
        const grade = emp.performanceGrade
        if (pendingPayZoneRates[payZone]?.[level]?.[grade]) {
          baseUp = pendingPayZoneRates[payZone][level][grade].baseUp || 0
          merit = pendingPayZoneRates[payZone][level][grade].merit || 0
          additional = pendingPayZoneRates[payZone][level][grade].additional || 0
        }
      } else if (adjustmentScope === 'level') {
        // 레벨별 조정: 레벨별 인상률 (pending rates 사용)
        baseUp = pendingLevelRates[level]?.baseUp || 0
        merit = pendingLevelRates[level]?.merit || 0
        additional = pendingLevelRates[level]?.additional || 0
      } else {
        // 전체 조정: 모든 직원 동일 (pending rates의 평균)
        const levels = Object.keys(pendingLevelRates)
        if (levels.length > 0) {
          baseUp = levels.reduce((sum, l) => sum + (pendingLevelRates[l]?.baseUp || 0), 0) / levels.length
          merit = levels.reduce((sum, l) => sum + (pendingLevelRates[l]?.merit || 0), 0) / levels.length
          additional = levels.reduce((sum, l) => sum + (pendingLevelRates[l]?.additional || 0), 0) / levels.length
        }
      }
      
      totalBaseUp += baseUp
      totalMerit += merit
      totalAdditional += additional
      totalCount++
    })
    
    return {
      baseUp: totalCount > 0 ? totalBaseUp / totalCount : 0,
      merit: totalCount > 0 ? totalMerit / totalCount : 0,
      additional: totalCount > 0 ? totalAdditional / totalCount : 0,
      total: totalCount > 0 ? (totalBaseUp + totalMerit + (additionalType === 'percentage' ? totalAdditional : 0)) / totalCount : 0
    }
  }
  
  const weightedAverageRates = calculateWeightedAverageRates()
  
  // 직급별 통계 계산
  const calculateLevelBreakdown = () => {
    if (!contextEmployeeData) return {}
    
    const breakdown: { [level: string]: { count: number; baseUp: number; merit: number } } = {}
    
    dynamicStructure.levels.forEach(level => {
      const employees = contextEmployeeData.filter(emp => emp.level === level)
      breakdown[level] = {
        count: employees.length,
        baseUp: levelRates[level]?.baseUp || contextBaseUpRate,
        merit: levelRates[level]?.merit || contextMeritRate
      }
    })
    
    return breakdown
  }
  
  const levelBreakdown = calculateLevelBreakdown()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Fixed Summary Bar - 인상률 조정 모드일 때만 표시 */}
      {viewMode === 'adjustment' && (
        <FixedSummaryBar
          totalEmployees={totalEmployees}
          currentBaseUp={weightedAverageRates.baseUp}
          currentMerit={weightedAverageRates.merit}
          currentAdditional={weightedAverageRates.additional}
          additionalType={additionalType}
          aiBaseUp={contextBaseUpRate}
          aiMerit={contextMeritRate}
          totalBudget={availableBudget - welfareBudget}
          usedBudget={budgetUsage.total}
          budgetPercentage={budgetUsage.percentage}
        />
      )}
      
      <main className="pt-20 pb-8">
        <div className="flex gap-6">
          {/* 좌측 메뉴 */}
          <div className="w-80 bg-white rounded-lg shadow-sm h-fit p-4 ml-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">뷰 모드</h2>
            </div>
            <nav className="space-y-2">
              <button
                onClick={() => setViewMode('adjustment')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                  viewMode === 'adjustment'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span className="font-medium">인상률 조정</span>
                </div>
              </button>
              
              <button
                onClick={() => setViewMode('all')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                  viewMode === 'all'
                    ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">종합 현황</span>
                </div>
              </button>
              
              <button
                onClick={() => setViewMode('competitiveness')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                  viewMode === 'competitiveness'
                    ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="font-medium">경쟁력 분석</span>
                </div>
              </button>
              
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2 px-4">직군별 분석</p>
                {dynamicStructure.bands.map(band => (
                  <button
                    key={band}
                    onClick={() => {
                      setViewMode('band')
                      setSelectedViewBand(band)
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'band' && selectedViewBand === band
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="text-sm font-medium">{band}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
          
          {/* 오른쪽 콘텐츠 영역 */}
          <div className="flex-1 pr-6">
            {/* 헤더 섹션 */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                시뮬레이션 센터
              </h1>
              <p className="text-gray-600 mt-2">
                {viewMode === 'adjustment' ? '인상률 조정 및 예산 시뮬레이션' :
                 viewMode === 'all' ? '전체 직군 통합 집계 현황' :
                 viewMode === 'band' ? `${selectedViewBand} 직군 상세 분석` :
                 '직군별 경쟁력 분석'}
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {totalEmployees.toLocaleString()}명
                </span>
              </p>
            </div>
            
            {/* 인상률 조정 모드일 때만 C사 대비 섹션 표시 */}
            {viewMode === 'adjustment' && (
              <div className="mb-6">
                <IndustryComparisonSection 
                  baseUpRate={contextBaseUpRate}
                  meritRate={contextMeritRate}
                  competitorIncreaseRate={dashboardData?.competitorIncreaseRate}
                  competitorData={dashboardData?.competitorData}
                  levelStatistics={dashboardData?.levelStatistics}
                />
              </div>
            )}
            
            {/* 인상률 조정 뷰 */}
            {viewMode === 'adjustment' && (
              <>
                
                {/* 컴팩트한 예산 현황 - 우측 상단에 작게 표시 */}
                <div className="bg-white rounded-lg shadow-sm p-3 mb-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">예산 상세</h3>
                    <button 
                      onClick={() => router.push('/dashboard')}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      설정 →
                    </button>
                  </div>
                  
                </div>
                
                {/* 예산 요약 한 줄 */}
                <div className="bg-white rounded-lg shadow-sm px-4 py-2 mb-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-6">
                    <span className="text-gray-600">
                      예산: <span className="font-semibold text-gray-900">{formatKoreanCurrency(availableBudget, '억원')}</span>
                    </span>
                    <span className="text-gray-600">
                      사용: <span className="font-semibold text-gray-900">{formatKoreanCurrency(budgetUsage.total, '억원')}</span>
                      <span className={`ml-1 font-semibold ${
                        budgetUsage.percentage > 90 ? 'text-red-600' : 
                        budgetUsage.percentage > 70 ? 'text-yellow-600' : 'text-blue-600'
                      }`}>
                        ({budgetUsage.percentage.toFixed(1)}%)
                      </span>
                    </span>
                    <span className="text-gray-600">
                      잔여: <span className="font-semibold text-green-600">{formatKoreanCurrency((availableBudget - welfareBudget - budgetUsage.total), '억', 100000000)}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {pendingChangeCount > 0 && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                        {pendingChangeCount}개 변경사항
                      </span>
                    )}
                  </div>
                </div>
                
                {/* 상단 컨트롤 */}
                <div className="bg-white rounded-lg shadow-sm px-4 py-3 mb-4">
                  <div className="flex items-center justify-between">
                    {/* 조정 범위 탭 */}
                    <div className="flex gap-1">
                      {(['all', 'level', 'payzone'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setAdjustmentScope(s)}
                          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                            adjustmentScope === s
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {s === 'all' ? '전체 조정' : s === 'level' ? '레벨별' : 'Pay Zone별'}
                        </button>
                      ))}
                    </div>
                    
                    {/* 직군 필터 */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">직군:</span>
                      <div className="flex gap-1">
                        {dynamicStructure.bands.map((band) => (
                          <button
                            key={band}
                            onClick={() => handleBandToggle(band)}
                            className={`px-3 py-1 text-xs rounded-full transition-all ${
                              selectedBands.includes(band)
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            {band}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1 border-l pl-3">
                        <button
                          onClick={handleSelectAllBands}
                          className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                        >
                          전체
                        </button>
                        <button
                          onClick={handleClearAllBands}
                          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded"
                        >
                          해제
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 메인 조정 영역 (전체 너비) */}
                <div>
                    {adjustmentScope === 'all' && (
                      <AllAdjustment
                        pendingLevelRates={pendingLevelRates}
                        onRateChange={(field, value) => {
                          // 모든 레벨에 동일한 값 적용
                          dynamicStructure.levels.forEach(level => {
                            handleLevelRateChange(level, field, value)
                          })
                        }}
                        additionalType={additionalType}
                        onAdditionalTypeChange={setAdditionalType}
                      />
                    )}
                    
                    {adjustmentScope === 'level' && (
                      <LevelAdjustment
                        levels={dynamicStructure.levels}
                        pendingLevelRates={pendingLevelRates}
                        onRateChange={handleLevelRateChange}
                        additionalType={additionalType}
                        employeeCounts={
                          dynamicStructure.levels.reduce((acc, level) => {
                            acc[level] = contextEmployeeData.filter(emp => emp.level === level).length
                            return acc
                          }, {} as { [level: string]: number })
                        }
                      />
                    )}
                    
                    {adjustmentScope === 'payzone' && (
                      <PayZoneAdjustment
                        levels={dynamicStructure.levels}
                        payZones={dynamicStructure.payZones}
                        performanceGrades={dynamicStructure.grades}
                        pendingPayZoneRates={pendingPayZoneRates}
                        onRateChange={handlePayZoneLevelGradeChange}
                        additionalType={additionalType}
                        selectedBands={selectedBands}
                        contextEmployeeData={contextEmployeeData}
                        employeeCounts={
                          (() => {
                            const counts: { [key: string]: number } = {}
                            dynamicStructure.levels.forEach(level => {
                              dynamicStructure.payZones.forEach(zone => {
                                const key = `${level}-PZ${zone}`
                                counts[key] = contextEmployeeData.filter(
                                  emp => emp.level === level && emp.payZone === zone &&
                                  (selectedBands.length === 0 || selectedBands.includes(emp.band))
                                ).length
                              })
                            })
                            return counts
                          })()
                        }
                      />
                    )}
                  </div>
              </>
            )}
            
            {/* 전체 직군 현황 뷰 - 종합 현황 (단일 집계 카드) */}
            {viewMode === 'all' && bandsData && bandsData.length > 0 && (() => {
              // 전체 직급별 데이터 집계
              const totalBandData = {
                id: 'total',
                name: '전체',
                levels: ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4'].map(level => {
                  const levelData = bandsData.flatMap(band => 
                    band.levels ? band.levels.filter(l => l && l.level === level) : []
                  ).filter(l => l !== undefined && l !== null)
                  
                  const totalHeadcount = levelData.reduce((sum, l) => sum + (l?.headcount || 0), 0)
                  const totalBasePay = levelData.reduce((sum, l) => sum + ((l?.meanBasePay || 0) * (l?.headcount || 0)), 0)
                  
                  return {
                    level,
                    headcount: totalHeadcount,
                    meanBasePay: totalHeadcount > 0 ? totalBasePay / totalHeadcount : 0,
                    baseUpKRW: levelData.reduce((sum, l) => sum + (l?.baseUpKRW || 0) * (l?.headcount || 0), 0) / (totalHeadcount || 1),
                    baseUpRate: levelData.reduce((sum, l) => sum + (l?.baseUpRate || 0) * (l?.headcount || 0), 0) / (totalHeadcount || 1),
                    sblIndex: levelData.reduce((sum, l) => sum + (l?.sblIndex || 0) * (l?.headcount || 0), 0) / (totalHeadcount || 1),
                    caIndex: levelData.reduce((sum, l) => sum + (l?.caIndex || 0) * (l?.headcount || 0), 0) / (totalHeadcount || 1),
                    competitiveness: levelData.reduce((sum, l) => sum + (l?.competitiveness || 0) * (l?.headcount || 0), 0) / (totalHeadcount || 1),
                    company: {
                      median: levelData.reduce((sum, l) => sum + (l?.company?.median || 0) * (l?.headcount || 0), 0) / (totalHeadcount || 1),
                      mean: levelData.reduce((sum, l) => sum + (l?.company?.mean || 0) * (l?.headcount || 0), 0) / (totalHeadcount || 1),
                      values: []
                    },
                    competitor: {
                      median: levelData.reduce((sum, l) => sum + (l?.competitor?.median || 0) * (l?.headcount || 0), 0) / (totalHeadcount || 1)
                    }
                  }
                })
              }
              
              return (
                <PayBandCard
                  key="total"
                  bandId="total"
                  bandName={totalBandData.name}
                  levels={totalBandData.levels}
                  initialBaseUp={contextBaseUpRate || 0}
                  initialMerit={contextMeritRate || 0}
                  levelRates={levelRates}
                  currentRates={{
                    baseUpRate: 0,
                    additionalRate: 0,
                    meritMultipliers: { ...performanceWeights }
                  }}
                  isReadOnly={true}
                  bands={bandsData}
                />
              )
            })()}
            
            {/* 직군별 분석 뷰 (읽기 전용 - 정보 표시용) */}
            {viewMode === 'band' && selectedViewBand && bandsData && (
              <div>
                {bandsData
                  .filter(band => band.name === selectedViewBand)
                  .map(band => (
                    <PayBandCard
                      key={band.id}
                      bandId={band.id}
                      bandName={band.name}
                      levels={band.levels}
                      initialBaseUp={contextBaseUpRate || 0}
                      initialMerit={contextMeritRate || 0}
                      levelRates={levelRates}
                      currentRates={{
                        baseUpRate: calculateBandAverage(band.name, 'baseUp'),
                        additionalRate: 0,
                        meritMultipliers: { ...performanceWeights }
                      }}
                      isReadOnly={true}
                      bands={bandsData}
                    />
                  ))}
              </div>
            )}
            
            {/* 경쟁력 분석 뷰 */}
            {viewMode === 'competitiveness' && (
              <PayBandCompetitivenessHeatmap 
                bands={bandsData || []}
                bandRates={Object.fromEntries(
                  dynamicStructure.bands.map(band => [
                    band,
                    {
                      baseUpAdjustment: calculateBandAverage(band, 'baseUp') - (contextBaseUpRate || 0),
                      meritAdjustment: calculateBandAverage(band, 'merit') - (contextMeritRate || 0)
                    }
                  ])
                )}
                levelRates={levelRates}
                initialBaseUp={contextBaseUpRate || 0}
                initialMerit={contextMeritRate || 0}
              />
            )}
          </div>
        </div>
      </main>
      
      {/* 평가가중치 설정 모달 */}
      <PerformanceWeightModal 
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
      />
      
      {/* Apply Bar - 펜딩 변경사항이 있을 때만 표시 */}
      {hasPendingChanges && (
        <ApplyBar
          pendingCount={pendingChangeCount}
          onApply={applyPendingChanges}
          onReset={resetPendingChanges}
        />
      )}
    </div>
  )
}