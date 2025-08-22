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
import { MatrixEditor } from '@/components/simulation/MatrixEditor'

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
    payZoneRates,  // payZoneRates 추가
    adjustmentMode,
    setAdjustmentMode,
    performanceWeights,
    
    // Local state
    dynamicStructure,
    budgetUsage,
    viewMode,
    setViewMode,
    selectedViewBand,
    setSelectedViewBand,
    selectedLevel,
    setSelectedLevel,
    selectedBand,
    setSelectedBand,
    selectedPayZone,
    setSelectedPayZone,
    selectedBandExpert,
    setSelectedBandExpert,
    isWeightModalOpen,
    setIsWeightModalOpen,
    
    // Handlers
    handleLevelRateChange,
    handleGlobalAdjustment,
    handleBandLevelChange,
    handlePayZoneBandLevelChange,
    handleExpertChange,
    
    // Helper functions
    getActualCombinationCount,
    calculateBandAverage,
    calculateAverageSalary,
    calculateZoneBandBudget,
    
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
      return { baseUp: 0, merit: 0, total: 0 }
    }
    
    let totalBaseUp = 0
    let totalMerit = 0
    let totalCount = 0
    
    // 조정 모드에 따라 다른 인상률 적용
    contextEmployeeData.forEach(emp => {
      const level = emp.level
      const band = emp.bandName
      const payZone = emp.payZone
      
      let baseUp = 0
      let merit = 0
      
      if (adjustmentMode === 'expert' && payZone && payZoneRates[payZone]?.[band]?.[level]) {
        // Expert 모드: Pay Zone별 인상률
        baseUp = payZoneRates[payZone][band][level].baseUp || 0
        merit = payZoneRates[payZone][band][level].merit || 0
      } else if (adjustmentMode === 'advanced' && bandFinalRates[band]?.[level]) {
        // Advanced 모드: 직군×직급별 인상률
        baseUp = bandFinalRates[band][level].baseUp || 0
        merit = bandFinalRates[band][level].merit || 0
      } else {
        // Simple 모드: 직급별 인상률
        baseUp = levelRates[level]?.baseUp || contextBaseUpRate
        merit = levelRates[level]?.merit || contextMeritRate
      }
      
      totalBaseUp += baseUp
      totalMerit += merit
      totalCount++
    })
    
    return {
      baseUp: totalCount > 0 ? totalBaseUp / totalCount : 0,
      merit: totalCount > 0 ? totalMerit / totalCount : 0,
      total: totalCount > 0 ? (totalBaseUp + totalMerit) / totalCount : 0
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
                  
                  {/* 컴팩트한 예산 개요 */}
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">총예산:</span>
                      <span className="ml-1 font-medium">{formatKoreanCurrency(availableBudget, '억', 100000000)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">복리:</span>
                      <span className="ml-1 font-medium">{formatKoreanCurrency(welfareBudget, '억', 100000000)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">인건비:</span>
                      <span className="ml-1 font-medium">{formatKoreanCurrency((availableBudget - welfareBudget), '억', 100000000)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">잔여:</span>
                      <span className="ml-1 font-medium text-green-600">{formatKoreanCurrency((availableBudget - welfareBudget - budgetUsage.total), '억', 100000000)}</span>
                    </div>
                  </div>
                  
                </div>
                
                {/* 개선된 인상률 조정 섹션 */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                  {/* 컴팩트한 탭 헤더 */}
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700">인상률 조정</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setAdjustmentMode('simple')}
                          className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                            adjustmentMode === 'simple'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          직급별
                        </button>
                        <button
                          onClick={() => setAdjustmentMode('matrix')}
                          className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                            adjustmentMode === 'matrix'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          매트릭스
                        </button>
                        <button
                          onClick={() => setAdjustmentMode('advanced')}
                          className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                            adjustmentMode === 'advanced'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          상세
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* 탭 컨텐츠 */}
                  <div className="p-4">
                    {/* Matrix Mode: 매트릭스 편집기 */}
                    {adjustmentMode === 'matrix' && (
                      <MatrixEditor
                        levels={dynamicStructure.levels}
                        bands={dynamicStructure.bands}
                        rates={bandFinalRates}
                        onCellChange={(band, level, type, value) => {
                          handleBandLevelChange(band, level, type, value)
                        }}
                        onBulkChange={(type, target, rateType, value) => {
                          if (type === 'all') {
                            dynamicStructure.bands.forEach(band => {
                              dynamicStructure.levels.forEach(level => {
                                handleBandLevelChange(band, level, rateType, value)
                              })
                            })
                          } else if (type === 'row' && target) {
                            dynamicStructure.levels.forEach(level => {
                              handleBandLevelChange(target, level, rateType, value)
                            })
                          } else if (type === 'column' && target) {
                            dynamicStructure.bands.forEach(band => {
                              handleBandLevelChange(band, target, rateType, value)
                            })
                          }
                        }}
                        employeeCounts={
                          contextEmployeeData.reduce((acc, emp) => {
                            if (!acc[emp.bandName]) acc[emp.bandName] = {}
                            if (!acc[emp.bandName][emp.level]) acc[emp.bandName][emp.level] = 0
                            acc[emp.bandName][emp.level]++
                            return acc
                          }, {} as { [band: string]: { [level: string]: number } })
                        }
                        showMerit={true}
                      />
                    )}
                    
                    {/* Simple Mode: Level별 조정 */}
                    {adjustmentMode === 'simple' && (
                      <div>
                        {/* 빠른 조정 도구 */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-medium text-gray-700">빠른 조정</h4>
                            <button
                              onClick={() => setIsWeightModalOpen(true)}
                              className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                            >
                              가중치
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <button
                              onClick={() => {
                                handleGlobalAdjustment('baseUp', contextBaseUpRate)
                                handleGlobalAdjustment('merit', contextMeritRate)
                              }}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              AI 제안
                            </button>
                            <button
                              onClick={() => {
                                handleGlobalAdjustment('baseUp', 5.0)
                                handleGlobalAdjustment('merit', 2.0)
                              }}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              업계 평균
                            </button>
                            <button
                              onClick={() => {
                                handleGlobalAdjustment('baseUp', 0)
                                handleGlobalAdjustment('merit', 0)
                              }}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              초기화
                            </button>
                            <button
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              저장
                            </button>
                          </div>
                        </div>
                        
                        {/* 컴팩트한 일괄 조정 */}
                        <div className="mb-3 flex gap-2">
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Base-up 일괄"
                            onChange={(e) => handleGlobalAdjustment('baseUp', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                          <input
                            type="number"
                            step="0.1"
                            placeholder="성과 일괄"
                            onChange={(e) => handleGlobalAdjustment('merit', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                        
                        {/* 컴팩트한 Level별 조정 */}
                        <div className="space-y-2">
                          {dynamicStructure.levels.map(level => {
                            const empCount = contextEmployeeData.filter(emp => emp.level === level).length
                            const baseUp = levelRates[level]?.baseUp || 0
                            const merit = levelRates[level]?.merit || 0
                            const total = baseUp + merit
                            
                            return (
                              <div key={level} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                <div className="w-16 font-medium text-sm">{level}</div>
                                <div className="text-xs text-gray-500 w-12">{empCount}명</div>
                                <div className="flex-1 grid grid-cols-3 gap-2">
                                  <div className="flex items-center gap-1">
                                    <label className="text-xs text-gray-600 w-12">Base:</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={baseUp}
                                      onChange={(e) => handleLevelRateChange(level, 'baseUp', parseFloat(e.target.value) || 0)}
                                      className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded text-center"
                                    />
                                    <span className="text-xs">%</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <label className="text-xs text-gray-600 w-12">성과:</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={merit}
                                      onChange={(e) => handleLevelRateChange(level, 'merit', parseFloat(e.target.value) || 0)}
                                      className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded text-center"
                                    />
                                    <span className="text-xs">%</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <label className="text-xs text-gray-600 w-12">총:</label>
                                    <div className="w-16 px-1 py-0.5 text-xs bg-blue-100 rounded text-center font-medium text-blue-700">
                                      {total.toFixed(1)}%
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Advanced Mode: Band×Level 조정 */}
                    {adjustmentMode === 'advanced' && (
                      <div>
                        {/* 평가가중치 설정 */}
                        <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">평가가중치 설정</h3>
                          <p className="text-xs text-gray-500 mt-1">성과평가 등급별 인상률 가중치를 조정합니다</p>
                        </div>
                        <button
                          onClick={() => setIsWeightModalOpen(true)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                        >
                          가중치 설정
                        </button>
                      </div>
                    </div>
                    
                    {/* Band 선택 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">직군 선택</label>
                      <div className="flex flex-wrap gap-2">
                        {dynamicStructure.bands.map(band => (
                          <button
                            key={band}
                            onClick={() => setSelectedBand(band)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              selectedBand === band
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {band}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* 선택된 Band의 Level별 조정 */}
                    {selectedBand && (
                      <div className="space-y-3">
                        {dynamicStructure.levels.map(level => {
                          const empCount = contextEmployeeData.filter(
                            emp => emp.band === selectedBand && emp.level === level
                          ).length;
                          
                          if (empCount === 0) return null;
                          
                          return (
                            <div key={level} className="p-4 bg-white border border-gray-200 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{level}</h4>
                                <span className="text-sm text-gray-500">{empCount}명</span>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Base-up (%)</label>
                                  <input
                                    type="number"
                                    value={bandFinalRates[selectedBand]?.[level]?.baseUp || 0}
                                    onChange={(e) => handleBandLevelChange(selectedBand, level, 'baseUp', parseFloat(e.target.value) || 0)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    step="0.1"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">성과인상률 (%)</label>
                                  <input
                                    type="number"
                                    value={bandFinalRates[selectedBand]?.[level]?.merit || 0}
                                    onChange={(e) => handleBandLevelChange(selectedBand, level, 'merit', parseFloat(e.target.value) || 0)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    step="0.1"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">총 인상률</label>
                                  <div className="px-2 py-1 text-sm bg-gray-100 rounded text-center font-medium">
                                    {((bandFinalRates[selectedBand]?.[level]?.baseUp || 0) + 
                                      (bandFinalRates[selectedBand]?.[level]?.merit || 0)).toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Expert Mode: Level×Band×PayZone 조정 */}
                {adjustmentMode === 'expert' && (
                  <div>
                    {/* 평가가중치 설정 */}
                    <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">평가가중치 설정</h3>
                          <p className="text-xs text-gray-500 mt-1">성과평가 등급별 인상률 가중치를 조정합니다</p>
                        </div>
                        <button
                          onClick={() => setIsWeightModalOpen(true)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                        >
                          가중치 설정
                        </button>
                      </div>
                    </div>
                    
                    {/* Level & Band 선택 (Pay Zone은 아래에서 선택) */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">직급 선택</label>
                        <div className="flex flex-wrap gap-2">
                          {dynamicStructure.levels.map(level => (
                            <button
                              key={level}
                              onClick={() => setSelectedLevel(level)}
                              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                                selectedLevel === level
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">직군 선택</label>
                        <div className="flex flex-wrap gap-2">
                          {dynamicStructure.bands.map(band => (
                            <button
                              key={band}
                              onClick={() => setSelectedBandExpert(band)}
                              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                                selectedBandExpert === band
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {band}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* 선택된 Level×Band의 Pay Zone별 조정 */}
                    {selectedLevel && selectedBandExpert && (
                      <div className="space-y-3">
                        <div className="p-3 bg-purple-50 rounded-lg mb-3">
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">
                              {selectedLevel} / {selectedBandExpert}
                            </span>
                            <span className="ml-4 text-gray-600">
                              총 {contextEmployeeData.filter(
                                emp => emp.level === selectedLevel && emp.band === selectedBandExpert
                              ).length}명
                            </span>
                          </div>
                        </div>
                        
                        {/* Pay Zone별 그리드 */}
                        <div className="grid grid-cols-1 gap-3">
                          {dynamicStructure.payZones.map(zone => {
                            const empCount = contextEmployeeData.filter(
                              emp => emp.payZone === zone && 
                                     emp.band === selectedBandExpert && 
                                     emp.level === selectedLevel
                            ).length;
                            
                            if (empCount === 0) return null;
                            
                            const avgSalary = contextEmployeeData
                              .filter(emp => emp.payZone === zone && emp.band === selectedBandExpert && emp.level === selectedLevel)
                              .reduce((sum, emp) => sum + (emp.currentSalary || 0), 0) / (empCount || 1);
                            
                            return (
                              <div key={zone} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                                      Pay Zone {zone}
                                    </span>
                                    <span className="text-sm text-gray-600">{empCount}명</span>
                                    <span className="text-sm text-gray-600">
                                      평균: {formatKoreanCurrency(avgSalary, '만원', 10000)}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-4 gap-3">
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Base-up (%)</label>
                                    <input
                                      type="number"
                                      value={payZoneRates[zone]?.[selectedBandExpert]?.[selectedLevel]?.baseUp || 0}
                                      onChange={(e) => handleExpertChange(zone, selectedBandExpert, selectedLevel, 'baseUp', parseFloat(e.target.value) || 0)}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      step="0.1"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">성과인상률 (%)</label>
                                    <input
                                      type="number"
                                      value={payZoneRates[zone]?.[selectedBandExpert]?.[selectedLevel]?.merit || 0}
                                      onChange={(e) => handleExpertChange(zone, selectedBandExpert, selectedLevel, 'merit', parseFloat(e.target.value) || 0)}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      step="0.1"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">추가인상률 (%)</label>
                                    <input
                                      type="number"
                                      value={payZoneRates[zone]?.[selectedBandExpert]?.[selectedLevel]?.additional || 0}
                                      onChange={(e) => handleExpertChange(zone, selectedBandExpert, selectedLevel, 'additional', parseFloat(e.target.value) || 0)}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      step="0.1"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">총 인상률</label>
                                    <div className="px-2 py-1 text-sm bg-gradient-to-r from-purple-50 to-blue-50 rounded text-center font-bold text-purple-700">
                                      {((payZoneRates[zone]?.[selectedBandExpert]?.[selectedLevel]?.baseUp || 0) + 
                                        (payZoneRates[zone]?.[selectedBandExpert]?.[selectedLevel]?.merit || 0) +
                                        (payZoneRates[zone]?.[selectedBandExpert]?.[selectedLevel]?.additional || 0)).toFixed(1)}%
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                      </div>
                    )}
                  </div>
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
    </div>
  )
}