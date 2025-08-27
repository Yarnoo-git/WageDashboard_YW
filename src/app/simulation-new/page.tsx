/**
 * 새로운 시뮬레이션 페이지
 * 전면 리팩토링된 새로운 시스템 통합
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { WageContextNewProvider, useWageContextNew } from '@/context/WageContextNew'
import { MatrixGrid } from '@/components/matrix/MatrixGrid'
import { PayZoneSettings } from '@/components/payzone/PayZoneSettings'
import { ApplyResetBar } from '@/components/common/ApplyResetBar'
import { WeightedAverageVisualization } from '@/components/common/WeightedAverageVisualization'
import { UNITS, UI_CONFIG } from '@/config/constants'

function SimulationContent() {
  const router = useRouter()
  const {
    config,
    originalData,
    adjustment,
    computed,
    actions,
    isLoading,
    hasChanges,
    canUndo,
    canRedo
  } = useWageContextNew()
  
  const [activeTab, setActiveTab] = useState<'matrix' | 'payzone' | 'analysis'>('matrix')
  const [selectedCell, setSelectedCell] = useState<{ band: string; level: string } | null>(null)
  
  // 데이터 없으면 홈으로
  useEffect(() => {
    if (!isLoading && originalData.employees.length === 0) {
      router.push('/home')
    }
  }, [isLoading, originalData.employees, router])
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }
  
  if (!adjustment.matrix) {
    return null
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* 상단 요약 바 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* 왼쪽: 기본 정보 */}
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs text-gray-500">총 인원</span>
                <div className="text-lg font-bold text-gray-900">
                  {computed.statistics.totalEmployees.toLocaleString()}명
                </div>
              </div>
              <div className="border-l pl-6">
                <span className="text-xs text-gray-500">평균 인상률</span>
                <div className="text-lg font-bold text-blue-600">
                  {computed.weightedAverage.summary.effectiveRate.toFixed(2)}%
                </div>
              </div>
              <div className="border-l pl-6">
                <span className="text-xs text-gray-500">예산 사용률</span>
                <div className="text-lg font-bold">
                  <span className={`${
                    computed.budgetUsage.isOverBudget ? 'text-red-600' :
                    computed.budgetUsage.usagePercentage > 80 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {computed.budgetUsage.usagePercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* 오른쪽: 미적용 변경사항 표시 */}
            {hasChanges && computed.pendingWeightedAverage && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  변경 후 예상:
                </div>
                <div>
                  <span className="text-xs text-gray-500">인상률</span>
                  <div className="text-lg font-bold">
                    <span className="text-gray-400 line-through mr-2">
                      {computed.weightedAverage.summary.effectiveRate.toFixed(2)}%
                    </span>
                    <span className="text-blue-600">
                      → {computed.pendingWeightedAverage.summary.effectiveRate.toFixed(2)}%
                    </span>
                  </div>
                </div>
                {computed.pendingBudgetUsage && (
                  <div className="border-l pl-4">
                    <span className="text-xs text-gray-500">예산</span>
                    <div className="text-lg font-bold">
                      <span className="text-gray-400 line-through mr-2">
                        {computed.budgetUsage.usagePercentage.toFixed(1)}%
                      </span>
                      <span className={`${
                        computed.pendingBudgetUsage.isOverBudget ? 'text-red-600' :
                        computed.pendingBudgetUsage.usagePercentage > 80 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        → {computed.pendingBudgetUsage.usagePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 탭 메뉴 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'matrix'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              매트릭스 조정
            </button>
            <button
              onClick={() => setActiveTab('payzone')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'payzone'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pay Zone 설정
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'analysis'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              가중평균 분석
            </button>
          </div>
        </div>
      </div>
      
      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 매트릭스 조정 탭 */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            {/* 조정 모드 선택 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => actions.setAdjustmentMode('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      adjustment.mode === 'all'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    전체 일괄 조정
                  </button>
                  <button
                    onClick={() => actions.setAdjustmentMode('matrix')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      adjustment.mode === 'matrix'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Band × Level별
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">추가 인상:</span>
                  <button
                    onClick={() => actions.setAdditionalType('percentage')}
                    className={`px-3 py-1 text-sm rounded-full transition-all ${
                      config.additionalType === 'percentage'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    비율(%)
                  </button>
                  <button
                    onClick={() => actions.setAdditionalType('amount')}
                    className={`px-3 py-1 text-sm rounded-full transition-all ${
                      config.additionalType === 'amount'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    정액(만원)
                  </button>
                </div>
              </div>
            </div>
            
            {/* 조정 UI */}
            {adjustment.mode === 'all' ? (
              <AllModeAdjustment />
            ) : (
              <MatrixGrid
                matrix={adjustment.pendingMatrix || adjustment.matrix}
                onCellGradeRateChange={actions.updateCellGradeRate}
                selectedCell={selectedCell}
                onCellSelect={(band, level) => setSelectedCell({ band, level })}
                isReadOnly={false}
              />
            )}
          </div>
        )}
        
        {/* Pay Zone 설정 탭 */}
        {activeTab === 'payzone' && (
          <PayZoneSettings
            employees={originalData.employees}
            onConfigChange={actions.updatePayZoneConfig}
          />
        )}
        
        {/* 가중평균 분석 탭 */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <WeightedAverageVisualization
              result={computed.weightedAverage}
              title="현재 가중평균 분석"
            />
            
            {hasChanges && computed.pendingWeightedAverage && (
              <WeightedAverageVisualization
                result={computed.pendingWeightedAverage}
                title="변경 후 예상 가중평균"
              />
            )}
          </div>
        )}
      </main>
      
      {/* Apply/Reset 바 */}
      <ApplyResetBar
        hasChanges={hasChanges}
        onApply={actions.applyPendingChanges}
        onReset={actions.discardPendingChanges}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={actions.undo}
        onRedo={actions.redo}
      />
    </div>
  )
}

