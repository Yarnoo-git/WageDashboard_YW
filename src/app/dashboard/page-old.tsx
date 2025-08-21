'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useWageContext } from '@/context/WageContext'
import { ScenarioManager } from '@/components/ScenarioManager'
import { AIRecommendationCard } from '@/components/dashboard/AIRecommendationCard'
import { BudgetResourceCard } from '@/components/dashboard/BudgetResourceCard'
import { BudgetUtilizationDetail } from '@/components/dashboard/BudgetUtilizationDetail'
import { GradeSalaryAdjustmentTable } from '@/components/dashboard/GradeSalaryAdjustmentTable'
import { IndustryComparisonSection } from '@/components/dashboard/IndustryComparisonSection'
import { ExportButton, SimpleExportButton } from '@/components/ExportButton'
import { prepareExportData } from '@/lib/exportHelpers'

export default function Home() {
  const router = useRouter()
  const { data, loading, error, refresh } = useDashboardData()
  
  // WageContext에서 전역 상태 가져오기
  const {
    baseUpRate: contextBaseUpRate,
    meritRate: contextMeritRate,
    levelRates: contextLevelRates,
    detailedLevelRates: contextDetailedLevelRates,
    totalBudget: contextTotalBudget,
    setBaseUpRate: setContextBaseUpRate,
    setMeritRate: setContextMeritRate,
    setLevelRates: setContextLevelRates,
    setDetailedLevelRates: setContextDetailedLevelRates,
    setTotalBudget: setContextTotalBudget
  } = useWageContext()
  
  // AI 설정 데이터가 로드되면 상태 동기화 (첫 로드 시에만)
  const [hasInitialized, setHasInitialized] = useState(false)
  
  // AI 추천값 (대시보드 표시용, 읽기 전용)
  const [aiBaseUpRate, setAiBaseUpRate] = useState(0)
  const [aiMeritRate, setAiMeritRate] = useState(0)
  
  // 사용자 조정값 (슬라이더로 변경 가능)
  const [baseUpRate, setBaseUpRate] = useState(0)
  const [meritRate, setMeritRate] = useState(0)
  const [totalBudget, setTotalBudget] = useState<number | null>(null)
  const [levelRates, setLevelRates] = useState({
    'Lv.1': { baseUp: 0, merit: 0 },
    'Lv.2': { baseUp: 0, merit: 0 },
    'Lv.3': { baseUp: 0, merit: 0 },
    'Lv.4': { baseUp: 0, merit: 0 }
  })
  
  // GradeSalaryAdjustmentTable의 세부 인상률 상태 - 모두 0으로 초기화 (여기로 이동)
  const [detailedLevelRates, setDetailedLevelRates] = useState<Record<string, {
    baseUp: number
    merit: number
    promotion: number
    advancement: number
    additional: number
  }>>({
    'Lv.4': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 },
    'Lv.3': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 },
    'Lv.2': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 },
    'Lv.1': { baseUp: 0, merit: 0, promotion: 0, advancement: 0, additional: 0 }
  })
  
  // 사용자 조정값이 변경될 때 WageContext 업데이트
  useEffect(() => {
    // 초기화가 완료된 후에만 Context 업데이트
    if (hasInitialized) {
      setContextLevelRates(levelRates)
      setContextDetailedLevelRates(detailedLevelRates)
      if (totalBudget !== null) {
        setContextTotalBudget(totalBudget)
      }
    }
  }, [levelRates, detailedLevelRates, totalBudget, hasInitialized, setContextLevelRates, setContextDetailedLevelRates, setContextTotalBudget])
  
  // 예산활용내역 상세를 위한 상태 - 모두 0원으로 초기화
  const [promotionBudgets, setPromotionBudgets] = useState({
    lv1: 0,
    lv2: 0,
    lv3: 0,
    lv4: 0
  })
  const [additionalBudget, setAdditionalBudget] = useState(0)
  const [enableAdditionalIncrease, setEnableAdditionalIncrease] = useState(false) // 비활성화로 시작
  
  // 계산된 예산 값들 상태
  const [budgetDetails, setBudgetDetails] = useState({
    aiRecommendation: 0,
    promotion: 0,
    additional: 0,
    indirect: 0
  })
  
  // 추가 인상 총액 상태 (GradeSalaryAdjustmentTable에서 계산)
  const [calculatedAdditionalBudget, setCalculatedAdditionalBudget] = useState(0)
  
  // 직급별 총 인상률 및 가중평균 상태 - 0으로 초기화
  const [levelTotalRates, setLevelTotalRates] = useState<{[key: string]: number}>({
    'Lv.1': 0,
    'Lv.2': 0,
    'Lv.3': 0,
    'Lv.4': 0
  })
  const [weightedAverageRate, setWeightedAverageRate] = useState(0)
  const [meritWeightedAverage, setMeritWeightedAverage] = useState(0) // 성과인상률 가중평균
  
  // 시나리오 관리 - WageContext에서 가져오기
  const {
    scenarios,
    activeScenarioId,
    saveScenario: saveScenarioContext,
    loadScenario: loadScenarioContext,
    deleteScenario,
    renameScenario
  } = useWageContext()
  
  // 데이터가 없으면 홈으로 리다이렉트
  useEffect(() => {
    if (!loading && !data?.summary?.totalEmployees) {
      router.push('/home')
    }
  }, [loading, data, router])
  
  useEffect(() => {
    if (data?.aiRecommendation && !hasInitialized) {
      const aiData = data.aiRecommendation
      
      // AI 추천값은 항상 엑셀 데이터로 설정 (고정값, 변경되지 않음)
      setAiBaseUpRate(aiData.baseUpPercentage)
      setAiMeritRate(aiData.meritIncreasePercentage)
      
      // Context에 저장된 값이 있으면 그것을 사용, 없으면 AI 데이터로 초기화
      if (contextDetailedLevelRates && Object.values(contextDetailedLevelRates).some((rate: any) => 
        rate.baseUp > 0 || rate.merit > 0 || rate.promotion > 0 || rate.advancement > 0 || rate.additional > 0
      )) {
        // Context에 저장된 상세 인상률 사용
        setDetailedLevelRates(contextDetailedLevelRates)
        
        // levelRates도 Context에서 가져오기
        if (contextLevelRates && 
            'Lv.1' in contextLevelRates && 
            'Lv.2' in contextLevelRates && 
            'Lv.3' in contextLevelRates && 
            'Lv.4' in contextLevelRates) {
          setLevelRates({
            'Lv.1': contextLevelRates['Lv.1'],
            'Lv.2': contextLevelRates['Lv.2'],
            'Lv.3': contextLevelRates['Lv.3'],
            'Lv.4': contextLevelRates['Lv.4']
          })
        }
        
        // baseUpRate와 meritRate는 평균값 계산
        let totalBaseUp = 0, totalMerit = 0, totalHeadcount = 0
        if (data?.levelStatistics) {
          data.levelStatistics.forEach(level => {
            const detailedRate = contextDetailedLevelRates[level.level]
            if (detailedRate) {
              totalBaseUp += detailedRate.baseUp * level.employeeCount
              totalMerit += detailedRate.merit * level.employeeCount
              totalHeadcount += level.employeeCount
            }
          })
          if (totalHeadcount > 0) {
            setBaseUpRate(totalBaseUp / totalHeadcount)
            setMeritRate(totalMerit / totalHeadcount)
          }
        }
        
        // Context의 totalBudget 사용하거나 새로 계산
        if (contextTotalBudget > 0) {
          setTotalBudget(contextTotalBudget)
        } else if (data?.summary?.totalPayroll && aiData) {
          // Context에 총예산이 없으면 계산
          const totalPayroll = data.summary.totalPayroll
          const directBudget = totalPayroll * (aiData.totalPercentage / 100)
          const indirectCost = directBudget * 0.178 // 간접비용 17.8%
          const calculatedTotalBudget = directBudget + indirectCost
          setTotalBudget(Math.round(calculatedTotalBudget))
        }
      } else {
        // Context에 저장된 값이 없으면 AI 데이터로 초기화
        setBaseUpRate(aiData.baseUpPercentage)
        setMeritRate(aiData.meritIncreasePercentage)
        
        // 개별 레벨 인상률도 업데이트
        setLevelRates({
          'Lv.1': { baseUp: aiData.baseUpPercentage, merit: aiData.meritIncreasePercentage },
          'Lv.2': { baseUp: aiData.baseUpPercentage, merit: aiData.meritIncreasePercentage },
          'Lv.3': { baseUp: aiData.baseUpPercentage, merit: aiData.meritIncreasePercentage },
          'Lv.4': { baseUp: aiData.baseUpPercentage, merit: aiData.meritIncreasePercentage }
        })
        
        // 세부 인상률도 업데이트
        setDetailedLevelRates({
          'Lv.4': { baseUp: aiData.baseUpPercentage, merit: aiData.meritIncreasePercentage, promotion: 0, advancement: 0, additional: 0 },
          'Lv.3': { baseUp: aiData.baseUpPercentage, merit: aiData.meritIncreasePercentage, promotion: 0, advancement: 0, additional: 0 },
          'Lv.2': { baseUp: aiData.baseUpPercentage, merit: aiData.meritIncreasePercentage, promotion: 0, advancement: 0, additional: 0 },
          'Lv.1': { baseUp: aiData.baseUpPercentage, merit: aiData.meritIncreasePercentage, promotion: 0, advancement: 0, additional: 0 }
        })
        
        // 총예산 설정 - AI 적정인상률 예산 + 간접비용으로 계산
        if (data?.summary?.totalPayroll && aiData) {
          const totalPayroll = data.summary.totalPayroll
          const directBudget = totalPayroll * (aiData.totalPercentage / 100)
          const indirectCost = directBudget * 0.178 // 간접비용 17.8%
          const calculatedTotalBudget = directBudget + indirectCost
          setTotalBudget(Math.round(calculatedTotalBudget))
          console.log('[대시보드] 총예산 계산:', {
            totalPayroll,
            aiTotalPercentage: aiData.totalPercentage,
            directBudget,
            indirectCost,
            totalBudget: calculatedTotalBudget
          })
        } else if (data.budget?.totalBudget) {
          // 백업: API에서 계산된 총예산 사용
          const budgetValue = typeof data.budget.totalBudget === 'string' 
            ? parseFloat(data.budget.totalBudget.replace(/[^0-9.-]/g, ''))
            : data.budget.totalBudget
          setTotalBudget(budgetValue)
        } else {
          // 엑셀 데이터가 없으면 0원
          setTotalBudget(0)
        }
      }
      
      console.log('대시보드 초기화 완료 - Context값 우선 사용')
      setHasInitialized(true)
    }
  }, [data?.aiRecommendation, data?.levelStatistics, hasInitialized, contextDetailedLevelRates, contextLevelRates, contextTotalBudget])
  
  // Context 값이 변경되면 로컬 상태 업데이트 (시나리오 적용 시)
  useEffect(() => {
    if (hasInitialized && contextBaseUpRate !== undefined && contextMeritRate !== undefined) {
      // 시나리오 로드로 인한 Context 변경 감지
      if (Math.abs(contextBaseUpRate - baseUpRate) > 0.01 || Math.abs(contextMeritRate - meritRate) > 0.01) {
        setBaseUpRate(contextBaseUpRate)
        setMeritRate(contextMeritRate)
        
        // 직급별 인상률도 업데이트
        if (contextLevelRates) {
          setLevelRates(contextLevelRates as {
            'Lv.1': { baseUp: number; merit: number }
            'Lv.2': { baseUp: number; merit: number }
            'Lv.3': { baseUp: number; merit: number }
            'Lv.4': { baseUp: number; merit: number }
          })
        }
        
        // 상세 인상률도 업데이트
        if (contextDetailedLevelRates) {
          setDetailedLevelRates(contextDetailedLevelRates)
        }
        
        // 총예산도 업데이트
        if (contextTotalBudget) {
          setTotalBudget(contextTotalBudget)
        }
      }
    }
  }, [contextBaseUpRate, contextMeritRate, contextLevelRates, contextDetailedLevelRates, contextTotalBudget, hasInitialized])
  
  // 새로운 인터페이스에 맞춰 수정
  const updateLevelRate = (level: string, rates: any) => {
    // 새로운 GradeSalaryAdjustmentTable에서 전체 rates 객체를 전달받음
    console.log(`Level ${level} rates updated:`, rates)
    // detailedLevelRates 업데이트
    if (rates) {
      setDetailedLevelRates(prev => ({
        ...prev,
        [level]: rates
      }))
      
      // levelRates도 업데이트 (baseUp과 merit만)
      setLevelRates(prev => ({
        ...prev,
        [level]: { baseUp: rates.baseUp, merit: rates.merit }
      }))
    }
  }
  
  // 승급/승격 예산 업데이트 핸들러 (개별 레벨)
  const updatePromotionBudget = (level: string, value: number) => {
    setPromotionBudgets(prev => ({
      ...prev,
      [level]: value
    }))
  }
  
  // 승급/승격 예산 업데이트 핸들러 (전체 레벨)
  const updateAllPromotionBudgets = (levelBudgets: {[key: string]: number}) => {
    // 직급별 예산을 억원 단위로 변환
    const budgets = {
      lv4: (levelBudgets['Lv.4'] || 0) / 100000000,
      lv3: (levelBudgets['Lv.3'] || 0) / 100000000,
      lv2: (levelBudgets['Lv.2'] || 0) / 100000000,
      lv1: (levelBudgets['Lv.1'] || 0) / 100000000
    }
    setPromotionBudgets(budgets)
  }
  
  // 추가 인상 예산 업데이트 핸들러
  const updateAdditionalBudget = (value: number) => {
    setAdditionalBudget(value)
  }
  
  // 시나리오 저장 핸들러
  const handleSaveScenario = async (name: string) => {
    // 사용 예산 계산
    const usedBudget = budgetDetails.aiRecommendation + budgetDetails.promotion + budgetDetails.additional + budgetDetails.indirect
    
    console.log('[Dashboard] 시나리오 저장 - 사용 예산:', {
      aiRecommendation: budgetDetails.aiRecommendation,
      promotion: budgetDetails.promotion,
      additional: budgetDetails.additional,
      indirect: budgetDetails.indirect,
      total: usedBudget
    })
    
    // Context로 저장 (모든 페이지 데이터 + 사용 예산 포함)
    await saveScenarioContext(name, { usedBudget })
  }
  
  // 시나리오 불러오기 핸들러
  const handleLoadScenario = (id: string) => {
    // Context에서 불러오기 (모든 페이지 데이터 포함)
    loadScenarioContext(id)
  }
  
  // GradeSalaryAdjustmentTable용 직원 데이터
  const employeeDataForTable = useMemo(() => {
    if (!data?.levelStatistics) return undefined
    
    return {
      totalCount: data.summary.totalEmployees,
      levels: data.levelStatistics.reduce((acc, level) => ({
        ...acc,
        [level.level]: {
          headcount: level.employeeCount,
          averageSalary: parseInt(level.averageSalary)
        }
      }), {})
    }
  }, [data?.levelStatistics, data?.summary?.totalEmployees])
  
  // 내보내기용 데이터 준비
  const exportData = useMemo(() => {
    const currentState = {
      baseUpRate,
      meritRate,
      totalBudget,
      levelTotalRates,
      weightedAverageRate,
      meritWeightedAverage
    }
    
    // 현재 활성 시나리오 이름 가져오기
    const activeScenario = scenarios.find(s => s.id === activeScenarioId)
    const scenarioName = activeScenario?.name || '현재 설정'
    
    return prepareExportData(
      currentState,
      budgetDetails,
      data?.levelStatistics,
      detailedLevelRates,
      scenarioName
    )
  }, [
    baseUpRate,
    meritRate,
    totalBudget,
    levelTotalRates,
    weightedAverageRate,
    meritWeightedAverage,
    budgetDetails,
    detailedLevelRates,
    data?.levelStatistics,
    scenarios,
    activeScenarioId
  ])
  
  // 현재 시나리오 이름
  const currentScenarioName = useMemo(() => {
    const activeScenario = scenarios.find(s => s.id === activeScenarioId)
    return activeScenario?.name || '현재 설정'
  }, [scenarios, activeScenarioId])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow h-96"></div>
              <div className="bg-white rounded-lg shadow h-96"></div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">데이터를 불러오는 중 오류가 발생했습니다: {error}</p>
            <button 
              onClick={refresh}
              className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              다시 시도
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-200">
      {/* 네비게이션 바 아래에 버튼 영역 추가 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-end items-center h-12 gap-2">
            <ScenarioManager
              scenarios={scenarios}
              activeScenarioId={activeScenarioId}
              onSave={handleSaveScenario}
              onLoad={handleLoadScenario}
              onDelete={deleteScenario}
              onRename={renameScenario}
              isNavigation={true}
            />
            <button
              onClick={() => {
                // API 데이터 새로고침
                refresh()
                // 엑셀 AI 데이터로 리셋
                if (data?.aiRecommendation) {
                  const aiData = data.aiRecommendation
                  // AI 추천값 복원
                  setAiBaseUpRate(aiData.baseUpPercentage)
                  setAiMeritRate(aiData.meritIncreasePercentage)
                  // 사용자 조정값도 AI 값으로 초기화
                  setBaseUpRate(aiData.baseUpPercentage)
                  setMeritRate(aiData.meritIncreasePercentage)
                  // 총예산도 리셋 시 재계산
                  if (data?.summary?.totalPayroll && aiData) {
                    const totalPayroll = data.summary.totalPayroll
                    const directBudget = totalPayroll * (aiData.totalPercentage / 100)
                    const indirectCost = directBudget * 0.178 // 간접비용 17.8%
                    const calculatedTotalBudget = directBudget + indirectCost
                    setTotalBudget(Math.round(calculatedTotalBudget))
                  } else if (data.budget?.totalBudget) {
                    const budgetValue = typeof data.budget.totalBudget === 'string' 
                      ? parseFloat(data.budget.totalBudget.replace(/[^0-9.-]/g, ''))
                      : data.budget.totalBudget
                    setTotalBudget(budgetValue)
                  } else {
                    setTotalBudget(0)
                  }
                  setLevelRates({
                    'Lv.1': { baseUp: aiData.baseUpPercentage, merit: aiData.meritIncreasePercentage },
                    'Lv.2': { baseUp: aiData.baseUpPercentage, merit: aiData.meritIncreasePercentage },
                    'Lv.3': { baseUp: aiData.baseUpPercentage, merit: aiData.meritIncreasePercentage },
                    'Lv.4': { baseUp: aiData.baseUpPercentage, merit: aiData.meritIncreasePercentage }
                  })
                  setDetailedLevelRates({
                    'Lv.4': { baseUp: aiData.baseUpPercentage, merit: aiData.meritIncreasePercentage, promotion: 0, advancement: 0, additional: 0 },
                    'Lv.3': { baseUp: aiData.baseUpPercentage, merit: aiData.meritIncreasePercentage, promotion: 0, advancement: 0, additional: 0 },
                    'Lv.2': { baseUp: aiData.baseUpPercentage, merit: aiData.meritIncreasePercentage, promotion: 0, advancement: 0, additional: 0 },
                    'Lv.1': { baseUp: aiData.baseUpPercentage, merit: aiData.meritIncreasePercentage, promotion: 0, advancement: 0, additional: 0 }
                  })
                  
                  // Default 시나리오도 AI 값으로 리셋 (loadScenario를 통해)
                  loadScenarioContext('default')
                }
                setPromotionBudgets({ lv1: 0, lv2: 0, lv3: 0, lv4: 0 })
                setAdditionalBudget(0)
                setEnableAdditionalIncrease(false)
                setCalculatedAdditionalBudget(0)
                setLevelTotalRates({
                  'Lv.1': 0,
                  'Lv.2': 0,
                  'Lv.3': 0,
                  'Lv.4': 0
                })
                setWeightedAverageRate(0)
                setMeritWeightedAverage(0)
              }}
              className="h-8 md:h-9 px-2 md:px-4 text-xs md:text-sm font-medium bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              초기화
            </button>
            <SimpleExportButton 
              exportData={exportData}
              scenarioName={currentScenarioName}
              isNavigation={true}
            />
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-3 md:px-4 py-4">
        
        {/* 상단 레이아웃: 좌측 2개 카드, 우측 예산 활용 내역 상세 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-4 mb-2 md:mb-4">
          <div className="flex flex-col gap-4 h-full">
            {/* AI 제안 적정인상률 */}
            <AIRecommendationCard 
              data={data?.aiRecommendation || null} 
              totalEmployees={data?.summary?.totalEmployees || 0}
              baseUpRate={aiBaseUpRate}
              meritRate={aiMeritRate}
              meritWeightedAverage={meritWeightedAverage}
              onBaseUpChange={(value) => {
                // AI 추천값은 읽기 전용이므로 실제로는 변경하지 않음
                // 사용자가 슬라이더 조정 시 별도 로직으로 처리
                console.log('AI 추천값은 읽기 전용입니다. 직급별 조정 테이블을 사용하세요.')
              }}
              onMeritChange={(value) => {
                // AI 추천값은 읽기 전용이므로 실제로는 변경하지 않음
                console.log('AI 추천값은 읽기 전용입니다. 직급별 조정 테이블을 사용하세요.')
              }}
              onReset={() => {
                // AI 추천값 리셋 (엑셀 데이터로 복원)
                if (data?.aiRecommendation) {
                  const aiData = data.aiRecommendation
                  setAiBaseUpRate(aiData.baseUpPercentage)
                  setAiMeritRate(aiData.meritIncreasePercentage)
                }
              }}
            />
            
            {/* 인상 재원 예산 현황 */}
            <BudgetResourceCard
              totalBudget={totalBudget || 0}
              baseUpRate={baseUpRate}
              meritRate={meritRate}
              totalEmployees={data?.summary?.totalEmployees || 0}
              averageSalary={data?.summary?.averageSalary || 0}
              levelRates={levelRates}
              levelStatistics={data?.levelStatistics || []}
              customTotalBudget={totalBudget}
              onTotalBudgetChange={setTotalBudget}
              budgetDetails={budgetDetails}
            />
          </div>
          
          {/* 예산 활용 내역 상세 */}
          <BudgetUtilizationDetail
            baseUpRate={baseUpRate}
            meritRate={meritRate}
            meritWeightedAverage={meritWeightedAverage}
            totalEmployees={data?.summary?.totalEmployees || 0}
            totalSalaryBase={data?.summary?.totalPayroll || 0}
            totalBudget={totalBudget || 0} // 원 단위 그대로 사용
            levelStatistics={data?.levelStatistics || []}
            promotionBudgets={promotionBudgets}
            onPromotionBudgetChange={updatePromotionBudget}
            additionalBudget={calculatedAdditionalBudget} // 자동 계산된 값 사용
            onAdditionalBudgetChange={updateAdditionalBudget}
            enableAdditionalIncrease={enableAdditionalIncrease}
            onBudgetCalculated={setBudgetDetails}
          />
        </div>
        
        {/* 중앙: 직급별 고정급 인상률 조정 테이블 */}
        <div className="mb-4">
          <GradeSalaryAdjustmentTable
            baseUpRate={baseUpRate}
            meritRate={meritRate}
            initialRates={detailedLevelRates}
            employeeData={employeeDataForTable}
            enableAdditionalIncrease={enableAdditionalIncrease}
            onEnableAdditionalIncreaseChange={setEnableAdditionalIncrease}
            onRateChange={updateLevelRate}
            onTotalBudgetChange={(totalBudget) => {
              console.log('Total budget changed:', totalBudget)
              // 필요시 다른 컴포넌트에 예산 정보 전달
            }}
            onAdditionalBudgetChange={setCalculatedAdditionalBudget}
            onPromotionBudgetChange={updateAllPromotionBudgets}  // 승급/승격 예산 콜백 추가
            onLevelTotalRatesChange={(rates, avgRate) => {
              setLevelTotalRates(rates)
              setWeightedAverageRate(avgRate)
            }}
            onMeritWeightedAverageChange={setMeritWeightedAverage}
            onTotalSummaryChange={(summary) => {
              // GradeSalaryAdjustmentTable의 전체 평균값을 WageContext에만 반영
              // 대시보드 AI 추천값은 유지하고, 조정값만 Context로 전달
              setContextBaseUpRate(summary.avgBaseUp)
              setContextMeritRate(summary.avgMerit)
            }}
          />
        </div>
        
        {/* 하단: C사 대비 비교 */}
        <div className="mb-4">
          <IndustryComparisonSection
            baseUpRate={baseUpRate}
            meritRate={meritRate}
            levelTotalRates={levelTotalRates}
            weightedAverageRate={weightedAverageRate}
            levelStatistics={data?.levelStatistics || []}
            competitorData={data?.competitorData}  // 엑셀에서 C사 데이터 가져오기
            competitorIncreaseRate={data?.industryComparison?.competitor || 0}  // C사 인상률
          />
        </div>



        <div className="mt-3 text-center text-xs text-gray-500">
          <p>마지막 업데이트: {data ? new Date(data.summary.lastUpdated).toLocaleString('ko-KR') : '-'}</p>
        </div>
      </div>
    </main>
  )
}