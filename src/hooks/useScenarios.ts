'use client'

import { useState, useEffect, useCallback } from 'react'
import { Scenario } from '@/types/scenario'

// 기본 시나리오 생성 함수 - AI 제안값 또는 0으로 초기화
function createDefaultScenario(aiData?: { baseUpPercentage?: number, meritIncreasePercentage?: number }): Scenario {
  const baseUp = aiData?.baseUpPercentage || 0
  const merit = aiData?.meritIncreasePercentage || 0
  const totalRate = baseUp + merit
  
  return {
    id: 'default',
    name: 'Default (AI 제안)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      baseUpRate: baseUp,
      meritRate: merit,
      levelRates: {
        'Lv.1': { baseUp, merit },
        'Lv.2': { baseUp, merit },
        'Lv.3': { baseUp, merit },
        'Lv.4': { baseUp, merit }
      },
      totalBudget: 0,
      promotionBudgets: { lv1: 0, lv2: 0, lv3: 0, lv4: 0 },
      additionalBudget: 0,
      enableAdditionalIncrease: false,
      calculatedAdditionalBudget: 0,
      levelTotalRates: {
        'Lv.1': totalRate,
        'Lv.2': totalRate,
        'Lv.3': totalRate,
        'Lv.4': totalRate
      },
      weightedAverageRate: totalRate,
      meritWeightedAverage: merit,
      detailedLevelRates: {
        'Lv.4': { baseUp, merit, promotion: 0, advancement: 0, additional: 0 },
        'Lv.3': { baseUp, merit, promotion: 0, advancement: 0, additional: 0 },
        'Lv.2': { baseUp, merit, promotion: 0, advancement: 0, additional: 0 },
        'Lv.1': { baseUp, merit, promotion: 0, advancement: 0, additional: 0 }
      }
    }
  }
}

