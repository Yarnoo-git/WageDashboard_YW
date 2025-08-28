'use client'

import React from 'react'

interface DisplayControlsProps {
  showAllZones: boolean
  onToggleShowAllZones: () => void
  isCompactMode: boolean
  onToggleCompactMode: () => void
  selectedBandsCount: number
}

export function DisplayControls({
  showAllZones,
  onToggleShowAllZones,
  isCompactMode,
  onToggleCompactMode,
  selectedBandsCount
}: DisplayControlsProps) {
  // 동적 컴팩트 모드 - 직군 수에 따라 자동 조정
  const getAutoCompactMode = () => {
    if (selectedBandsCount >= 3) return true  // 3개 이상은 무조건 컴팩트
    return isCompactMode  // 2개 이하는 사용자 설정 따름
  }
  
  const effectiveCompactMode = getAutoCompactMode()
  
  return (
    <div className="flex items-center gap-4">
      {/* Zone 표시 토글 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showAllZones}
          onChange={onToggleShowAllZones}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Pay Zone별 상세 보기</span>
      </label>
      
      {/* 컴팩트 모드 토글 - 3개 미만일 때만 표시 */}
      {selectedBandsCount < 3 && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isCompactMode}
            onChange={onToggleCompactMode}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">컴팩트 모드</span>
        </label>
      )}
      
      {/* 3개 이상일 때 자동 컴팩트 모드 표시 */}
      {selectedBandsCount >= 3 && (
        <span className="text-sm text-gray-500 italic">
          (자동 컴팩트 모드)
        </span>
      )}
    </div>
  )
}