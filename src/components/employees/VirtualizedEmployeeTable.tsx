'use client'

import React, { useState, useCallback, useMemo, memo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { Employee } from '@/types/employee'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'
import { PerformanceWeightModal } from './PerformanceWeightModal'

interface VirtualizedEmployeeTableProps {
  employees: Employee[]
  onUpdateEmployee?: (id: string, data: Partial<Employee>) => void
  performanceWeights?: Record<string, number>
}

// 메모이제이션된 행 컴포넌트
const EmployeeRow = memo(({ 
  employee, 
  style, 
  onEdit,
  performanceWeight 
}: { 
  employee: Employee
  style: React.CSSProperties
  onEdit: (employee: Employee) => void
  performanceWeight: number
}) => {
  const increaseInfo = employee.increaseInfo || {
    baseUpAmount: 0,
    meritAmount: 0,
    totalAmount: 0,
    totalPercentage: 0
  }
  
  return (
    <div 
      style={style} 
      className="flex items-center border-b border-gray-100 hover:bg-gray-50 transition-colors"
    >
      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="grid grid-cols-11 gap-4 text-sm">
          {/* 사번 */}
          <div className="truncate">{employee.employeeNumber || employee.id}</div>
          
          {/* 이름 */}
          <div className="font-medium truncate">{employee.name}</div>
          
          {/* 부서 */}
          <div className="truncate">{employee.department}</div>
          
          {/* 직급 */}
          <div className="text-center">{employee.level}</div>
          
          {/* 직군 */}
          <div className="text-center">{employee.band || '-'}</div>
          
          {/* Pay Zone */}
          <div className="text-center">{employee.payZone || '-'}</div>
          
          {/* 평가등급 */}
          <div className="text-center">
            <button
              onClick={() => onEdit(employee)}
              className="px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
            >
              {employee.performanceRating} ({performanceWeight.toFixed(1)})
            </button>
          </div>
          
          {/* 현재급여 */}
          <div className="text-right">{formatKoreanCurrency(employee.currentSalary)}</div>
          
          {/* Base-up */}
          <div className="text-right">{formatKoreanCurrency(increaseInfo.baseUpAmount)}</div>
          
          {/* Merit */}
          <div className="text-right">{formatKoreanCurrency(increaseInfo.meritAmount)}</div>
          
          {/* 총 인상률 */}
          <div className="text-right font-medium text-blue-600">
            {formatPercentage(increaseInfo.totalPercentage)}
          </div>
        </div>
      </div>
    </div>
  )
})

EmployeeRow.displayName = 'EmployeeRow'

export function VirtualizedEmployeeTable({
  employees,
  onUpdateEmployee,
  performanceWeights = {}
}: VirtualizedEmployeeTableProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showWeightModal, setShowWeightModal] = useState(false)
  
  // 행 렌더러
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const employee = employees[index]
    const weight = performanceWeights[employee.performanceRating] || 1.0
    
    return (
      <EmployeeRow
        employee={employee}
        style={style}
        onEdit={(emp) => {
          setSelectedEmployee(emp)
          setShowWeightModal(true)
        }}
        performanceWeight={weight}
      />
    )
  }, [employees, performanceWeights])
  
  // 통계 계산 (메모이제이션)
  const statistics = useMemo(() => {
    const totalSalary = employees.reduce((sum, emp) => sum + emp.currentSalary, 0)
    const totalIncrease = employees.reduce((sum, emp) => 
      sum + (emp.increaseInfo?.totalAmount || 0), 0
    )
    const avgIncreaseRate = totalSalary > 0 ? (totalIncrease / totalSalary) * 100 : 0
    
    return {
      totalCount: employees.length,
      totalSalary,
      totalIncrease,
      avgIncreaseRate
    }
  }, [employees])
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            직원 목록 ({statistics.totalCount}명)
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>총 급여: {formatKoreanCurrency(statistics.totalSalary)}</span>
            <span>총 인상액: {formatKoreanCurrency(statistics.totalIncrease)}</span>
            <span>평균 인상률: {formatPercentage(statistics.avgIncreaseRate)}</span>
          </div>
        </div>
      </div>
      
      {/* 테이블 헤더 */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-11 gap-4 text-xs font-medium text-gray-700 uppercase tracking-wider">
          <div>사번</div>
          <div>이름</div>
          <div>부서</div>
          <div className="text-center">직급</div>
          <div className="text-center">직군</div>
          <div className="text-center">Pay Zone</div>
          <div className="text-center">평가등급</div>
          <div className="text-right">현재급여</div>
          <div className="text-right">Base-up</div>
          <div className="text-right">Merit</div>
          <div className="text-right">총 인상률</div>
        </div>
      </div>
      
      {/* 가상화된 목록 */}
      <div className="relative">
        <List
          height={600}  // 테이블 높이
          itemCount={employees.length}
          itemSize={48}  // 각 행의 높이
          width="100%"
        >
          {Row}
        </List>
      </div>
      
      {/* 성과 가중치 모달 */}
      <PerformanceWeightModal
        isOpen={showWeightModal}
        onClose={() => {
          setShowWeightModal(false)
          setSelectedEmployee(null)
        }}
      />
    </div>
  )
}