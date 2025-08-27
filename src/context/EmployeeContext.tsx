'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Employee, EmployeeFilter, EmployeeSort } from '@/types/employee'
import { getCurrentFileId, loadExcelData } from '@/lib/clientStorage'

interface EmployeeWeight {
  performanceRating: string
  meritMultiplier: number
}

interface EmployeeContextType {
  // 직원 데이터
  employees: Employee[]
  filteredEmployees: Employee[]
  totalCount: number
  
  // 직원별 성과 가중치
  employeeWeights: Record<string, EmployeeWeight>
  
  // 필터 및 정렬
  filter: EmployeeFilter
  sort: EmployeeSort
  
  // 페이지네이션
  currentPage: number
  pageSize: number
  totalPages: number
  
  // 데이터 조작 함수
  setEmployees: (employees: Employee[]) => void
  updateEmployee: (id: string, data: Partial<Employee>) => void
  setEmployeeWeight: (employeeId: string, weight: EmployeeWeight) => void
  
  // 필터 및 정렬 함수
  setFilter: (filter: EmployeeFilter) => void
  setSort: (sort: EmployeeSort) => void
  applyFiltersAndSort: () => void
  
  // 페이지네이션 함수
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  goToPage: (page: number) => void
  
  // 데이터 로드 함수
  loadEmployeeData: () => Promise<void>
  refreshEmployeeData: () => Promise<void>
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined)

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [employeeWeights, setEmployeeWeights] = useState<Record<string, EmployeeWeight>>({})
  
  const [filter, setFilter] = useState<EmployeeFilter>({})
  const [sort, setSort] = useState<EmployeeSort>({
    field: 'name',
    direction: 'asc'
  })
  
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  
  // 총 개수 및 페이지 계산
  const totalCount = filteredEmployees.length
  const totalPages = Math.ceil(totalCount / pageSize)
  
  // 직원 데이터 업데이트
  const updateEmployee = (id: string, data: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === id ? { ...emp, ...data } : emp
    ))
  }
  
  // 직원별 가중치 설정
  const setEmployeeWeight = (employeeId: string, weight: EmployeeWeight) => {
    setEmployeeWeights(prev => ({
      ...prev,
      [employeeId]: weight
    }))
  }
  
  // 필터 및 정렬 적용
  const applyFiltersAndSort = () => {
    let result = [...employees]
    
    // 필터 적용
    if (filter.department) {
      result = result.filter(emp => emp.department === filter.department)
    }
    if (filter.band) {
      result = result.filter(emp => emp.band === filter.band)
    }
    if (filter.level) {
      result = result.filter(emp => emp.level === filter.level)
    }
    if (filter.payZone !== undefined) {
      result = result.filter(emp => emp.payZone === filter.payZone)
    }
    if (filter.performanceRating) {
      result = result.filter(emp => emp.performanceRating === filter.performanceRating)
    }
    if (filter.salaryRange) {
      if (filter.salaryRange.min !== undefined) {
        result = result.filter(emp => emp.currentSalary >= filter.salaryRange!.min!)
      }
      if (filter.salaryRange.max !== undefined) {
        result = result.filter(emp => emp.currentSalary <= filter.salaryRange!.max!)
      }
    }
    
    // 정렬 적용
    result.sort((a, b) => {
      let aValue: any = a[sort.field as keyof Employee]
      let bValue: any = b[sort.field as keyof Employee]
      
      // 특별한 필드 처리
      if (sort.field === 'increaseAmount') {
        aValue = a.increaseInfo?.totalAmount || 0
        bValue = b.increaseInfo?.totalAmount || 0
      } else if (sort.field === 'increasePercentage') {
        aValue = a.increaseInfo?.totalPercentage || 0
        bValue = b.increaseInfo?.totalPercentage || 0
      }
      
      // null/undefined 처리
      if (aValue == null) return sort.direction === 'asc' ? 1 : -1
      if (bValue == null) return sort.direction === 'asc' ? -1 : 1
      
      // 비교
      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1
      return 0
    })
    
    setFilteredEmployees(result)
  }
  
  // 페이지 이동
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
  }
  
  // 직원 데이터 로드
  const loadEmployeeData = async () => {
    try {
      const fileId = getCurrentFileId()
      if (!fileId) return
      
      const excelData = await loadExcelData()
      if (!excelData?.employees) return
      
      setEmployees(excelData.employees || [])
      setFilteredEmployees(excelData.employees || [])
    } catch (error) {
      console.error('[EmployeeContext] 직원 데이터 로드 실패:', error)
    }
  }
  
  // 데이터 새로고침
  const refreshEmployeeData = async () => {
    await loadEmployeeData()
    applyFiltersAndSort()
  }
  
  // 필터/정렬 변경 시 자동 적용
  useEffect(() => {
    applyFiltersAndSort()
  }, [filter, sort, employees])
  
  // 초기 로드
  useEffect(() => {
    loadEmployeeData()
  }, [])
  
  const value: EmployeeContextType = {
    employees,
    filteredEmployees,
    totalCount,
    employeeWeights,
    filter,
    sort,
    currentPage,
    pageSize,
    totalPages,
    setEmployees,
    updateEmployee,
    setEmployeeWeight,
    setFilter,
    setSort,
    applyFiltersAndSort,
    setCurrentPage,
    setPageSize,
    goToPage,
    loadEmployeeData,
    refreshEmployeeData,
  }
  
  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  )
}

export function useEmployeeContext() {
  const context = useContext(EmployeeContext)
  if (!context) {
    throw new Error('useEmployeeContext must be used within an EmployeeProvider')
  }
  return context
}