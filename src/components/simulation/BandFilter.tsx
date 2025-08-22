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
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">직군 필터</h3>
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
          >
            전체 선택
          </button>
          <button
            onClick={onClearAll}
            className="px-3 py-1 text-sm bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            전체 해제
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        {bands.map((band) => (
          <label
            key={band}
            className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedBands.includes(band)}
              onChange={() => onBandToggle(band)}
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              {band}
            </span>
            {selectedBands.includes(band) && (
              <span className="ml-auto text-xs text-blue-600">
                적용중
              </span>
            )}
          </label>
        ))}
      </div>
      
      {/* 선택 상태 요약 */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {selectedBands.length === 0 ? (
            <span className="text-orange-600">직군을 선택해주세요</span>
          ) : selectedBands.length === bands.length ? (
            <span className="text-green-600">모든 직군 선택됨</span>
          ) : (
            <span>{selectedBands.length}개 직군 선택됨</span>
          )}
        </div>
      </div>
    </div>
  )
}