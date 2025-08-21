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

  // Load scenarios from API on mount or when fileId/aiData changes
  useEffect(() => {
    loadScenariosFromAPI()
  }, [fileId, aiData])

  const loadScenariosFromAPI = async () => {
    try {
      // AI 설정을 query parameter로 추가
      let url = fileId ? `/api/scenarios?fileId=${fileId}` : '/api/scenarios'
      if (aiData) {
        const baseUp = aiData.baseUpPercentage || 0
        const merit = aiData.meritIncreasePercentage || 0
        url += `${url.includes('?') ? '&' : '?'}baseUp=${baseUp}&merit=${merit}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        // API에서 불러온 시나리오 사용 (Default 포함)
        const loadedScenarios = data.scenarios || []
        console.log('[loadScenariosFromAPI] 로드된 시나리오:', loadedScenarios)
        
        // Default 시나리오가 있는지 확인하고 콘솔에 출력
        const defaultScenario = loadedScenarios.find((s: Scenario) => s.id === 'default')
        if (defaultScenario) {
          console.log('[loadScenariosFromAPI] Default 시나리오 발견:', {
            baseUp: defaultScenario.data.baseUpRate,
            merit: defaultScenario.data.meritRate
          })
        }
        
        setScenarios(loadedScenarios)
        setActiveScenarioId(data.activeScenarioId || null)
      }
    } catch (error) {
      console.error('Failed to load scenarios:', error)
      // API 실패시에도 기본 시나리오는 유지
      setScenarios([createDefaultScenario(aiData || undefined)])
    } finally {
      setLoading(false)
    }
  }

  const saveToAPI = async (scenariosData: Scenario[], activeId: string | null) => {
    try {
      await fetch('/api/scenarios', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarios: scenariosData,
          activeScenarioId: activeId,
          fileId
        })
      })
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
      const response = await fetch('/api/scenarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario: newScenario,
          fileId
        })
      })
      
      if (response.ok) {
        // 기본 시나리오는 항상 첫 번째 위치 유지
        const nonDefaultScenarios = scenarios.filter(s => s.id !== 'default')
        const defaultScenario = scenarios.find(s => s.id === 'default') || createDefaultScenario(aiData || undefined)
        const updatedScenarios = [defaultScenario, ...nonDefaultScenarios, newScenario]
        setScenarios(updatedScenarios)
        setActiveScenarioId(newScenario.id)
      }
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
    await saveToAPI(updatedScenarios, activeScenarioId)
  }

  const deleteScenario = async (id: string) => {
    // 기본 시나리오는 삭제 불가
    if (id === 'default') {
      console.warn('Cannot delete default scenario')
      return
    }
    
    try {
      const url = fileId ? `/api/scenarios?id=${id}&fileId=${fileId}` : `/api/scenarios?id=${id}`
      const response = await fetch(url, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const updatedScenarios = scenarios.filter(s => s.id !== id)
        const newActiveId = activeScenarioId === id ? null : activeScenarioId
        
        setScenarios(updatedScenarios)
        setActiveScenarioId(newActiveId)
      }
    } catch (error) {
      console.error('Failed to delete scenario:', error)
    }
  }

  const loadScenario = (id: string) => {
    const scenario = scenarios.find(s => s.id === id)
    if (scenario) {
      setActiveScenarioId(id)
      saveToAPI(scenarios, id)
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
    await saveToAPI(updatedScenarios, activeScenarioId)
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