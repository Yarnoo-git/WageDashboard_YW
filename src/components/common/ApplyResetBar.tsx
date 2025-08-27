/**
 * Apply/Reset 버튼 바 컴포넌트
 * 변경사항 적용 및 취소 기능
 */

'use client'

import React from 'react'
import { SUCCESS_MESSAGES } from '@/config/constants'

interface ApplyResetBarProps {
  hasChanges: boolean
  changeCount?: number
  onApply: () => void
  onReset: () => void
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  isFixed?: boolean
}

export function ApplyResetBar({
  hasChanges,
  changeCount = 0,
  onApply,
  onReset,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  isFixed = true
}: ApplyResetBarProps) {
  // 변경사항이 없으면 표시하지 않음
  if (!hasChanges && !canUndo && !canRedo) {
    return null
  }
  
  const handleApply = () => {
    if (confirm('변경사항을 적용하시겠습니까?')) {
      onApply()
      // 성공 메시지
      setTimeout(() => {
        alert(SUCCESS_MESSAGES.APPLIED)
      }, 100)
    }
  }
  
  const handleReset = () => {
    if (confirm('모든 변경사항을 취소하시겠습니까?')) {
      onReset()
      setTimeout(() => {
        alert(SUCCESS_MESSAGES.RESET)
      }, 100)
    }
  }
  
  return (
    <div 
      className={`
        bg-white border-t shadow-lg
        ${isFixed ? 'fixed bottom-0 left-0 right-0 z-50' : ''}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 왼쪽: 상태 표시 */}
          <div className="flex items-center gap-4">
            {hasChanges && (
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {changeCount > 0 ? (
                    <>
                      <span className="text-yellow-600 font-bold">{changeCount}개</span>의 변경사항이 있습니다
                    </>
                  ) : (
                    '변경사항이 있습니다'
                  )}
                </span>
              </div>
            )}
            
            {/* Undo/Redo 버튼 */}
            {(canUndo || canRedo) && (
              <div className="flex items-center gap-1 border-l pl-4">
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className={`p-2 rounded transition-colors ${
                    canUndo 
                      ? 'hover:bg-gray-100 text-gray-700' 
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                  title="실행 취소 (Ctrl+Z)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" 
                    />
                  </svg>
                </button>
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className={`p-2 rounded transition-colors ${
                    canRedo 
                      ? 'hover:bg-gray-100 text-gray-700' 
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                  title="다시 실행 (Ctrl+Y)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" 
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          {/* 오른쪽: 액션 버튼 */}
          {hasChanges && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handleApply}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                적용하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 미니 Apply/Reset 버튼 (인라인용)
 */
export function ApplyResetButtons({
  hasChanges,
  onApply,
  onReset,
  size = 'normal'
}: {
  hasChanges: boolean
  onApply: () => void
  onReset: () => void
  size?: 'small' | 'normal' | 'large'
}) {
  if (!hasChanges) return null
  
  const sizeClasses = {
    small: 'px-3 py-1 text-sm',
    normal: 'px-4 py-2',
    large: 'px-6 py-3 text-lg'
  }
  
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onReset}
        className={`${sizeClasses[size]} bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium`}
      >
        취소
      </button>
      <button
        onClick={onApply}
        className={`${sizeClasses[size]} bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium`}
      >
        적용
      </button>
    </div>
  )
}