/**
 * 실무 추천안 개별 셀 컴포넌트
 * 컴팩트 모드 + 팝오버 편집
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
  isCompact?: boolean  // 컴팩트 모드
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
  isCompact = true,  // 기본값 컴팩트 모드
  onChange,
  band,
  level,
  payZone,
  grade
}: PracticalRecommendationCellProps) {
  const [showPopover, setShowPopover] = useState(false)
  const [editValues, setEditValues] = useState({
    baseUp: baseUp.toFixed(1),
    merit: merit.toFixed(1),
    additional: additional.toFixed(1)
  })
  const cellRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  
  const total = baseUp + merit + additional
  
  useEffect(() => {
    setEditValues({
      baseUp: baseUp.toFixed(1),
      merit: merit.toFixed(1),
      additional: additional.toFixed(1)
    })
  }, [baseUp, merit, additional])
  
  // 팝오버 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        cellRef.current &&
        !cellRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false)
      }
    }
    
    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPopover])
  
  const handleCellClick = () => {
    if (isEditable) {
      setShowPopover(!showPopover)
    }
  }
  
  const handleValueChange = (field: 'baseUp' | 'merit' | 'additional', value: string) => {
    setEditValues(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const handleApply = () => {
    onChange?.('baseUp', parseFloat(editValues.baseUp) || 0)
    onChange?.('merit', parseFloat(editValues.merit) || 0)
    onChange?.('additional', parseFloat(editValues.additional) || 0)
    setShowPopover(false)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply()
    } else if (e.key === 'Escape') {
      setShowPopover(false)
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
  
  // 컴팩트 모드
  if (isCompact) {
    return (
      <div className="relative">
        <div 
          ref={cellRef}
          className={`h-full p-0.5 flex items-center justify-center ${
            isTotal ? 'bg-blue-50' : ''
          } ${
            isEditable ? 'cursor-pointer hover:bg-gray-50' : ''
          }`}
          onClick={handleCellClick}
        >
          <div className="text-center">
            <div className={`text-xs font-semibold ${isTotal ? 'text-blue-700' : 'text-gray-900'}`}>
              {formatPercentage(total)}
            </div>
            <div className="text-[10px] text-gray-500">
              {employeeCount}
            </div>
          </div>
        </div>
        
        {/* 편집 팝오버 */}
        {showPopover && isEditable && (
          <div 
            ref={popoverRef}
            className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-[150px]"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600 font-medium">Base:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={editValues.baseUp}
                    onChange={(e) => handleValueChange('baseUp', e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-14 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600 font-medium">Merit:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={editValues.merit}
                    onChange={(e) => handleValueChange('merit', e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-14 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-orange-600 font-medium">Add:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={editValues.additional}
                    onChange={(e) => handleValueChange('additional', e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-14 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
              
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-gray-700">합계:</span>
                  <span className="text-gray-900">
                    {formatPercentage(
                      (parseFloat(editValues.baseUp) || 0) +
                      (parseFloat(editValues.merit) || 0) +
                      (parseFloat(editValues.additional) || 0)
                    )}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleApply}
                  className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  적용
                </button>
                <button
                  onClick={() => setShowPopover(false)}
                  className="flex-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // 상세 모드 (기존 방식)
  return (
    <div className="relative">
      <div 
        ref={cellRef}
        className={`h-full p-1 ${isTotal ? 'bg-blue-50' : ''} ${
          isEditable ? 'cursor-pointer hover:bg-gray-50' : ''
        }`}
        onClick={handleCellClick}
      >
        <div className="flex flex-col items-center justify-center">
          {/* 3개 인상률 표시 */}
          <div className="flex items-center gap-0.5">
            <span className={`text-xs ${isTotal ? 'text-blue-600' : 'text-blue-500'}`}>
              {baseUp.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">+</span>
            <span className={`text-xs ${isTotal ? 'text-green-600' : 'text-green-500'}`}>
              {merit.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">+</span>
            <span className={`text-xs ${isTotal ? 'text-orange-600' : 'text-orange-500'}`}>
              {additional.toFixed(1)}
            </span>
          </div>
          
          {/* 합계 */}
          <div className={`text-xs font-semibold mt-0.5 ${isTotal ? 'text-blue-700' : 'text-gray-900'}`}>
            = {formatPercentage(total)}
          </div>
          
          {/* 인원수 */}
          <div className="text-xs text-gray-500 mt-0.5">
            ({employeeCount})
          </div>
        </div>
      </div>
      
      {/* 편집 팝오버 (상세 모드에서도 표시) */}
      {showPopover && isEditable && (
        <div 
          ref={popoverRef}
          className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-[150px]"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 font-medium">Base:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={editValues.baseUp}
                  onChange={(e) => handleValueChange('baseUp', e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-14 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-600 font-medium">Merit:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={editValues.merit}
                  onChange={(e) => handleValueChange('merit', e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-14 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-orange-600 font-medium">Add:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={editValues.additional}
                  onChange={(e) => handleValueChange('additional', e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-14 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-700">합계:</span>
                <span className="text-gray-900">
                  {formatPercentage(
                    (parseFloat(editValues.baseUp) || 0) +
                    (parseFloat(editValues.merit) || 0) +
                    (parseFloat(editValues.additional) || 0)
                  )}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleApply}
                className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                적용
              </button>
              <button
                onClick={() => setShowPopover(false)}
                className="flex-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}