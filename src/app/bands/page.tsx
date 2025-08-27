/**
 * 직군별 상세 분석 페이지
 * PayBandCard를 활용한 아름다운 직군별 분석 UI
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { WageContextNewProvider, useWageContextNew } from '@/context/WageContextNew'
import { useWageContextAdapter } from '@/hooks/useWageContextAdapter'
import { PayBandCardWrapper } from '@/components/band/PayBandCardWrapper'
import { formatKoreanCurrency, formatPercentage } from '@/lib/utils'

function BandsContent() {
  const router = useRouter()
  const newContext = useWageContextNew()
  const adapter = useWageContextAdapter()
  const [selectedBand, setSelectedBand] = useState<string | null>(null)
  const [bandAdjustments, setBandAdjustments] = useState<Record<string, { baseUpAdjustment: number; meritAdjustment: number }>>({})
  
  // 데이터 없으면 홈으로
  useEffect(() => {
    if (!newContext.isLoading && newContext.originalData.employees.length === 0) {
      router.push('/home')
    }
  }, [newContext.isLoading, newContext.originalData.employees, router])
  
  // 직군별 데이터 집계
  const bandsData = useMemo(() => {
    if (!newContext.originalData.employees.length) return []
    
    const bands = newContext.originalData.metadata.bands
    const employees = newContext.originalData.employees
    const competitorData = adapter.competitorData || []
    
    return bands.map(band => {
      // 해당 직군의 직원들
      const bandEmployees = employees.filter(e => e.band === band)
      if (bandEmployees.length === 0) return null
      
      // 레벨별 데이터 집계
      const levelData = newContext.originalData.metadata.levels.map(level => {
        const levelEmployees = bandEmployees.filter(e => e.level === level)
        
        if (levelEmployees.length === 0) {
          return {
            level,
            headcount: 0,
            meanBasePay: 0,
            baseUpKRW: 0,
            baseUpRate: 0,
            sblIndex: 0,
            caIndex: 0,
            company: {
              median: 0,
              mean: 0,
              values: []
            },
            competitor: {
              median: 0
            }
          }
        }
        
        const salaries = levelEmployees.map(e => e.currentSalary).sort((a, b) => a - b)
        const meanSalary = salaries.reduce((sum, s) => sum + s, 0) / salaries.length
        const medianSalary = salaries[Math.floor(salaries.length / 2)]
        
        // 경쟁사 데이터 찾기
        const competitorInfo = competitorData.find(c => 
          c.band === band && c.level === level
        )
        const competitorMedian = competitorInfo?.averageSalary || 0
        
        return {
          level,
          headcount: levelEmployees.length,
          meanBasePay: meanSalary,
          baseUpKRW: meanSalary * 0.032, // 3.2% 기본 인상
          baseUpRate: 3.2,
          sblIndex: competitorMedian > 0 ? (medianSalary / competitorMedian) * 100 : 0,
          caIndex: competitorMedian > 0 ? (medianSalary / competitorMedian) * 100 : 0,
          company: {
            median: medianSalary,
            mean: meanSalary,
            values: salaries
          },
          competitor: {
            median: competitorMedian
          }
        }
      })
      
      return {
        bandId: band,
        bandName: band,
        levels: levelData,
        totalEmployees: bandEmployees.length,
        averageSalary: bandEmployees.reduce((sum, e) => sum + e.currentSalary, 0) / bandEmployees.length
      }
    }).filter(Boolean)
  }, [newContext.originalData, adapter.competitorData])
  
  // 전체 경쟁력 지표 계산
  const overallMetrics = useMemo(() => {
    if (!bandsData.length) return null
    
    const totalEmployees = bandsData.reduce((sum, band) => sum + band!.totalEmployees, 0)
    const overallAvgSalary = bandsData.reduce((sum, band) => 
      sum + (band!.averageSalary * band!.totalEmployees), 0
    ) / totalEmployees
    
    // 경쟁력 지수 계산
    let competitiveBands = 0
    let neutralBands = 0
    let behindBands = 0
    
    bandsData.forEach(band => {
      const avgIndex = band!.levels.reduce((sum, level) => {
        if (level.headcount > 0) {
          return sum + level.sblIndex
        }
        return sum
      }, 0) / band!.levels.filter(l => l.headcount > 0).length
      
      if (avgIndex >= 110) competitiveBands++
      else if (avgIndex >= 90) neutralBands++
      else behindBands++
    })
    
    return {
      totalBands: bandsData.length,
      totalEmployees,
      overallAvgSalary,
      competitiveBands,
      neutralBands,
      behindBands
    }
  }, [bandsData])
  
  if (newContext.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* 헤더 섹션 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">
                직군별 상세 분석
              </h1>
              <p className="text-gray-600 mt-1">직군별 보상 경쟁력 및 인상률 조정</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
              >
                ← 대시보드
              </button>
              <button
                onClick={() => router.push('/simulation')}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md"
              >
                시뮬레이션 →
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* 전체 요약 카드 */}
        {overallMetrics && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <p className="text-sm text-gray-600 mb-1">전체 직군</p>
                <p className="text-2xl font-bold text-gray-900">{overallMetrics.totalBands}개</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <p className="text-sm text-gray-600 mb-1">전체 인원</p>
                <p className="text-2xl font-bold text-gray-900">{overallMetrics.totalEmployees.toLocaleString()}명</p>
              </div>
              <div className="bg-green-50 rounded-lg shadow-sm p-4">
                <p className="text-sm text-green-600 mb-1">경쟁력 우위</p>
                <p className="text-2xl font-bold text-green-900">{overallMetrics.competitiveBands}개</p>
              </div>
              <div className="bg-yellow-50 rounded-lg shadow-sm p-4">
                <p className="text-sm text-yellow-600 mb-1">보통</p>
                <p className="text-2xl font-bold text-yellow-900">{overallMetrics.neutralBands}개</p>
              </div>
              <div className="bg-red-50 rounded-lg shadow-sm p-4">
                <p className="text-sm text-red-600 mb-1">경쟁력 열위</p>
                <p className="text-2xl font-bold text-red-900">{overallMetrics.behindBands}개</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 직군 선택 탭 */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedBand(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedBand === null
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체 보기
              </button>
              {bandsData.map(band => (
                <button
                  key={band!.bandId}
                  onClick={() => setSelectedBand(band!.bandId)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedBand === band!.bandId
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {band!.bandName} ({band!.totalEmployees}명)
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* 직군별 카드 */}
        <div className="space-y-6">
          {selectedBand === null ? (
            // 전체 보기 - 모든 직군 요약
            <div className="grid grid-cols-1 gap-6">
              {bandsData.map(band => (
                <PayBandCardWrapper
                  key={band!.bandId}
                  bandId={band!.bandId}
                  bandName={band!.bandName}
                  levels={band!.levels}
                  initialBaseUp={adapter.baseUpRate}
                  initialMerit={adapter.meritRate}
                  levelRates={adapter.levelRates}
                  currentRates={{
                    baseUpRate: bandAdjustments[band!.bandName]?.baseUpAdjustment || 0,
                    additionalRate: bandAdjustments[band!.bandName]?.meritAdjustment || 0
                  }}
                  isReadOnly={true}
                  bands={bandsData}
                  bandAdjustments={bandAdjustments}
                  setBandAdjustments={setBandAdjustments}
                />
              ))}
            </div>
          ) : (
            // 개별 직군 상세
            bandsData
              .filter(band => band!.bandId === selectedBand)
              .map(band => (
                <PayBandCardWrapper
                  key={band!.bandId}
                  bandId={band!.bandId}
                  bandName={band!.bandName}
                  levels={band!.levels}
                  initialBaseUp={adapter.baseUpRate}
                  initialMerit={adapter.meritRate}
                  levelRates={adapter.levelRates}
                  onRateChange={(bandId, data) => {
                    setBandAdjustments(prev => ({
                      ...prev,
                      [bandId]: {
                        baseUpAdjustment: data.baseUpAdjustment,
                        meritAdjustment: data.meritAdjustment
                      }
                    }))
                  }}
                  currentRates={{
                    baseUpRate: bandAdjustments[band!.bandName]?.baseUpAdjustment || 0,
                    additionalRate: bandAdjustments[band!.bandName]?.meritAdjustment || 0
                  }}
                  isReadOnly={false}
                  bandAdjustments={bandAdjustments}
                  setBandAdjustments={setBandAdjustments}
                />
              ))
          )}
        </div>
        
        {/* 하단 요약 정보 */}
        {selectedBand === null && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">직군별 인상률 조정 요약</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium mb-1">총 조정된 직군</p>
                <p className="text-2xl font-bold text-blue-900">
                  {Object.keys(bandAdjustments).length}개
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium mb-1">평균 추가 인상률</p>
                <p className="text-2xl font-bold text-green-900">
                  {Object.values(bandAdjustments).length > 0 
                    ? formatPercentage(
                        Object.values(bandAdjustments).reduce((sum, adj) => 
                          sum + adj.baseUpAdjustment + adj.meritAdjustment, 0
                        ) / Object.values(bandAdjustments).length
                      )
                    : '0%'
                  }
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-medium mb-1">예상 추가 예산</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatKoreanCurrency(
                    bandsData.reduce((total, band) => {
                      const adjustment = bandAdjustments[band!.bandName] || { baseUpAdjustment: 0, meritAdjustment: 0 }
                      const additionalRate = (adjustment.baseUpAdjustment + adjustment.meritAdjustment) / 100
                      return total + (band!.averageSalary * additionalRate * band!.totalEmployees * 12)
                    }, 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* 하단 액션 버튼들 */}
        <div className="flex gap-4 justify-center mt-8">
          <button
            onClick={() => router.push('/simulation')}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
          >
            시뮬레이션에서 세부 조정
          </button>
          <button
            onClick={() => router.push('/person')}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            개인별 결과 확인
          </button>
        </div>
      </main>
    </div>
  )
}

export default function BandsPage() {
  return (
    <WageContextNewProvider>
      <BandsContent />
    </WageContextNewProvider>
  )
}