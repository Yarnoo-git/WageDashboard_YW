/**
 * 새로운 WageContext - 완전 재구성된 상태 관리
 * 단순화된 구조와 명확한 책임 분리
 */

'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { Employee } from '@/types/employee'
import { 
  AdjustmentMatrix, 
  MatrixCell, 
  RateValues,
  WeightedAverageResult,
  AdjustmentMode
} from '@/types/adjustmentMatrix'
import { PayZoneConfiguration } from '@/types/payZone'
import { payZoneService } from '@/services/payZoneService'
import {
  WeightedAverageCalculator,
  calculateBudgetUsage,
  createEmptyMatrix,
  updateMatrixStatistics,
  BudgetUsage
} from '@/utils/matrixCalculations'
import { BUDGET_CONFIG, STORAGE_KEYS } from '@/config/constants'
import { getCurrentFileId, loadExcelData } from '@/lib/clientStorage'

// Context 타입 정의
interface WageContextNewType {
  // === 1. 설정 데이터 ===
  config: {
    budget: {
      total: number
      welfare: number
      available: number  // total - welfare
    }
    payZone: PayZoneConfiguration
    additionalType: 'percentage' | 'amount'
  }
  
  // === 2. 원본 데이터 (읽기 전용) ===
  originalData: {
    employees: Employee[]
    competitorData: any[]
    competitorIncreaseRate?: number
    metadata: {
      bands: string[]
      levels: string[]
      grades: string[]
    }
    aiSettings: {
      baseUpPercentage: number
      meritIncreasePercentage: number
    }
  }
  
  // === 3. 조정 상태 (핵심) ===
  adjustment: {
    matrix: AdjustmentMatrix           // 현재 적용된 매트릭스
    pendingMatrix: AdjustmentMatrix | null  // 미적용 변경사항
    mode: AdjustmentMode              // 현재 조정 모드
    history: AdjustmentMatrix[]       // 실행 취소/다시 실행용
    historyIndex: number              // 현재 히스토리 위치
  }
  
  // === 4. 계산된 값 (파생 상태) ===
  computed: {
    budgetUsage: BudgetUsage
    weightedAverage: WeightedAverageResult
    pendingBudgetUsage?: BudgetUsage
    pendingWeightedAverage?: WeightedAverageResult
    statistics: {
      totalEmployees: number
      averageSalary: number
      byLevel: Record<string, number>
      byBand: Record<string, number>
      byGrade: Record<string, number>
    }
  }
  
  // === 5. 액션 ===
  actions: {
    // 매트릭스 조정
    updateCellGradeRate: (
      band: string, 
      level: string, 
      grade: string, 
      field: keyof RateValues, 
      value: number
    ) => void
    updateCellPayZoneRate: (
      band: string, 
      level: string, 
      grade: string, 
      zone: number, 
      field: keyof RateValues, 
      value: number
    ) => void
    updateAllCells: (rates: { [grade: string]: RateValues }) => void
    
    // 적용/취소
    applyPendingChanges: () => void
    discardPendingChanges: () => void
    undo: () => void
    redo: () => void
    reset: () => void
    
    // 설정 변경
    updateBudget: (total: number, welfare: number) => void
    updatePayZoneConfig: (config: PayZoneConfiguration) => void
    setAdditionalType: (type: 'percentage' | 'amount') => void
    setAdjustmentMode: (mode: AdjustmentMode) => void
    
    // 데이터 로드
    reloadEmployeeData: () => Promise<void>
  }
  
  // 상태 플래그
  isLoading: boolean
  hasChanges: boolean
  canUndo: boolean
  canRedo: boolean
}

// Context 생성
const WageContextNew = createContext<WageContextNewType | null>(null)

