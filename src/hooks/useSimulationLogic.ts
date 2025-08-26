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
  PayZoneRates,
  GradeAdjustmentRates,
  AllAdjustmentRates,
  LevelGradeRates,
  PayZoneLevelGradeRates
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
  calculateZoneBandBudget,
  calculateWeightedAverage,
  countEmployeesByGrade,
  propagateAllToLevel,
  propagateLevelToPayZone,
  calculateAverageFromGrades
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
    performanceWeights,
    
    // AI 설정
    aiSettings,
    
    // 엑셀에서 정의된 순서
    gradeOrder,
    levelOrder
  } = useWageContext()
  
  // 동적 구조 (Excel 데이터에서 추출)
  const [dynamicStructure, setDynamicStructure] = useState<DynamicStructure>({
    levels: [] as string[],
    bands: [] as string[],
    payZones: [] as number[],
    grades: [] as string[]
  })
  
  // Pending rates (적용 전 임시 값)
  const [pendingLevelRates, setPendingLevelRates] = useState<LevelRates>({})
  const [pendingBandFinalRates, setPendingBandFinalRates] = useState<BandFinalRates>({})
  const [pendingPayZoneRates, setPendingPayZoneRates] = useState<PayZoneRates>({})
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  const [pendingChangeCount, setPendingChangeCount] = useState(0)
  
  // 조정 범위 (전체/레벨별/PayZone별)
  const [adjustmentScope, setAdjustmentScope] = useState<'all' | 'level' | 'payzone'>('all')
  
  // 추가인상률 타입 (비율/정액)
  const [additionalType, setAdditionalType] = useState<'percentage' | 'amount'>('percentage')
  
  // 직군 필터
  const [selectedBands, setSelectedBands] = useState<string[]>([])
  
  // PayZone 뷰 모드
  const [payZoneViewMode, setPayZoneViewMode] = useState<'grouped' | 'matrix' | 'performance'>('grouped')
  
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
  
  // 평가등급별 상태 관리 (중앙 집중식)
  const [allGradeRates, setAllGradeRates] = useState<AllAdjustmentRates>({
    average: { baseUp: 0, merit: 0, additional: 0 },
    byGrade: {}
  })
  const [levelGradeRates, setLevelGradeRates] = useState<LevelGradeRates>({})
  const [payZoneLevelGradeRates, setPayZoneLevelGradeRates] = useState<PayZoneLevelGradeRates>({})
  
  // 적용된 상태 저장 (취소 시 복원용)
  const [appliedAllGradeRates, setAppliedAllGradeRates] = useState<AllAdjustmentRates>({
    average: { baseUp: 0, merit: 0, additional: 0 },
    byGrade: {}
  })
  const [appliedLevelGradeRates, setAppliedLevelGradeRates] = useState<LevelGradeRates>({})
  const [appliedPayZoneLevelGradeRates, setAppliedPayZoneLevelGradeRates] = useState<PayZoneLevelGradeRates>({})
  
  // Pending rates 초기화
  useEffect(() => {
    // levelRates를 LevelRates 타입으로 변환 (additional 필드 추가)
    const convertedLevelRates: LevelRates = {}
    Object.keys(levelRates).forEach(level => {
      convertedLevelRates[level] = {
        baseUp: levelRates[level].baseUp,
        merit: levelRates[level].merit,
        additional: 0  // 기본값으로 0 설정
      }
    })
    
    // bandFinalRates를 BandFinalRates 타입으로 변환 (additional 필드 추가)
    const convertedBandFinalRates: BandFinalRates = {}
    Object.keys(bandFinalRates).forEach(band => {
      convertedBandFinalRates[band] = {}
      Object.keys(bandFinalRates[band]).forEach(level => {
        convertedBandFinalRates[band][level] = {
          baseUp: bandFinalRates[band][level].baseUp,
          merit: bandFinalRates[band][level].merit,
          additional: 0  // 기본값으로 0 설정
        }
      })
    })
    
    setPendingLevelRates(convertedLevelRates)
    setPendingBandFinalRates(convertedBandFinalRates)
    setPendingPayZoneRates(payZoneRates)
  }, [levelRates, bandFinalRates, payZoneRates])
  
  // Pending 변경사항 감지 (Grade 기반)
  useEffect(() => {
    let hasChanges = false
    let changeCount = 0
    
    // 전체 평가등급 변경 확인
    if (appliedAllGradeRates.byGrade && allGradeRates.byGrade && Object.keys(appliedAllGradeRates.byGrade).length > 0) {
      Object.keys(allGradeRates.byGrade).forEach(grade => {
        const applied = appliedAllGradeRates.byGrade[grade]
        const current = allGradeRates.byGrade[grade]
        if (applied && current) {
          if (applied.baseUp !== current.baseUp || 
              applied.merit !== current.merit ||
              applied.additional !== current.additional) {
            hasChanges = true
            changeCount++
            console.log(`[변경감지] 전체 ${grade} 등급 변경 감지:`, {
              applied: applied,
              current: current
            })
          }
        }
      })
    }
    
    // 레벨별 평가등급 변경 확인
    if (appliedLevelGradeRates && levelGradeRates && Object.keys(appliedLevelGradeRates).length > 0) {
      Object.keys(levelGradeRates).forEach(level => {
        const appliedLevel = appliedLevelGradeRates[level]
        const currentLevel = levelGradeRates[level]
        if (appliedLevel && currentLevel && appliedLevel.byGrade && currentLevel.byGrade) {
          Object.keys(currentLevel.byGrade).forEach(grade => {
            const applied = appliedLevel.byGrade[grade]
            const current = currentLevel.byGrade[grade]
            if (applied && current) {
              if (applied.baseUp !== current.baseUp || 
                  applied.merit !== current.merit ||
                  applied.additional !== current.additional) {
                // 이미 전체에서 변경된 경우 중복 카운트하지 않음
                if (!hasChanges) {
                  hasChanges = true
                  changeCount++
                  console.log(`[변경감지] ${level} - ${grade} 변경 감지`)
                }
              }
            }
          })
        }
      })
    }
    
    console.log(`[변경감지] 총 변경사항: ${changeCount}개, hasChanges: ${hasChanges}`)
    setHasPendingChanges(hasChanges)
    setPendingChangeCount(changeCount)
  }, [allGradeRates, levelGradeRates, payZoneLevelGradeRates, appliedAllGradeRates, appliedLevelGradeRates, appliedPayZoneLevelGradeRates])
  
  // Pending 변경사항 적용
  const applyPendingChanges = () => {
    // 현재 grade 상태를 적용된 상태로 저장
    setAppliedAllGradeRates(JSON.parse(JSON.stringify(allGradeRates)))
    setAppliedLevelGradeRates(JSON.parse(JSON.stringify(levelGradeRates)))
    setAppliedPayZoneLevelGradeRates(JSON.parse(JSON.stringify(payZoneLevelGradeRates)))
    
    // 기존 레거시 state도 업데이트
    setLevelRates(pendingLevelRates)
    setBandFinalRates(pendingBandFinalRates)
    setPayZoneRates(pendingPayZoneRates)
    
    setHasPendingChanges(false)
    setPendingChangeCount(0)
  }
  
  // Pending 변경사항 취소 (적용된 값으로 복원)
  const resetPendingChanges = () => {
    // grade 관련 state를 적용된 상태로 복원
    if (Object.keys(appliedAllGradeRates.byGrade).length > 0) {
      setAllGradeRates(JSON.parse(JSON.stringify(appliedAllGradeRates)))
    }
    if (Object.keys(appliedLevelGradeRates).length > 0) {
      setLevelGradeRates(JSON.parse(JSON.stringify(appliedLevelGradeRates)))
    }
    if (Object.keys(appliedPayZoneLevelGradeRates).length > 0) {
      setPayZoneLevelGradeRates(JSON.parse(JSON.stringify(appliedPayZoneLevelGradeRates)))
    }
    
    // 레거시 state도 복원
    const convertedLevelRates: LevelRates = {}
    Object.keys(levelRates).forEach(level => {
      convertedLevelRates[level] = {
        baseUp: levelRates[level].baseUp,
        merit: levelRates[level].merit,
        additional: levelRates[level].additional || 0
      }
    })
    
    const convertedBandFinalRates: BandFinalRates = {}
    Object.keys(bandFinalRates).forEach(band => {
      convertedBandFinalRates[band] = {}
      Object.keys(bandFinalRates[band]).forEach(level => {
        convertedBandFinalRates[band][level] = {
          baseUp: bandFinalRates[band][level].baseUp,
          merit: bandFinalRates[band][level].merit,
          additional: bandFinalRates[band][level].additional || 0
        }
      })
    })
    
    setPendingLevelRates(convertedLevelRates)
    setPendingBandFinalRates(convertedBandFinalRates)
    setPendingPayZoneRates(payZoneRates)
    setHasPendingChanges(false)
    setPendingChangeCount(0)
  }
  
  // 직군 필터 핸들러
  const handleBandToggle = (band: string) => {
    setSelectedBands(prev => 
      prev.includes(band) 
        ? prev.filter(b => b !== band)
        : [...prev, band]
    )
  }
  
  const handleSelectAllBands = () => {
    setSelectedBands(dynamicStructure.bands)
  }
  
  const handleClearAllBands = () => {
    setSelectedBands([])
  }
  
  // 엑셀 순서를 유지하면서 중복 제거하는 헬퍼 함수
  const getUniqueInOrder = (arr: any[]) => {
    const seen = new Set()
    return arr.filter(item => {
      if (item && !seen.has(item)) {
        seen.add(item)
        return true
      }
      return false
    })
  }

  // Excel 데이터에서 동적 구조 추출
  useEffect(() => {
    if (contextEmployeeData && contextEmployeeData.length > 0) {
      // 엑셀에서 정의된 순서가 있으면 사용, 없으면 데이터에서 추출
      const levels = levelOrder && levelOrder.length > 0 
        ? levelOrder.filter(level => level !== 'Lv0')
        : getUniqueInOrder(contextEmployeeData.map(emp => emp.level)).filter(level => level !== 'Lv0')
      
      const grades = gradeOrder && gradeOrder.length > 0
        ? gradeOrder
        : getUniqueInOrder(contextEmployeeData.map(emp => emp.performanceRating))
      
      const bands = getUniqueInOrder(contextEmployeeData.map(emp => emp.band))
      // PayZone은 이제 문자열이므로 정렬 방식 수정
      const payZones = Array.from(new Set(contextEmployeeData.map(emp => emp.payZone))).filter(zone => zone !== undefined)
      
      setDynamicStructure({
        levels,
        bands,
        payZones: payZones,  // 문자열 그대로 사용
        grades: grades.length > 0 ? grades : []
      })
      
      console.log('[시뮬레이션] 동적 구조 설정:', {
        levels: levels,
        grades: grades,
        gradeOrder: gradeOrder,
        levelOrder: levelOrder,
        payZones: payZones
      })
      
      // 평가등급별 상태 초기화 (AI 권장값 사용)
      if (grades.length > 0) {
        console.log('[시뮬레이션 초기화] aiSettings:', aiSettings)
        const aiBaseUp = aiSettings?.baseUpPercentage || 0
        const aiMerit = aiSettings?.meritIncreasePercentage || 0
        console.log('[시뮬레이션 초기화] AI 값 설정 - baseUp:', aiBaseUp, 'merit:', aiMerit)
        
        const initialGradeRates: GradeAdjustmentRates = {}
        grades.forEach(grade => {
          initialGradeRates[grade] = { baseUp: aiBaseUp, merit: aiMerit, additional: 0 }
        })
        
        const initialAllRates = {
          average: { baseUp: aiBaseUp, merit: aiMerit, additional: 0 },
          byGrade: initialGradeRates
        }
        setAllGradeRates(initialAllRates)
        setAppliedAllGradeRates(JSON.parse(JSON.stringify(initialAllRates)))  // 깊은 복사로 저장
        
        // 레벨별 평가등급 초기화
        const initialLevelGradeRatesData: LevelGradeRates = {}
        levels.forEach(level => {
          const levelEmployees = contextEmployeeData.filter(emp => emp.level === level)
          const gradeCounts = countEmployeesByGrade(levelEmployees)
          
          initialLevelGradeRatesData[level] = {
            average: { baseUp: aiBaseUp, merit: aiMerit, additional: 0 },
            byGrade: { ...initialGradeRates },
            employeeCount: {
              total: levelEmployees.length,
              byGrade: gradeCounts
            }
          }
        })
        setLevelGradeRates(initialLevelGradeRatesData)
        setAppliedLevelGradeRates(JSON.parse(JSON.stringify(initialLevelGradeRatesData)))  // 깊은 복사로 저장
        
        // PayZone별 평가등급 초기화
        const initialPayZoneRates: PayZoneLevelGradeRates = {}
        payZones.forEach(zone => {
          initialPayZoneRates[zone.toString()] = {}
          levels.forEach(level => {
            const zoneEmployees = contextEmployeeData.filter(
              emp => emp.payZone === zone && emp.level === level
            )
            const gradeCounts = countEmployeesByGrade(zoneEmployees)
            
            initialPayZoneRates[zone.toString()][level] = {
              average: { baseUp: aiBaseUp, merit: aiMerit, additional: 0 },
              byGrade: { ...initialGradeRates },
              employeeCount: {
                total: zoneEmployees.length,
                byGrade: gradeCounts
              }
            }
          })
        })
        setPayZoneLevelGradeRates(initialPayZoneRates)
        setAppliedPayZoneLevelGradeRates(JSON.parse(JSON.stringify(initialPayZoneRates)))  // 깊은 복사로 저장
        
        console.log('[시뮬레이션 초기화] Applied 상태 저장 완료:', {
          allGradeRates: initialAllRates,
          levelGradeRates: Object.keys(initialLevelGradeRatesData).length,
          payZoneRates: Object.keys(initialPayZoneRates).length
        })
      }
      
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
  }, [contextEmployeeData, aiSettings, gradeOrder, levelOrder])
  
  // Level별 조정 (Pending)
  const handleLevelRateChange = (level: string, field: keyof AdjustmentRates, value: number) => {
    setPendingLevelRates((prev: any) => ({
      ...prev,
      [level]: {
        ...prev[level],
        [field]: value
      }
    }))
    setHasPendingChanges(true)
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
  
  // 전체 일괄 조정 (Pending)
  const handleGlobalAdjustment = (type: 'all' | 'row' | 'column', target: string | null, field: keyof AdjustmentRates, value: number) => {
    if (type === 'all') {
      const newRates: LevelRates = {}
      dynamicStructure.levels.forEach(level => {
        newRates[level] = {
          ...pendingLevelRates[level],
          [field]: value
        }
      })
      setPendingLevelRates(newRates)
    }
    setHasPendingChanges(true)
  }
  
  // 전역 업데이트
  const updateGlobalRates = (rates: LevelRates) => {
    const avgBaseUp = Object.values(rates).reduce((sum, r) => sum + r.baseUp, 0) / Object.keys(rates).length
    const avgMerit = Object.values(rates).reduce((sum, r) => sum + r.merit, 0) / Object.keys(rates).length
    setContextBaseUpRate(avgBaseUp)
    setContextMeritRate(avgMerit)
  }
  
  // Advanced Mode: Band×Level 조정 (Pending)
  const handleBandLevelChange = (band: string, level: string, field: 'baseUp' | 'merit', value: number) => {
    setPendingBandFinalRates(prev => ({
      ...prev,
      [band]: {
        ...prev[band],
        [level]: {
          ...(prev[band]?.[level] || {}),
          [field]: value
        }
      }
    }))
    setHasPendingChanges(true)
  }
  
  // Band 데이터로부터 Level 평균 계산 래퍼
  const updateLevelRatesFromBandsWrapper = (level: string, field: 'baseUp' | 'merit') => {
    // bandFinalRates를 BandFinalRates 타입으로 변환
    const convertedBandFinalRates: BandFinalRates = {}
    Object.keys(bandFinalRates).forEach(band => {
      convertedBandFinalRates[band] = {}
      Object.keys(bandFinalRates[band]).forEach(lvl => {
        convertedBandFinalRates[band][lvl] = {
          baseUp: bandFinalRates[band][lvl].baseUp,
          merit: bandFinalRates[band][lvl].merit,
          additional: 0
        }
      })
    })
    
    // levelRates를 LevelRates 타입으로 변환
    const convertedLevelRates: LevelRates = {}
    Object.keys(levelRates).forEach(lvl => {
      convertedLevelRates[lvl] = {
        baseUp: levelRates[lvl].baseUp,
        merit: levelRates[lvl].merit,
        additional: 0
      }
    })
    
    const avgRate = updateLevelRatesFromBands(
      level,
      field,
      contextEmployeeData,
      dynamicStructure,
      convertedBandFinalRates,
      convertedLevelRates
    )
    
    if (avgRate !== null) {
      setLevelRates((prev: any) => ({
        ...prev,
        [level]: {
          ...prev[level],
          [field]: avgRate
        }
      }))
    }
  }
  
  // Expert Mode: PayZone×Band×Level 조정 (Pending)
  const handlePayZoneBandLevelChange = (zone: number, band: string, level: string, field: 'baseUp' | 'merit' | 'additional', value: number) => {
    setPendingPayZoneRates(prev => {
      const newRates = { ...prev }
      if (!newRates[zone]) newRates[zone] = {}
      if (!newRates[zone][band]) newRates[zone][band] = {}
      if (!newRates[zone][band][level]) {
        newRates[zone][band][level] = { baseUp: 0, merit: 0, additional: 0 }
      }
      newRates[zone][band][level][field] = value
      return newRates
    })
    setHasPendingChanges(true)
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
  
  // PayZone-Level-Grade 단위 조정 핸들러
  const handlePayZoneLevelGradeChange = (payZone: number, level: string, grade: string, field: keyof AdjustmentRates, value: number) => {
    setPendingPayZoneRates(prev => {
      const newRates = { ...prev }
      if (!newRates[payZone]) newRates[payZone] = {}
      if (!newRates[payZone][level]) newRates[payZone][level] = {}
      if (!newRates[payZone][level][grade]) {
        newRates[payZone][level][grade] = { baseUp: 0, merit: 0, additional: 0 }
      }
      newRates[payZone][level][grade][field] = value
      return newRates
    })
    setHasPendingChanges(true)
  }
  
  // 양방향 동기화 핸들러
  // 전체 평가등급 변경 → 하위 전파
  const handleAllGradeChange = (grade: string, field: keyof AdjustmentRates, value: number) => {
    console.log(`[전체→하위] 평가등급 ${grade} ${field} 값을 ${value}로 변경`)
    
    // 전체 업데이트
    setAllGradeRates(prev => ({
      ...prev,
      byGrade: {
        ...prev.byGrade,
        [grade]: {
          ...prev.byGrade[grade],
          [field]: value
        }
      }
    }))
    
    // 레벨별로 전파
    setLevelGradeRates(prev => {
      const newRates = { ...prev }
      Object.keys(newRates).forEach(level => {
        if (newRates[level].byGrade[grade]) {
          newRates[level].byGrade[grade][field] = value
        }
      })
      return newRates
    })
    
    // PayZone별로 전파
    setPayZoneLevelGradeRates(prev => {
      const newRates = { ...prev }
      Object.keys(newRates).forEach(zone => {
        Object.keys(newRates[zone]).forEach(level => {
          if (newRates[zone][level].byGrade[grade]) {
            newRates[zone][level].byGrade[grade][field] = value
          }
        })
      })
      return newRates
    })
    
    setHasPendingChanges(true)
  }
  
  // 레벨별 평가등급 변경 → 상위/하위 동기화
  const handleLevelGradeChange = (level: string, grade: string, field: keyof AdjustmentRates, value: number) => {
    console.log(`[레벨별] ${level} - ${grade} ${field} 값을 ${value}로 변경`)
    
    // 레벨 업데이트
    setLevelGradeRates(prev => ({
      ...prev,
      [level]: {
        ...prev[level],
        byGrade: {
          ...prev[level].byGrade,
          [grade]: {
            ...prev[level].byGrade[grade],
            [field]: value
          }
        }
      }
    }))
    
    // PayZone으로 전파
    setPayZoneLevelGradeRates(prev => {
      const newRates = { ...prev }
      Object.keys(newRates).forEach(zone => {
        if (newRates[zone][level] && newRates[zone][level].byGrade[grade]) {
          newRates[zone][level].byGrade[grade][field] = value
        }
      })
      return newRates
    })
    
    // 전체로 역전파 (가중평균 계산)
    setTimeout(() => {
      setAllGradeRates(prev => {
        // 최신 levelGradeRates를 사용하여 가중평균 계산
        let totalCount = 0
        let weightedSum = 0
        
        // 현재 변경사항을 반영한 상태로 계산
        const updatedLevelRates = {
          ...levelGradeRates,
          [level]: {
            ...levelGradeRates[level],
            byGrade: {
              ...levelGradeRates[level].byGrade,
              [grade]: {
                ...levelGradeRates[level].byGrade[grade],
                [field]: value
              }
            }
          }
        }
        
        Object.keys(updatedLevelRates).forEach(lvl => {
          const levelData = updatedLevelRates[lvl]
          const count = levelData.employeeCount?.byGrade[grade] || 0
          if (count > 0 && levelData.byGrade[grade]) {
            totalCount += count
            weightedSum += levelData.byGrade[grade][field] * count
          }
        })
        
        const avgValue = totalCount > 0 ? weightedSum / totalCount : value
        console.log(`[레벨→전체] ${grade} ${field} 가중평균: ${avgValue} (총 ${totalCount}명)`)
        
        return {
          ...prev,
          byGrade: {
            ...prev.byGrade,
            [grade]: {
              ...prev.byGrade[grade],
              [field]: avgValue
            }
          }
        }
      })
    }, 0)
    
    setHasPendingChanges(true)
  }
  
  // PayZone별 평가등급 변경 → 상위 역전파
  const handlePayZoneGradeChange = (payZone: number, level: string, grade: string, field: keyof AdjustmentRates, value: number) => {
    console.log(`[PayZone별] PayZone ${payZone} - ${level} - ${grade} ${field} 값을 ${value}로 변경`)
    
    // PayZone 업데이트
    setPayZoneLevelGradeRates(prev => ({
      ...prev,
      [payZone.toString()]: {
        ...prev[payZone.toString()],
        [level]: {
          ...prev[payZone.toString()][level],
          byGrade: {
            ...prev[payZone.toString()][level].byGrade,
            [grade]: {
              ...prev[payZone.toString()][level].byGrade[grade],
              [field]: value
            }
          }
        }
      }
    }))
    
    // 레벨로 역전파 (가중평균 계산)
    setTimeout(() => {
      setLevelGradeRates(prev => {
        // 해당 레벨의 모든 PayZone 데이터를 수집하여 가중평균 계산
        let totalCount = 0
        let weightedSum = 0
        
        // 현재 변경사항을 반영한 상태로 계산
        const updatedPayZoneRates = {
          ...payZoneLevelGradeRates,
          [payZone.toString()]: {
            ...payZoneLevelGradeRates[payZone.toString()],
            [level]: {
              ...payZoneLevelGradeRates[payZone.toString()][level],
              byGrade: {
                ...payZoneLevelGradeRates[payZone.toString()][level].byGrade,
                [grade]: {
                  ...payZoneLevelGradeRates[payZone.toString()][level].byGrade[grade],
                  [field]: value
                }
              }
            }
          }
        }
        
        Object.keys(updatedPayZoneRates).forEach(zone => {
          const zoneLevel = updatedPayZoneRates[zone][level]
          if (zoneLevel) {
            const count = zoneLevel.employeeCount?.byGrade[grade] || 0
            if (count > 0 && zoneLevel.byGrade[grade]) {
              totalCount += count
              weightedSum += zoneLevel.byGrade[grade][field] * count
            }
          }
        })
        
        const avgValue = totalCount > 0 ? weightedSum / totalCount : value
        console.log(`[PayZone→레벨] ${level} - ${grade} ${field} 가중평균: ${avgValue} (총 ${totalCount}명)`)
        
        return {
          ...prev,
          [level]: {
            ...prev[level],
            byGrade: {
              ...prev[level].byGrade,
              [grade]: {
                ...prev[level].byGrade[grade],
                [field]: avgValue
              }
            }
          }
        }
      })
    }, 0)
    
    // 전체로 역전파 (가중평균 계산)
    setTimeout(() => {
      setAllGradeRates(prev => {
        // 모든 PayZone-레벨의 해당 등급 데이터를 수집하여 가중평균 계산
        let totalCount = 0
        let weightedSum = 0
        
        // 모든 PayZone 데이터에서 가중평균 계산
        Object.keys(payZoneLevelGradeRates).forEach(zone => {
          if (payZoneLevelGradeRates[zone][level]) {
            const zoneLevel = zone === payZone.toString() 
              ? {
                  ...payZoneLevelGradeRates[zone][level],
                  byGrade: {
                    ...payZoneLevelGradeRates[zone][level].byGrade,
                    [grade]: {
                      ...payZoneLevelGradeRates[zone][level].byGrade[grade],
                      [field]: value
                    }
                  }
                }
              : payZoneLevelGradeRates[zone][level]
            
            const count = zoneLevel.employeeCount?.byGrade[grade] || 0
            if (count > 0 && zoneLevel.byGrade[grade]) {
              totalCount += count
              weightedSum += zoneLevel.byGrade[grade][field] * count
            }
          }
        })
        
        const avgValue = totalCount > 0 ? weightedSum / totalCount : value
        console.log(`[PayZone→전체] ${grade} ${field} 가중평균: ${avgValue} (총 ${totalCount}명)`)
        
        return {
          ...prev,
          byGrade: {
            ...prev.byGrade,
            [grade]: {
              ...prev.byGrade[grade],
              [field]: avgValue
            }
          }
        }
      })
    }, 50)  // 레벨 업데이트 후 실행
    
    setHasPendingChanges(true)
  }
  
  // Expert Mode 핸들러 (기존 유지)
  const handleExpertChange = (payZone: number, band: string, level: string, field: keyof AdjustmentRates, value: number) => {
    setPendingPayZoneRates(prev => ({
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
    setHasPendingChanges(true)
  }
  
  // PayZone 데이터로부터 Band×Level 평균 계산 래퍼
  const updateBandRatesFromPayZonesWrapper = (band: string, level: string, field: 'baseUp' | 'merit') => {
    // bandFinalRates를 BandFinalRates 타입으로 변환
    const convertedBandFinalRates: BandFinalRates = {}
    Object.keys(bandFinalRates).forEach(b => {
      convertedBandFinalRates[b] = {}
      Object.keys(bandFinalRates[b]).forEach(l => {
        convertedBandFinalRates[b][l] = {
          baseUp: bandFinalRates[b][l].baseUp,
          merit: bandFinalRates[b][l].merit,
          additional: 0
        }
      })
    })
    
    // levelRates를 LevelRates 타입으로 변환
    const convertedLevelRates: LevelRates = {}
    Object.keys(levelRates).forEach(l => {
      convertedLevelRates[l] = {
        baseUp: levelRates[l].baseUp,
        merit: levelRates[l].merit,
        additional: 0
      }
    })
    
    const avgRate = updateBandRatesFromPayZones(
      band,
      level,
      field,
      contextEmployeeData,
      dynamicStructure,
      payZoneRates,
      convertedBandFinalRates,
      convertedLevelRates
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
    // levelRates를 LevelRates 타입으로 변환
    const convertedLevelRates: LevelRates = {}
    Object.keys(levelRates).forEach(level => {
      convertedLevelRates[level] = {
        baseUp: levelRates[level].baseUp,
        merit: levelRates[level].merit,
        additional: 0
      }
    })
    
    // bandFinalRates를 BandFinalRates 타입으로 변환
    const convertedBandFinalRates: BandFinalRates = {}
    Object.keys(bandFinalRates).forEach(band => {
      convertedBandFinalRates[band] = {}
      Object.keys(bandFinalRates[band]).forEach(level => {
        convertedBandFinalRates[band][level] = {
          baseUp: bandFinalRates[band][level].baseUp,
          merit: bandFinalRates[band][level].merit,
          additional: 0
        }
      })
    })
    
    const usage = calculateBudgetUsage(
      contextEmployeeData,
      adjustmentMode,
      convertedLevelRates,
      convertedBandFinalRates,
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
    aiSettings,
    
    // Grade-based states
    allGradeRates,
    setAllGradeRates,
    levelGradeRates,
    setLevelGradeRates,
    payZoneLevelGradeRates,
    setPayZoneLevelGradeRates,
    
    // Pending states
    pendingLevelRates,
    setPendingLevelRates,
    pendingBandFinalRates,
    setPendingBandFinalRates,
    pendingPayZoneRates,
    setPendingPayZoneRates,
    hasPendingChanges,
    pendingChangeCount,
    applyPendingChanges,
    resetPendingChanges,
    
    // Adjustment controls
    adjustmentScope,
    setAdjustmentScope,
    additionalType,
    setAdditionalType,
    
    // Band filter
    selectedBands,
    handleBandToggle,
    handleSelectAllBands,
    handleClearAllBands,
    
    // PayZone view
    payZoneViewMode,
    setPayZoneViewMode,
    
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
    handlePayZoneLevelGradeChange,
    handleExpertChange,
    handleAllGradeChange,
    handleLevelGradeChange,
    handlePayZoneGradeChange,
    
    // Helper functions
    getActualCombinationCount: getActualCombinationCountWrapper,
    calculateBandAverage: calculateBandAverageWrapper,
    calculateAverageSalary: calculateAverageSalaryWrapper,
    calculateZoneBandBudget: calculateZoneBandBudgetWrapper,
    
    // Total employees
    totalEmployees: contextEmployeeData?.length || 0
  }
}