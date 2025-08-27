/**
 * 직원 관리 페이지
 * 새로운 시스템 기반 재구현
 */

'use client'

import React, { useState, useMemo } from 'react'
import { WageContextNewProvider, useWageContextNew } from '@/context/WageContextNew'
import { formatKoreanCurrency } from '@/lib/utils'
import { Employee } from '@/types/employee'

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
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50
  
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
  
  // 페이지네이션
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredEmployees.slice(start, end)
  }, [filteredEmployees, currentPage, itemsPerPage])
  
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
                  setCurrentPage(1)
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
        
        {/* 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pay Zone
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    현재 연봉
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedEmployees.map((employee) => (
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
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {employee.payZone ? `Zone ${employee.payZone}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {formatKoreanCurrency(employee.currentSalary)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  이전
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  다음
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    전체 <span className="font-medium">{filteredEmployees.length}</span>명 중{' '}
                    <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> -{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredEmployees.length)}
                    </span>
                    명 표시
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      이전
                    </button>
                    {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                      const pageNum = currentPage - 2 + idx
                      if (pageNum < 1 || pageNum > totalPages) return null
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      다음
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
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