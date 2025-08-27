'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  loadGradeSettingsFromExcel, 
  getPerformanceWeights, 
  getLevelRates, 
  getDetailedLevelRates,
  GradeSettings 
} from '@/services/gradeSettingsService'
import { getCurrentFileId, loadExcelData } from '@/lib/clientStorage'

// 동적 평가등급 가중치 타입
type PerformanceWeights = { [key: string]: number }

// 직급별 기본 인상률
interface LevelRate {
  baseUp: number
  merit: number
}

// 직급별 상세 인상률
interface DetailedLevelRate extends LevelRate {
  promotion: number
  advancement: number
  additional: number
}

// 직군별 조정값
interface BandAdjustment {
  baseUpAdjustment: number
  meritAdjustment: number
}

// Pay Zone별 인상률
interface PayZoneRate {
  baseUp: number
  merit: number
  additional: number
}

interface RateContextType {
  // 엑셀에서 로드된 직급/평가등급 설정
  gradeSettings: GradeSettings | null
  
  // 대시보드에서 설정한 기본 인상률
  baseUpRate: number
  meritRate: number
  
  // 조정 모드
  adjustmentMode: 'simple' | 'advanced' | 'expert'
  
  // 평가등급별 Merit 가중치
  performanceWeights: PerformanceWeights
  
  // 직급별 개별 인상률
  levelRates: Record<string, LevelRate>
  
  // 직급별 상세 인상률
  detailedLevelRates: Record<string, DetailedLevelRate>
  
  // 직군별 조정값
  bandAdjustments: Record<string, BandAdjustment>
  
  // 직군별 최종 인상률
  bandFinalRates: Record<string, Record<string, LevelRate>>
  
  // Pay Zone별 인상률
  payZoneRates: Record<string, Record<string, Record<string, PayZoneRate>>>
  
  // 설정 업데이트 함수들
  setBaseUpRate: (rate: number) => void
  setMeritRate: (rate: number) => void
  setAdjustmentMode: (mode: 'simple' | 'advanced' | 'expert') => void
  setPerformanceWeights: (weights: PerformanceWeights) => void
  setLevelRates: (rates: Record<string, LevelRate>) => void
  setDetailedLevelRates: (rates: Record<string, DetailedLevelRate>) => void
  setBandAdjustments: (adjustments: Record<string, BandAdjustment>) => void
  setBandFinalRates: (rates: Record<string, Record<string, LevelRate>>) => void
  setPayZoneRates: (rates: Record<string, Record<string, Record<string, PayZoneRate>>>) => void
  
  // 데이터 로드 함수
  loadGradeSettings: () => Promise<void>
}

const RateContext = createContext<RateContextType | undefined>(undefined)

export function RateProvider({ children }: { children: ReactNode }) {
  const [gradeSettings, setGradeSettings] = useState<GradeSettings | null>(null)
  const [baseUpRate, setBaseUpRate] = useState(0)
  const [meritRate, setMeritRate] = useState(0)
  const [adjustmentMode, setAdjustmentMode] = useState<'simple' | 'advanced' | 'expert'>('simple')
  const [performanceWeights, setPerformanceWeights] = useState<PerformanceWeights>({})
  const [levelRates, setLevelRates] = useState<Record<string, LevelRate>>({})
  const [detailedLevelRates, setDetailedLevelRates] = useState<Record<string, DetailedLevelRate>>({})
  const [bandAdjustments, setBandAdjustments] = useState<Record<string, BandAdjustment>>({})
  const [bandFinalRates, setBandFinalRates] = useState<Record<string, Record<string, LevelRate>>>({})
  const [payZoneRates, setPayZoneRates] = useState<Record<string, Record<string, Record<string, PayZoneRate>>>>({})
  
  // 직급/평가등급 설정 로드
  const loadGradeSettings = async () => {
    try {
      const fileId = getCurrentFileId()
      if (!fileId) return
      
      const excelData = await loadExcelData()
      if (!excelData) return
      
      // Load settings from cached data or use default
      const settings = await loadGradeSettingsFromExcel()
      if (settings) {
        setGradeSettings(settings)
        
        // 평가등급 가중치 설정
        const weights = getPerformanceWeights(settings)
        setPerformanceWeights(weights)
        
        // 직급별 인상률 설정
        const rates = getLevelRates(settings)
        setLevelRates(rates)
        
        // 직급별 상세 인상률 설정
        const detailedRates = getDetailedLevelRates(settings)
        setDetailedLevelRates(detailedRates)
      }
    } catch (error) {
      console.error('[RateContext] 직급/평가등급 설정 로드 실패:', error)
    }
  }
  
  // 초기 로드
  useEffect(() => {
    loadGradeSettings()
  }, [])
  
  const value: RateContextType = {
    gradeSettings,
    baseUpRate,
    meritRate,
    adjustmentMode,
    performanceWeights,
    levelRates,
    detailedLevelRates,
    bandAdjustments,
    bandFinalRates,
    payZoneRates,
    setBaseUpRate,
    setMeritRate,
    setAdjustmentMode,
    setPerformanceWeights,
    setLevelRates,
    setDetailedLevelRates,
    setBandAdjustments,
    setBandFinalRates,
    setPayZoneRates,
    loadGradeSettings,
  }
  
  return (
    <RateContext.Provider value={value}>
      {children}
    </RateContext.Provider>
  )
}

export function useRateContext() {
  const context = useContext(RateContext)
  if (!context) {
    throw new Error('useRateContext must be used within a RateProvider')
  }
  return context
}