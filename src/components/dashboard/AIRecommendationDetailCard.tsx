'use client'

// import removed - not used

interface AIRecommendationDetailCardProps {
  baseUpRate: number
  meritRate: number
  totalEmployees: number
  averageSalary: number
  levelRates?: Record<string, { baseUp: number; merit: number }>
  levelStatistics?: Array<{
    level: string
    employeeCount: number
    averageSalary: string
  }>
  totalBudget?: number // 총 예산 (억원 단위)
}

export function AIRecommendationDetailCard({ 
  baseUpRate, 
  meritRate, 
  totalEmployees,
  averageSalary,
  levelRates,
  levelStatistics,
  totalBudget
}: AIRecommendationDetailCardProps) {
  // 개별 레벨 인상률이 있으면 레벨별로 계산, 없으면 전체 평균 사용
  let baseUpBudget = 0
  let meritBudget = 0
  
  if (levelRates && levelStatistics) {
    // 레벨별로 계산
    levelStatistics.forEach((level) => {
      const levelRate = levelRates[level.level]
      if (levelRate) {
        const levelAvgSalary = parseFloat(level.averageSalary)
        const levelBaseUpBudget = (level.employeeCount * levelAvgSalary * levelRate.baseUp / 100) * 12 / 100000000
        const levelMeritBudget = (level.employeeCount * levelAvgSalary * levelRate.merit / 100) * 12 / 100000000
        baseUpBudget += levelBaseUpBudget
        meritBudget += levelMeritBudget
      }
    })
    baseUpBudget = Math.round(baseUpBudget)
    meritBudget = Math.round(meritBudget)
  } else {
    // 전체 평균으로 계산
    baseUpBudget = Math.round((totalEmployees * averageSalary * baseUpRate / 100) * 12 / 100000000)
    meritBudget = Math.round((totalEmployees * averageSalary * meritRate / 100) * 12 / 100000000)
  }
  
  const totalRecommendationBudget = baseUpBudget + meritBudget
  
  // 활용률 계산 (AI 적정 인상률 예산 / 전체 예산)
  const utilizationRate = totalBudget && totalBudget > 0 
    ? Math.round((totalRecommendationBudget / totalBudget) * 100)
    : 0

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-bold">1</span>
        </div>
        <h3 className="text-lg font-semibold">
          AI 적정 인상률 예산
          <span className="ml-2 text-sm text-gray-600">
            AI를 기반으로 도출된 적정 인상률 적용 시 필요 재원
          </span>
        </h3>
        <span className="ml-auto text-lg font-bold text-blue-600">{utilizationRate}% 활용</span>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-700 font-medium mb-1">Base-up 재원</p>
          <p className="text-3xl font-bold text-gray-900">{baseUpBudget}억</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-700 font-medium mb-1">성과 인상률 재원</p>
          <p className="text-3xl font-bold text-gray-900">{meritBudget}억</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-700 font-medium mb-1">Total</p>
          <p className="text-3xl font-bold text-blue-600">{totalRecommendationBudget}억</p>
        </div>
      </div>
    </div>
  )
}