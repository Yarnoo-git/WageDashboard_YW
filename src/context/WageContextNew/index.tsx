/**
 * 새로운 WageContext - 리팩토링됨
 */

'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Employee } from '@/types/employee'
import { AdjustmentMatrix, AdjustmentMode } from '@/types/adjustmentMatrix'
import { PayZoneConfiguration } from '@/types/payZone'
import { getPayZoneService } from '@/services/payZoneService'
import { DEFAULT_PAY_ZONE_CONFIG } from '@/types/payZone'
import { createEmptyMatrix, updateMatrixStatistics } from '@/utils/matrixCalculations'
import { getCurrentFileId, loadExcelData } from '@/lib/clientStorage'
import { useWageActions } from './useWageActions'
import { useWageComputed } from './useWageComputed'

// Context 타입 정의
interface WageContextNewType {
  config: {
    budget: { total: number; welfare: number; available: number }
    payZone: PayZoneConfiguration
    additionalType: 'percentage' | 'amount'
  }
  originalData: {
    employees: Employee[]
    competitorData: any[]
    competitorIncreaseRate?: number
    metadata: { bands: string[]; levels: string[]; grades: string[] }
    aiSettings: { baseUpPercentage: number; meritIncreasePercentage: number }
  }
  adjustment: {
    matrix: AdjustmentMatrix
    pendingMatrix: AdjustmentMatrix | null
    mode: AdjustmentMode
    history: AdjustmentMatrix[]
    historyIndex: number
  }
  computed: any // useWageComputed에서 반환
  actions: any // useWageActions에서 반환
  isLoading: boolean
  hasChanges: boolean
  canUndo: boolean
  canRedo: boolean
}

const WageContextNew = createContext<WageContextNewType | null>(null)

export function WageContextNewProvider({ children }: { children: React.ReactNode }) {
  // === 기본 상태 ===
  const [isLoading, setIsLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [competitorData, setCompetitorData] = useState<any[]>([])
  const [competitorIncreaseRate, setCompetitorIncreaseRate] = useState<number>(0)
  const [metadata, setMetadata] = useState({
    bands: [] as string[],
    levels: [] as string[],
    grades: [] as string[]
  })
  const [aiSettings, setAiSettings] = useState({
    baseUpPercentage: 0,
    meritIncreasePercentage: 0
  })
  
  // === 설정 상태 ===
  const [budget, setBudget] = useState({
    total: 0,
    welfare: 0,
    available: 0
  })
  const [payZoneConfig, setPayZoneConfig] = useState<PayZoneConfiguration>(
    typeof window !== 'undefined' ? getPayZoneService().getConfig() : DEFAULT_PAY_ZONE_CONFIG
  )
  const [additionalType, setAdditionalType] = useState<'percentage' | 'amount'>('percentage')
  
  // === 조정 상태 ===
  const [matrix, setMatrix] = useState<AdjustmentMatrix | null>(null)
  const [pendingMatrix, setPendingMatrix] = useState<AdjustmentMatrix | null>(null)
  const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentMode>('all')
  const [history, setHistory] = useState<AdjustmentMatrix[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // === 초기 데이터 로드 ===
  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      const fileId = getCurrentFileId()
      if (!fileId) {
        // No file ID found
        return
      }
      
      const data = await loadExcelData()
      if (!data || !data.employees || data.employees.length === 0) {
        // No employee data found
        return
      }
      
      // 직원 데이터 설정
      setEmployees(data.employees)
      
      // 경쟁사 데이터 설정
      if (data.competitorData) {
        setCompetitorData(data.competitorData)
      }
      if (data.competitorIncreaseRate !== undefined) {
        setCompetitorIncreaseRate(data.competitorIncreaseRate)
      }
      
      // 메타데이터 추출
      const bands = Array.from(new Set(data.employees.map(e => e.band).filter(Boolean)))
      const levels = Array.from(new Set(data.employees.map(e => e.level).filter(Boolean)))
      const grades = Array.from(new Set(data.employees.map(e => e.performanceRating).filter(Boolean)))
      
      setMetadata({ bands, levels, grades })
      
      // AI 설정
      if (data.aiSettings) {
        setAiSettings({
          baseUpPercentage: data.aiSettings.baseUpPercentage || 0,
          meritIncreasePercentage: data.aiSettings.meritIncreasePercentage || 0
        })
      }
      
      // 예산 설정
      if ((data as any).budget) {
        const total = (data as any).budget.total || 0
        const welfare = (data as any).budget.welfare || 0
        setBudget({
          total,
          welfare,
          available: total - welfare
        })
      }
      
      // 빈 매트릭스 생성
      const emptyMatrix = createEmptyMatrix(bands, levels, grades)
      updateMatrixStatistics(emptyMatrix, data.employees)
      setMatrix(emptyMatrix)
      setHistory([emptyMatrix])
      setHistoryIndex(0)
      
    } catch (error) {
      // Failed to load initial data
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    loadInitialData()
  }, [])
  
  // === 액션 훅 사용 ===
  const actions = useWageActions({
    matrix,
    pendingMatrix,
    setPendingMatrix,
    setMatrix,
    employees,
    history,
    historyIndex,
    setHistory,
    setHistoryIndex,
    metadata,
    setBudget,
    setPayZoneConfig,
    setAdditionalType,
    setAdjustmentMode,
    loadInitialData
  })
  
  // === 계산 훅 사용 ===
  const computed = useWageComputed({
    matrix,
    pendingMatrix,
    employees,
    budget,
    additionalType
  })
  
  // === Context Value ===
  const contextValue: WageContextNewType = {
    config: {
      budget,
      payZone: payZoneConfig,
      additionalType
    },
    originalData: {
      employees,
      competitorData,
      competitorIncreaseRate,
      metadata,
      aiSettings
    },
    adjustment: {
      matrix: matrix!,
      pendingMatrix,
      mode: adjustmentMode,
      history,
      historyIndex
    },
    computed,
    actions,
    isLoading,
    hasChanges: pendingMatrix !== null,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1
  }
  
  return (
    <WageContextNew.Provider value={contextValue}>
      {children}
    </WageContextNew.Provider>
  )
}

// Hook
export function useWageContextNew() {
  const context = useContext(WageContextNew)
  if (!context) {
    throw new Error('useWageContextNew must be used within WageContextNewProvider')
  }
  return context
}