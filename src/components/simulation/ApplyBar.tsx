'use client'

import React from 'react'

interface ApplyBarProps {
  pendingChangeCount: number
  onApply: () => void
  onReset: () => void
}

export function ApplyBar({
  pendingChangeCount,
  onApply,
  onReset
}: ApplyBarProps) {
  const hasPendingChanges = pendingChangeCount > 0
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-md">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hasPendingChanges ? (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-gray-700">
                  {pendingChangeCount}개의 변경사항
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-500">
                변경사항 없음
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              disabled={!hasPendingChanges}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                hasPendingChanges 
                  ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  : 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
              }`}
            >
              취소
            </button>
            <button
              onClick={onApply}
              disabled={!hasPendingChanges}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-sm ${
                hasPendingChanges
                  ? 'text-white bg-blue-600 hover:bg-blue-700'
                  : 'text-gray-400 bg-gray-200 cursor-not-allowed'
              }`}
            >
              적용하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}