'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { INDIRECT_COST } from '@/config/constants'

interface BudgetContextType {
  // 예산 관리
  availableBudget: number  // 사용가능 예산
  welfareBudget: number    // 복리후생 예산
  totalBudget: number      // 총 예산 (기존 호환용)
  
  // 간접비용 비율
  indirectCostRate: number // 간접비용 비율
  
  // 예산 업데이트 함수
  setAvailableBudget: (budget: number) => void
  setWelfareBudget: (budget: number) => void
  setTotalBudget: (budget: number) => void
  setIndirectCostRate: (rate: number) => void
  
  // 예산 계산 함수
  calculateDirectCost: (totalSalary: number, increaseRate: number) => number
  calculateIndirectCost: (directCost: number) => number
  calculateTotalCost: (directCost: number) => number
  calculateRemainingBudget: (usedCost: number) => number
  calculateMaxIncreasePossible: (remainingBudget: number) => number
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined)

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [availableBudget, setAvailableBudget] = useState(0)
  const [welfareBudget, setWelfareBudget] = useState(0)
  const [totalBudget, setTotalBudget] = useState(0)
  const [indirectCostRate, setIndirectCostRate] = useState(INDIRECT_COST.TOTAL)  // 간접비용 집계
  
  // 직접비용 계산
  const calculateDirectCost = (totalSalary: number, increaseRate: number): number => {
    return totalSalary * (increaseRate / 100)
  }
  
  // 간접비용 계산
  const calculateIndirectCost = (directCost: number): number => {
    return directCost * indirectCostRate
  }
  
  // 총 비용 계산 (직접비용 + 간접비용)
  const calculateTotalCost = (directCost: number): number => {
    return directCost + calculateIndirectCost(directCost)
  }
  
  // 남은 예산 계산
  const calculateRemainingBudget = (usedCost: number): number => {
    return totalBudget - usedCost
  }
  
  // 최대 인상 가능폭 계산
  const calculateMaxIncreasePossible = (remainingBudget: number): number => {
    // 간접비용을 고려한 실제 사용 가능한 직접비용 계산
    return remainingBudget / (1 + indirectCostRate)
  }
  
  const value: BudgetContextType = {
    availableBudget,
    welfareBudget,
    totalBudget,
    indirectCostRate,
    setAvailableBudget,
    setWelfareBudget,
    setTotalBudget,
    setIndirectCostRate,
    calculateDirectCost,
    calculateIndirectCost,
    calculateTotalCost,
    calculateRemainingBudget,
    calculateMaxIncreasePossible,
  }
  
  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  )
}

export function useBudgetContext() {
  const context = useContext(BudgetContext)
  if (!context) {
    throw new Error('useBudgetContext must be used within a BudgetProvider')
  }
  return context
}