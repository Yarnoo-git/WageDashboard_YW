'use client'

import React, { useState, useEffect } from 'react'
import { PayBandLineChart } from './PayBandLineChart'
import { ComparisonTable } from './ComparisonTable'
import { RaiseSliderPanel } from './RaiseSliderPanel'
import { PayBandCompetitivenessHeatmapCards } from './PayBandCompetitivenessHeatmapCards'
// import { useWageContextNew } from '@/context/WageContextNew' // 임시 제거

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

interface PayBandCardProps {
  bandId: string
  bandName: string
  levels: LevelData[]
  initialBaseUp: number
  initialMerit: number
  levelRates?: {  // 대시보드에서 설정한 직급별 인상률
    [level: string]: {
      baseUp: number
      merit: number
    }
  }
  onRateChange?: (bandId: string, updatedData: any) => void
  currentRates?: {  // 현재 저장된 인상률 값
    baseUpRate?: number
    additionalRate?: number
    meritMultipliers?: Record<string, number>
  }
  isReadOnly?: boolean  // 읽기 전용 모드
  bands?: any[]  // 모든 밴드 데이터 (종합 현황용)
}

export function PayBandCard({
  bandId,
  bandName,
  levels,
  onRateChange,
  isReadOnly = false,
  bands = []
}: PayBandCardProps) {
  // const { computed, matrix, updateMatrix } = useWageContextNew() // 임시 제거
  
  // 조정값 초기화 (현재 미구현)
  const baseUpAdjustment = 0
  const meritAdjustment = 0
  
  const [localBaseUpAdjustment, setLocalBaseUpAdjustment] = useState(baseUpAdjustment)
  const [localMeritAdjustment, setLocalMeritAdjustment] = useState(meritAdjustment)

  // WageContext에서 값이 변경되면 로컬 상태 업데이트
  useEffect(() => {
    if (isReadOnly) {
      // 전체 보기 모드: 현재는 조정값 0으로 유지
      setLocalBaseUpAdjustment(0)
      setLocalMeritAdjustment(0)
    } else {
      // 개별 직군 모드: 현재는 조정값 0으로 유지
      setLocalBaseUpAdjustment(0)
      setLocalMeritAdjustment(0)
    }
  }, [bandName, isReadOnly])

  // 로컬 조정값 변경 시 WageContext 업데이트 (읽기 전용이 아닐 때만)
  useEffect(() => {
    if (!isReadOnly && bandName && onRateChange) {
      // 현재는 조정값 변경이 미구현
    }
  }, [bandName, localBaseUpAdjustment, localMeritAdjustment, isReadOnly, onRateChange])

  // 최종 인상률 계산 및 Context 저장
  useEffect(() => {
    // 현재는 최종 인상률 계산이 미구현
  }, [bandName, baseUpAdjustment, meritAdjustment])

  // 차트 데이터 준비 - 인상률 적용
  const chartData = ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4']
    .map(levelName => {
      const level = levels.find(l => l.level === levelName)
      if (!level || (level.headcount === 0 && level.company.median === 0)) {
        return null
      }
      
      // 최종 인상률 계산 (현재는 0으로 고정)
      const totalRaiseRate = 0
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
      
      // 최종 인상률 계산 (현재는 0으로 고정)
      const totalRaiseRate = 0
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
    
    // Context에서 해당 직군 조정값 제거 (현재 미구현)
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
        {/* 좌측: 차트와 테이블 - 읽기 전용 모드일 때는 더 좁게 */}
        <div className={`${isReadOnly ? 'xl:col-span-7' : 'xl:col-span-8'} space-y-4`}>
          {/* 꺾은선 차트 */}
          <div className="p-1 md:p-2 bg-gray-50 rounded-lg min-h-[280px] md:min-h-[450px]">
            <h4 className="text-sm md:text-base font-semibold text-gray-700 mb-1 px-1 md:px-2 pt-1 md:pt-2">보상 경쟁력 분석</h4>
            <PayBandLineChart 
              key={`chart-${baseUpAdjustment}-${meritAdjustment}`}
              data={chartData} 
              bandName={bandName} 
            />
          </div>

          {/* 비교 테이블 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-base font-semibold text-gray-700 mb-3">상세 비교</h4>
            <ComparisonTable 
              key={`table-${baseUpAdjustment}-${meritAdjustment}`}
              data={tableData} 
            />
          </div>
        </div>

        {/* 우측: 슬라이더 패널 또는 경쟁력 분포 */}
        {!isReadOnly ? (
          <div className="xl:col-span-4">
            <div className="sticky top-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-base font-semibold text-gray-700">인상률 조정</h4>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>초기값</span>
                </div>
              </button>
            </div>
            <RaiseSliderPanel
              bandId={bandId}
              bandName={bandName}
              levelRates={{}}
              baseUpAdjustment={localBaseUpAdjustment}
              meritAdjustment={localMeritAdjustment}
              onBaseUpAdjustmentChange={setLocalBaseUpAdjustment}
              onMeritAdjustmentChange={setLocalMeritAdjustment}
              onReset={handleReset}
              budgetImpact={calculateBudgetImpact()}
            />
          </div>
        </div>
        ) : (
          <div className="xl:col-span-5">
            <PayBandCompetitivenessHeatmapCards 
              bands={bands}
              bandAdjustments={{}}
              levelRates={{}}
            />
          </div>
        )}
      </div>
    </div>
  )
}