'use client'

import { useState, useEffect } from 'react'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'
import { useWageContext } from '@/context/WageContext'
import { useSimulationLogic } from '@/hooks/useSimulationLogic'
import { useEmployeesData, type Employee } from '@/hooks/useEmployeesData'

interface PersonTableProps {
  level?: string
  department?: string
  performanceRating?: string
}

export function PersonTable({ level, department, performanceRating }: PersonTableProps) {
  const { performanceWeights } = useWageContext()
  const {
    allGradeRates,
    levelGradeRates,
    payZoneLevelGradeRates,
    adjustmentScope,
    additionalType
  } = useSimulationLogic()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  
  // Grade 기반 개인별 인상률 계산
  const getEmployeeRates = (employee: Employee) => {
    const grade = employee.performanceRating
    if (!grade) return { baseUp: 0, merit: 0, additional: 0 }
    
    if (adjustmentScope === 'all') {
      return allGradeRates.byGrade[grade] || { baseUp: 0, merit: 0, additional: 0 }
    } else if (adjustmentScope === 'level' && employee.level) {
      return levelGradeRates[employee.level]?.byGrade[grade] || { baseUp: 0, merit: 0, additional: 0 }
    } else if (adjustmentScope === 'payzone' && employee.payZone !== undefined && employee.level) {
      return payZoneLevelGradeRates[employee.payZone]?.[employee.level]?.byGrade[grade] || { baseUp: 0, merit: 0, additional: 0 }
    }
    return { baseUp: 0, merit: 0, additional: 0 }
  }
  
  // Grade 기반 To-Be 급여 계산
  const calculateToBeSalary = (employee: Employee) => {
    const rates = getEmployeeRates(employee)
    const totalPercentage = rates.baseUp + rates.merit + (additionalType === 'percentage' ? rates.additional : 0)
    const percentageIncrease = employee.currentSalary * (totalPercentage / 100)
    const additionalAmount = additionalType === 'amount' ? rates.additional * 10000 : 0
    return employee.currentSalary + percentageIncrease + additionalAmount
  }
  
  const { data, loading } = useEmployeesData({
    page,
    limit: 10,
    level,
    department,
    rating: performanceRating,
    search
  })
  
  const employees = data?.employees || []
  const totalPages = data?.totalPages || 1

  const levelColors = {
    'Lv.1': 'bg-purple-100 text-purple-700',
    'Lv.2': 'bg-blue-100 text-blue-700',
    'Lv.3': 'bg-green-100 text-green-700',
    'Lv.4': 'bg-orange-100 text-orange-700',
  }

  const ratingColors = {
    'ST': 'bg-emerald-100 text-emerald-700',
    'AT': 'bg-blue-100 text-blue-700',
    'OT': 'bg-amber-100 text-amber-700',
    'BT': 'bg-red-100 text-red-700',
  }
  
  const payZoneColors = {
    '0': 'bg-gray-100 text-gray-700',
    '1': 'bg-indigo-100 text-indigo-700',
    '2': 'bg-blue-100 text-blue-700',
    '3': 'bg-teal-100 text-teal-700',
    '4': 'bg-yellow-100 text-yellow-700',
    '5': 'bg-red-100 text-red-700',
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <h2 className="text-xl font-semibold">개인별 확인</h2>
          <input
            type="text"
            placeholder="이름 또는 사번으로 검색"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-2 px-2 md:mx-0 md:px-0">
            <table className="w-full md:min-w-[900px] text-xs md:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사번
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="hidden md:table-cell px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    부서
                  </th>
                  <th className="hidden md:table-cell px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    직군
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    직급
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pay Zone
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    현재 급여
                  </th>
                  <th className="hidden md:table-cell px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    평가등급
                  </th>
                  <th className="hidden md:table-cell px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    적용 인상률
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TO-BE 급여
                  </th>
                  <th className="hidden lg:table-cell px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    증감액
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900">
                      {employee.employeeNumber || employee.employeeId || '-'}
                    </td>
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                      {employee.name}
                    </td>
                    <td className="hidden md:table-cell px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                      {employee.department}
                    </td>
                    <td className="hidden md:table-cell px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                      {employee.band || '-'}
                    </td>
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                      <span className={`px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold rounded-full ${
                        levelColors[employee.level as keyof typeof levelColors] || 'bg-gray-100'
                      }`}>
                        {employee.level}
                      </span>
                    </td>
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                      {employee.payZone !== undefined ? (
                        <span className={`px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold rounded-full ${
                          payZoneColors[String(employee.payZone) as keyof typeof payZoneColors] || 'bg-gray-100'
                        }`}>
                          Zone {employee.payZone}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 font-tabular">
                      {formatKoreanCurrency(employee.currentSalary, '만원')}
                    </td>
                    <td className="hidden md:table-cell px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                      {employee.performanceRating ? (
                        <span className={`px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold rounded-full ${
                          ratingColors[employee.performanceRating as keyof typeof ratingColors] || 'bg-gray-100'
                        }`}>
                          {employee.performanceRating}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                      {(() => {
                        // Grade 기반 인상률 가져오기
                        const rates = getEmployeeRates(employee)
                        const totalRate = rates.baseUp + rates.merit + (additionalType === 'percentage' ? rates.additional : 0)
                        
                        return (
                          <div className="flex flex-col">
                            <span className="font-semibold text-purple-600">
                              {totalRate.toFixed(1)}%
                            </span>
                            <span className="text-xs text-gray-500">
                              (B: {rates.baseUp.toFixed(1)}% + M: {rates.merit.toFixed(1)}%{rates.additional > 0 ? ` + A: ${rates.additional.toFixed(1)}${additionalType === 'percentage' ? '%' : '만'}` : ''})
                            </span>
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 font-tabular">
                      {(() => {
                        const toBeSalary = calculateToBeSalary(employee)
                        return (
                          <span className="font-semibold text-primary-600">
                            {formatKoreanCurrency(toBeSalary, '만원')}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="hidden lg:table-cell px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 font-tabular">
                      {(() => {
                        const toBeSalary = calculateToBeSalary(employee)
                        const difference = toBeSalary - employee.currentSalary
                        const isPositive = difference > 0
                        return (
                          <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{formatKoreanCurrency(difference, '만원')}
                          </span>
                        )
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                총 {data?.total || 0}명의 직원
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  이전
                </button>
                <span className="px-3 py-1 text-sm">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}