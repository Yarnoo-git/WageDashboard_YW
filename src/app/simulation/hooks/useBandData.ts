/**
 * Band 데이터 처리 훅
 * simulation 페이지의 복잡한 데이터 로직 분리
 */

import { useMemo } from 'react'
import { useWageContextNew } from '@/context/WageContextNew'
// useWageContextAdapter removed - using WageContextNew directly

interface BandLevelData {
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

interface BandData {
  bandId: string
  bandName: string
  levels: BandLevelData[]
  totalEmployees: number
  averageSalary: number
}

export function useBandData() {
  const newContext = useWageContextNew()
  // Using newContext directly
  
  // 직군별 데이터 집계
  const bandsData = useMemo(() => {
    const bands = newContext.originalData.metadata.bands
    const employees = newContext.originalData.employees
    const competitorData = newContext.originalData.competitorData || []
    
    return bands.map(band => {
      const bandEmployees = employees.filter(e => e.band === band)
      if (bandEmployees.length === 0) return null
      
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
            company: { median: 0, mean: 0, values: [] },
            competitor: { median: 0 }
          }
        }
        
        const salaries: number[] = levelEmployees
          .map(e => e.currentSalary)
          .filter((s): s is number => s !== undefined)
          .sort((a, b) => a - b)
        const meanSalary: number = salaries.length > 0 ? salaries.reduce((sum, s) => sum + s, 0) / salaries.length : 0
        const medianSalary: number = salaries.length > 0 ? (salaries[Math.floor(salaries.length / 2)] ?? 0) : 0
        
        const competitorInfo = competitorData.find(c => 
          c.band === band && c.level === level
        )
        const competitorMedian = competitorInfo?.averageSalary || 0
        
        const baseUpRate = newContext.originalData.aiSettings.baseUpPercentage || 0
        
        return {
          level,
          headcount: levelEmployees.length,
          meanBasePay: meanSalary,
          baseUpKRW: meanSalary * baseUpRate / 100,
          baseUpRate,
          sblIndex: competitorMedian > 0 && medianSalary > 0 ? (medianSalary / competitorMedian) * 100 : 0,
          caIndex: competitorMedian > 0 && medianSalary > 0 ? (medianSalary / competitorMedian) * 100 : 0,
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
    }).filter(Boolean) as BandData[]
  }, [newContext.originalData])
  
  // 전체 집계 데이터
  const totalBandData = useMemo(() => {
    if (!bandsData || bandsData.length === 0) return null
    
    return {
      bandId: 'total',
      bandName: '전체',
      levels: newContext.originalData.metadata.levels.map(level => {
        const levelData = bandsData.flatMap(band => 
          band.levels.filter(l => l.level === level)
        )
        
        const totalHeadcount = levelData.reduce((sum, l) => sum + l.headcount, 0)
        const totalBasePay = levelData.reduce((sum, l) => sum + l.meanBasePay * l.headcount, 0)
        
        return {
          level,
          headcount: totalHeadcount,
          meanBasePay: totalHeadcount > 0 ? totalBasePay / totalHeadcount : 0,
          baseUpKRW: 0,
          baseUpRate: newContext.originalData.aiSettings.baseUpPercentage || 0,
          sblIndex: 100,
          caIndex: 100,
          company: {
            median: totalHeadcount > 0 ? totalBasePay / totalHeadcount : 0,
            mean: totalHeadcount > 0 ? totalBasePay / totalHeadcount : 0,
            values: []
          },
          competitor: {
            median: totalHeadcount > 0 ? totalBasePay / totalHeadcount : 0
          }
        }
      })
    }
  }, [bandsData, newContext.originalData.metadata.levels])
  
  return {
    bandsData,
    totalBandData
  }
}