// Provider 컴포넌트
export function WageContextNewProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
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
    payZoneService.getConfig()
  )
  const [additionalType, setAdditionalType] = useState<'percentage' | 'amount'>('percentage')
  
  // === 조정 상태 ===
  const [matrix, setMatrix] = useState<AdjustmentMatrix | null>(null)
  const [pendingMatrix, setPendingMatrix] = useState<AdjustmentMatrix | null>(null)
  const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentMode>('all')
  const [history, setHistory] = useState<AdjustmentMatrix[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // === 초기 데이터 로드 ===
  useEffect(() => {
    loadInitialData()
  }, [])
  
  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      const fileId = getCurrentFileId()
      if (!fileId) {
        console.log('No file ID found')
        return
      }
      
      const data = await loadExcelData()
      if (!data || !data.employees || data.employees.length === 0) {
        console.log('No employee data found')
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
      console.error('Failed to load initial data:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // === 계산된 값 (Memoized) ===
  const budgetUsage = useMemo(() => {
    if (!matrix || employees.length === 0) {
      return {
        directCost: 0,
        indirectCost: 0,
        totalCost: 0,
        availableBudget: budget.available,
        usagePercentage: 0,
        remaining: budget.available,
        isOverBudget: false
      }
    }
    return calculateBudgetUsage(matrix, employees, budget.available, additionalType)
  }, [matrix, employees, budget.available, additionalType])
  
  const weightedAverage = useMemo(() => {
    if (!matrix || employees.length === 0) {
      return {
        totalAverage: { baseUp: 0, merit: 0, additional: 0 },
        details: [],
        summary: {
          totalEmployees: 0,
          totalSalary: 0,
          averageSalary: 0,
          effectiveRate: 0
        }
      }
    }
    const calculator = new WeightedAverageCalculator()
    return calculator.calculateMatrix(matrix, employees)
  }, [matrix, employees])
  
  const pendingBudgetUsage = useMemo(() => {
    if (!pendingMatrix || employees.length === 0) return undefined
    return calculateBudgetUsage(pendingMatrix, employees, budget.available, additionalType)
  }, [pendingMatrix, employees, budget.available, additionalType])
  
  const pendingWeightedAverage = useMemo(() => {
    if (!pendingMatrix || employees.length === 0) return undefined
    const calculator = new WeightedAverageCalculator()
    return calculator.calculateMatrix(pendingMatrix, employees)
  }, [pendingMatrix, employees])
  
  const statistics = useMemo(() => {
    const totalSalary = employees.reduce((sum, e) => sum + e.currentSalary, 0)
    const byLevel: Record<string, number> = {}
    const byBand: Record<string, number> = {}
    const byGrade: Record<string, number> = {}
    
    employees.forEach(emp => {
      if (emp.level) byLevel[emp.level] = (byLevel[emp.level] || 0) + 1
      if (emp.band) byBand[emp.band] = (byBand[emp.band] || 0) + 1
      if (emp.performanceRating) byGrade[emp.performanceRating] = (byGrade[emp.performanceRating] || 0) + 1
    })
    
    return {
      totalEmployees: employees.length,
      averageSalary: employees.length > 0 ? totalSalary / employees.length : 0,
      byLevel,
      byBand,
      byGrade
    }
  }, [employees])
  
  // === 액션들 ===
  const updateCellGradeRate = useCallback((
    band: string, 
    level: string, 
    grade: string, 
    field: keyof RateValues, 
    value: number
  ) => {
    if (!matrix) return
    
    // pending이 없으면 현재 matrix를 복사하여 생성
    const targetMatrix = pendingMatrix || JSON.parse(JSON.stringify(matrix))
    const cell = targetMatrix.cellMap[band]?.[level]
    
    if (cell) {
      if (!cell.gradeRates[grade]) {
        cell.gradeRates[grade] = { baseUp: 0, merit: 0, additional: 0 }
      }
      cell.gradeRates[grade][field] = value
      updateMatrixStatistics(targetMatrix, employees)
      setPendingMatrix(targetMatrix)
    }
  }, [matrix, pendingMatrix, employees])
  
  const updateCellPayZoneRate = useCallback((
    band: string, 
    level: string, 
    grade: string, 
    zone: number, 
    field: keyof RateValues, 
    value: number
  ) => {
    if (!matrix) return
    
    const targetMatrix = pendingMatrix || JSON.parse(JSON.stringify(matrix))
    const cell = targetMatrix.cellMap[band]?.[level]
    
    if (cell) {
      if (!cell.payZoneOverrides) cell.payZoneOverrides = {}
      if (!cell.payZoneOverrides[grade]) cell.payZoneOverrides[grade] = {}
      if (!cell.payZoneOverrides[grade][zone]) {
        cell.payZoneOverrides[grade][zone] = { baseUp: 0, merit: 0, additional: 0 }
      }
      cell.payZoneOverrides[grade][zone][field] = value
      updateMatrixStatistics(targetMatrix, employees)
      setPendingMatrix(targetMatrix)
    }
  }, [matrix, pendingMatrix, employees])
  
  const updateAllCells = useCallback((rates: { [grade: string]: RateValues }) => {
    if (!matrix) return
    
    const targetMatrix = pendingMatrix || JSON.parse(JSON.stringify(matrix))
    
    // 모든 셀에 동일한 비율 적용
    targetMatrix.cells.forEach((row: MatrixCell[]) => {
      row.forEach((cell: MatrixCell) => {
        Object.keys(rates).forEach(grade => {
          cell.gradeRates[grade] = { ...rates[grade] }
        })
      })
    })
    
    updateMatrixStatistics(targetMatrix, employees)
    setPendingMatrix(targetMatrix)
  }, [matrix, pendingMatrix, employees])
  
  const applyPendingChanges = useCallback(() => {
    if (!pendingMatrix) return
    
    // 히스토리에 추가
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(pendingMatrix)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    
    // 적용
    setMatrix(pendingMatrix)
    setPendingMatrix(null)
    
    // 저장
    localStorage.setItem(STORAGE_KEYS.ADJUSTMENT_MATRIX, JSON.stringify(pendingMatrix))
  }, [pendingMatrix, history, historyIndex])
  
  const discardPendingChanges = useCallback(() => {
    setPendingMatrix(null)
  }, [])
  
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousMatrix = history[historyIndex - 1]
      setMatrix(previousMatrix)
      setHistoryIndex(historyIndex - 1)
      setPendingMatrix(null)
    }
  }, [history, historyIndex])
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextMatrix = history[historyIndex + 1]
      setMatrix(nextMatrix)
      setHistoryIndex(historyIndex + 1)
      setPendingMatrix(null)
    }
  }, [history, historyIndex])
  
  const reset = useCallback(() => {
    if (!metadata.bands.length || !metadata.levels.length || !metadata.grades.length) return
    
    const emptyMatrix = createEmptyMatrix(
      metadata.bands,
      metadata.levels,
      metadata.grades
    )
    updateMatrixStatistics(emptyMatrix, employees)
    setMatrix(emptyMatrix)
    setPendingMatrix(null)
    setHistory([emptyMatrix])
    setHistoryIndex(0)
  }, [metadata, employees])
  
  const updateBudget = useCallback((total: number, welfare: number) => {
    setBudget({
      total,
      welfare,
      available: total - welfare
    })
  }, [])
  
  const updatePayZoneConfig = useCallback((config: PayZoneConfiguration) => {
    setPayZoneConfig(config)
    payZoneService.saveConfig(config)
  }, [])
  
  const reloadEmployeeData = useCallback(async () => {
    await loadInitialData()
  }, [])
  
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
    computed: {
      budgetUsage,
      weightedAverage,
      pendingBudgetUsage,
      pendingWeightedAverage,
      statistics
    },
    actions: {
      updateCellGradeRate,
      updateCellPayZoneRate,
      updateAllCells,
      applyPendingChanges,
      discardPendingChanges,
      undo,
      redo,
      reset,
      updateBudget,
      updatePayZoneConfig,
      setAdditionalType,
      setAdjustmentMode,
      reloadEmployeeData
    },
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