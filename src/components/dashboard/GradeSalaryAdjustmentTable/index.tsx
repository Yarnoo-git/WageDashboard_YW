'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { formatKoreanCurrency } from '@/lib/utils'
import { 
  GradeSalaryAdjustmentTableProps, 
  LevelRates, 
  EMPTY_EMPLOYEE_DATA, 
  LEVELS 
} from './types'
import { TableHeader } from './TableHeader'
import { TableRow } from './TableRow'

function GradeSalaryAdjustmentTableComponent({
  baseUpRate = 0,
  meritRate = 0,
  employeeData = EMPTY_EMPLOYEE_DATA,
  onRateChange,
  onTotalBudgetChange,
  enableAdditionalIncrease = false,
  onEnableAdditionalIncreaseChange,
  onAdditionalBudgetChange,
  onPromotionBudgetChange,
  onLevelTotalRatesChange,
  onMeritWeightedAverageChange,
  initialRates,
  onTotalSummaryChange
}: GradeSalaryAdjustmentTableProps) {
  
  // 직급별 인상률 상태 (초기값 설정)
  const [rates, setRates] = useState<{ [key: string]: LevelRates }>(() => {
    if (initialRates) return initialRates
    
    const initial: { [key: string]: LevelRates } = {}
    LEVELS.forEach(level => {
      initial[level] = {
        baseUp: baseUpRate,
        merit: meritRate,
        promotion: 0,
        advancement: 0,
        additional: 0
      }
    })
    return initial
  })
  
  // baseUpRate가 변경되면 모든 직급의 baseUp 업데이트
  useEffect(() => {
    setRates(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(level => {
        const currentLevel = updated[level]
        if (currentLevel) {
          updated[level] = {
            ...currentLevel,
            baseUp: baseUpRate,
            merit: currentLevel.merit || meritRate,
            promotion: currentLevel.promotion || 0,
            advancement: currentLevel.advancement || 0,
            additional: currentLevel.additional || 0
          }
        }
      })
      return updated
    })
  }, [baseUpRate, meritRate])
  
  // 계산 함수들
  const calculateLevelAmount = (level: string) => {
    const rate = rates[level]
    const data = employeeData.levels[level]
    if (!data || !rate) return 0
    
    const totalRate = rate.baseUp + rate.merit + rate.additional
    return data.headcount * data.averageSalary * (totalRate / 100)
  }
  
  const calculateWeightedAverage = (field: keyof LevelRates) => {
    let weightedSum = 0
    let totalHeadcount = 0
    
    Object.entries(rates).forEach(([level, rate]) => {
      const data = employeeData.levels[level]
      if (data) {
        weightedSum += rate[field] * data.headcount
        totalHeadcount += data.headcount
      }
    })
    
    return totalHeadcount > 0 ? weightedSum / totalHeadcount : 0
  }
  
  // 전체 합계 계산
  const totalSummary = useMemo(() => {
    const avgBaseUp = calculateWeightedAverage('baseUp')
    const avgMerit = calculateWeightedAverage('merit')
    const avgPromotion = calculateWeightedAverage('promotion')
    const avgAdvancement = calculateWeightedAverage('advancement')
    const avgAdditional = calculateWeightedAverage('additional')
    
    const totalRate = avgBaseUp + avgMerit + avgAdditional
    
    let totalAmount = 0
    Object.keys(rates).forEach(level => {
      totalAmount += calculateLevelAmount(level)
    })
    
    return {
      avgBaseUp,
      avgMerit,
      avgPromotion,
      avgAdvancement,
      avgAdditional,
      totalRate,
      totalAmount
    }
  }, [rates, employeeData])
  
  // 인상률 변경 핸들러
  const handleRateChange = (level: string, field: keyof LevelRates, value: string) => {
    const numValue = parseFloat(value) || 0
    
    setRates(prev => {
      const currentLevel = prev[level]
      if (!currentLevel) return prev
      
      const updated = {
        ...prev,
        [level]: {
          baseUp: field === 'baseUp' ? numValue : currentLevel.baseUp,
          merit: field === 'merit' ? numValue : currentLevel.merit,
          promotion: field === 'promotion' ? numValue : currentLevel.promotion,
          advancement: field === 'advancement' ? numValue : currentLevel.advancement,
          additional: field === 'additional' ? numValue : currentLevel.additional
        }
      }
      
      if (onRateChange && updated[level]) {
        onRateChange(level, updated[level])
      }
      
      return updated
    })
  }
  
  // 콜백 이펙트들
  useEffect(() => {
    if (onTotalBudgetChange) {
      onTotalBudgetChange(totalSummary.totalAmount)
    }
  }, [totalSummary.totalAmount, onTotalBudgetChange])
  
  useEffect(() => {
    if (onAdditionalBudgetChange) {
      let additionalTotal = 0
      Object.entries(rates).forEach(([level, rate]) => {
        const data = employeeData.levels[level]
        if (data) {
          additionalTotal += data.headcount * data.averageSalary * (rate.additional / 100)
        }
      })
      onAdditionalBudgetChange(additionalTotal)
    }
  }, [rates, employeeData, onAdditionalBudgetChange])
  
  useEffect(() => {
    if (onPromotionBudgetChange) {
      const promotionBudgets: {[key: string]: number} = {}
      Object.entries(rates).forEach(([level, rate]) => {
        const data = employeeData.levels[level]
        if (data) {
          const promotionBudget = data.headcount * data.averageSalary * ((rate.promotion + rate.advancement) / 100)
          promotionBudgets[level] = promotionBudget
        }
      })
      onPromotionBudgetChange(promotionBudgets)
    }
  }, [rates, employeeData, onPromotionBudgetChange])
  
  useEffect(() => {
    if (onLevelTotalRatesChange) {
      const levelTotalRates: {[key: string]: number} = {}
      let weightedSum = 0
      let totalHeadcount = 0
      
      Object.entries(rates).forEach(([level, rate]) => {
        const totalRate = rate.baseUp + rate.merit + rate.additional
        levelTotalRates[level] = totalRate
        
        const data = employeeData.levels[level]
        if (data) {
          weightedSum += totalRate * data.headcount
          totalHeadcount += data.headcount
        }
      })
      
      const weightedAverage = totalHeadcount > 0 ? weightedSum / totalHeadcount : 0
      onLevelTotalRatesChange(levelTotalRates, weightedAverage)
    }
  }, [rates, employeeData, onLevelTotalRatesChange])
  
  useEffect(() => {
    if (onMeritWeightedAverageChange) {
      const meritWeightedAverage = calculateWeightedAverage('merit')
      onMeritWeightedAverageChange(meritWeightedAverage)
    }
  }, [rates, employeeData, onMeritWeightedAverageChange])
  
  useEffect(() => {
    if (onTotalSummaryChange) {
      onTotalSummaryChange({
        avgBaseUp: totalSummary.avgBaseUp,
        avgMerit: totalSummary.avgMerit,
        totalRate: totalSummary.totalRate
      })
    }
  }, [totalSummary, onTotalSummaryChange])
  
  return (
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">등급별·급여 수준 조정</h2>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full border-collapse">
          <TableHeader
            enableAdditionalIncrease={enableAdditionalIncrease}
            onEnableAdditionalIncreaseChange={onEnableAdditionalIncreaseChange}
          />
          <tbody>
            {LEVELS.map(level => {
              const levelRates = rates[level]
              if (!levelRates) return null
              return (
                <TableRow
                  key={level}
                  level={level}
                  rates={levelRates}
                  employeeData={employeeData}
                  enableAdditionalIncrease={enableAdditionalIncrease}
                  onRateChange={handleRateChange}
                />
              )
            })}
            
            {/* 합계 행 */}
            <tr className="font-bold bg-gray-100">
              <td className="px-3 py-2 text-center border border-gray-300">합계</td>
              <td className="px-3 py-2 text-center border border-gray-300">
                {employeeData.totalCount.toLocaleString()}명
              </td>
              <td className="px-3 py-2 text-center border border-gray-300">-</td>
              <td className="px-3 py-2 text-center bg-blue-100 border border-gray-300 text-blue-700">
                {totalSummary.avgBaseUp.toFixed(1)}%
              </td>
              <td className="px-3 py-2 text-center border border-gray-300">
                {totalSummary.avgMerit.toFixed(1)}%
              </td>
              <td className="px-3 py-2 text-center border border-gray-300">
                {totalSummary.avgPromotion.toFixed(1)}%
              </td>
              <td className="px-3 py-2 text-center border border-gray-300">
                {totalSummary.avgAdvancement.toFixed(1)}%
              </td>
              <td className="px-3 py-2 text-center border border-gray-300">
                {enableAdditionalIncrease ? `${totalSummary.avgAdditional.toFixed(1)}%` : '-'}
              </td>
              <td className="px-3 py-2 text-center bg-yellow-100 border border-gray-300 text-yellow-700">
                {totalSummary.totalRate.toFixed(1)}%
              </td>
              <td className="px-3 py-2 text-center border border-gray-300">-</td>
              <td className="px-3 py-2 text-center border border-gray-300">-</td>
              <td className="px-3 py-2 text-center bg-green-100 border border-gray-300 text-green-700">
                {formatKoreanCurrency(totalSummary.totalAmount, '억원', 100000000)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const GradeSalaryAdjustmentTable = React.memo(GradeSalaryAdjustmentTableComponent)