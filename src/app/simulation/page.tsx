'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSimulationLogic } from '@/hooks/useSimulationLogic'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'
import { IndustryComparisonSection } from '@/components/dashboard/IndustryComparisonSection'
import { PayBandCard } from '@/components/band/PayBandCard'
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
import { BandAdjustment } from '@/components/simulation/BandAdjustment'
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
    
    // Grade-based states
    allGradeRates,
    levelGradeRates,
    bandGradeRates,
    payZoneLevelGradeRates,
    
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
    handleAllGradeChange,
    handleBandGradeChange,
    handleLevelGradeChange,
    handlePayZoneGradeChange,
    
    // Selection states
    selectedBand,
    setSelectedBand,
    
    // Helper functions
    calculateBandAverage,
    
    // Total employees
    totalEmployees,
    aiSettings
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
    
    // 조정 모드에 따라 Grade 기반 rates 사용
    if (adjustmentScope === 'all') {
      // 전체 조정: allGradeRates 사용
      contextEmployeeData.forEach(emp => {
        const grade = emp.performanceRating || emp.performanceGrade
        if (grade && allGradeRates.byGrade[grade]) {
          totalBaseUp += allGradeRates.byGrade[grade].baseUp || 0
          totalMerit += allGradeRates.byGrade[grade].merit || 0
          totalAdditional += allGradeRates.byGrade[grade].additional || 0
          totalCount++
        }
      })
    } else if (adjustmentScope === 'band') {
      // 직군별 조정: bandGradeRates 사용
      contextEmployeeData.forEach(emp => {
        const band = emp.band
        const grade = emp.performanceRating || emp.performanceGrade
        if (band && grade && bandGradeRates[band]?.byGrade[grade]) {
          totalBaseUp += bandGradeRates[band].byGrade[grade].baseUp || 0
          totalMerit += bandGradeRates[band].byGrade[grade].merit || 0
          totalAdditional += bandGradeRates[band].byGrade[grade].additional || 0
          totalCount++
        }
      })
    } else if (adjustmentScope === 'level') {
      // 레벨별 조정: levelGradeRates 사용
      contextEmployeeData.forEach(emp => {
        const level = emp.level
        const grade = emp.performanceRating || emp.performanceGrade
        if (level && grade && levelGradeRates[level]?.byGrade[grade]) {
          totalBaseUp += levelGradeRates[level].byGrade[grade].baseUp || 0
          totalMerit += levelGradeRates[level].byGrade[grade].merit || 0
          totalAdditional += levelGradeRates[level].byGrade[grade].additional || 0
          totalCount++
        }
      })
    } else if (adjustmentScope === 'payzone') {
      // PayZone별 조정: payZoneLevelGradeRates 사용
      contextEmployeeData.forEach(emp => {
        const payZone = emp.payZone
        const level = emp.level
        const grade = emp.performanceRating || emp.performanceGrade
        if (payZone && level && grade && payZoneLevelGradeRates[payZone]?.[level]?.byGrade[grade]) {
          totalBaseUp += payZoneLevelGradeRates[payZone][level].byGrade[grade].baseUp || 0
          totalMerit += payZoneLevelGradeRates[payZone][level].byGrade[grade].merit || 0
          totalAdditional += payZoneLevelGradeRates[payZone][level].byGrade[grade].additional || 0
          totalCount++
        }
      })
    }
    
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
      {/* Fixed Summary Bar - 모든 뷰 모드에서 표시 (스크롤 시 상단 고정) */}
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
      
      <main className="pt-14 pb-8">
        <div className="flex gap-3">
          {/* 좌측 메뉴 */}
          <div className="w-60 bg-white rounded-lg shadow-sm h-fit p-2 ml-3">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold text-gray-900">뷰 모드</h2>
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => setViewMode('adjustment')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'adjustment'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">인상률 조정</span>
                </div>
              </button>
              
              <button
                onClick={() => setViewMode('all')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'all'
                    ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">종합 현황</span>
                </div>
              </button>
              
              <button
                onClick={() => setViewMode('competitiveness')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'competitiveness'
                    ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">경쟁력 분석</span>
                </div>
              </button>
              
              <div className="pt-1 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1 px-3">직군별 분석</p>
                {dynamicStructure.bands.map(band => (
                  <button
                    key={band}
                    onClick={() => {
                      setViewMode('band')
                      setSelectedViewBand(band)
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg transition-all duration-200 ${
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
          <div className="flex-1 pr-3">
            
            {/* 인상률 조정 모드일 때만 C사 대비 섹션 표시 */}
            {viewMode === 'adjustment' && (
              <div className="mb-3">
                <IndustryComparisonSection 
                  baseUpRate={contextBaseUpRate}
                  meritRate={contextMeritRate}
                  levelTotalRates={(() => {
                    // 직급별 평균 인상률 계산 (Grade 기반)
                    const levelRates: {[key: string]: number} = {}
                    const filteredEmployees = selectedBands.length > 0 && selectedBands.length < dynamicStructure.bands.length
                      ? contextEmployeeData.filter(emp => emp.band && selectedBands.includes(emp.band))
                      : contextEmployeeData
                    
                    // 각 직급별로 인상률 계산
                    dynamicStructure.levels.forEach(level => {
                      const levelEmployees = filteredEmployees.filter(emp => emp.level === level)
                      if (levelEmployees.length === 0) {
                        levelRates[level] = 0
                        return
                      }
                      
                      let totalRate = 0
                      let count = 0
                      
                      levelEmployees.forEach(emp => {
                        const grade = emp.performanceRating
                        if (!grade) return
                        
                        let baseUp = 0, merit = 0, additional = 0
                        
                        if (adjustmentScope === 'all' && allGradeRates.byGrade[grade]) {
                          baseUp = allGradeRates.byGrade[grade].baseUp || 0
                          merit = allGradeRates.byGrade[grade].merit || 0
                          additional = allGradeRates.byGrade[grade].additional || 0
                        } else if (adjustmentScope === 'level' && levelGradeRates[level]?.byGrade[grade]) {
                          baseUp = levelGradeRates[level].byGrade[grade].baseUp || 0
                          merit = levelGradeRates[level].byGrade[grade].merit || 0
                          additional = levelGradeRates[level].byGrade[grade].additional || 0
                        } else if (adjustmentScope === 'payzone' && emp.payZone !== undefined) {
                          const payZoneData = payZoneLevelGradeRates[emp.payZone]?.[level]?.byGrade[grade]
                          if (payZoneData) {
                            baseUp = payZoneData.baseUp || 0
                            merit = payZoneData.merit || 0
                            additional = payZoneData.additional || 0
                          }
                        }
                        
                        const rate = baseUp + merit + (additionalType === 'percentage' ? additional : 0)
                        totalRate += rate
                        count++
                      })
                      
                      levelRates[level] = count > 0 ? totalRate / count : 0
                    })
                    
                    return levelRates
                  })()}
                  weightedAverageRate={weightedAverageRates.baseUp + weightedAverageRates.merit + (additionalType === 'percentage' ? weightedAverageRates.additional : 0)}
                  competitorIncreaseRate={dashboardData?.competitorIncreaseRate}
                  competitorData={dashboardData?.competitorData}
                  levelStatistics={dashboardData?.levelStatistics}
                />
              </div>
            )}
            
            {/* 인상률 조정 뷰 */}
            {viewMode === 'adjustment' && (
              <>
                {/* 상단 컨트롤 */}
                <div className="bg-white rounded-lg shadow-sm px-3 py-2 mb-2">
                  <div className="flex items-center justify-between">
                    {/* 조정 범위 탭 */}
                    <div className="flex gap-1">
                      {(['all', 'band', 'level', 'payzone'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setAdjustmentScope(s)}
                          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                            adjustmentScope === s
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {s === 'all' ? '전체 조정' : 
                           s === 'band' ? '직군별' :
                           s === 'level' ? '레벨별' : 
                           'Pay Zone별'}
                        </button>
                      ))}
                    </div>
                    
                    {/* 추가인상률 타입 선택 */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">추가인상:</span>
                      <button
                        onClick={() => setAdditionalType('percentage')}
                        className={`px-3 py-1 text-xs rounded-full transition-all ${
                          additionalType === 'percentage'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        비율(%)
                      </button>
                      <button
                        onClick={() => setAdditionalType('amount')}
                        className={`px-3 py-1 text-xs rounded-full transition-all ${
                          additionalType === 'amount'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        정액(만원)
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* 메인 조정 영역 (전체 너비) */}
                <div>
                    {adjustmentScope === 'all' && (
                      <AllAdjustment
                        allGradeRates={allGradeRates}
                        onGradeChange={handleAllGradeChange}
                        onApply={applyPendingChanges}
                        onReset={resetPendingChanges}
                        contextEmployeeData={contextEmployeeData}
                        performanceGrades={dynamicStructure.grades}
                        hasPendingChanges={hasPendingChanges}
                        aiSettings={aiSettings}
                      />
                    )}
                    
                    {adjustmentScope === 'band' && (
                      <BandAdjustment
                        bands={dynamicStructure.bands}
                        bandGradeRates={bandGradeRates}
                        onBandGradeChange={handleBandGradeChange}
                        contextEmployeeData={contextEmployeeData}
                        performanceGrades={dynamicStructure.grades}
                        aiSettings={aiSettings}
                      />
                    )}
                    
                    {adjustmentScope === 'level' && (
                      <LevelAdjustment
                        levels={dynamicStructure.levels}
                        levelGradeRates={levelGradeRates}
                        onLevelGradeChange={handleLevelGradeChange}
                        onApply={applyPendingChanges}
                        onReset={resetPendingChanges}
                        additionalType={additionalType}
                        contextEmployeeData={contextEmployeeData}
                        performanceGrades={dynamicStructure.grades}
                        hasPendingChanges={hasPendingChanges}
                        aiSettings={aiSettings}
                      />
                    )}
                    
                    {adjustmentScope === 'payzone' && (
                      <PayZoneAdjustment
                        levels={dynamicStructure.levels}
                        payZones={dynamicStructure.payZones}
                        performanceGrades={dynamicStructure.grades}
                        payZoneLevelGradeRates={payZoneLevelGradeRates}
                        onPayZoneGradeChange={handlePayZoneGradeChange}
                        onApply={applyPendingChanges}
                        onReset={resetPendingChanges}
                        additionalType={additionalType}
                        selectedBands={selectedBands}
                        contextEmployeeData={contextEmployeeData}
                        hasPendingChanges={hasPendingChanges}
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
      
      {/* Apply Bar - 항상 표시 */}
      {viewMode === 'adjustment' && (
        <ApplyBar
          pendingChangeCount={pendingChangeCount}
          onApply={applyPendingChanges}
          onReset={resetPendingChanges}
        />
      )}
    </div>
  )
}