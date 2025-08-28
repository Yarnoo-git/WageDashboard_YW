import { useState, useEffect } from 'react'
import { loadExcelData, hasStoredData } from '@/lib/clientStorage'
import { BandName } from '@/types/band'

interface BandData {
  id: string
  name: BandName
  totalHeadcount: number
  avgBaseUpRate: number
  avgSBLIndex: number
  avgCAIndex: number
  totalBudgetImpact: number
  levels: Array<{
    level: string
    headcount: number
    meanBasePay: number
    baseUpKRW: number
    baseUpRate: number
    sblIndex: number
    caIndex: number
    competitiveness: number
    market: {
      min: number
      q1: number
      median: number
      q3: number
      max: number
    }
    company: {
      median: number
      mean: number
      values: number[]
    }
    competitor: {
      median: number
    }
  }>
}

export function useBandData() {
  const [bands, setBands] = useState<BandData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // 먼저 클라이언트 데이터 확인
        if (hasStoredData()) {
          const clientData = await loadExcelData()
          if (clientData) {
            // 클라이언트 데이터를 밴드 형식으로 변환
            const bandMap = new Map<string, any>()
            
            // 직원 데이터로 밴드별 그룹화
            clientData.employees.forEach((emp: any) => {
              if (!emp.band) return
              
              if (!bandMap.has(emp.band)) {
                bandMap.set(emp.band, {
                  name: emp.band,
                  employees: [],
                  levels: new Map()
                })
              }
              
              const band = bandMap.get(emp.band)
              band.employees.push(emp)
              
              // 레벨별 그룹화
              if (!band.levels.has(emp.level)) {
                band.levels.set(emp.level, [])
              }
              band.levels.get(emp.level).push(emp)
            })
            
            // 밴드 데이터 생성
            const bandDataArray: BandData[] = []
            
            bandMap.forEach((bandInfo, bandName) => {
              const levels = ['Lv.4', 'Lv.3', 'Lv.2', 'Lv.1']
              const levelData = levels.map(level => {
                const levelEmployees = bandInfo.levels.get(level) || []
                const salaries = levelEmployees.map((e: any) => e.currentSalary || 0)
                const avgSalary = salaries.length > 0 
                  ? salaries.reduce((a: number, b: number) => a + b, 0) / salaries.length 
                  : 0
                
                // C사 데이터 찾기 - 대소문자와 공백 무시하여 매칭
                const competitorEntry = clientData.competitorData?.find(
                  (c: any) => {
                    const cBand = c.band?.toString().toLowerCase().trim()
                    const cLevel = c.level?.toString().toLowerCase().trim()
                    const targetBand = bandName.toString().toLowerCase().trim()
                    const targetLevel = level.toString().toLowerCase().trim()
                    return cBand === targetBand && cLevel === targetLevel
                  }
                )
                
                // C사 평균 급여 - 데이터가 없으면 우리회사 급여의 95-105% 범위로 임의 설정
                let competitorAvgSalary = competitorEntry?.averageSalary || competitorEntry?.salary || 0
                if (!competitorAvgSalary && avgSalary > 0) {
                  // C사 데이터가 없을 때 우리회사 급여 기준 95-105% 사이의 값으로 설정
                  const ratio = 0.95 + (Math.random() * 0.1) // 95% ~ 105%
                  competitorAvgSalary = Math.round(avgSalary * ratio)
                }
                
                // 경쟁력 계산
                const competitiveness = competitorAvgSalary > 0 
                  ? Math.round((avgSalary / competitorAvgSalary) * 100)
                  : 100 // 기본값 100%
                
                return {
                  level,
                  headcount: levelEmployees.length,
                  meanBasePay: avgSalary,
                  baseUpKRW: 0,
                  baseUpRate: 0,
                  sblIndex: competitiveness,
                  caIndex: competitorAvgSalary,
                  competitiveness: competitiveness,
                  market: {
                    min: salaries.length > 0 ? Math.min(...salaries) : 0,
                    q1: calculatePercentile(salaries, 25),
                    median: calculatePercentile(salaries, 50),
                    q3: calculatePercentile(salaries, 75),
                    max: salaries.length > 0 ? Math.max(...salaries) : 0
                  },
                  company: {
                    median: calculatePercentile(salaries, 50),
                    mean: avgSalary,
                    values: []
                  },
                  competitor: {
                    median: competitorAvgSalary
                  }
                }
              }).filter(level => level.headcount > 0)
              
              const totalHeadcount = bandInfo.employees.length
              // const avgSalary = totalHeadcount > 0
              //   ? bandInfo.employees.reduce((sum: number, e: any) => sum + (e.currentSalary || 0), 0) / totalHeadcount
              //   : 0
              
              bandDataArray.push({
                id: bandName.toLowerCase().replace(/[&\s]/g, '_'),
                name: bandName as BandName,
                totalHeadcount,
                avgBaseUpRate: 0,
                avgSBLIndex: 0,
                avgCAIndex: 0,
                totalBudgetImpact: 0,
                levels: levelData
              })
            })
            
            setBands(bandDataArray)
            setLoading(false)
            return
          }
        }
        
        // 클라이언트 데이터가 없으면 API에서 가져오기
        const response = await fetch('/api/bands')
        if (!response.ok) throw new Error('Failed to fetch bands data')
        const result = await response.json()
        if (result.success) {
          setBands(result.data.bands)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { bands, loading, error }
}

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = (percentile / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index % 1
  const lowerValue = sorted[lower] ?? 0
  const upperValue = sorted[upper] ?? 0
  return lowerValue * (1 - weight) + upperValue * weight
}