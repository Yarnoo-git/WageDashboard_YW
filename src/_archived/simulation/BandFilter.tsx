'use client'

import React from 'react'

interface BandFilterProps {
  bands: string[]
  selectedBands: string[]
  onBandToggle: (band: string) => void
  onSelectAll: () => void
  onClearAll: () => void
}

export function BandFilter({
  bands,
  selectedBands,
  onBandToggle,
  onSelectAll,
  onClearAll
}: BandFilterProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">직군 필터</h3>
        <div className="flex gap-1">
          <button
            onClick={onSelectAll}
            className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            전체
          </button>
          <button
            onClick={onClearAll}
            className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
          >
            해제
          </button>
        </div>
      </div>
      
      <div className="space-y-1">
        {bands.map((band) => (
          <label
            key={band}
            className="flex items-center px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedBands.includes(band)}
              onChange={() => onBandToggle(band)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              {band}
            </span>
          </label>
        ))}
      </div>
      
      {selectedBands.length > 0 && selectedBands.length < bands.length && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {selectedBands.length}개 선택
          </p>
        </div>
      )}
    </div>
  )
}