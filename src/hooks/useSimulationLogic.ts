// 시뮬레이션 페이지 비즈니스 로직 커스텀 훅

import { useState, useEffect } from 'react'
import { useWageContext } from '@/context/WageContext'
import { useDashboardData } from '@/hooks/useDashboardData'
import { 
  AdjustmentRates,
  DynamicStructure,
  BudgetUsage,
  ViewMode,
  AdjustmentMode,
  LevelRates,
  BandFinalRates,
  PayZoneRates
} from '@/types/simulation'
import {
  calculateBudgetUsage,
  updateBandRatesFromPayZones,
  updateLevelRatesFromBands,
  calculateAdvancedFromExpert,
  calculateSimpleFromExpert,
  getActualCombinationCount,
  calculateBandAverage,
  calculateAverageSalary,
  calculateZoneBandBudget
} from '@/utils/simulationHelpers'

export function useSimulationLogic() {
  const { data: dashboardData, loading } = useDashboardData()
  
  const {
    // 예산 관련
    availableBudget,
    welfareBudget,
    totalBudget,
    setAvailableBudget,
    setWelfareBudget,
    
    // 인상률 관련
    baseUpRate: contextBaseUpRate,
    meritRate: contextMeritRate,
    setBaseUpRate: setContextBaseUpRate,
    setMeritRate: setContextMeritRate,
    levelRates,
    setLevelRates,
    bandFinalRates,
    setBandFinalRates,
    payZoneRates,
    setPayZoneRates,
    adjustmentMode,
    setAdjustmentMode,
    
    // 직원 데이터
    contextEmployeeData,
    
    // 성과 가중치
    performanceWeights
  } = useWageContext()
  
  // 동적 구조 (Excel 데이터에서 추출)
  const [dynamicStructure, setDynamicStructure] = useState<DynamicStructure>({
    levels: [] as string[],
    bands: [] as string[],
    payZones: [] as number[]
  })
  
  // 계산된 예산 사용량
  const [budgetUsage, setBudgetUsage] = useState<BudgetUsage>({
    direct: 0,
    indirect: 0,
    total: 0,
    remaining: 0,
    percentage: 0
  })
  
  // View mode state (좌측 메뉴)
  const [viewMode, setViewMode] = useState<ViewMode>('adjustment')
  const [selectedViewBand, setSelectedViewBand] = useState<string>('')
  
  // Mode selection for components
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedBand, setSelectedBand] = useState<string>('')
  const [selectedPayZone, setSelectedPayZone] = useState<number | null>(null)
  const [selectedBandExpert, setSelectedBandExpert] = useState<string>('')
  
  // 평가가중치 모달 상태
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false)
  
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
  
  // Simple Mode: Level별 조정
  const handleLevelRateChange = (level: string, field: keyof AdjustmentRates, value: number) => {
    setLevelRates(prev => ({
      ...prev,
      [level]: {
        ...prev[level],
        [field]: value
      }
    }))
    
    // Top-down: Level → Band×Level → PayZone×Band×Level
    if (adjustmentMode === 'simple') {
      propagateToLowerModes(level, field as 'baseUp' | 'merit', value)
    }
  }
  
  // 하위 모드로 전파
  const propagateToLowerModes = (level: string, field: 'baseUp' | 'merit', value: number) => {
    // Band×Level 업데이트
    const newBandRates = { ...bandFinalRates }
    dynamicStructure.bands.forEach(band => {
      if (!newBandRates[band]) newBandRates[band] = {}
      if (!newBandRates[band][level]) newBandRates[band][level] = { baseUp: 0, merit: 0 }
      newBandRates[band][level][field] = value
    })
    setBandFinalRates(newBandRates)
    
    // PayZone×Band×Level 업데이트
    const newPayZoneRates = { ...payZoneRates }
    dynamicStructure.payZones.forEach(zone => {
      if (!newPayZoneRates[zone]) newPayZoneRates[zone] = {}
      dynamicStructure.bands.forEach(band => {
        if (!newPayZoneRates[zone][band]) newPayZoneRates[zone][band] = {}
        if (!newPayZoneRates[zone][band][level]) {
          newPayZoneRates[zone][band][level] = { baseUp: 0, merit: 0, additional: 0 }
        }
        newPayZoneRates[zone][band][level][field] = value
      })
    })
    setPayZoneRates(newPayZoneRates)
  }
  
  // 전체 일괄 조정
  const handleGlobalAdjustment = (field: keyof AdjustmentRates, value: number) => {
    if (field === 'additional') {
      // additional은 Simple 모드에서 지원하지 않음
      return
    }
    
    const newRates: LevelRates = {}
    dynamicStructure.levels.forEach(level => {
      newRates[level] = {
        ...levelRates[level],
        [field]: value
      }
    })
    setLevelRates(newRates)
    updateGlobalRates(newRates)
  }
  
  // 전역 업데이트
  const updateGlobalRates = (rates: LevelRates) => {
    const avgBaseUp = Object.values(rates).reduce((sum, r) => sum + r.baseUp, 0) / Object.keys(rates).length
    const avgMerit = Object.values(rates).reduce((sum, r) => sum + r.merit, 0) / Object.keys(rates).length
    setContextBaseUpRate(avgBaseUp)
    setContextMeritRate(avgMerit)
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
    
    // 양방향 동기화
    updateLevelRatesFromBandsWrapper(level, field)
  }
  
  // Band 데이터로부터 Level 평균 계산 래퍼
  const updateLevelRatesFromBandsWrapper = (level: string, field: 'baseUp' | 'merit') => {
    const avgRate = updateLevelRatesFromBands(
      level,
      field,
      contextEmployeeData,
      dynamicStructure,
      bandFinalRates,
      levelRates
    )
    
    if (avgRate !== null) {
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
      updateAdvancedFromExpertWrapper(newPayZoneRates)
      updateSimpleFromExpertWrapper(newPayZoneRates)
    }
  }
  
  // Expert → Advanced 동기화 래퍼
  const updateAdvancedFromExpertWrapper = (expertRates: PayZoneRates) => {
    const newBandRates = calculateAdvancedFromExpert(
      expertRates,
      contextEmployeeData,
      dynamicStructure
    )
    setBandFinalRates(newBandRates)
  }
  
  // Expert → Simple 동기화 래퍼
  const updateSimpleFromExpertWrapper = (expertRates: PayZoneRates) => {
    const newLevelRates = calculateSimpleFromExpert(
      expertRates,
      contextEmployeeData,
      dynamicStructure
    )
    setLevelRates(newLevelRates)
    updateGlobalRates(newLevelRates)
  }
  
  // Expert Mode 핸들러
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
    updateBandRatesFromPayZonesWrapper(band, level, field as 'baseUp' | 'merit')
  }
  
  // PayZone 데이터로부터 Band×Level 평균 계산 래퍼
  const updateBandRatesFromPayZonesWrapper = (band: string, level: string, field: 'baseUp' | 'merit') => {
    const avgRate = updateBandRatesFromPayZones(
      band,
      level,
      field,
      contextEmployeeData,
      dynamicStructure,
      payZoneRates,
      bandFinalRates,
      levelRates
    )
    
    if (avgRate !== null) {
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
      updateLevelRatesFromBandsWrapper(level, field)
    }
  }
  
  // 예산 계산
  useEffect(() => {
    const usage = calculateBudgetUsage(
      contextEmployeeData,
      adjustmentMode,
      levelRates,
      bandFinalRates,
      payZoneRates,
      availableBudget,
      welfareBudget
    )
    setBudgetUsage(usage)
  }, [contextEmployeeData, adjustmentMode, levelRates, bandFinalRates, payZoneRates, availableBudget, welfareBudget])
  
  // 헬퍼 함수들 래퍼
  const getActualCombinationCountWrapper = () => {
    return getActualCombinationCount(contextEmployeeData, adjustmentMode)
  }
  
  const calculateBandAverageWrapper = (band: string, field: 'baseUp' | 'merit') => {
    return calculateBandAverage(
      band,
      field,
      contextEmployeeData,
      dynamicStructure,
      bandFinalRates,
      levelRates
    )
  }
  
  const calculateAverageSalaryWrapper = (payZone: number, band: string) => {
    return calculateAverageSalary(payZone, band, contextEmployeeData)
  }
  
  const calculateZoneBandBudgetWrapper = (payZone: number, band: string) => {
    return calculateZoneBandBudget(
      payZone,
      band,
      contextEmployeeData,
      payZoneRates,
      bandFinalRates,
      levelRates
    )
  }
  
  return {
    // Context data
    loading,
    dashboardData,
    contextEmployeeData,
    availableBudget,
    welfareBudget,
    totalBudget,
    setAvailableBudget,
    setWelfareBudget,
    contextBaseUpRate,
    contextMeritRate,
    setContextBaseUpRate,
    setContextMeritRate,
    levelRates,
    setLevelRates,
    bandFinalRates,
    setBandFinalRates,
    payZoneRates,
    setPayZoneRates,
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
    getActualCombinationCount: getActualCombinationCountWrapper,
    calculateBandAverage: calculateBandAverageWrapper,
    calculateAverageSalary: calculateAverageSalaryWrapper,
    calculateZoneBandBudget: calculateZoneBandBudgetWrapper,
    
    // Total employees
    totalEmployees: contextEmployeeData?.length || 0
  }
}