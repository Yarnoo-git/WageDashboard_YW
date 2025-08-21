'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useScenarios } from '@/hooks/useScenarios'
import { Scenario } from '@/types/scenario'
import { getCurrentFileId, loadExcelData } from '@/lib/clientStorage'

interface PerformanceWeights {
  ST: number
  AT: number
  OT: number
  BT: number
}

interface WageContextType {
  // 대시보드에서 설정한 기본 인상률
  baseUpRate: number
  meritRate: number
  
  // 예산 관리 (분리)
  availableBudget: number  // 사용가능 예산
  welfareBudget: number    // 복리후생 예산
  totalBudget: number      // 총 예산 (기존 호환용)
  
  // 조정 모드
  adjustmentMode: 'simple' | 'advanced' | 'expert'
  
  // 평가등급별 Merit 가중치
  performanceWeights: PerformanceWeights
  
  // 직급별 개별 인상률
  levelRates: {
    [level: string]: {
      baseUp: number
      merit: number
    }
  }
  
  // 직급별 상세 인상률 (promotion, advancement, additional 포함)
  detailedLevelRates: {
    [level: string]: {
      baseUp: number
      merit: number
      promotion: number
      advancement: number
      additional: number
    }
  }
  
  // 직군별 조정값 (PAY-BAND 페이지 슬라이더)
  bandAdjustments: {
    [bandName: string]: {
      baseUpAdjustment: number
      meritAdjustment: number
    }
  }
  
  // 직군별 최종 인상률 (Pay Band에서 조정된 값)
  bandFinalRates: {
    [bandName: string]: {
      [level: string]: {
        baseUp: number
        merit: number
      }
    }
  }
  
  // Pay Zone별 인상률 (Expert 모드)
  payZoneRates: {
    [payZone: string]: {
      [bandName: string]: {
        [level: string]: {
          baseUp: number
          merit: number
          additional: number
        }
      }
    }
  }
  
  // 직원별 성과 가중치 (직원관리 페이지)
  employeeWeights: {
    [employeeId: string]: {
      performanceRating: string
      meritMultiplier: number
    }
  }
  
  // 직원 데이터 (Pay Zone 포함)
  contextEmployeeData: any[]
  
  // 설정 업데이트 함수들
  setBaseUpRate: (rate: number) => void
  setMeritRate: (rate: number) => void
  setAvailableBudget: (budget: number) => void
  setWelfareBudget: (budget: number) => void
  setTotalBudget: (budget: number) => void
  setAdjustmentMode: (mode: 'simple' | 'advanced' | 'expert') => void
  setPerformanceWeights: (weights: PerformanceWeights) => void
  setLevelRates: (rates: any) => void
  setDetailedLevelRates: (rates: any) => void
  setBandAdjustments: React.Dispatch<React.SetStateAction<{
    [bandName: string]: {
      baseUpAdjustment: number
      meritAdjustment: number
    }
  }>>
  setBandFinalRates: React.Dispatch<React.SetStateAction<{
    [bandName: string]: {
      [level: string]: {
        baseUp: number
        merit: number
      }
    }
  }>>
  setPayZoneRates: React.Dispatch<React.SetStateAction<{
    [payZone: string]: {
      [bandName: string]: {
        [level: string]: {
          baseUp: number
          merit: number
          additional: number
        }
      }
    }
  }>>
  setEmployeeWeights: React.Dispatch<React.SetStateAction<{
    [employeeId: string]: {
      performanceRating: string
      meritMultiplier: number
    }
  }>>
  setContextEmployeeData: React.Dispatch<React.SetStateAction<any[]>>
  
  // 시나리오 관리
  scenarios: Scenario[]
  activeScenarioId: string | null
  saveScenario: (name: string, additionalData?: { usedBudget?: number }) => Promise<Scenario>
  loadScenario: (id: string) => void
  deleteScenario: (id: string) => Promise<void>
  renameScenario: (id: string, newName: string) => Promise<void>
  
  // TO-BE 급여 계산 함수
  calculateToBeSalary: (
    currentSalary: number,
    level: string,
    performanceRating?: string,
    band?: string
  ) => number
}

const WageContext = createContext<WageContextType | undefined>(undefined)

