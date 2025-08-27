/**
 * WageContext 호환성 레이어
 * 기존 컴포넌트들이 새로운 시스템과 호환되도록 하는 래퍼
 */

'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useWageContextNew } from './WageContextNew'
import { useWageContextAdapter } from '@/hooks/useWageContextAdapter'

interface WageContextType {
  baseUpRate: number
  meritRate: number
  setBandFinalRates: (value: any) => void
  bandFinalRates: any
  bandAdjustments: {
    [bandName: string]: {
      baseUpAdjustment: number
      meritAdjustment: number
    }
  }
  setBandAdjustments: (value: any) => void
}

const WageContext = createContext<WageContextType | undefined>(undefined)

export function WageProvider({ children }: { children: ReactNode }) {
  const newContext = useWageContextNew()
  const adapter = useWageContextAdapter()
  
  // Band별 조정값 상태 (로컬)
  const [bandAdjustments, setBandAdjustments] = React.useState<{
    [bandName: string]: {
      baseUpAdjustment: number
      meritAdjustment: number
    }
  }>({})
  
  const [bandFinalRates, setBandFinalRates] = React.useState<any>({})
  
  const value: WageContextType = {
    baseUpRate: adapter.baseUpRate,
    meritRate: adapter.meritRate,
    setBandFinalRates,
    bandFinalRates,
    bandAdjustments,
    setBandAdjustments
  }
  
  return (
    <WageContext.Provider value={value}>
      {children}
    </WageContext.Provider>
  )
}

export function useWageContext() {
  const context = useContext(WageContext)
  if (!context) {
    throw new Error('useWageContext must be used within a WageProvider')
  }
  return context
}