/**
 * 전체 일괄 조정 컴포넌트
 */
function AllModeAdjustment() {
  const { adjustment, actions, originalData } = useWageContextNew()
  const [gradeRates, setGradeRates] = useState<{ [grade: string]: any }>({})  
  
  // 초기 값 설정
  useEffect(() => {
    const initialRates: { [grade: string]: any } = {}
    originalData.metadata.grades.forEach(grade => {
      initialRates[grade] = {
        baseUp: 0,
        merit: 0,
        additional: 0
      }
    })
    setGradeRates(initialRates)
  }, [originalData.metadata.grades])
  
  const handleGradeChange = (grade: string, field: string, value: number) => {
    setGradeRates(prev => ({
      ...prev,
      [grade]: {
        ...prev[grade],
        [field]: value
      }
    }))
  }
  
  const handleApplyAll = () => {
    actions.updateAllCells(gradeRates)
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">전체 일괄 조정</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                평가등급
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                Base-up (%)
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                Merit (%)
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                추가 (%/만원)
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                총 인상률
              </th>
            </tr>
          </thead>
          <tbody>
            {originalData.metadata.grades.map(grade => {
              const rates = gradeRates[grade] || { baseUp: 0, merit: 0, additional: 0 }
              const total = rates.baseUp + rates.merit
              
              return (
                <tr key={grade} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${
                      UI_CONFIG.GRADE_COLORS[grade as keyof typeof UI_CONFIG.GRADE_COLORS]?.bg || 'bg-gray-100'
                    } ${
                      UI_CONFIG.GRADE_COLORS[grade as keyof typeof UI_CONFIG.GRADE_COLORS]?.text || 'text-gray-700'
                    }`}>
                      {grade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      value={rates.baseUp}
                      onChange={(e) => handleGradeChange(grade, 'baseUp', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      step="0.1"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      value={rates.merit}
                      onChange={(e) => handleGradeChange(grade, 'merit', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      step="0.1"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      value={rates.additional}
                      onChange={(e) => handleGradeChange(grade, 'additional', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      step="0.1"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${
                      total > 10 ? 'text-red-600' :
                      total > 5 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {total.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleApplyAll}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          전체 적용
        </button>
      </div>
    </div>
  )
}

export default function SimulationNewPage() {
  return (
    <WageContextNewProvider>
      <SimulationContent />
    </WageContextNewProvider>
  )
}