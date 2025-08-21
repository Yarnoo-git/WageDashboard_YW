'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMetadata } from '@/hooks/useMetadata'
import { useWageContext } from '@/context/WageContext'
import { PersonTable } from '@/components/person/PersonTable'
import { SimpleExportButton } from '@/components/ExportButton'
import { ScenarioManager } from '@/components/ScenarioManager'
import { RateInfoCard } from '@/components/common/RateInfoCard'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'

export default function PersonPage() {
  const router = useRouter()
  const { departments, levels, ratings, loading: metadataLoading } = useMetadata()
  const { 
    baseUpRate, 
    meritRate, 
    levelRates,
    bandFinalRates,
    payZoneRates,
    adjustmentMode,
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
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedRating, setSelectedRating] = useState<string>('')
  
  // 예산 사용률 계산
  const getBudgetUsagePercentage = () => {
    if (!contextEmployeeData || contextEmployeeData.length === 0) return 0
    
    let totalDirect = 0
    contextEmployeeData.forEach(emp => {
      const level = emp.level
      const band = emp.band
      const payZone = emp.payZone
      
      let rates = { baseUp: 0, merit: 0 }
      
      // 모드에 따른 인상률 적용
      if (adjustmentMode === 'expert' && payZone !== undefined && payZoneRates[payZone]?.[band]?.[level]) {
        rates = payZoneRates[payZone][band][level]
      } else if (adjustmentMode === 'advanced' && band && bandFinalRates[band]?.[level]) {
        rates = bandFinalRates[band][level]
      } else if (levelRates[level]) {
        rates = levelRates[level]
      }
      
      const totalRate = rates.baseUp + rates.merit
      const increase = emp.currentSalary * (totalRate / 100)
      totalDirect += increase
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
      <main className="pt-20 px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 섹션 */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-transparent bg-clip-text">
                개인별 시뮬레이션 결과
              </h1>
              <p className="text-gray-600 mt-2">
                직원별 인상 결과 확인
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {contextEmployeeData?.length || 0}명
                </span>
              </p>
            </div>
            
            {/* 가중치 설정 버튼 */}
          </div>
          
          {/* 시뮬레이션 정보 카드 */}
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 조정 모드 */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">조정 모드</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className={`px-3 py-2 rounded-lg text-center font-semibold ${
                adjustmentMode === 'simple' ? 'bg-blue-100 text-blue-700' :
                adjustmentMode === 'advanced' ? 'bg-purple-100 text-purple-700' :
                'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700'
              }`}>
                {adjustmentMode === 'simple' ? 'Simple (Level)' :
                 adjustmentMode === 'advanced' ? 'Advanced (Band×Level)' :
                 'Expert (PayZone×Band×Level)'}
              </div>
            </div>
            
            {/* 적용 인상률 */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">평균 인상률</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {formatPercentage((baseUpRate || 0) + (meritRate || 0))}
                </span>
                <span className="text-xs text-gray-500">
                  (Base {formatPercentage(baseUpRate || 0)} + 성과 {formatPercentage(meritRate || 0)})
                </span>
              </div>
            </div>
            
            {/* 예산 사용률 */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-orange-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">예산 사용률</span>
                <button 
                  onClick={() => router.push('/simulation')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  시뮬레이션 →
                </button>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${
                  getBudgetUsagePercentage() > 100 ? 'text-red-600' :
                  getBudgetUsagePercentage() > 80 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {getBudgetUsagePercentage().toFixed(1)}%
                </span>
                {getBudgetUsagePercentage() > 100 && (
                  <span className="text-xs text-red-600 font-medium">초과!</span>
                )}
              </div>
            </div>
          </div>

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