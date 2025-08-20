'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'

interface EmployeeDetail {
  id: string
  employeeNumber: string
  name: string
  department: string
  level: string
  currentSalary: number
  performanceRating: string | null
  hireDate: string
  salaryHistories: Array<{
    id: string
    effectiveDate: string
    previousSalary: number
    newSalary: number
    increasePercentage: number
    reason: string
  }>
  wageCalculations: Array<{
    id: string
    calculationDate: string
    baseUpPercentage: number
    meritIncreasePercentage: number
    totalPercentage: number
    suggestedSalary: number
    status: string
  }>
}

function EmployeeDetailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const employeeId = searchParams.get('id')
  
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null)
  const [comparisons, setComparisons] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  
  // 계산 폼 상태
  const [baseUp, setBaseUp] = useState(3.2)
  const [merit, setMerit] = useState(2.5)
  const [showCalculation, setShowCalculation] = useState(false)
  const [calculationResult, setCalculationResult] = useState<any>(null)

  useEffect(() => {
    if (employeeId) {
      fetchEmployee()
    } else {
      // ID가 없으면 목록으로 리다이렉트
      router.push('/employees')
    }
  }, [employeeId])

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`)
      const data = await response.json()
      setEmployee(data.employee)
      setComparisons(data.comparisons)
    } catch (error) {
      console.error('Failed to fetch employee:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculate = async (applyToSalary: boolean = false) => {
    setCalculating(true)
    try {
      const response = await fetch(`/api/employees/${employeeId}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUpPercentage: baseUp,
          meritIncreasePercentage: merit,
          applyToSalary,
        }),
      })
      
      const result = await response.json()
      setCalculationResult(result)
      
      if (applyToSalary) {
        await fetchEmployee() // 데이터 새로고침
        setShowCalculation(false)
        setCalculationResult(null)
      }
    } catch (error) {
      console.error('Calculation failed:', error)
    } finally {
      setCalculating(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="bg-white rounded-lg shadow h-96"></div>
          </div>
        </div>
      </main>
    )
  }

  if (!employee) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-500">직원을 찾을 수 없습니다.</p>
            <Link href="/employees" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
              목록으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const levelColors = {
    'Lv.1': 'bg-purple-100 text-purple-700',
    'Lv.2': 'bg-blue-100 text-blue-700',
    'Lv.3': 'bg-green-100 text-green-700',
    'Lv.4': 'bg-orange-100 text-orange-700',
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/employees" className="text-primary-600 hover:text-primary-700">
            ← 직원 목록으로
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
                <p className="text-gray-500">{employee.employeeNumber}</p>
              </div>
              <button
                onClick={() => setShowCalculation(!showCalculation)}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                인상률 계산
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">부서</p>
                <p className="font-semibold">{employee.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">직급</p>
                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                  levelColors[employee.level as keyof typeof levelColors]
                }`}>
                  {employee.level}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">성과 등급</p>
                <p className="font-semibold">{employee.performanceRating || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">현재 급여</p>
                <p className="font-semibold text-xl font-tabular">
                  {formatKoreanCurrency(employee.currentSalary, '만원')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">직급 평균</p>
                <p className="font-semibold font-tabular">
                  {formatKoreanCurrency(comparisons?.levelAverage || 0, '만원')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">부서 평균</p>
                <p className="font-semibold font-tabular">
                  {formatKoreanCurrency(comparisons?.departmentAverage || 0, '만원')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 인상률 계산 섹션 */}
        {showCalculation && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h2 className="text-xl font-semibold mb-4">인상률 계산</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base-up (%)
                </label>
                <input
                  type="number"
                  value={baseUp}
                  onChange={(e) => setBaseUp(parseFloat(e.target.value))}
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  성과 인상률 (%)
                </label>
                <input
                  type="number"
                  value={merit}
                  onChange={(e) => setMerit(parseFloat(e.target.value))}
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">총 인상률</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatPercentage(baseUp + merit)}
              </p>
              <p className="text-sm text-gray-600 mt-2">예상 급여</p>
              <p className="text-xl font-semibold font-tabular">
                {formatKoreanCurrency(
                  Math.round(employee.currentSalary * (1 + (baseUp + merit) / 100)),
                  '만원'
                )}
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleCalculate(false)}
                disabled={calculating}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
              >
                시뮬레이션
              </button>
              <button
                onClick={() => handleCalculate(true)}
                disabled={calculating}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                급여에 적용
              </button>
            </div>

            {calculationResult && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">계산 결과</p>
                <p className="text-sm text-blue-700">
                  인상액: {formatKoreanCurrency(calculationResult.increaseAmount, '만원')}
                </p>
                <p className="text-sm text-blue-700">
                  제안 급여: {formatKoreanCurrency(calculationResult.suggestedSalary, '만원')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 급여 이력 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">급여 변경 이력</h2>
          {employee.salaryHistories && employee.salaryHistories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      적용일
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      이전 급여
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      변경 급여
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      인상률
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      사유
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employee.salaryHistories.map((history) => (
                    <tr key={history.id}>
                      <td className="px-4 py-2 text-sm">
                        {new Date(history.effectiveDate).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-2 text-sm font-tabular">
                        {formatKoreanCurrency(history.previousSalary, '만원')}
                      </td>
                      <td className="px-4 py-2 text-sm font-tabular font-semibold">
                        {formatKoreanCurrency(history.newSalary, '만원')}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className="text-primary-600 font-semibold">
                          {formatPercentage(history.increasePercentage)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {history.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">급여 변경 이력이 없습니다.</p>
          )}
        </div>
      </div>
    </main>
  )
}

// Suspense로 감싸진 페이지 컴포넌트
export default function EmployeeDetailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="bg-white rounded-lg shadow h-96"></div>
          </div>
        </div>
      </main>
    }>
      <EmployeeDetailContent />
    </Suspense>
  )
}