export function WageProvider({ children }: { children: ReactNode }) {
  // 기본값 설정 - 모두 0으로 초기화
  const [baseUpRate, setBaseUpRate] = useState(0)
  const [meritRate, setMeritRate] = useState(0)
  const [availableBudget, setAvailableBudget] = useState(30000000000) // 300억 기본값
  const [welfareBudget, setWelfareBudget] = useState(5000000000) // 50억 기본값
  const [totalBudget, setTotalBudget] = useState(25000000000) // 250억 (available - welfare)
  const [adjustmentMode, setAdjustmentMode] = useState<'simple' | 'advanced' | 'expert'>('simple')
  
  // 예산 자동 계산
  useEffect(() => {
    setTotalBudget(availableBudget - welfareBudget)
  }, [availableBudget, welfareBudget])
  const [aiSettings, setAiSettings] = useState<{ baseUpPercentage?: number, meritIncreasePercentage?: number } | null>(null)
  const [performanceWeights, setPerformanceWeights] = useState<PerformanceWeights>({
    ST: 1.5,
    AT: 1.2,
    OT: 1.0,
    BT: 0.8
  })
  const [levelRates, setLevelRates] = useState({
    'Lv.1': { baseUp: 0, merit: 0 },
    'Lv.2': { baseUp: 0, merit: 0 },
    'Lv.3': { baseUp: 0, merit: 0 },
    'Lv.4': { baseUp: 0, merit: 0 }
  })
  const [detailedLevelRates, setDetailedLevelRates] = useState({
    'Lv.1': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 },
    'Lv.2': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 },
    'Lv.3': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 },
    'Lv.4': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 }
  })
  const [bandAdjustments, setBandAdjustments] = useState<{
    [bandName: string]: {
      baseUpAdjustment: number
      meritAdjustment: number
    }
  }>({})
  const [bandFinalRates, setBandFinalRates] = useState<{
    [bandName: string]: {
      [level: string]: {
        baseUp: number
        merit: number
      }
    }
  }>({})
  const [employeeWeights, setEmployeeWeights] = useState<{
    [employeeId: string]: {
      performanceRating: string
      meritMultiplier: number
    }
  }>({})
  const [payZoneRates, setPayZoneRates] = useState<{
    [payZone: string]: {
      [bandName: string]: {
        [level: string]: {
          baseUp: number
          merit: number
          additional: number
        }
      }
    }
  }>({})
  const [contextEmployeeData, setContextEmployeeData] = useState<any[]>([])
  const [hasLoadedActiveScenario, setHasLoadedActiveScenario] = useState(false)
  const [currentFileId, setCurrentFileId] = useState<string | undefined>(undefined)
  
  // 파일 ID 가져오기 및 변경 감지
  useEffect(() => {
    const checkFileId = () => {
      const fileId = getCurrentFileId()
      if (fileId && fileId !== currentFileId) {
        console.log('[WageContext] 파일 ID 변경 감지:', fileId)
        setCurrentFileId(fileId)
      }
    }
    
    // 초기 체크
    checkFileId()
    
    // 주기적으로 파일 ID 변경 체크 (storage 이벤트가 없는 경우를 위해)
    const interval = setInterval(checkFileId, 1000)
    
    return () => clearInterval(interval)
  }, [currentFileId])
  
  // AI 설정 값 가져오기 - IndexedDB에서 직접 읽기 (파일 ID 변경 시 재로드)
  useEffect(() => {
    const fetchAISettings = async () => {
      try {
        // IndexedDB에서 클라이언트 데이터 직접 읽기
        const clientData = await loadExcelData()
        
        // 직원 데이터 로드 (Pay Zone 포함)
        if (clientData?.employees) {
          setContextEmployeeData(clientData.employees)
          console.log('[WageContext] 직원 데이터 로드:', clientData.employees.length, '명')
        }
        
        if (clientData?.aiSettings) {
          const newAiSettings = {
            baseUpPercentage: clientData.aiSettings.baseUpPercentage || 0,
            meritIncreasePercentage: clientData.aiSettings.meritIncreasePercentage || 0
          }
          setAiSettings(newAiSettings)
          console.log('[WageContext] 클라이언트 AI 설정 로드:', newAiSettings, 'FileID:', currentFileId)
          
          // AI 설정이 로드되면 기본 인상률도 설정
          // 새 파일이 로드되면 항상 AI 값으로 재설정
          setBaseUpRate(newAiSettings.baseUpPercentage)
          setMeritRate(newAiSettings.meritIncreasePercentage)
          
          // 직급별 인상률도 AI 값으로 초기화
          const aiLevelRates = {
            'Lv.1': { baseUp: newAiSettings.baseUpPercentage, merit: newAiSettings.meritIncreasePercentage },
            'Lv.2': { baseUp: newAiSettings.baseUpPercentage, merit: newAiSettings.meritIncreasePercentage },
            'Lv.3': { baseUp: newAiSettings.baseUpPercentage, merit: newAiSettings.meritIncreasePercentage },
            'Lv.4': { baseUp: newAiSettings.baseUpPercentage, merit: newAiSettings.meritIncreasePercentage }
          }
          setLevelRates(aiLevelRates)
          
          const aiDetailedRates = {
            'Lv.1': { baseUp: newAiSettings.baseUpPercentage, merit: newAiSettings.meritIncreasePercentage, promotion: 0, advancement: 0, additional: 0 },
            'Lv.2': { baseUp: newAiSettings.baseUpPercentage, merit: newAiSettings.meritIncreasePercentage, promotion: 0, advancement: 0, additional: 0 },
            'Lv.3': { baseUp: newAiSettings.baseUpPercentage, merit: newAiSettings.meritIncreasePercentage, promotion: 0, advancement: 0, additional: 0 },
            'Lv.4': { baseUp: newAiSettings.baseUpPercentage, merit: newAiSettings.meritIncreasePercentage, promotion: 0, advancement: 0, additional: 0 }
          }
          setDetailedLevelRates(aiDetailedRates)
        } else {
          console.log('[WageContext] 클라이언트 데이터 없음')
          // 데이터가 없으면 모두 0으로 초기화
          setAiSettings(null)
          setBaseUpRate(0)
          setMeritRate(0)
          setLevelRates({
            'Lv.1': { baseUp: 0, merit: 0 },
            'Lv.2': { baseUp: 0, merit: 0 },
            'Lv.3': { baseUp: 0, merit: 0 },
            'Lv.4': { baseUp: 0, merit: 0 }
          })
          setDetailedLevelRates({
            'Lv.1': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 },
            'Lv.2': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 },
            'Lv.3': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 },
            'Lv.4': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 }
          })
        }
      } catch (error) {
        console.error('Failed to fetch AI settings from IndexedDB:', error)
      }
    }
    
    // currentFileId가 변경될 때마다 AI 설정 다시 로드
    if (currentFileId) {
      fetchAISettings()
    }
  }, [currentFileId])

  // 시나리오 관리 - AI 데이터와 파일 ID 전달
  const {
    scenarios,
    activeScenarioId,
    saveScenario: saveScenarioHook,
    loadScenario: loadScenarioHook,
    deleteScenario: deleteScenarioHook,
    renameScenario: renameScenarioHook,
    updateDefaultScenario
  } = useScenarios(aiSettings, currentFileId)
  
  
  // localStorage에서 저장된 값 불러오기 (activeScenarioId가 없을 때만)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 먼저 저장된 activeScenarioId 확인
      const scenariosData = localStorage.getItem('scenarios')
      let hasActiveScenario = false
      
      if (scenariosData) {
        try {
          const parsed = JSON.parse(scenariosData)
          hasActiveScenario = !!parsed.activeScenarioId
        } catch (e) {
          console.error('Failed to parse scenarios data:', e)
        }
      }
      
      // activeScenarioId가 없을 때만 localStorage의 wageSettings 로드
      if (!hasActiveScenario) {
        const savedState = localStorage.getItem('wageSettings')
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState)
            setBaseUpRate(parsed.baseUpRate ?? 0)
            setMeritRate(parsed.meritRate ?? 0)
            setPerformanceWeights(parsed.performanceWeights ?? {
              ST: 1.5, AT: 1.2, OT: 1.0, BT: 0.8
            })
            setLevelRates(parsed.levelRates ?? {
              'Lv.1': { baseUp: 0, merit: 0 },
              'Lv.2': { baseUp: 0, merit: 0 },
              'Lv.3': { baseUp: 0, merit: 0 },
              'Lv.4': { baseUp: 0, merit: 0 }
            })
            setDetailedLevelRates(parsed.detailedLevelRates ?? {
              'Lv.1': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 },
              'Lv.2': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 },
              'Lv.3': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 },
              'Lv.4': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 }
            })
            setBandAdjustments(parsed.bandAdjustments ?? {})
            setBandFinalRates(parsed.bandFinalRates ?? {})
            setEmployeeWeights(parsed.employeeWeights ?? {})
            setTotalBudget(parsed.totalBudget ?? 0)
          } catch (e) {
            console.error('Failed to parse saved wage settings:', e)
          }
        }
      }
    }
  }, [])
  
  // 값이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stateToSave = {
        baseUpRate,
        meritRate,
        performanceWeights,
        levelRates,
        detailedLevelRates,
        bandAdjustments,
        bandFinalRates,
        employeeWeights,
        totalBudget
      }
      localStorage.setItem('wageSettings', JSON.stringify(stateToSave))
    }
  }, [baseUpRate, meritRate, performanceWeights, levelRates, detailedLevelRates, bandAdjustments, bandFinalRates, employeeWeights, totalBudget])
  
  // 시나리오 저장
  const saveScenario = async (name: string, additionalData?: { usedBudget?: number }) => {
    const scenarioData = {
      baseUpRate,
      meritRate,
      levelRates,
      detailedLevelRates,
      totalBudget,
      usedBudget: additionalData?.usedBudget,
      bandAdjustments,
      employeeWeights,
      performanceWeights
    }
    return await saveScenarioHook(name, scenarioData)
  }
  
  // 시나리오 불러오기
  const loadScenario = (id: string) => {
    console.log('[loadScenario] 호출됨:', id)
    
    // 플래그 리셋 (다른 시나리오 선택 시 자동 로드 가능하도록)
    if (activeScenarioId !== id) {
      setHasLoadedActiveScenario(false)
    }
    
    // Default 시나리오 로드 시 AI 데이터가 있으면 먼저 업데이트
    if (id === 'default' && aiSettings && updateDefaultScenario) {
      const updatedData = updateDefaultScenario(aiSettings)
      if (updatedData) {
        setBaseUpRate(updatedData.baseUpRate || 0)
        setMeritRate(updatedData.meritRate || 0)
        
        // Default 시나리오는 AI 값으로 직급별 인상률 설정
        const aiLevelRates = {
          'Lv.1': { baseUp: updatedData.baseUpRate || 0, merit: updatedData.meritRate || 0 },
          'Lv.2': { baseUp: updatedData.baseUpRate || 0, merit: updatedData.meritRate || 0 },
          'Lv.3': { baseUp: updatedData.baseUpRate || 0, merit: updatedData.meritRate || 0 },
          'Lv.4': { baseUp: updatedData.baseUpRate || 0, merit: updatedData.meritRate || 0 }
        }
        setLevelRates(aiLevelRates)
        
        const aiDetailedRates = {
          'Lv.1': { baseUp: updatedData.baseUpRate || 0, merit: updatedData.meritRate || 0, promotion: 0, advancement: 0, additional: 0 },
          'Lv.2': { baseUp: updatedData.baseUpRate || 0, merit: updatedData.meritRate || 0, promotion: 0, advancement: 0, additional: 0 },
          'Lv.3': { baseUp: updatedData.baseUpRate || 0, merit: updatedData.meritRate || 0, promotion: 0, advancement: 0, additional: 0 },
          'Lv.4': { baseUp: updatedData.baseUpRate || 0, merit: updatedData.meritRate || 0, promotion: 0, advancement: 0, additional: 0 }
        }
        setDetailedLevelRates(aiDetailedRates)
        
        setTotalBudget(updatedData.totalBudget || 0)
        setBandAdjustments({})
        setEmployeeWeights({})
        setPerformanceWeights({
          ST: 1.5,
          AT: 1.2,
          OT: 1.0,
          BT: 0.8
        })
        return
      }
    }
    
    // 일반 시나리오 로드
    const scenarioData = loadScenarioHook(id)
    console.log('[loadScenario] 시나리오 데이터:', scenarioData)
    if (scenarioData) {
      console.log('[loadScenario] 적용할 값:', {
        baseUpRate: scenarioData.baseUpRate,
        meritRate: scenarioData.meritRate
      })
      setBaseUpRate(scenarioData.baseUpRate || 0)
      setMeritRate(scenarioData.meritRate || 0)
      
      // levelRates 처리 - 타입 호환성 보장
      const defaultLevelRates = {
        'Lv.1': { baseUp: 0, merit: 0 },
        'Lv.2': { baseUp: 0, merit: 0 },
        'Lv.3': { baseUp: 0, merit: 0 },
        'Lv.4': { baseUp: 0, merit: 0 }
      }
      if (scenarioData.levelRates && 
          'Lv.1' in scenarioData.levelRates && 
          'Lv.2' in scenarioData.levelRates &&
          'Lv.3' in scenarioData.levelRates &&
          'Lv.4' in scenarioData.levelRates) {
        setLevelRates(scenarioData.levelRates as typeof defaultLevelRates)
      } else {
        setLevelRates(defaultLevelRates)
      }
      
      // detailedLevelRates 처리 - 타입 호환성 보장
      const defaultDetailedLevelRates = {
        'Lv.1': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 },
        'Lv.2': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 },
        'Lv.3': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 },
        'Lv.4': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 }
      }
      if (scenarioData.detailedLevelRates &&
          'Lv.1' in scenarioData.detailedLevelRates &&
          'Lv.2' in scenarioData.detailedLevelRates &&
          'Lv.3' in scenarioData.detailedLevelRates &&
          'Lv.4' in scenarioData.detailedLevelRates) {
        setDetailedLevelRates(scenarioData.detailedLevelRates as typeof defaultDetailedLevelRates)
      } else {
        setDetailedLevelRates(defaultDetailedLevelRates)
      }
      
      setTotalBudget(scenarioData.totalBudget || 0)
      setBandAdjustments(scenarioData.bandAdjustments || {})
      setEmployeeWeights(scenarioData.employeeWeights || {})
      
      // performanceWeights 복원
      if (scenarioData.performanceWeights) {
        setPerformanceWeights(scenarioData.performanceWeights)
      } else {
        // 기본값 유지
        setPerformanceWeights({
          ST: 1.5,
          AT: 1.2,
          OT: 1.0,
          BT: 0.8
        })
      }
    }
  }
  
  // activeScenarioId가 변경될 때 플래그 리셋
  useEffect(() => {
    setHasLoadedActiveScenario(false)
  }, [activeScenarioId])
  
  // activeScenarioId가 있으면 자동으로 해당 시나리오 로드 (한 번만)
  useEffect(() => {
    if (activeScenarioId && scenarios.length > 0 && !hasLoadedActiveScenario) {
      const activeScenario = scenarios.find(s => s.id === activeScenarioId)
      if (activeScenario && loadScenario) {
        console.log('[WageContext] 활성 시나리오 자동 로드 시작:', {
          id: activeScenarioId,
          name: activeScenario.name,
          baseUpRate: activeScenario.data.baseUpRate,
          meritRate: activeScenario.data.meritRate
        })
        setHasLoadedActiveScenario(true)
        // 즉시 실행으로 변경
        loadScenario(activeScenarioId)
        console.log('[WageContext] 활성 시나리오 자동 로드 완료')
      }
    }
  }, [activeScenarioId, scenarios, hasLoadedActiveScenario]) // loadScenario는 의존성에서 제외
  
  // TO-BE 급여 계산 함수
  const calculateToBeSalary = (
    currentSalary: number,
    level: string,
    performanceRating?: string,
    band?: string
  ): number => {
    // 1. 우선순위: 직군별 최종 인상률 (Pay Band에서 조정된 값)
    let levelRate
    if (band && bandFinalRates[band] && bandFinalRates[band][level]) {
      levelRate = bandFinalRates[band][level]
    } else {
      // 2. 차선책: 대시보드 직급별 인상률
      levelRate = levelRates[level as keyof typeof levelRates] || { baseUp: baseUpRate, merit: meritRate }
    }
    
    let effectiveMeritRate = levelRate.merit
    
    // 평가등급별 가중치 적용
    if (performanceRating && performanceWeights[performanceRating as keyof PerformanceWeights]) {
      effectiveMeritRate = levelRate.merit * performanceWeights[performanceRating as keyof PerformanceWeights]
    }
    
    const totalRate = levelRate.baseUp + effectiveMeritRate
    return Math.round(currentSalary * (1 + totalRate / 100))
  }
  
  const value: WageContextType = {
    baseUpRate,
    meritRate,
    availableBudget,
    welfareBudget,
    totalBudget,
    adjustmentMode,
    performanceWeights,
    levelRates,
    detailedLevelRates,
    bandAdjustments,
    bandFinalRates,
    payZoneRates,
    employeeWeights,
    contextEmployeeData,
    setBaseUpRate,
    setMeritRate,
    setAvailableBudget,
    setWelfareBudget,
    setTotalBudget,
    setAdjustmentMode,
    setPerformanceWeights,
    setLevelRates,
    setDetailedLevelRates,
    setBandAdjustments,
    setBandFinalRates,
    setPayZoneRates,
    setEmployeeWeights,
    setContextEmployeeData,
    scenarios,
    activeScenarioId,
    saveScenario,
    loadScenario,
    deleteScenario: deleteScenarioHook,
    renameScenario: renameScenarioHook,
    calculateToBeSalary
  }
  
  return <WageContext.Provider value={value}>{children}</WageContext.Provider>
}

export function useWageContext() {
  const context = useContext(WageContext)
  if (context === undefined) {
    throw new Error('useWageContext must be used within a WageProvider')
  }
  return context
}