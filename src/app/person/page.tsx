/**
 * 개인별 시뮬레이션 결과 페이지
 * 새로운 시스템 기반 완전 재구현
 */

'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { WageContextNewProvider, useWageContextNew } from '@/context/WageContextNew'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'
import { Employee } from '@/types/employee'
import { UNITS } from '@/config/constants'

function PersonContent() {
  const router = useRouter()
  const {
    originalData,
    adjustment,
    computed,
    config,
    isLoading
  } = useWageContextNew()
  
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedRating, setSelectedRating] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // 필터링된 직원 목록
  const filteredEmployees = useMemo(() => {
    return originalData.employees.filter(emp => {
      if (selectedLevel && emp.level !== selectedLevel) return false
      if (selectedDepartment && emp.department !== selectedDepartment) return false
      if (selectedRating && emp.performanceRating !== selectedRating) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        return (
          emp.name?.toLowerCase().includes(term) ||
          emp.employeeNumber?.toLowerCase().includes(term) ||
          emp.department?.toLowerCase().includes(term)
        )
      }
      return true
    })
  }, [originalData.employees, selectedLevel, selectedDepartment, selectedRating, searchTerm])
  
  // 개인별 인상률 계산
  const calculatePersonalRates = (employee: Employee) => {
    if (!adjustment.matrix) return { baseUp: 0, merit: 0, additional: 0, total: 0 }
    
    const cell = adjustment.matrix.cellMap[employee.band]?.[employee.level]
    if (!cell) return { baseUp: 0, merit: 0, additional: 0, total: 0 }
    
    const gradeRates = cell.gradeRates[employee.performanceRating] || { baseUp: 0, merit: 0, additional: 0 }
    
    // Pay Zone override 확인
    const payZoneNum = typeof employee.payZone === 'string' ? parseInt(employee.payZone) : employee.payZone
    if (payZoneNum && cell.payZoneOverrides?.[employee.performanceRating]?.[payZoneNum]) {
      const override = cell.payZoneOverrides[employee.performanceRating][payZoneNum]
      return {
        ...override,
        total: override.baseUp + override.merit + (config.additionalType === 'percentage' ? override.additional : 0)
      }
    }
    
    return {
      ...gradeRates,
      total: gradeRates.baseUp + gradeRates.merit + (config.additionalType === 'percentage' ? gradeRates.additional : 0)
    }
  }
  
  // 개인별 인상액 계산
  const calculateIncreaseAmount = (employee: Employee) => {
    const rates = calculatePersonalRates(employee)
    const salary = employee.currentSalary || 0
    
    const baseUpAmount = salary * rates.baseUp / 100
    const meritAmount = salary * rates.merit / 100
    const additionalAmount = config.additionalType === 'percentage' 
      ? salary * rates.additional / 100
      : rates.additional * UNITS.MAN_WON
    
    return {
      baseUp: baseUpAmount,
      merit: meritAmount,
      additional: additionalAmount,
      total: baseUpAmount + meritAmount + additionalAmount,
      newSalary: salary + baseUpAmount + meritAmount + additionalAmount
    }
  }
  
  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }
  
  // 데이터 없음
  if (originalData.employees.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">데이터가 없습니다.</p>
          <button
            onClick={() => router.push('/home')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* 상단 요약 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">개인별 시뮬레이션 결과</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                총 인원: <span className="font-bold">{originalData.employees.length}명</span>
              </div>
              <div className="text-sm text-gray-600">
                평균 인상률: <span className="font-bold text-blue-600">
                  {computed.weightedAverage.summary.effectiveRate.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 필터 영역 */}
      <div className="bg-white shadow-sm mb-4">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-3 items-center flex-wrap">
            <input
              type="text"
              placeholder="이름, 사번, 부서 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 레벨</option>
              {originalData.metadata.levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 부서</option>
              {Array.from(new Set(originalData.employees.map(e => e.department).filter(Boolean))).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 평가</option>
              {originalData.metadata.grades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            
            {(searchTerm || selectedLevel || selectedDepartment || selectedRating) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedLevel('')
                  setSelectedDepartment('')
                  setSelectedRating('')
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                필터 초기화
              </button>
            )}
            
            <div className="ml-auto text-sm text-gray-600">
              {filteredEmployees.length}명 표시
            </div>
          </div>
        </div>
      </div>
      
      {/* 테이블 */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사번
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    부서
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    직군
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    레벨
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    평가
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    현재 연봉
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base-up
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Merit
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    추가
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 인상률
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    인상액
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예상 연봉
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.map((employee) => {
                  const rates = calculatePersonalRates(employee)
                  const amounts = calculateIncreaseAmount(employee)
                  
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {employee.employeeNumber}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {employee.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {employee.department}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {employee.band}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {employee.level}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.performanceRating === 'S' || employee.performanceRating === 'ST' ? 'bg-blue-100 text-blue-800' :
                          employee.performanceRating === 'A' || employee.performanceRating === 'AT' ? 'bg-green-100 text-green-800' :
                          employee.performanceRating === 'B' || employee.performanceRating === 'BT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {employee.performanceRating}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatKoreanCurrency(employee.currentSalary)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">
                        {rates.baseUp.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">
                        {rates.merit.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">
                        {config.additionalType === 'percentage' 
                          ? `${rates.additional.toFixed(1)}%`
                          : `${rates.additional}만원`}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`font-bold ${
                          rates.total > 5 ? 'text-red-600' :
                          rates.total > 3 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {rates.total.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                        {formatKoreanCurrency(amounts.total)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                        {formatKoreanCurrency(amounts.newSalary)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PersonPage() {
  return <PersonContent />
}