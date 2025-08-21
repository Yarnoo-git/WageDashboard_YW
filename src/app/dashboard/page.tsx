'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWageContext } from '@/context/WageContext'
import { useDashboardData } from '@/hooks/useDashboardData'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const { data, loading } = useDashboardData()
  
  const {
    // 예산 관련 (읽기만)
    availableBudget,
    welfareBudget,
    totalBudget,
    setAvailableBudget,
    setWelfareBudget,
    
    // 인상률 (읽기만)
    baseUpRate,
    meritRate,
    levelRates,
    
    // 직원 데이터
    contextEmployeeData
  } = useWageContext()
  
  const [showBudgetDetail, setShowBudgetDetail] = useState(false)
  
  // 데이터 없으면 홈으로
  useEffect(() => {
    if (!loading && (!contextEmployeeData || contextEmployeeData.length === 0)) {
      router.push('/home')
    }
  }, [contextEmployeeData, loading, router])
  
  // 총 인원수
  const totalEmployees = contextEmployeeData?.length || 0
  
  // 총 인상률 계산
  const totalRate = baseUpRate + meritRate
  
  // 예산 사용량 계산
  const calculateBudgetUsage = () => {
    if (!contextEmployeeData || contextEmployeeData.length === 0) return null
    
    let totalDirect = 0
    contextEmployeeData.forEach(emp => {
      const level = emp.level
      const rate = levelRates[level] || { baseUp: baseUpRate, merit: meritRate }
      const totalRate = rate.baseUp + rate.merit
      const increase = emp.currentSalary * (totalRate / 100)
      totalDirect += increase
    })
    
    const totalIndirect = totalDirect * 0.178
    const total = totalDirect + totalIndirect
    const actualBudget = availableBudget - welfareBudget
    const percentage = actualBudget > 0 ? (total / actualBudget) * 100 : 0
    
    return {
      direct: totalDirect,
      indirect: totalIndirect,
      total,
      percentage
    }
  }
  
  const budgetUsage = calculateBudgetUsage()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <main className="pt-20 px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 섹션 */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
              예산 관리 대시보드
            </h1>
            <p className="text-gray-600 mt-2">예산 설정 및 인상률 현황 모니터링</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 좌상단: 인상률 표시 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">인상률 현황</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Base-up</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPercentage(baseUpRate)}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">성과인상률</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatPercentage(meritRate)}
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">총 인상률</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatPercentage(totalRate)}
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">총 인원</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {totalEmployees.toLocaleString()}명
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => router.push('/simulation')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  시뮬레이션에서 조정하기 →
                </button>
              </div>
            </div>
            
            {/* 우상단: 예산 설정 (주요 기능) */}
            <div className="bg-gradient-to-br from-white to-indigo-50 rounded-lg shadow-md p-6 border-2 border-indigo-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                예산 설정
                <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">조정 가능</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사용가능 예산
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={availableBudget / 100000000}
                      onChange={(e) => setAvailableBudget(parseFloat(e.target.value || '0') * 100000000)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      step="1"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">억원</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    복리후생 예산
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={welfareBudget / 100000000}
                      onChange={(e) => setWelfareBudget(parseFloat(e.target.value || '0') * 100000000)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      step="0.1"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">억원</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">사용 예산</span>
                    <span className="text-lg font-bold text-blue-600">
                      {budgetUsage ? formatKoreanCurrency(budgetUsage.total, '억원', 100000000) : '계산 중...'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">가용률</span>
                    <span className={`text-lg font-bold ${
                      budgetUsage && budgetUsage.percentage > 100 ? 'text-red-600' :
                      budgetUsage && budgetUsage.percentage > 80 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {budgetUsage ? `${budgetUsage.percentage.toFixed(1)}%` : '계산 중...'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setShowBudgetDetail(!showBudgetDetail)}
                    className="mt-3 w-full px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    {showBudgetDetail ? '상세 내역 숨기기 ▲' : '상세 내역 보기 ▼'}
                  </button>
                  
                  {showBudgetDetail && budgetUsage && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base-up</span>
                        <span className="font-medium">
                          {formatKoreanCurrency(budgetUsage.direct * (baseUpRate / (baseUpRate + meritRate)), '억원', 100000000)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">성과인상</span>
                        <span className="font-medium">
                          {formatKoreanCurrency(budgetUsage.direct * (meritRate / (baseUpRate + meritRate)), '억원', 100000000)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">추가인상</span>
                        <span className="font-medium">0억원</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-gray-600">간접비용 (17.8%)</span>
                        <span className="font-medium">
                          {formatKoreanCurrency(budgetUsage.indirect, '억원', 100000000)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* 직급별 현황 */}
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">직급별 인상률 현황</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">직급</th>
                    <th className="text-right py-2 px-4">인원</th>
                    <th className="text-right py-2 px-4">Base-up</th>
                    <th className="text-right py-2 px-4">성과인상률</th>
                    <th className="text-right py-2 px-4">총 인상률</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(levelRates).map(([level, rates]) => {
                    const levelCount = contextEmployeeData?.filter(emp => emp.level === level).length || 0
                    return (
                      <tr key={level} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4 font-medium">{level}</td>
                        <td className="text-right py-2 px-4">{levelCount.toLocaleString()}명</td>
                        <td className="text-right py-2 px-4">{formatPercentage(rates.baseUp)}</td>
                        <td className="text-right py-2 px-4">{formatPercentage(rates.merit)}</td>
                        <td className="text-right py-2 px-4 font-semibold text-blue-600">
                          {formatPercentage(rates.baseUp + rates.merit)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}