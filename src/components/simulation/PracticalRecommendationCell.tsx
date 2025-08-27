/**
 * 실무 추천안 개별 셀 컴포넌트
 * 3개 인상률 (base-up, merit, additional) 개별 편집
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { formatPercentage } from '@/lib/utils'

interface PracticalRecommendationCellProps {
  baseUp: number
  merit: number
  additional: number
  employeeCount: number
  isEditable: boolean
  isTotal?: boolean  // 전체 컬럼 여부
  onChange?: (field: 'baseUp' | 'merit' | 'additional', value: number) => void
  band?: string
  level?: string
  payZone?: string
  grade?: string
}

export function PracticalRecommendationCell({
  baseUp,
  merit,
  additional,
  employeeCount,
  isEditable,
  isTotal = false,
  onChange,
  band,
  level,
  payZone,
  grade
}: PracticalRecommendationCellProps) {
  const [editingField, setEditingField] = useState<'baseUp' | 'merit' | 'additional' | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const total = baseUp + merit + additional
  
  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.select()
    }
  }, [editingField])
  
  const handleFieldClick = (field: 'baseUp' | 'merit' | 'additional') => {
    if (isEditable && !isTotal) {
      setEditingField(field)
      const value = field === 'baseUp' ? baseUp : field === 'merit' ? merit : additional
      setEditValue(value.toFixed(1))
    }
  }
  
  const handleBlur = () => {
    if (editingField) {
      const numValue = parseFloat(editValue) || 0
      const currentValue = editingField === 'baseUp' ? baseUp : editingField === 'merit' ? merit : additional
      if (!isNaN(numValue) && numValue !== currentValue) {
        onChange?.(editingField, numValue)
      }
      setEditingField(null)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setEditingField(null)
    }
  }
  
  // 인원수 0명인 경우
  if (employeeCount === 0) {
    return (
      <div className="h-full flex items-center justify-center p-1">
        <span className="text-xs text-gray-400">-</span>
      </div>
    )
  }
  
  // 편집 가능한 필드 렌더링
  const renderField = (field: 'baseUp' | 'merit' | 'additional', value: number, color: string) => {
    if (editingField === field) {
      return (
        <input
          ref={inputRef}
          type="number"
          step="0.1"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-10 px-0.5 text-xs text-center border border-blue-300 rounded focus:outline-none focus:border-blue-500"
        />
      )
    }
    
    return (
      <span
        className={`text-xs ${isEditable && !isTotal ? 'cursor-pointer hover:underline' : ''} ${color}`}
        onClick={() => handleFieldClick(field)}
      >
        {value.toFixed(1)}
      </span>
    )
  }
  
  return (
    <div className={`h-full p-1 ${isTotal ? 'bg-blue-50' : ''}`}>
      <div className="flex flex-col items-center justify-center">
        {/* 3개 인상률 표시 */}
        <div className="flex items-center gap-0.5">
          {renderField('baseUp', baseUp, isTotal ? 'text-blue-600' : 'text-blue-500')}
          <span className="text-xs text-gray-400">+</span>
          {renderField('merit', merit, isTotal ? 'text-green-600' : 'text-green-500')}
          <span className="text-xs text-gray-400">+</span>
          {renderField('additional', additional, isTotal ? 'text-orange-600' : 'text-orange-500')}
        </div>
        
        {/* 합계 */}
        <div className={`text-xs font-semibold mt-0.5 ${isTotal ? 'text-blue-700' : 'text-gray-900'}`}>
          = {formatPercentage(total)}
        </div>
        
        {/* 인원수 */}
        <div className="text-xs text-gray-500 mt-0.5">
          ({employeeCount})
        </div>
        
        {/* 가중평균 표시 (전체 컬럼만) */}
        {isTotal && (
          <div className="text-xs text-blue-500 mt-0.5">
            가중평균
          </div>
        )}
      </div>
    </div>
  )
}