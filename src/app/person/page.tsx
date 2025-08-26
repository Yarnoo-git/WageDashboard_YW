'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useMetadata } from '@/hooks/useMetadata'
import { useWageContext } from '@/context/WageContext'
import { useSimulationLogic } from '@/hooks/useSimulationLogic'
import { PersonTable } from '@/components/person/PersonTable'
import { SimpleExportButton } from '@/components/ExportButton'
import { ScenarioManager } from '@/components/ScenarioManager'
import { RateInfoCard } from '@/components/common/RateInfoCard'
import { FixedSummaryBar } from '@/components/simulation/FixedSummaryBar'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'
import { calculateWeightedAverage } from '@/utils/simulationHelpers'

export default function PersonPage() {
  const router = useRouter()
  const { departments, levels, ratings, loading: metadataLoading } = useMetadata()
  const { 
    contextEmployeeData,
    scenarios,
    activeScenarioId,
    saveScenario,
    loadScenario,
    deleteScenario,
    renameScenario,
    availableBudget,
    welfareBudget
  } = useWageContext()
  
  // useSimulationLogic에서 필요한 데이터 가져오기
  const {
    allGradeRates,
    levelGradeRates,
    payZoneLevelGradeRates,
    adjustmentScope,
    selectedBands,
    budgetUsage,
    additionalType,
    contextBaseUpRate,
    contextMeritRate,
    dynamicStructure,
    totalEmployees
  } = useSimulationLogic()
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedRating, setSelectedRating] = useState<string>('')
  
  // 가중평균 인상률 계산 (시뮬레이션 페이지와 동일한 로직)
  const calculateWeightedAverageRates = useMemo(() => {
    if (!contextEmployeeData || contextEmployeeData.length === 0) {
      return { baseUp: 0, merit: 0, additional: 0 }
    }

    const filteredEmployees = selectedBands.length > 0 && selectedBands.length < dynamicStructure.bands.length
      ? contextEmployeeData.filter(emp => emp.band && selectedBands.includes(emp.band))
      : contextEmployeeData

    if (filteredEmployees.length === 0) {
      return { baseUp: 0, merit: 0, additional: 0 }
    }

    let totalBaseUp = 0
    let totalMerit = 0
    let totalAdditional = 0
    let totalCount = 0

    filteredEmployees.forEach(emp => {
      const grade = emp.performanceRating
      if (!grade) return

      let baseUp = 0, merit = 0, additional = 0
      
      if (adjustmentScope === 'all' && allGradeRates.byGrade[grade]) {
        baseUp = allGradeRates.byGrade[grade].baseUp || 0
        merit = allGradeRates.byGrade[grade].merit || 0
        additional = allGradeRates.byGrade[grade].additional || 0
      } else if (adjustmentScope === 'level' && emp.level && levelGradeRates[emp.level]?.byGrade[grade]) {
        baseUp = levelGradeRates[emp.level].byGrade[grade].baseUp || 0
        merit = levelGradeRates[emp.level].byGrade[grade].merit || 0
        additional = levelGradeRates[emp.level].byGrade[grade].additional || 0
      } else if (adjustmentScope === 'payzone' && emp.payZone !== undefined && emp.level) {
        const payZoneData = payZoneLevelGradeRates[emp.payZone]?.[emp.level]?.byGrade[grade]
        if (payZoneData) {
          baseUp = payZoneData.baseUp || 0
          merit = payZoneData.merit || 0
          additional = payZoneData.additional || 0
        }
      }

      totalBaseUp += baseUp
      totalMerit += merit
      totalAdditional += additional
      totalCount++
    })

    if (totalCount === 0) {
      return { baseUp: 0, merit: 0, additional: 0 }
    }

    return {
      baseUp: totalBaseUp / totalCount,
      merit: totalMerit / totalCount,
      additional: totalAdditional / totalCount
    }
  }, [contextEmployeeData, selectedBands, dynamicStructure.bands, adjustmentScope, 
      allGradeRates, levelGradeRates, payZoneLevelGradeRates])
  
  // 예산 사용률 계산 (Grade 기반)
  const getBudgetUsagePercentage = () => {
    if (!contextEmployeeData || contextEmployeeData.length === 0) return 0
    
    let totalDirect = 0
    const filteredEmployees = selectedBands.length > 0 && selectedBands.length < dynamicStructure.bands.length
      ? contextEmployeeData.filter(emp => emp.band && selectedBands.includes(emp.band))
      : contextEmployeeData
    
    filteredEmployees.forEach(emp => {
      const grade = emp.performanceRating
      if (!grade) return
      
      let baseUp = 0, merit = 0, additional = 0
      
      // adjustmentScope에 따른 Grade 기반 인상률 적용
      if (adjustmentScope === 'all' && allGradeRates.byGrade[grade]) {
        baseUp = allGradeRates.byGrade[grade].baseUp || 0
        merit = allGradeRates.byGrade[grade].merit || 0
        additional = allGradeRates.byGrade[grade].additional || 0
      } else if (adjustmentScope === 'level' && emp.level && levelGradeRates[emp.level]?.byGrade[grade]) {
        baseUp = levelGradeRates[emp.level].byGrade[grade].baseUp || 0
        merit = levelGradeRates[emp.level].byGrade[grade].merit || 0
        additional = levelGradeRates[emp.level].byGrade[grade].additional || 0
      } else if (adjustmentScope === 'payzone' && emp.payZone !== undefined && emp.level) {
        const payZoneData = payZoneLevelGradeRates[emp.payZone]?.[emp.level]?.byGrade[grade]
        if (payZoneData) {
          baseUp = payZoneData.baseUp || 0
          merit = payZoneData.merit || 0
          additional = payZoneData.additional || 0
        }
      }
      
      const totalRate = baseUp + merit + (additionalType === 'percentage' ? additional : 0)
      const increase = emp.currentSalary * (totalRate / 100)
      const additionalAmount = additionalType === 'amount' ? additional * 10000 : 0
      totalDirect += increase + additionalAmount
    })
    
    const totalIndirect = totalDirect * 0.178
    const total = totalDirect + totalIndirect
    const actualBudget = availableBudget - welfareBudget
    
    return actualBudget > 0 ? (total / actualBudget) * 100 : 0
  }
  
  // 데이터 없으면 홈으로
  useEffect(() => {
    if (!metadataLoading && (!contextEmployeeData || contextEmployeeData.length === 0)) {
      router.push('/home')
    }
  }, [contextEmployeeData, metadataLoading, router])

  // 메타데이터 로딩 중일 때 로딩 화면 표시
  if (metadataLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-lg shadow h-96"></div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Fixed Summary Bar - 스크롤 시 상단 고정 */}
      <FixedSummaryBar
        totalEmployees={totalEmployees}
        currentBaseUp={calculateWeightedAverageRates.baseUp}
        currentMerit={calculateWeightedAverageRates.merit}
        currentAdditional={calculateWeightedAverageRates.additional}
        additionalType={additionalType}
        aiBaseUp={contextBaseUpRate}
        aiMerit={contextMeritRate}
        totalBudget={availableBudget - welfareBudget}
        usedBudget={budgetUsage.total}
        budgetPercentage={budgetUsage.percentage}
      />
      
      <main className="pt-20 px-6 pb-8">
        <div className="max-w-7xl mx-auto">

        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">필터</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                직급
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">전체</option>
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                부서
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">전체</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                평가등급
              </label>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">전체</option>
                {ratings.map(rating => (
                  <option key={rating} value={rating}>
                    {rating}등급
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

          <PersonTable 
            level={selectedLevel} 
            department={selectedDepartment}
            performanceRating={selectedRating}
          />
        </div>
      </main>
      
    </div>
  )
}