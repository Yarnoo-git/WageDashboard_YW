import { useState, useEffect } from 'react'
import { useWageContext } from '@/context/WageContext'

interface Metadata {
  departments: string[]
  bands: string[]
  levels: string[]
  ratings: string[]
  statistics?: {
    totalEmployees: number
    departmentCount: number
    levelDistribution: Array<{ level: string; count: number }>
    ratingDistribution: Array<{ rating: string; count: number }>
  }
}

interface UseMetadataReturn extends Metadata {
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

// 기본값 (폴백용)
const DEFAULT_METADATA: Metadata = {
  departments: ['생산', '영업', '생산기술', '경영지원', '품질보증', '기획', '구매&물류', 'Facility'],
  bands: ['생산', '영업', '생산기술', '경영지원', '품질보증', '기획', '구매&물류', 'Facility'],
  levels: ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4'],
  ratings: ['ST', 'AT', 'OT', 'BT']  // 실제 데이터에 맞게 수정
}

export function useMetadata(): UseMetadataReturn {
  const { contextEmployeeData } = useWageContext()
  const [metadata, setMetadata] = useState<Metadata>(DEFAULT_METADATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetadata = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 먼저 contextEmployeeData에서 동적으로 추출
      if (contextEmployeeData && contextEmployeeData.length > 0) {
        const departments = Array.from(new Set(contextEmployeeData.map(emp => emp.department).filter(Boolean))).sort()
        const bands = Array.from(new Set(contextEmployeeData.map(emp => emp.band).filter(Boolean))).sort()
        const levels = Array.from(new Set(contextEmployeeData.map(emp => emp.level).filter(Boolean))).sort()
        const ratings = Array.from(new Set(contextEmployeeData.map(emp => emp.performanceRating).filter(Boolean))).sort()
        
        if (departments.length > 0 || bands.length > 0 || levels.length > 0 || ratings.length > 0) {
          setMetadata({
            departments: departments.length > 0 ? departments : DEFAULT_METADATA.departments,
            bands: bands.length > 0 ? bands : DEFAULT_METADATA.bands,
            levels: levels.length > 0 ? levels : DEFAULT_METADATA.levels,
            ratings: ratings.length > 0 ? ratings : DEFAULT_METADATA.ratings
          })
          setLoading(false)
          return
        }
      }
      
      // API 호출 시도 (폴백)
      const response = await fetch('/api/metadata')
      const result = await response.json()
      
      if (result.success && result.data) {
        setMetadata(result.data)
      } else {
        // 에러 시에도 기본값 사용
        setMetadata(result.data || DEFAULT_METADATA)
        if (!result.success) {
          setError(result.error || 'Failed to fetch metadata')
        }
      }
    } catch (err) {
      console.error('Error fetching metadata:', err)
      setError('Failed to load metadata')
      // 에러 시 기본값 유지
      setMetadata(DEFAULT_METADATA)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetadata()
  }, [contextEmployeeData])  // contextEmployeeData가 변경될 때마다 업데이트

  return {
    ...metadata,
    loading,
    error,
    refresh: fetchMetadata
  }
}