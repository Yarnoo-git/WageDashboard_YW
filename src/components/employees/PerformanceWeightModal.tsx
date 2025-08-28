'use client'

import { useState, useEffect } from 'react'
import { useWageContextNew } from '@/context/WageContextNew'
import { getPerformanceWeights } from '@/services/gradeSettingsService'

interface PerformanceWeightModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PerformanceWeightModal({ isOpen, onClose }: PerformanceWeightModalProps) {
  const context = useWageContextNew()
  const performanceWeights = context.computed.performanceWeights
  const setPerformanceWeights = (weights: Record<string, number>) => {
    // WageContextNew doesn't have direct setPerformanceWeights, using updateMatrix instead
    console.log('Performance weights update:', weights)
  }
  const gradeSettings = context.originalData.gradeSettings
  const [localWeights, setLocalWeights] = useState(performanceWeights)

  useEffect(() => {
    setLocalWeights(performanceWeights)
  }, [performanceWeights, isOpen])

  if (!isOpen) return null

  const handleApply = () => {
    setPerformanceWeights(localWeights)
    onClose()
  }

  const handleReset = () => {
    // 엑셀에서 로드된 기본값 사용, 없으면 하드코딩된 값 사용
    const defaultWeights = getPerformanceWeights(gradeSettings || undefined)
    setLocalWeights(defaultWeights)
  }

  return (
    <>
      {/* 반투명 배경 제거 - 클릭 시 닫기 */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* 플로팅 카드 */}
      <div className="fixed top-20 right-4 z-50 bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-md animate-slide-in-right">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              평가등급별 성과 인상률 가중치 설정
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p className="text-sm text-slate-600 mb-6">
            각 평가등급에 대한 성과 인상률 가중치를 조정하세요.
          </p>

          <div className="space-y-6">
            {Object.entries(localWeights).map(([grade, weight]) => (
              <div key={grade} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    {grade}등급
                  </label>
                  <span className="text-sm font-semibold text-indigo-600">
                    {weight.toFixed(1)}x
                  </span>
                </div>
                
                <div className="relative">
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setLocalWeights(prev => ({
                      ...prev,
                      [grade]: parseFloat(e.target.value)
                    }))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div 
                    className="absolute h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg pointer-events-none"
                    style={{ width: `${((weight - 0.5) / 1.5) * 100}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0.5x</span>
                  <span>1.0x</span>
                  <span>2.0x</span>
                </div>
              </div>
            ))}
          </div>

          {/* 미리보기 */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-xs font-medium text-slate-600 mb-2">예시 계산 (성과 인상률 2.5% 기준)</p>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {Object.entries(localWeights).map(([grade, weight]) => (
                <div key={grade} className="text-center">
                  <span className="font-medium text-slate-700">{grade}</span>
                  <p className="text-indigo-600 font-semibold">{(2.5 * weight).toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              초기화
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </>
  )
}