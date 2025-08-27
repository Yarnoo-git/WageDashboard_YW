/**
 * 대시보드 페이지
 * 예산 설정 및 인상률 개요 (간소화된 버전)
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWageContextNew } from '@/context/WageContextNew'
import { useWageContextAdapter } from '@/hooks/useWageContextAdapter'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'
import { UNITS, BUDGET_CONFIG } from '@/config/constants'

export default function DashboardPage() {
  const router = useRouter()
  const newContext = useWageContextNew()
  const adapter = useWageContextAdapter()
  
  const availableBudget = newContext.config.budget.available
  const welfareBudget = newContext.config.budget.welfare
  const totalBudget = newContext.config.budget.total
  const baseUpRate = adapter.baseUpRate
  const meritRate = adapter.meritRate
  const contextEmployeeData = newContext.originalData.employees
  
  const [budgetInput, setBudgetInput] = useState('')
  const [welfareInput, setWelfareInput] = useState('')
  
  // 초기값 설정
  useEffect(() => {
    setBudgetInput((availableBudget / UNITS.HUNDRED_MILLION).toFixed(0))
    setWelfareInput((welfareBudget / UNITS.HUNDRED_MILLION).toFixed(0))
  }, [availableBudget, welfareBudget])
  
  // 데이터 없으면 홈으로
  useEffect(() => {
    if (!newContext.isLoading && contextEmployeeData.length === 0) {
      router.push('/home')
    }
  }, [newContext.isLoading, contextEmployeeData, router])
  
  // 총 인원수
  const totalEmployees = contextEmployeeData?.length || 0
  
  // 예산 적용
  const handleBudgetApply = () => {
    const budget = parseFloat(budgetInput) * UNITS.HUNDRED_MILLION
    const welfare = parseFloat(welfareInput) * UNITS.HUNDRED_MILLION
    
    if (!isNaN(budget) && budget >= 0 && !isNaN(welfare) && welfare >= 0) {
      newContext.actions.updateBudget(budget + welfare, welfare)
    }
  }
  
  // 예산 사용량은 context에서 직접 가져오기
  const budgetUsage = newContext.computed.budgetUsage ? {
    directCost: newContext.computed.budgetUsage.directCost,
    indirectCost: newContext.computed.budgetUsage.indirectCost,
    totalCost: newContext.computed.budgetUsage.totalCost,
    remaining: newContext.computed.budgetUsage.remaining,
    usagePercentage: newContext.computed.budgetUsage.usagePercentage
  } : null
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <main className="pt-8 px-6 pb-8">
        <div className="max-w-5xl mx-auto">
          {/* 헤더 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">예산 관리 센터</h1>
            <p className="text-sm text-gray-600 mt-1">
              예산 설정 및 인상률 현황
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {totalEmployees.toLocaleString()}명
              </span>
            </p>
          </div>
          
          {/* 예산 설정 카드 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">예산 설정</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  가용 예산
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-600">억원</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  복리후생비
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={welfareInput}
                    onChange={(e) => setWelfareInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-600">억원</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                총 예산: <span className="font-semibold text-gray-900">
                  {formatKoreanCurrency(totalBudget)}
                </span>
                {welfareBudget > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    (복리후생 제외: {formatKoreanCurrency(availableBudget - welfareBudget)})
                  </span>
                )}
              </div>
              
              <button
                onClick={handleBudgetApply}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                예산 적용
              </button>
            </div>
          </div>
          
          {/* 인상률 현황 카드 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">인상률 현황</h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Base-up</div>
                <div className="text-2xl font-bold text-blue-600 mt-1">
                  {formatPercentage(baseUpRate)}
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Merit</div>
                <div className="text-2xl font-bold text-green-600 mt-1">
                  {formatPercentage(meritRate)}
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">총 인상률</div>
                <div className="text-2xl font-bold text-purple-600 mt-1">
                  {formatPercentage(baseUpRate + meritRate)}
                </div>
              </div>
            </div>
          </div>
          
          {/* 예산 사용 현황 카드 */}
          {budgetUsage && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">예산 사용 현황</h2>
              
              <div className="space-y-4">
                {/* 진행 바 */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">사용률</span>
                    <span className={`font-bold ${
                      budgetUsage.usagePercentage > 90 ? 'text-red-600' :
                      budgetUsage.usagePercentage > 70 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {budgetUsage.usagePercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        budgetUsage.usagePercentage > 90 ? 'bg-red-500' :
                        budgetUsage.usagePercentage > 70 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, budgetUsage.usagePercentage)}%` }}
                    />
                  </div>
                </div>
                
                {/* 상세 내역 */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-sm">
                    <div className="text-gray-600">직접비</div>
                    <div className="font-semibold">{formatKoreanCurrency(budgetUsage.directCost)}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-600">간접비 ({(BUDGET_CONFIG.INDIRECT_COST.TOTAL * 100).toFixed(1)}%)</div>
                    <div className="font-semibold">{formatKoreanCurrency(budgetUsage.indirectCost)}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-600">총 소요 예산</div>
                    <div className="font-bold text-lg">{formatKoreanCurrency(budgetUsage.totalCost)}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-600">잔여 예산</div>
                    <div className={`font-bold text-lg ${
                      budgetUsage.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatKoreanCurrency(budgetUsage.remaining)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 시뮬레이션 이동 버튼 */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => router.push('/home')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              홈으로
            </button>
            <button
              onClick={() => router.push('/simulation')}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-md"
            >
              시뮬레이션 센터로 이동 →
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}