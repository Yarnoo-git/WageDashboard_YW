/**
 * 뷰 모드 선택 사이드바 컴포넌트
 */

'use client'

import React from 'react'

type ViewMode = 'adjustment' | 'all' | 'competitiveness' | 'band'

interface ViewModeSelectorProps {
  viewMode: ViewMode
  selectedBand: string | null
  bands: string[]
  onViewModeChange: (mode: ViewMode) => void
  onBandSelect: (band: string) => void
}

export function ViewModeSelector({
  viewMode,
  selectedBand,
  bands,
  onViewModeChange,
  onBandSelect
}: ViewModeSelectorProps) {
  return (
    <div className="w-60 bg-white rounded-lg shadow-sm h-fit p-2 ml-3">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-bold text-gray-900">뷰 모드</h2>
      </div>
      <nav className="space-y-1">
        <button
          onClick={() => onViewModeChange('adjustment')}
          className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
            viewMode === 'adjustment'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">인상률 조정</span>
          </div>
        </button>
        
        <button
          onClick={() => onViewModeChange('all')}
          className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
            viewMode === 'all'
              ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">종합 현황</span>
          </div>
        </button>
        
        <button
          onClick={() => onViewModeChange('competitiveness')}
          className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
            viewMode === 'competitiveness'
              ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">경쟁력 분석</span>
          </div>
        </button>
        
        <div className="pt-1 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1 px-3">직군별 분석</p>
          {bands.map(band => (
            <button
              key={band}
              onClick={() => {
                onViewModeChange('band')
                onBandSelect(band)
              }}
              className={`w-full text-left px-3 py-1.5 rounded-lg transition-all duration-200 ${
                viewMode === 'band' && selectedBand === band
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="text-sm font-medium">{band}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}