export function useScenarios(
  aiData?: { baseUpPercentage?: number, meritIncreasePercentage?: number } | null,
  fileId?: string
) {
  // 초기에는 빈 배열로 시작하거나 AI 데이터가 있으면 사용
  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    if (aiData && (aiData.baseUpPercentage || aiData.meritIncreasePercentage)) {
      return [createDefaultScenario(aiData || undefined)]
    }
    return [createDefaultScenario()]
  })
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [prevAiData, setPrevAiData] = useState(aiData)

  // AI 데이터가 변경되면 Default 시나리오 업데이트
  useEffect(() => {
    // AI 데이터가 처음 로드되었거나 변경된 경우
    if (aiData && (
      !prevAiData || 
      aiData.baseUpPercentage !== prevAiData?.baseUpPercentage || 
      aiData.meritIncreasePercentage !== prevAiData?.meritIncreasePercentage
    )) {
      console.log('[useScenarios] AI 데이터 변경 감지:', aiData)
      setPrevAiData(aiData)
      // API에서 로드된 시나리오가 있으면 업데이트하지 않음
      // Default 시나리오는 API에서 이미 AI 값으로 설정되어 있음
      if (scenarios.length === 0 || !scenarios.find(s => s.id === 'default')) {
        updateDefaultScenario(aiData)
      }
    }
  }, [aiData, scenarios])

  // Load scenarios from localStorage on mount or when fileId/aiData changes
  useEffect(() => {
    loadScenariosFromStorage()
  }, [fileId, aiData])

  const loadScenariosFromStorage = async () => {
    try {
      // Use localStorage for client-side storage
      const storageKey = fileId ? `scenarios_${fileId}` : 'scenarios_default'
      const stored = localStorage.getItem(storageKey)
      
      if (stored) {
        const data = JSON.parse(stored)
        // Use scenarios from storage (including Default)
        const loadedScenarios = data.scenarios || []
        console.log('[loadScenariosFromStorage] 로드된 시나리오:', loadedScenarios)
        
        // Check for Default scenario and log it
        const defaultScenario = loadedScenarios.find((s: Scenario) => s.id === 'default')
        if (defaultScenario) {
          console.log('[loadScenariosFromStorage] Default 시나리오 발견:', {
            baseUp: defaultScenario.data.baseUpRate,
            merit: defaultScenario.data.meritRate
          })
        }
        
        setScenarios(loadedScenarios)
        setActiveScenarioId(data.activeScenarioId || null)
      } else {
        // No stored data, create default scenario
        setScenarios([createDefaultScenario(aiData || undefined)])
      }
    } catch (error) {
      console.error('Failed to load scenarios:', error)
      // On failure, maintain default scenario
      setScenarios([createDefaultScenario(aiData || undefined)])
    } finally {
      setLoading(false)
    }
  }

  const saveToStorage = async (scenariosData: Scenario[], activeId: string | null) => {
    try {
      const storageKey = fileId ? `scenarios_${fileId}` : 'scenarios_default'
      localStorage.setItem(storageKey, JSON.stringify({
        scenarios: scenariosData,
        activeScenarioId: activeId,
        fileId
      }))
    } catch (error) {
      console.error('Failed to save scenarios:', error)
    }
  }

  const saveScenario = async (name: string, data: Scenario['data']) => {
    console.log('[useScenarios] 시나리오 저장 - data.usedBudget:', data.usedBudget)
    const newScenario: Scenario = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data
    }
    
    try {
      // 기본 시나리오는 항상 첫 번째 위치 유지
      const nonDefaultScenarios = scenarios.filter(s => s.id !== 'default')
      const defaultScenario = scenarios.find(s => s.id === 'default') || createDefaultScenario(aiData || undefined)
      const updatedScenarios = [defaultScenario, ...nonDefaultScenarios, newScenario]
      
      // Save to localStorage
      await saveToStorage(updatedScenarios, newScenario.id)
      
      setScenarios(updatedScenarios)
      setActiveScenarioId(newScenario.id)
    } catch (error) {
      console.error('Failed to save scenario:', error)
    }
    
    return newScenario
  }

  const updateScenario = async (id: string, data: Partial<Scenario['data']>) => {
    const updatedScenarios = scenarios.map(scenario => {
      if (scenario.id === id) {
        return {
          ...scenario,
          data: { ...scenario.data, ...data },
          updatedAt: new Date().toISOString()
        }
      }
      return scenario
    })
    
    setScenarios(updatedScenarios)
    await saveToStorage(updatedScenarios, activeScenarioId)
  }

  const deleteScenario = async (id: string) => {
    // 기본 시나리오는 삭제 불가
    if (id === 'default') {
      console.warn('Cannot delete default scenario')
      return
    }
    
    try {
      const updatedScenarios = scenarios.filter(s => s.id !== id)
      const newActiveId = activeScenarioId === id ? null : activeScenarioId
      
      // Save to localStorage
      await saveToStorage(updatedScenarios, newActiveId)
      
      setScenarios(updatedScenarios)
      setActiveScenarioId(newActiveId)
    } catch (error) {
      console.error('Failed to delete scenario:', error)
    }
  }

  const loadScenario = (id: string) => {
    const scenario = scenarios.find(s => s.id === id)
    if (scenario) {
      setActiveScenarioId(id)
      saveToStorage(scenarios, id)
      return scenario.data
    }
    return null
  }

  const renameScenario = async (id: string, newName: string) => {
    const updatedScenarios = scenarios.map(scenario => {
      if (scenario.id === id) {
        return {
          ...scenario,
          name: newName,
          updatedAt: new Date().toISOString()
        }
      }
      return scenario
    })
    
    setScenarios(updatedScenarios)
    await saveToStorage(updatedScenarios, activeScenarioId)
  }

  // Default 시나리오를 AI 데이터로 업데이트하는 함수
  const updateDefaultScenario = useCallback((newAiData?: { baseUpPercentage?: number, meritIncreasePercentage?: number } | null) => {
    const dataToUse = newAiData || aiData
    console.log('[updateDefaultScenario] 업데이트할 AI 데이터:', dataToUse)
    const updatedDefaultScenario = createDefaultScenario(dataToUse || undefined)
    setScenarios(prevScenarios => {
      const nonDefaultScenarios = prevScenarios.filter(s => s.id !== 'default')
      return [updatedDefaultScenario, ...nonDefaultScenarios]
    })
    
    // 만약 현재 활성화된 시나리오가 default라면 데이터도 업데이트
    if (activeScenarioId === 'default') {
      return updatedDefaultScenario.data
    }
    return null
  }, [aiData, activeScenarioId])

  return {
    scenarios,
    activeScenarioId,
    saveScenario,
    updateScenario,
    deleteScenario,
    loadScenario,
    renameScenario,
    setActiveScenarioId,
    loading,
    updateDefaultScenario
  }
}