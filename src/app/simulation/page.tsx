/**
 * 시뮬레이션 페이지
 * 새로운 시스템으로 완전히 재구성
 */

'use client'

import React from 'react'
import { WageContextNewProvider } from '@/context/WageContextNew'
import SimulationNewPage from '../simulation-new/page'

export default function SimulationPage() {
  // 기존 simulation-new 컴포넌트를 재사용
  return <SimulationNewPage />
}