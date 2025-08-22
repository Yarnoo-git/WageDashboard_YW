'use client'

import React from 'react'

interface ApplyBarProps {
  hasPendingChanges: boolean
  pendingChangeCount: number
  onApply: () => void
  onReset: () => void
}

export function ApplyBar({
  hasPendingChanges,
  pendingChangeCount,
  onApply,
  onReset
}: ApplyBarProps) {
  if (!hasPendingChanges) return null
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700">
                {pendingChangeCount}개의 변경사항이 있습니다
              </span>
            </div>
            <span className="text-sm text-gray-500">
              적용을 눌러 변경사항을 반영하세요
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              초기화
            </button>
            <button
              onClick={onApply}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              적용하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}