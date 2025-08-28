'use client'

// import removed - not used

interface IndirectCostImpactCardProps {
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

export function IndirectCostImpactCard({ 
  baseUpRate, 
  meritRate, 
  totalEmployees,
  averageSalary,
  levelRates,
  levelStatistics,
  totalBudget
}: IndirectCostImpactCardProps) {
  // 개별 레벨 인상률이 있으면 레벨별로 계산, 없으면 전체 평균 사용
  let baseSalaryBudget = 0
  
  if (levelRates && levelStatistics) {
    // 레벨별로 계산
    levelStatistics.forEach((level) => {
      const levelRate = levelRates[level.level]
      if (levelRate) {
        const levelAvgSalary = parseFloat(level.averageSalary)
        const levelTotalRate = levelRate.baseUp + levelRate.merit
        const levelBudget = (level.employeeCount * levelAvgSalary * levelTotalRate / 100) * 12 / 100000000
        baseSalaryBudget += levelBudget
      }
    })
    baseSalaryBudget = Math.round(baseSalaryBudget)
  } else {
    // 전체 평균으로 계산
    const totalRate = baseUpRate + meritRate
    baseSalaryBudget = Math.round((totalEmployees * averageSalary * totalRate / 100) * 12 / 100000000)
  }
  
  // 퇴직급여충당분 (기본급의 약 8.3%)
  const retirementProvision = Math.round(baseSalaryBudget * 0.083)
  const retirementRate = 4.5
  
  // 4대보험 (기본급의 약 11.3%)
  const socialInsurance = Math.round(baseSalaryBudget * 0.113)
  const insuranceRate = 11.3
  
  // 기타 복리후생 (기본급의 약 3%)
  const welfareBenefit = Math.round(baseSalaryBudget * 0.03)
  
  // 총 간접비용
  const totalIndirectCost = retirementProvision + socialInsurance + welfareBenefit
  
  // 활용률 계산 (간접비용 / 전체 예산)
  const utilizationRate = totalBudget && totalBudget > 0 
    ? Math.round((totalIndirectCost / totalBudget) * 100)
    : 0

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
          <span className="text-orange-600 font-bold">3</span>
        </div>
        <h3 className="text-lg font-semibold">
          간접비용 Impact
          <span className="ml-2 text-sm text-gray-600">
            급여 인상에 따른 4대보험, 퇴직급여충당금 등 간접비용 인상분
          </span>
        </h3>
        <span className="ml-auto text-lg font-bold text-orange-600">{utilizationRate}% 활용</span>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-700 font-medium">퇴직급여충당분</p>
            <p className="text-sm text-gray-600 font-medium">({retirementRate}%)</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-700 font-medium">4대보험</p>
            <p className="text-sm text-gray-600 font-medium">({insuranceRate}%)</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{retirementProvision}억 원</p>
            <p className="text-xs text-gray-600 font-medium">기타 복리후생 (3%)</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{socialInsurance}억 원</p>
            <p className="text-sm font-semibold text-gray-700">총 간접비용</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center">
          <div className="bg-orange-50 rounded-lg p-6 text-center">
            <p className="text-2xl font-bold text-gray-900">{welfareBenefit}억 원</p>
            <div className="mt-2 pt-2 border-t border-orange-200">
              <p className="text-3xl font-bold text-orange-600">{totalIndirectCost}억 원</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}