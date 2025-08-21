'use client'

import React, { useEffect, useState } from 'react'
import { formatPercentage } from '@/lib/utils'

interface RateChangeIndicatorProps {
  originalValue: number
  currentValue: number
  showTooltip?: boolean
  label?: string
  size?: 'sm' | 'md' | 'lg'
  position?: 'inline' | 'absolute'
}

export function RateChangeIndicator({
  originalValue,
  currentValue,
  showTooltip = true,
  label,
  size = 'sm',
  position = 'inline'
}: RateChangeIndicatorProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [prevValue, setPrevValue] = useState(currentValue)
  
  const difference = currentValue - originalValue
  const hasChanged = Math.abs(difference) > 0.001
  
  // 값이 변경될 때 애니메이션 트리거
  useEffect(() => {
    if (currentValue !== prevValue) {
      setIsAnimating(true)
      setPrevValue(currentValue)
      const timer = setTimeout(() => setIsAnimating(false), 500)
      return () => clearTimeout(timer)
    }
  }, [currentValue, prevValue])
  
  if (!hasChanged && position === 'inline') {
    return null
  }
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  }
  
  const positionClasses = position === 'absolute' 
    ? 'absolute -top-2 -right-2 z-10' 
    : 'inline-flex ml-2'
  
  return (
    <div className={`group relative ${positionClasses}`}>
      <span 
        className={`
          ${sizeClasses[size]}
          ${isAnimating ? 'animate-pulse' : ''}
          inline-flex items-center gap-1 rounded-full font-medium transition-all duration-300
          ${difference > 0 
            ? 'bg-orange-100 text-orange-700 border border-orange-200' 
            : difference < 0
            ? 'bg-blue-100 text-blue-700 border border-blue-200'
            : 'bg-gray-100 text-gray-600 border border-gray-200'
          }
        `}
      >
        {difference > 0 && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
          </svg>
        )}
        {difference < 0 && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        )}
        <span>{difference > 0 ? '+' : ''}{formatPercentage(difference)}</span>
      </span>
      
      {/* 툴팁 */}
      {showTooltip && hasChanged && (
        <div className="
          absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
          opacity-0 group-hover:opacity-100 pointer-events-none
          transition-opacity duration-200 z-20
        ">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
            {label && <div className="font-medium mb-1">{label}</div>}
            <div>원래값: {formatPercentage(originalValue)}</div>
            <div>현재값: {formatPercentage(currentValue)}</div>
            <div className="mt-1 pt-1 border-t border-gray-700">
              변화: {difference > 0 ? '+' : ''}{formatPercentage(difference)}
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 입력 필드와 함께 사용하는 컴포넌트
interface RateInputWithIndicatorProps {
  value: number
  originalValue: number
  onChange: (value: number) => void
  label: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
  showPercentSign?: boolean
}

export function RateInputWithIndicator({
  value,
  originalValue,
  onChange,
  label,
  min = 0,
  max = 10,
  step = 0.1,
  disabled = false,
  className = '',
  showPercentSign = true
}: RateInputWithIndicatorProps) {
  const hasChanged = Math.abs(value - originalValue) > 0.001
  
  return (
    <div className="relative">
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className={`
              w-full px-2 py-1.5 text-sm border rounded transition-all duration-200
              ${hasChanged 
                ? 'border-blue-400 ring-2 ring-blue-100' 
                : 'border-gray-300'
              }
              ${disabled 
                ? 'bg-gray-100 cursor-not-allowed' 
                : 'bg-white hover:border-gray-400'
              }
              ${className}
            `}
          />
          {showPercentSign && (
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
              %
            </span>
          )}
        </div>
        
        <RateChangeIndicator
          originalValue={originalValue}
          currentValue={value}
          label={label}
          size="sm"
        />
      </div>
      
      {/* 리셋 버튼 */}
      {hasChanged && !disabled && (
        <button
          onClick={() => onChange(originalValue)}
          className="absolute -right-8 top-6 p-1 rounded hover:bg-gray-100 transition-colors"
          title="원래값으로 되돌리기"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}
    </div>
  )
}