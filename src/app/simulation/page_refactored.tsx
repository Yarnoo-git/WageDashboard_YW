'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSimulationLogic } from '@/hooks/useSimulationLogic'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'
import { IndustryComparisonSection } from '@/components/dashboard/IndustryComparisonSection'
import { PayBandCard } from '@/components/simulation/PayBandCard'
import { RaiseSliderPanel } from '@/components/simulation/RaiseSliderPanel'
import { PayBandCompetitivenessHeatmap } from '@/components/analytics/PayBandCompetitivenessHeatmap'
import { useBandData } from '@/hooks/useBandData'
import { PerformanceWeightModal } from '@/components/employees/PerformanceWeightModal'

export default function SimulationPage() {
  const router = useRouter()
  const { bands: bandsData } = useBandData()
  
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
  
  // 데이터 없으면 홈으로
  useEffect(() => {
    if (!loading && (!contextEmployeeData || contextEmployeeData.length === 0)) {
      router.push('/home')
    }
  }, [contextEmployeeData, loading, router])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
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
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="font-medium">전체 직군 현황</span>
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
                 viewMode === 'all' ? '전체 직군 종합 현황' :
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
                  competitorIncrease={dashboardData?.competitorIncrease}
                  competitorData={dashboardData?.competitorComparison}
                />
              </div>
            )}
            
            {/* 인상률 조정 뷰 */}
            {viewMode === 'adjustment' && (
              <>
                {/* 예산 현황 표시 */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      예산 현황
                    </h2>
                    <button 
                      onClick={() => router.push('/dashboard')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      대시보드에서 조정 →
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">사용가능 예산</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatKoreanCurrency(availableBudget, '억원', 100000000)}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">복리후생</p>
                      <p className="text-xl font-bold text-yellow-700">
                        {formatKoreanCurrency(welfareBudget, '억원', 100000000)}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">실제 인건비</p>
                      <p className="text-xl font-bold text-blue-700">
                        {formatKoreanCurrency((availableBudget - welfareBudget), '억원', 100000000)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* 조정 모드 선택 */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h2 className="text-lg font-semibold mb-4">조정 세밀도</h2>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setAdjustmentMode('simple')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        adjustmentMode === 'simple'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Simple ({dynamicStructure.levels.length}개 Level)
                    </button>
                    <button
                      onClick={() => setAdjustmentMode('advanced')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        adjustmentMode === 'advanced'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Advanced (+{dynamicStructure.bands.length}개 Band)
                    </button>
                    <button
                      onClick={() => setAdjustmentMode('expert')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        adjustmentMode === 'expert'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Expert (+{dynamicStructure.payZones.length}개 Pay Zone)
                    </button>
                  </div>
                </div>
                
                {/* 예산 사용량 표시 */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">예산 사용량</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>직접비용</span>
                        <span>{formatKoreanCurrency(budgetUsage.direct, '억원', 100000000)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>간접비용 (17.8%)</span>
                        <span>{formatKoreanCurrency(budgetUsage.indirect, '억원', 100000000)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>총 사용</span>
                        <span>{formatKoreanCurrency(budgetUsage.total, '억원', 100000000)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          budgetUsage.percentage <= 80 ? 'bg-green-600' :
                          budgetUsage.percentage <= 100 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{width: `${Math.min(budgetUsage.percentage, 100)}%`}}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>예산 사용률</span>
                      <span className={`font-semibold ${
                        budgetUsage.percentage <= 80 ? 'text-green-600' :
                        budgetUsage.percentage <= 100 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(budgetUsage.percentage)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* 전체 직군 현황 뷰 */}
            {viewMode === 'all' && (
              <div className="grid grid-cols-2 gap-6">
                {dynamicStructure.bands.map(band => (
                  <PayBandCard
                    key={band}
                    band={band}
                    employees={contextEmployeeData.filter(emp => emp.band === band)}
                    averageSalary={calculateAverageSalary(0, band)}
                    baseUpRate={calculateBandAverage(band, 'baseUp')}
                    meritRate={calculateBandAverage(band, 'merit')}
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