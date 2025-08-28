// WageContext 액션 훅

import { useCallback } from 'react'
import { RateValues, AdjustmentMatrix, MatrixCell } from '@/types/adjustmentMatrix'
import { PayZoneConfiguration } from '@/types/payZone'
import { Employee } from '@/types/employee'
import { updateMatrixStatistics, createEmptyMatrix } from '@/utils/matrixCalculations'
import { getPayZoneService } from '@/services/payZoneService'
import { STORAGE_KEYS } from '@/config/constants'

interface UseWageActionsParams {
  matrix: AdjustmentMatrix | null
  pendingMatrix: AdjustmentMatrix | null
  setPendingMatrix: (matrix: AdjustmentMatrix | null) => void
  setMatrix: (matrix: AdjustmentMatrix | null) => void
  employees: Employee[]
  history: AdjustmentMatrix[]
  historyIndex: number
  setHistory: (history: AdjustmentMatrix[]) => void
  setHistoryIndex: (index: number) => void
  metadata: { bands: string[]; levels: string[]; grades: string[] }
  setBudget: (budget: any) => void
  setPayZoneConfig: (config: PayZoneConfiguration) => void
  setAdditionalType: (type: 'percentage' | 'amount') => void
  setAdjustmentMode: (mode: any) => void
  loadInitialData: () => Promise<void>
}

export function useWageActions({
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
}: UseWageActionsParams) {
  
  const updateCellGradeRate = useCallback((
    band: string, 
    level: string, 
    grade: string, 
    field: keyof RateValues, 
    value: number
  ) => {
    if (!matrix) return
    
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
  }, [matrix, pendingMatrix, employees, setPendingMatrix])
  
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
  }, [matrix, pendingMatrix, employees, setPendingMatrix])
  
  const updateAllCells = useCallback((rates: { [grade: string]: RateValues }) => {
    if (!matrix) return
    
    const targetMatrix = pendingMatrix || JSON.parse(JSON.stringify(matrix))
    
    targetMatrix.cells.forEach((row: MatrixCell[]) => {
      row.forEach((cell: MatrixCell) => {
        Object.keys(rates).forEach(grade => {
          cell.gradeRates[grade] = { ...rates[grade] }
        })
      })
    })
    
    updateMatrixStatistics(targetMatrix, employees)
    setPendingMatrix(targetMatrix)
  }, [matrix, pendingMatrix, employees, setPendingMatrix])
  
  const applyPendingChanges = useCallback(() => {
    if (!pendingMatrix) return
    
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(pendingMatrix)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    
    setMatrix(pendingMatrix)
    setPendingMatrix(null)
    
    localStorage.setItem(STORAGE_KEYS.ADJUSTMENT_MATRIX, JSON.stringify(pendingMatrix))
  }, [pendingMatrix, history, historyIndex, setHistory, setHistoryIndex, setMatrix, setPendingMatrix])
  
  const discardPendingChanges = useCallback(() => {
    setPendingMatrix(null)
  }, [setPendingMatrix])
  
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousMatrix = history[historyIndex - 1]
      setMatrix(previousMatrix)
      setHistoryIndex(historyIndex - 1)
      setPendingMatrix(null)
    }
  }, [history, historyIndex, setMatrix, setHistoryIndex, setPendingMatrix])
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextMatrix = history[historyIndex + 1]
      setMatrix(nextMatrix)
      setHistoryIndex(historyIndex + 1)
      setPendingMatrix(null)
    }
  }, [history, historyIndex, setMatrix, setHistoryIndex, setPendingMatrix])
  
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
  }, [metadata, employees, setMatrix, setPendingMatrix, setHistory, setHistoryIndex])
  
  const updateBudget = useCallback((total: number, welfare: number) => {
    setBudget({
      total,
      welfare,
      available: total - welfare
    })
  }, [setBudget])
  
  const updatePayZoneConfig = useCallback((config: PayZoneConfiguration) => {
    setPayZoneConfig(config)
    if (typeof window !== 'undefined') {
      getPayZoneService().saveConfig(config)
    }
  }, [setPayZoneConfig])
  
  const reloadEmployeeData = useCallback(async () => {
    await loadInitialData()
  }, [loadInitialData])
  
  return {
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
  }
}