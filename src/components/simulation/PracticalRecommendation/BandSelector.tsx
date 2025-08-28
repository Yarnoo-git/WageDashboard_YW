'use client'

import React, { useRef, useState, useEffect } from 'react'

interface BandSelectorProps {
  availableBands: string[]
  selectedBands: string[]
  onBandToggle: (band: string) => void
  onSelectAll: () => void
  onClearAll: () => void
}

export function BandSelector({
  availableBands,
  selectedBands,
  onBandToggle,
  onSelectAll,
  onClearAll
}: BandSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span className="text-sm font-medium">
          {selectedBands.length === 0 ? '전체' : 
           selectedBands.length === availableBands.length ? '모든 직군' :
           `${selectedBands.length}개 직군`}
        </span>
        <svg className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2 border-b border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={onSelectAll}
                className="flex-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                모두 선택
              </button>
              <button
                onClick={onClearAll}
                className="flex-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                전체 해제
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {availableBands.map(band => (
              <label
                key={band}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedBands.includes(band)}
                  onChange={() => onBandToggle(band)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm">{band}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}