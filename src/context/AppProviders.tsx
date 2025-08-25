'use client'

import React, { ReactNode } from 'react'
import { BudgetProvider } from './BudgetContext'
import { RateProvider } from './RateContext'
import { EmployeeProvider } from './EmployeeContext'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * 애플리케이션 전체 Context Provider를 통합 관리
 * 각 Provider는 독립적인 도메인을 담당:
 * - BudgetProvider: 예산 관리
 * - RateProvider: 인상률 관리
 * - EmployeeProvider: 직원 데이터 관리
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <BudgetProvider>
      <RateProvider>
        <EmployeeProvider>
          {children}
        </EmployeeProvider>
      </RateProvider>
    </BudgetProvider>
  )
}