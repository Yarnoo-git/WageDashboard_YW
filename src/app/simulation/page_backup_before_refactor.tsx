'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useWageContext } from '@/context/WageContext'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'
import { IndustryComparisonSection } from '@/components/dashboard/IndustryComparisonSection'
import { useDashboardData } from '@/hooks/useDashboardData'
import { PayBandCard } from '@/components/simulation/PayBandCard'
import { RaiseSliderPanel } from '@/components/simulation/RaiseSliderPanel'
import { PayBandCompetitivenessHeatmap } from '@/components/analytics/PayBandCompetitivenessHeatmap'
import { useBandData } from '@/hooks/useBandData'
import { PerformanceWeightModal } from '@/components/employees/PerformanceWeightModal'

interface AdjustmentRates {
  baseUp: number
  merit: number
  additional: number
}

export default function SimulationPage() {
  const router = useRouter()
  const { data: dashboardData, loading } = useDashboardData()
  
  const {
    // 예산 관련
    availableBudget,
    welfareBudget,
    totalBudget,
    setAvailableBudget,
    setWelfareBudget,
    
    // 조정 모드
    adjustmentMode,
    setAdjustmentMode,
    
    // 인상률 관련
    baseUpRate: contextBaseUpRate,
    meritRate: contextMeritRate,
    levelRates,
    setLevelRates,
    bandFinalRates,
    setBandFinalRates,
    payZoneRates,
    setPayZoneRates,
    
    // 직원 데이터
    contextEmployeeData,
    
    // Context 전역 설정
    setBaseUpRate,
    setMeritRate
  } = useWageContext()
  
  // 동적 데이터 구조 (Excel 기반)
  const [dynamicStructure, setDynamicStructure] = useState({
    levels: [] as string[],
    bands: [] as string[],
    payZones: [] as number[]
  })
  
  // 계산된 예산 사용량
  const [budgetUsage, setBudgetUsage] = useState({
    direct: 0,
    indirect: 0,
    total: 0,
    remaining: 0,
    percentage: 0
  })
  
  // View mode state (좌측 메뉴)
  const [viewMode, setViewMode] = useState<'adjustment' | 'all' | 'band' | 'payzone' | 'competitiveness'>('adjustment')
  const [selectedViewBand, setSelectedViewBand] = useState<string>('')
  
  // Advanced mode state
  const [selectedBand, setSelectedBand] = useState<string>('')
  
  // Expert mode state
  const [selectedPayZone, setSelectedPayZone] = useState<number | null>(null)
  const [selectedBandExpert, setSelectedBandExpert] = useState<string>('')
  
  // 평가가중치 모달 상태
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false)
  
  // 실제 존재하는 Pay Zone × Band × Level 조합 카운트
  const getActualCombinationCount = () => {
    if (!contextEmployeeData || contextEmployeeData.length === 0) return 0
    
    const combinations = new Set<string>()
    contextEmployeeData.forEach(emp => {
      if (emp.payZone !== undefined && emp.band && emp.level) {
        combinations.add(`${emp.payZone}-${emp.band}-${emp.level}`)
      }
    })
    
    return combinations.size
  }
  
  // Band data (from bands page)
  const { bands: bandsData, loading: bandsLoading } = useBandData()
  
  // Excel 데이터에서 동적 구조 추출
  useEffect(() => {
    if (contextEmployeeData && contextEmployeeData.length > 0) {
      const levels = [...new Set(contextEmployeeData.map(emp => emp.level))].sort()
      const bands = [...new Set(contextEmployeeData.map(emp => emp.band))].filter(Boolean).sort()
      const payZones = [...new Set(contextEmployeeData.map(emp => emp.payZone))].filter(zone => zone !== undefined).sort((a, b) => Number(a) - Number(b))
      
      setDynamicStructure({
        levels,
        bands,
        payZones: payZones.map(Number)
      })
      
      // 첫 번째 값으로 초기화
      if (bands.length > 0) {
        if (!selectedBand) {
          setSelectedBand(bands[0])
          setSelectedBandExpert(bands[0])
        }
        if (!selectedViewBand) {
          setSelectedViewBand(bands[0])
        }
      }
      if (payZones.length > 0 && selectedPayZone === null) {
        setSelectedPayZone(Number(payZones[0]))
      }
      
      // 동적 구조 감지 완료
    }
  }, [contextEmployeeData, selectedBand, selectedViewBand, selectedBandExpert, selectedPayZone])
  
  // 데이터 없으면 홈으로
  useEffect(() => {
    if (!loading && (!contextEmployeeData || contextEmployeeData.length === 0)) {
      router.push('/home')
    }
  }, [contextEmployeeData, loading, router])
  
  // Simple Mode: Level별 조정
  const handleLevelRateChange = (level: string, field: keyof AdjustmentRates, value: number) => {
    const newRates = {
      ...levelRates,
      [level]: {
        ...levelRates[level],
        [field]: value
      }
    }
    setLevelRates(newRates)
    
    // 전역 base-up, merit 평균값 업데이트
    updateGlobalRates(newRates)
    
    // 양방향 동기화: Simple → Advanced → Expert (기본값으로 전파)
    if (adjustmentMode === 'simple') {
      propagateToLowerModes(level, field as 'baseUp' | 'merit', value)
    }
  }
  
  // Simple 모드 변경을 하위 모드로 전파
  const propagateToLowerModes = (level: string, field: 'baseUp' | 'merit', value: number) => {
    // Advanced 모드로 전파: 모든 밴드에 동일하게 적용
    dynamicStructure.bands.forEach(band => {
      setBandFinalRates(prev => ({
        ...prev,
        [band]: {
          ...prev[band],
          [level]: {
            ...(prev[band]?.[level] || {}),
            [field]: value
          }
        }
      }))
    })
    
    // Expert 모드로 전파: 모든 PayZone×Band 조합에 적용
    dynamicStructure.payZones.forEach(zone => {
      dynamicStructure.bands.forEach(band => {
        setPayZoneRates(prev => ({
          ...prev,
          [zone]: {
            ...prev[zone],
            [band]: {
              ...(prev[zone]?.[band] || {}),
              [level]: {
                ...(prev[zone]?.[band]?.[level] || {}),
                [field]: value
              }
            }
          }
        }))
      })
    })
  }
  
  // 전역 인상률 계산 (가중평균)
  const updateGlobalRates = (rates: typeof levelRates) => {
    if (!contextEmployeeData || contextEmployeeData.length === 0) return
    
    let totalBaseUp = 0
    let totalMerit = 0
    let totalCount = 0
    
    Object.entries(rates).forEach(([level, rate]) => {
      const levelCount = contextEmployeeData.filter(emp => emp.level === level).length
      totalBaseUp += rate.baseUp * levelCount
      totalMerit += rate.merit * levelCount
      totalCount += levelCount
    })
    
    if (totalCount > 0) {
      setBaseUpRate(totalBaseUp / totalCount)
      setMeritRate(totalMerit / totalCount)
    }
  }
  
  // 전체 일괄 조정
  const handleGlobalAdjustment = (field: keyof AdjustmentRates, value: number) => {
    const newRates: any = {}
    dynamicStructure.levels.forEach(level => {
      newRates[level] = {
        ...levelRates[level],
        [field]: value
      }
    })
    setLevelRates(newRates)
    updateGlobalRates(newRates)
  }
  
  // Advanced Mode: Band×Level 조정
  const handleBandLevelChange = (band: string, level: string, field: 'baseUp' | 'merit', value: number) => {
    setBandFinalRates(prev => ({
      ...prev,
      [band]: {
        ...prev[band],
        [level]: {
          ...(prev[band]?.[level] || {}),
          [field]: value
        }
      }
    }))
    
    // 양방향 동기화: Advanced → Simple (가중평균 업데이트)
    updateLevelRatesFromBands(level, field)
  }
  
  // Band 데이터로부터 Level 평균 계산 (Bottom-up)
  const updateLevelRatesFromBands = (level: string, field: 'baseUp' | 'merit') => {
    if (!contextEmployeeData) return
    
    let totalWeighted = 0
    let totalCount = 0
    
    dynamicStructure.bands.forEach(band => {
      const empCount = contextEmployeeData.filter(emp => emp.band === band && emp.level === level).length
      if (empCount > 0) {
        const rate = bandFinalRates[band]?.[level]?.[field] || levelRates[level]?.[field] || 0
        totalWeighted += rate * empCount
        totalCount += empCount
      }
    })
    
    if (totalCount > 0) {
      const avgRate = totalWeighted / totalCount
      setLevelRates(prev => ({
        ...prev,
        [level]: {
          ...prev[level],
          [field]: avgRate
        }
      }))
    }
  }
  
  // Expert Mode: PayZone×Band×Level 조정
  const handlePayZoneBandLevelChange = (zone: number, band: string, level: string, field: 'baseUp' | 'merit' | 'additional', value: number) => {
    const newPayZoneRates = {
      ...payZoneRates,
      [zone]: {
        ...payZoneRates[zone],
        [band]: {
          ...payZoneRates[zone]?.[band],
          [level]: {
            ...payZoneRates[zone]?.[band]?.[level],
            [field]: value
          }
        }
      }
    }
    setPayZoneRates(newPayZoneRates)
    
    // Bottom-up: PayZone → Band → Level 가중평균 업데이트
    if (adjustmentMode === 'expert') {
      updateAdvancedFromExpert(newPayZoneRates)
      updateSimpleFromExpert(newPayZoneRates)
    }
  }
  
  // Expert → Advanced 동기화 (Pay Zone별 가중평균)
  const updateAdvancedFromExpert = (expertRates: typeof payZoneRates) => {
    if (!contextEmployeeData) return
    
    const newBandRates: typeof bandFinalRates = {}
    
    dynamicStructure.bands.forEach(band => {
      newBandRates[band] = {}
      dynamicStructure.levels.forEach(level => {
        let totalBaseUp = 0
        let totalMerit = 0
        let totalCount = 0
        
        dynamicStructure.payZones.forEach(zone => {
          const empCount = contextEmployeeData.filter(emp => 
            emp.payZone === zone && emp.band === band && emp.level === level
          ).length
          
          if (empCount > 0) {
            const rates = expertRates[zone]?.[band]?.[level] || { baseUp: 0, merit: 0 }
            totalBaseUp += rates.baseUp * empCount
            totalMerit += rates.merit * empCount
            totalCount += empCount
          }
        })
        
        if (totalCount > 0) {
          newBandRates[band][level] = {
            baseUp: totalBaseUp / totalCount,
            merit: totalMerit / totalCount
          }
        }
      })
    })
    
    setBandFinalRates(newBandRates)
  }
  
  // Expert → Simple 동기화 (전체 가중평균)
  const updateSimpleFromExpert = (expertRates: typeof payZoneRates) => {
    if (!contextEmployeeData) return
    
    const newLevelRates: typeof levelRates = {}
    
    dynamicStructure.levels.forEach(level => {
      let totalBaseUp = 0
      let totalMerit = 0
      let totalCount = 0
      
      dynamicStructure.payZones.forEach(zone => {
        dynamicStructure.bands.forEach(band => {
          const empCount = contextEmployeeData.filter(emp => 
            emp.payZone === zone && emp.band === band && emp.level === level
          ).length
          
          if (empCount > 0) {
            const rates = expertRates[zone]?.[band]?.[level] || { baseUp: 0, merit: 0 }
            totalBaseUp += rates.baseUp * empCount
            totalMerit += rates.merit * empCount
            totalCount += empCount
          }
        })
      })
      
      if (totalCount > 0) {
        newLevelRates[level] = {
          baseUp: totalBaseUp / totalCount,
          merit: totalMerit / totalCount
        }
      }
    })
    
    setLevelRates(newLevelRates)
    updateGlobalRates(newLevelRates)
  }
  
  // 직군 평균 계산
  const calculateBandAverage = (band: string, field: 'baseUp' | 'merit') => {
    if (!contextEmployeeData || !band) return 0
    
    let total = 0
    let count = 0
    
    dynamicStructure.levels.forEach(level => {
      const empCount = contextEmployeeData.filter(emp => emp.band === band && emp.level === level).length
      if (empCount > 0) {
        const rate = bandFinalRates[band]?.[level]?.[field] || levelRates[level]?.[field] || 0
        total += rate * empCount
        count += empCount
      }
    })
    
    return count > 0 ? total / count : 0
  }
  
  // Expert Mode: PayZone×Band×Level 조정
  const handleExpertChange = (payZone: number, band: string, level: string, field: keyof AdjustmentRates, value: number) => {
    setPayZoneRates(prev => ({
      ...prev,
      [payZone]: {
        ...prev[payZone],
        [band]: {
          ...(prev[payZone]?.[band] || {}),
          [level]: {
            ...(prev[payZone]?.[band]?.[level] || {}),
            [field]: value
          }
        }
      }
    }))
    
    // 양방향 동기화: Expert → Advanced → Simple
    updateBandRatesFromPayZones(band, level, field as 'baseUp' | 'merit')
  }
  
  // PayZone 데이터로부터 Band×Level 평균 계산
  const updateBandRatesFromPayZones = (band: string, level: string, field: 'baseUp' | 'merit') => {
    if (!contextEmployeeData) return
    
    let totalWeighted = 0
    let totalCount = 0
    
    dynamicStructure.payZones.forEach(zone => {
      const empCount = contextEmployeeData.filter(
        emp => emp.payZone === zone && emp.band === band && emp.level === level
      ).length
      
      if (empCount > 0) {
        const rate = payZoneRates[zone]?.[band]?.[level]?.[field] || 
                    bandFinalRates[band]?.[level]?.[field] || 
                    levelRates[level]?.[field] || 0
        totalWeighted += rate * empCount
        totalCount += empCount
      }
    })
    
    if (totalCount > 0) {
      const avgRate = totalWeighted / totalCount
      
      // Advanced 레벨 업데이트
      setBandFinalRates(prev => ({
        ...prev,
        [band]: {
          ...prev[band],
          [level]: {
            ...(prev[band]?.[level] || {}),
            [field]: avgRate
          }
        }
      }))
      
      // Simple 레벨도 업데이트
      updateLevelRatesFromBands(level, field)
    }
  }
  
  // Pay Zone×Band 평균 급여 계산
  const calculateAverageSalary = (payZone: number, band: string) => {
    if (!contextEmployeeData) return 0
    
    const employees = contextEmployeeData.filter(
      emp => emp.payZone === payZone && emp.band === band
    )
    
    if (employees.length === 0) return 0
    
    const totalSalary = employees.reduce((sum, emp) => sum + (emp.currentSalary || 0), 0)
    return totalSalary / employees.length
  }
  
  // Pay Zone×Band 예산 영향 계산
  const calculateZoneBandBudget = (payZone: number, band: string) => {
    if (!contextEmployeeData) return 0
    
    const employees = contextEmployeeData.filter(
      emp => emp.payZone === payZone && emp.band === band
    )
    
    let totalIncrease = 0
    
    employees.forEach(emp => {
      const rates = payZoneRates[payZone]?.[band]?.[emp.level] || 
                   bandFinalRates[band]?.[emp.level] || 
                   levelRates[emp.level] || 
                   { baseUp: 0, merit: 0, additional: 0 }
      
      const totalRate = (rates.baseUp + rates.merit + (rates.additional || 0)) / 100
      totalIncrease += emp.currentSalary * totalRate
    })
    
    return totalIncrease * 1.178 // 간접비용 포함
  }
  
  // 예산 계산
  useEffect(() => {
    if (!contextEmployeeData || contextEmployeeData.length === 0) return
    
    let totalDirect = 0
    
    contextEmployeeData.forEach(emp => {
      const level = emp.level
      const band = emp.band
      const payZone = emp.payZone
      
      let rates: AdjustmentRates = { baseUp: 0, merit: 0, additional: 0 }
      
      // 모드에 따른 인상률 적용
      if (adjustmentMode === 'expert' && payZone !== undefined && payZoneRates[payZone]?.[band]?.[level]) {
        rates = payZoneRates[payZone][band][level]
      } else if (adjustmentMode === 'advanced' && band && bandFinalRates[band]?.[level]) {
        rates = {
          baseUp: bandFinalRates[band][level].baseUp,
          merit: bandFinalRates[band][level].merit,
          additional: 0
        }
      } else if (levelRates[level]) {
        rates = {
          baseUp: levelRates[level].baseUp,
          merit: levelRates[level].merit,
          additional: 0
        }
      }
      
      const totalRate = rates.baseUp + rates.merit + rates.additional
      const increase = emp.currentSalary * (totalRate / 100)
      totalDirect += increase
    })
    
    const totalIndirect = totalDirect * 0.178 // 간접비용 17.8%
    const total = totalDirect + totalIndirect
    const actualBudget = availableBudget - welfareBudget
    const remaining = actualBudget - total
    const percentage = actualBudget > 0 ? (total / actualBudget) * 100 : 0
    
    setBudgetUsage({
      direct: totalDirect,
      indirect: totalIndirect,
      total,
      remaining,
      percentage: Math.min(percentage, 200) // 최대 200%까지 표시
    })
  }, [contextEmployeeData, adjustmentMode, levelRates, bandFinalRates, payZoneRates, availableBudget, welfareBudget])
  
  // 총 인원수 계산
  const totalEmployees = contextEmployeeData?.length || 0
  
  return (
    <React.Fragment>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <main className="pt-20 pb-8">
        <div className="flex gap-6">
          {/* 좌측 메뉴 (bands 페이지에서 가져옴) */}
          <div className="w-80 bg-white rounded-lg shadow-sm h-fit p-4 ml-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">뷰 모드</h2>
            </div>
            <nav className="space-y-2">
              {/* 인상률 조정 버튼 */}
              <button
                onClick={() => setViewMode('adjustment')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                  viewMode === 'adjustment'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span className="font-semibold">인상률 조정</span>
                </div>
              </button>
              
              {/* 구분선 */}
              <div className="border-t border-gray-200 my-3"></div>
              
              {/* 종합 현황 버튼 */}
              <button
                onClick={() => setViewMode('all')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                  viewMode === 'all'
                    ? 'bg-gray-600 text-white shadow-md'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-semibold">종합 현황</span>
                </div>
              </button>
              
              {/* 구분선 */}
              <div className="border-t border-gray-200 my-3"></div>
              
              <h3 className="text-sm font-medium text-gray-500 px-2 mb-2">직군별 분석</h3>
              
              {/* 개별 직군들 */}
              {bandsData?.map((band) => (
                <button
                  key={band.id}
                  onClick={() => {
                    setViewMode('band')
                    setSelectedViewBand(band.name)
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                    viewMode === 'band' && selectedViewBand === band.name
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{band.name}</span>
                    <span className="text-sm font-medium">
                      {band.totalHeadcount.toLocaleString()}명
                    </span>
                  </div>
                </button>
              ))}
              
              {/* 구분선 */}
              <div className="border-t border-gray-200 my-3"></div>
              
              {/* 경쟁력 분석 버튼 */}
              <button
                onClick={() => setViewMode('competitiveness')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                  viewMode === 'competitiveness'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="font-semibold">경쟁력 분석</span>
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
            {viewMode === 'adjustment' ? (
              <>
                {/* 예산 현황 표시 (읽기 전용) */}
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
          
          {/* Simple Mode: Level별 조정 */}
          {adjustmentMode === 'simple' && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">직급별 인상률 조정</h2>
              
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
              
              {/* 일괄 조정 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">전체 일괄 조정</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Base-up</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="일괄 적용"
                      onChange={(e) => handleGlobalAdjustment('baseUp', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">성과인상률</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="일괄 적용"
                      onChange={(e) => handleGlobalAdjustment('merit', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">추가인상률</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="일괄 적용"
                      onChange={(e) => handleGlobalAdjustment('additional', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
              
              {/* 개별 Level 조정 */}
              <div className="space-y-4">
                {dynamicStructure.levels.map(level => {
                  const rates = levelRates[level] || { baseUp: 0, merit: 0 }
                  const levelCount = contextEmployeeData?.filter(emp => emp.level === level).length || 0
                  
                  return (
                    <div key={level} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">
                        {level} ({levelCount}명)
                      </h3>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Base-up (%)</label>
                          <input
                            type="number"
                            value={rates.baseUp}
                            onChange={(e) => handleLevelRateChange(level, 'baseUp', parseFloat(e.target.value) || 0)}
                            step="0.1"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">성과인상률 (%)</label>
                          <input
                            type="number"
                            value={rates.merit}
                            onChange={(e) => handleLevelRateChange(level, 'merit', parseFloat(e.target.value) || 0)}
                            step="0.1"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">추가인상률 (%)</label>
                          <input
                            type="number"
                            value={0}
                            onChange={(e) => handleLevelRateChange(level, 'additional', parseFloat(e.target.value) || 0)}
                            step="0.1"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">총 인상률</label>
                          <div className="px-2 py-1 text-sm font-semibold text-blue-600">
                            {formatPercentage(rates.baseUp + rates.merit)}
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
            <div className="space-y-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">
                  직군×직급별 인상률 조정 ({dynamicStructure.bands.length} × {dynamicStructure.levels.length} = {dynamicStructure.bands.length * dynamicStructure.levels.length}개)
                </h2>
                
                {/* 탭 네비게이션 */}
                <div className="border-b border-gray-200 mb-4">
                  <nav className="-mb-px flex space-x-8">
                    {dynamicStructure.bands.map((band, index) => (
                      <button
                        key={band}
                        onClick={() => setSelectedBand(band)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          selectedBand === band
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {band}
                      </button>
                    ))}
                  </nav>
                </div>
                
                {/* 선택된 직군 조정 패널 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">{selectedBand} 직군 인상률 조정</h3>
                    
                    {/* 직급별 조정 */}
                    {dynamicStructure.levels.map(level => {
                      const rates = bandFinalRates[selectedBand]?.[level] || levelRates[level] || { baseUp: 0, merit: 0 }
                      const empCount = contextEmployeeData?.filter(emp => emp.band === selectedBand && emp.level === level).length || 0
                      
                      return (
                        <div key={level} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">{level}</span>
                            <span className="text-sm text-gray-500">{empCount}명</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs text-gray-600">Base-up</label>
                              <input
                                type="number"
                                value={rates.baseUp}
                                onChange={(e) => handleBandLevelChange(selectedBand, level, 'baseUp', parseFloat(e.target.value) || 0)}
                                step="0.1"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600">성과</label>
                              <input
                                type="number"
                                value={rates.merit}
                                onChange={(e) => handleBandLevelChange(selectedBand, level, 'merit', parseFloat(e.target.value) || 0)}
                                step="0.1"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600">총계</label>
                              <div className="px-2 py-1 text-sm font-semibold text-blue-600">
                                {formatPercentage(rates.baseUp + rates.merit)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* 직군 요약 정보 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{selectedBand} 직군 요약</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">총 인원</span>
                        <span className="font-medium">
                          {contextEmployeeData?.filter(emp => emp.band === selectedBand).length || 0}명
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">평균 Base-up</span>
                        <span className="font-medium text-blue-600">
                          {formatPercentage(calculateBandAverage(selectedBand, 'baseUp'))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">평균 성과인상률</span>
                        <span className="font-medium text-green-600">
                          {formatPercentage(calculateBandAverage(selectedBand, 'merit'))}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm font-medium text-gray-700">평균 총 인상률</span>
                        <span className="font-semibold text-purple-600">
                          {formatPercentage(calculateBandAverage(selectedBand, 'baseUp') + calculateBandAverage(selectedBand, 'merit'))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Expert Mode: PayZone×Band×Level 조정 */}
          {adjustmentMode === 'expert' && (
            <div className="space-y-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Pay Zone×직군×직급별 인상률 조정 (실제 {getActualCombinationCount()}개 조합)
                </h2>
                
                {/* Pay Zone 선택 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pay Zone 선택</label>
                  <div className="flex gap-2">
                    {dynamicStructure.payZones.map(zone => (
                      <button
                        key={zone}
                        onClick={() => setSelectedPayZone(zone)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          selectedPayZone === zone
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Zone {zone}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Band 선택 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">직군 선택</label>
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto">
                      {dynamicStructure.bands.map(band => (
                        <button
                          key={band}
                          onClick={() => setSelectedBandExpert(band)}
                          className={`py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                            selectedBandExpert === band
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {band}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
                
                {/* 세부 조정 패널 */}
                {selectedPayZone !== null && selectedBandExpert && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">
                        Zone {selectedPayZone} - {selectedBandExpert} 인상률
                      </h3>
                      
                      {dynamicStructure.levels.map(level => {
                        const rates = payZoneRates[selectedPayZone]?.[selectedBandExpert]?.[level] || 
                                     bandFinalRates[selectedBandExpert]?.[level] || 
                                     levelRates[level] || 
                                     { baseUp: 0, merit: 0, additional: 0 }
                        const empCount = contextEmployeeData?.filter(
                          emp => emp.payZone === selectedPayZone && emp.band === selectedBandExpert && emp.level === level
                        ).length || 0
                        
                        // 직원이 없는 조합은 표시하지 않음
                        if (empCount === 0) return null
                        
                        return (
                          <div key={level} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-sm">{level}</span>
                              <span className="text-sm text-gray-500">{empCount}명</span>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <label className="block text-xs text-gray-600">Base-up</label>
                                <input
                                  type="number"
                                  value={rates.baseUp}
                                  onChange={(e) => handlePayZoneBandLevelChange(selectedPayZone, selectedBandExpert, level, 'baseUp', parseFloat(e.target.value) || 0)}
                                  step="0.1"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600">성과</label>
                                <input
                                  type="number"
                                  value={rates.merit}
                                  onChange={(e) => handlePayZoneBandLevelChange(selectedPayZone, selectedBandExpert, level, 'merit', parseFloat(e.target.value) || 0)}
                                  step="0.1"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600">추가</label>
                                <input
                                  type="number"
                                  value={rates.additional || 0}
                                  onChange={(e) => handlePayZoneBandLevelChange(selectedPayZone, selectedBandExpert, level, 'additional', parseFloat(e.target.value) || 0)}
                                  step="0.1"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600">총계</label>
                                <div className="px-2 py-1 text-sm font-semibold text-purple-600">
                                  {formatPercentage(rates.baseUp + rates.merit + (rates.additional || 0))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Pay Zone 요약 */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Zone {selectedPayZone} - {selectedBandExpert} 요약</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">해당 인원</span>
                          <span className="font-medium">
                            {contextEmployeeData?.filter(
                              emp => emp.payZone === selectedPayZone && emp.band === selectedBandExpert
                            ).length || 0}명
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">평균 급여</span>
                          <span className="font-medium">
                            {formatKoreanCurrency(
                              calculateAverageSalary(selectedPayZone, selectedBandExpert),
                              '만원',
                              10000
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-sm font-medium text-gray-700">예상 인상액</span>
                          <span className="font-semibold text-purple-600">
                            {formatKoreanCurrency(
                              calculateZoneBandBudget(selectedPayZone, selectedBandExpert),
                              '억원',
                              100000000
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
                {/* 예산 경고 알림 */}
                {budgetUsage.percentage > 100 && (
                  <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg animate-pulse">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-red-800">예산 초과 경고!</h3>
                        <p className="text-sm text-red-700 mt-1">
                          현재 설정은 예산을 {formatKoreanCurrency(Math.abs(budgetUsage.remaining), '억원', 100000000)} 초과합니다.
                          인상률을 조정하거나 대시보드에서 예산을 늘려주세요.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {budgetUsage.percentage > 80 && budgetUsage.percentage <= 100 && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-yellow-800">예산 주의</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          예산의 {budgetUsage.percentage.toFixed(1)}%를 사용 중입니다.
                          잔여 예산: {formatKoreanCurrency(budgetUsage.remaining, '억원', 100000000)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 예산 사용 현황 */}
                <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">예산 사용 현황</h2>
            
            <div className="space-y-4">
              {/* 프로그레스 바 */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">사용률</span>
                  <span className={`font-semibold ${
                    budgetUsage.percentage > 100 ? 'text-red-600' : 
                    budgetUsage.percentage > 80 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {budgetUsage.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      budgetUsage.percentage > 100
                        ? 'bg-red-600'
                        : budgetUsage.percentage > 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budgetUsage.percentage, 100)}%` }}
                  />
                </div>
                {budgetUsage.percentage > 100 && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-800">
                      예산 {formatKoreanCurrency(Math.abs(budgetUsage.remaining), '억원', 100000000)} 초과!
                    </p>
                  </div>
                )}
              </div>
              
              {/* 상세 내역 */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">직접 인건비</p>
                  <p className="text-lg font-semibold">{formatKoreanCurrency(budgetUsage.direct, '억원', 100000000)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">간접비용 (17.8%)</p>
                  <p className="text-lg font-semibold">{formatKoreanCurrency(budgetUsage.indirect, '억원', 100000000)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">총 사용 예산</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatKoreanCurrency(budgetUsage.total, '억원', 100000000)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">잔여 예산</p>
                  <p className={`text-lg font-semibold ${budgetUsage.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatKoreanCurrency(Math.abs(budgetUsage.remaining), '억원', 100000000)}
                    {budgetUsage.remaining < 0 && ' 초과'}
                  </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : viewMode === 'all' ? (
            /* 종합 현황 뷰 */
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">전체 직군 종합 현황</h2>
              {bandsData && (
                <PayBandCard
                  key="total"
                  bandId="total"
                  bandName="전체"
                  levels={[
                    ...dynamicStructure.levels.map(level => {
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
                        market: {
                          min: levelData.length > 0 ? Math.min(...levelData.map(l => l?.market?.min || 0)) : 0,
                          q1: levelData.reduce((sum, l) => sum + (l?.market?.q1 || 0) * (l?.headcount || 0), 0) / (totalHeadcount || 1),
                          median: levelData.reduce((sum, l) => sum + (l?.market?.median || 0) * (l?.headcount || 0), 0) / (totalHeadcount || 1),
                          q3: levelData.reduce((sum, l) => sum + (l?.market?.q3 || 0) * (l?.headcount || 0), 0) / (totalHeadcount || 1),
                          max: levelData.length > 0 ? Math.max(...levelData.map(l => l?.market?.max || 0)) : 0
                        },
                        company: {
                          median: levelData.reduce((sum, l) => sum + (l?.company?.median || 0) * (l?.headcount || 0), 0) / (totalHeadcount || 1),
                          mean: levelData.reduce((sum, l) => sum + (l?.company?.mean || 0) * (l?.headcount || 0), 0) / (totalHeadcount || 1),
                          values: levelData.flatMap(l => l?.company?.values || [])
                        },
                        competitor: {
                          median: levelData.reduce((sum, l) => sum + (l?.competitor?.median || 0) * (l?.headcount || 0), 0) / (totalHeadcount || 1)
                        }
                      }
                    })
                  ]}
                  initialBaseUp={3.2}
                  initialMerit={2.5}
                  levelRates={levelRates}
                  isReadOnly={true}
                  bands={bandsData}
                  onRateChange={(bandId, data) => {
                    console.log('Total band rate changed:', data)
                  }}
                />
              )}
            </div>
          ) : viewMode === 'band' ? (
            /* 개별 직군 뷰 - 조정된 인상률 적용 */
            <div className="space-y-6">
              {/* 조정 유도 버튼 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedViewBand} 직군 분석</h3>
                    <p className="text-sm text-gray-600 mt-1">인상률을 조정하려면 조정 모드로 이동하세요</p>
                  </div>
                  <button
                    onClick={() => setViewMode('adjustment')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    인상률 조정하기 →
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                {bandsData && (() => {
                  const selectedBandData = bandsData.find(band => band.name === selectedViewBand)
                  return selectedBandData ? (
                    <PayBandCard
                    key={selectedBandData.id}
                    bandId={selectedBandData.id}
                    bandName={selectedBandData.name}
                    levels={selectedBandData.levels.map(level => {
                      // 조정된 인상률을 적용하여 재계산
                      const adjustedRates = bandFinalRates[selectedViewBand]?.[level.level] || levelRates[level.level] || { baseUp: 0, merit: 0 }
                      return {
                        ...level,
                        baseUpRate: adjustedRates.baseUp,
                        // 기타 필요한 계산 추가
                      }
                    })}
                    initialBaseUp={3.2}
                    initialMerit={2.5}
                    levelRates={levelRates}
                    currentRates={bandFinalRates[selectedViewBand]}
                    // 읽기 전용 모드 - 조정 비활성화
                    readOnly={true}
                  />
                ) : (
                  <p className="text-gray-500">직군 데이터를 불러오는 중...</p>
                )
              })()}
            </div>
          ) : (
            /* 경쟁력 분석 뷰 - d1426af 버전 디자인 복원 (동적 연결 유지) */
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
    </React.Fragment>
  )
}