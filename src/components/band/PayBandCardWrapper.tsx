/**
 * Wrapper component for PayBandCard to work with new WageContextNew
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useWageContextNew } from '@/context/WageContextNew'

interface LevelData {
  level: string
  headcount: number
  meanBasePay: number
  baseUpKRW: number
  baseUpRate: number
  sblIndex: number
  caIndex: number
  company: {
    median: number
    mean: number
    values: number[]
  }
  competitor: {
    median: number
  }
}

interface PayBandCardWrapperProps {
  bandId: string
  bandName: string
  levels: LevelData[]
  initialBaseUp: number
  initialMerit: number
  levelRates?: {
    [level: string]: {
      baseUp: number
      merit: number
    }
  }
  onRateChange?: (bandId: string, updatedData: any) => void
  currentRates?: {
    baseUpRate?: number
    additionalRate?: number
    meritMultipliers?: Record<string, number>
  }
  isReadOnly?: boolean
  bands?: any[]
  bandAdjustments: {
    [bandName: string]: {
      baseUpAdjustment: number
      meritAdjustment: number
    }
  }
  setBandAdjustments: React.Dispatch<React.SetStateAction<{
    [bandName: string]: {
      baseUpAdjustment: number
      meritAdjustment: number
    }
  }>>
}

export function PayBandCardWrapper({
  bandId,
  bandName,
  levels,
  initialBaseUp,
  initialMerit,
  levelRates,
  onRateChange,
  currentRates,
  isReadOnly = false,
  bands = [],
  bandAdjustments,
  setBandAdjustments
}: PayBandCardWrapperProps) {
  const newContext = useWageContextNew()
  const [localBaseUpAdjustment, setLocalBaseUpAdjustment] = useState(0)
  const [localMeritAdjustment, setLocalMeritAdjustment] = useState(0)

  // 읽기 전용 모드일 때는 모든 직군의 조정값 합계를 계산
  let baseUpAdjustment = 0
  let meritAdjustment = 0
  
  if (isReadOnly) {
    // 전체 보기 모드: 모든 직군의 조정값 평균 계산
    const allAdjustments = Object.values(bandAdjustments)
    if (allAdjustments.length > 0) {
      baseUpAdjustment = allAdjustments.reduce((sum, adj) => sum + adj.baseUpAdjustment, 0) / allAdjustments.length
      meritAdjustment = allAdjustments.reduce((sum, adj) => sum + adj.meritAdjustment, 0) / allAdjustments.length
    }
  } else {
    // 개별 직군 모드: 해당 직군의 조정값 사용
    const bandAdjustment = bandAdjustments[bandName] || { baseUpAdjustment: 0, meritAdjustment: 0 }
    baseUpAdjustment = bandAdjustment.baseUpAdjustment
    meritAdjustment = bandAdjustment.meritAdjustment
  }

  // Context에서 값이 변경되면 로컬 상태 업데이트
  useEffect(() => {
    if (isReadOnly) {
      const allAdjustments = Object.values(bandAdjustments)
      if (allAdjustments.length > 0) {
        setLocalBaseUpAdjustment(allAdjustments.reduce((sum, adj) => sum + adj.baseUpAdjustment, 0) / allAdjustments.length)
        setLocalMeritAdjustment(allAdjustments.reduce((sum, adj) => sum + adj.meritAdjustment, 0) / allAdjustments.length)
      }
    } else {
      const adjustment = bandAdjustments[bandName]
      if (adjustment) {
        setLocalBaseUpAdjustment(adjustment.baseUpAdjustment)
        setLocalMeritAdjustment(adjustment.meritAdjustment)
      }
    }
  }, [bandAdjustments, bandName, isReadOnly])

  // 로컬 조정값 변경 시 상위 컴포넌트 업데이트
  useEffect(() => {
    if (!isReadOnly && bandName) {
      setBandAdjustments(prev => ({
        ...prev,
        [bandName]: {
          baseUpAdjustment: localBaseUpAdjustment,
          meritAdjustment: localMeritAdjustment
        }
      }))
    }
  }, [bandName, localBaseUpAdjustment, localMeritAdjustment, setBandAdjustments, isReadOnly])

  // 차트 데이터 준비 - 인상률 적용
  const chartData = ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4']
    .map(levelName => {
      const level = levels.find(l => l.level === levelName)
      if (!level || (level.headcount === 0 && level.company.median === 0)) {
        return null
      }
      
      // 최종 인상률 계산 (대시보드 기준 + 직군 조정)
      let totalRaiseRate = 0
      if (levelRates && levelRates[level.level]) {
        const baseRate = levelRates[level.level]
        totalRaiseRate = (baseRate.baseUp + baseUpAdjustment) / 100 + 
                        (baseRate.merit + meritAdjustment) / 100
      }
      const adjustedSblMedian = level.company.median * (1 + totalRaiseRate)
      
      return {
        level: level.level,
        sblMedian: level.company.median,  // 현재 값
        sblMedianAdjusted: adjustedSblMedian,  // 조정 후 값
        caMedian: level.competitor.median
      }
    })
    .filter(item => item !== null)

  // 테이블 데이터 준비 - 인상률 적용
  const tableData = ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4']
    .map(levelName => {
      const level = levels.find(l => l.level === levelName)
      if (!level || (level.headcount === 0 && level.company.median === 0)) {
        return null
      }
      
      // 최종 인상률 계산 (대시보드 기준 + 직군 조정)
      let totalRaiseRate = 0
      if (levelRates && levelRates[level.level]) {
        const baseRate = levelRates[level.level]
        totalRaiseRate = (baseRate.baseUp + baseUpAdjustment) / 100 + 
                        (baseRate.merit + meritAdjustment) / 100
      }
      const adjustedSblMedian = level.company.median * (1 + totalRaiseRate)
      
      return {
        level: level.level,
        caMedian: level.competitor.median,
        sblMedian: level.company.median,
        sblMedianAdjusted: adjustedSblMedian
      }
    })
    .filter(item => item !== null)

  // 예산 영향 계산 - 추가 조정분만 계산
  const calculateBudgetImpact = () => {
    return levels.reduce((total, level) => {
      // 추가 조정 비율만 계산 (대시보드 기준값 제외)
      const additionalRate = (baseUpAdjustment + meritAdjustment) / 100
      return total + (level.meanBasePay * additionalRate * level.headcount)
    }, 0)
  }

  // 인상률 초기화 (조정값만 0으로 리셋)
  const handleReset = () => {
    setLocalBaseUpAdjustment(0)
    setLocalMeritAdjustment(0)
    
    // localStorage에서도 삭제
    if (typeof window !== 'undefined' && bandName) {
      localStorage.removeItem(`bandAdjustments_${bandName}`)
    }
  }

  // 조정값 변경 시 상위 컴포넌트에 알림
  useEffect(() => {
    if (onRateChange) {
      onRateChange(bandId, {
        baseUpAdjustment,
        meritAdjustment,
        budgetImpact: calculateBudgetImpact()
      })
    }
  }, [baseUpAdjustment, meritAdjustment])

  // Since we can't use the original PayBandCard due to WageContext dependency,
  // we'll render a simplified version here
  return (
    <div className="bg-white rounded-lg shadow-lg p-3 md:p-6">
      {/* 헤더 */}
      <div className="mb-3 md:mb-4 pb-2 md:pb-3 border-b border-gray-200">
        <h3 className="text-lg md:text-2xl font-bold text-gray-900">{bandName}</h3>
        <p className="text-sm md:text-base text-gray-500 mt-1">
          총 {levels.reduce((sum, l) => sum + l.headcount, 0)}명
        </p>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* 좌측: 차트와 테이블 */}
        <div className={`${isReadOnly ? 'xl:col-span-7' : 'xl:col-span-8'} space-y-4`}>
          {/* 꺾은선 차트 대체 */}
          <div className="p-4 bg-gray-50 rounded-lg min-h-[280px]">
            <h4 className="text-base font-semibold text-gray-700 mb-3">보상 경쟁력 분석</h4>
            <div className="space-y-3">
              {chartData.map((item: any) => (
                <div key={item.level} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.level}</span>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-600">현재: {item.sblMedian.toLocaleString()}원</span>
                    <span className="text-blue-600">조정: {Math.round(item.sblMedianAdjusted).toLocaleString()}원</span>
                    <span className="text-red-600">경쟁사: {item.caMedian.toLocaleString()}원</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 비교 테이블 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-base font-semibold text-gray-700 mb-3">상세 비교</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-sm text-gray-600">
                    <th className="text-left py-2">직급</th>
                    <th className="text-right py-2">경쟁사</th>
                    <th className="text-right py-2">현재</th>
                    <th className="text-right py-2">조정 후</th>
                    <th className="text-right py-2">경쟁력</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((item: any) => {
                    const competitiveness = item.caMedian > 0 
                      ? Math.round((item.sblMedianAdjusted / item.caMedian) * 100)
                      : 0
                    return (
                      <tr key={item.level} className="border-t">
                        <td className="py-2 text-sm font-medium">{item.level}</td>
                        <td className="py-2 text-right text-sm">{item.caMedian.toLocaleString()}원</td>
                        <td className="py-2 text-right text-sm">{item.sblMedian.toLocaleString()}원</td>
                        <td className="py-2 text-right text-sm text-blue-600">
                          {Math.round(item.sblMedianAdjusted).toLocaleString()}원
                        </td>
                        <td className="py-2 text-right text-sm">
                          <span className={`font-semibold ${
                            competitiveness >= 110 ? 'text-green-600' :
                            competitiveness >= 90 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {competitiveness}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 우측: 슬라이더 패널 */}
        {!isReadOnly && (
          <div className="xl:col-span-4">
            <div className="sticky top-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-base font-semibold text-gray-700">인상률 조정</h4>
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    초기화
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base-up 조정: {localBaseUpAdjustment.toFixed(1)}%
                    </label>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.1"
                      value={localBaseUpAdjustment}
                      onChange={(e) => setLocalBaseUpAdjustment(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Merit 조정: {localMeritAdjustment.toFixed(1)}%
                    </label>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.1"
                      value={localMeritAdjustment}
                      onChange={(e) => setLocalMeritAdjustment(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">예산 영향</p>
                    <p className="text-lg font-semibold text-blue-600">
                      +{calculateBudgetImpact().toLocaleString()}원
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}