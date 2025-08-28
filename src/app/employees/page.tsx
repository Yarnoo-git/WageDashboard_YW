/**
 * 직원 관리 페이지
 * 새로운 시스템 기반 재구현 - VirtualizedTable 적용
 */

'use client'

import React, { useState, useMemo } from 'react'
import { WageContextNewProvider, useWageContextNew } from '@/context/WageContextNew'
import { VirtualizedEmployeeTable } from '@/components/employees/VirtualizedEmployeeTable'
import { formatKoreanCurrency } from '@/lib/utils'

function EmployeesContent() {
  const {
    originalData,
    computed,
    isLoading
  } = useWageContextNew()
  
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedBand, setSelectedBand] = useState<string>('')
  const [selectedRating, setSelectedRating] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // 필터링된 직원 목록
  const filteredEmployees = useMemo(() => {
    return originalData.employees.filter(emp => {
      if (selectedLevel && emp.level !== selectedLevel) return false
      if (selectedDepartment && emp.department !== selectedDepartment) return false
      if (selectedBand && emp.band !== selectedBand) return false
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
  }, [originalData.employees, selectedLevel, selectedDepartment, selectedBand, selectedRating, searchTerm])
  
  // 통계 계산
  const statistics = useMemo(() => {
    const stats = {
      totalCount: filteredEmployees.length,
      totalSalary: 0,
      averageSalary: 0,
      byLevel: {} as Record<string, number>,
      byDepartment: {} as Record<string, number>,
      byBand: {} as Record<string, number>,
      byRating: {} as Record<string, number>
    }
    
    filteredEmployees.forEach(emp => {
      stats.totalSalary += emp.currentSalary || 0
      
      if (emp.level) {
        stats.byLevel[emp.level] = (stats.byLevel[emp.level] || 0) + 1
      }
      if (emp.department) {
        stats.byDepartment[emp.department] = (stats.byDepartment[emp.department] || 0) + 1
      }
      if (emp.band) {
        stats.byBand[emp.band] = (stats.byBand[emp.band] || 0) + 1
      }
      if (emp.performanceRating) {
        stats.byRating[emp.performanceRating] = (stats.byRating[emp.performanceRating] || 0) + 1
      }
    })
    
    stats.averageSalary = stats.totalCount > 0 ? stats.totalSalary / stats.totalCount : 0
    
    return stats
  }, [filteredEmployees])
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">직원 관리</h1>
        </div>
      </div>
      
      {/* 통계 카드 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">총 직원수</div>
            <div className="text-2xl font-bold text-gray-900">
              {statistics.totalCount.toLocaleString()}명
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">평균 연봉</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatKoreanCurrency(statistics.averageSalary)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">총 인건비</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatKoreanCurrency(statistics.totalSalary)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">평균 인상률</div>
            <div className="text-2xl font-bold text-blue-600">
              {computed.weightedAverage.summary.effectiveRate.toFixed(2)}%
            </div>
          </div>
        </div>
        
        {/* 필터 영역 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
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
              value={selectedBand}
              onChange={(e) => setSelectedBand(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 직군</option>
              {originalData.metadata.bands.map(band => (
                <option key={band} value={band}>{band}</option>
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
            
            {(searchTerm || selectedLevel || selectedDepartment || selectedBand || selectedRating) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedLevel('')
                  setSelectedDepartment('')
                  setSelectedBand('')
                  setSelectedRating('')
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                필터 초기화
              </button>
            )}
            
            <div className="ml-auto text-sm text-gray-600">
              {filteredEmployees.length}명 검색됨
            </div>
          </div>
        </div>
        
        {/* 가상화된 테이블 */}
        <VirtualizedEmployeeTable
          employees={filteredEmployees}
          performanceWeights={computed.performanceWeights}
        />
      </div>
    </div>
  )
}

export default function EmployeesPage() {
  return (
    <WageContextNewProvider>
      <EmployeesContent />
    </WageContextNewProvider>
  )
}