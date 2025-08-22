/**
 * 직급 및 평가등급 설정 서비스
 * zone,grade 엑셀 파일에서 직급 순서와 평가등급 순서를 읽어옵니다.
 */

import * as XLSX from 'xlsx'

// 직급 정보 인터페이스
export interface LevelInfo {
  name: string          // 직급명 (예: Lv.1, Lv.2)
  order: number        // 순서 (1부터 시작)
  baseUp?: number      // 기본 인상률 (있을 경우)
  merit?: number       // 성과 인상률 (있을 경우)
}

// 평가등급 정보 인터페이스
export interface PerformanceRatingInfo {
  name: string         // 등급명 (예: ST, AT, OT, BT)
  order: number        // 순서 (1부터 시작)  
  weight: number       // 가중치 (예: 1.5, 1.2, 1.0, 0.8)
  distribution?: number // 분포 비율 (있을 경우)
}

// 전체 설정 정보
export interface GradeSettings {
  levels: LevelInfo[]                    // 직급 목록
  performanceRatings: PerformanceRatingInfo[]  // 평가등급 목록
  payZones?: number[]                    // Pay Zone 목록 (1~8)
  bands?: string[]                       // 직군 목록
}

// 캐시 변수
let cachedGradeSettings: GradeSettings | null = null

// 기본값 (엑셀 파일이 없을 경우 사용)
const DEFAULT_GRADE_SETTINGS: GradeSettings = {
  levels: [
    { name: 'Lv.1', order: 1, baseUp: 0, merit: 0 },
    { name: 'Lv.2', order: 2, baseUp: 0, merit: 0 },
    { name: 'Lv.3', order: 3, baseUp: 0, merit: 0 },
    { name: 'Lv.4', order: 4, baseUp: 0, merit: 0 }
  ],
  performanceRatings: [
    { name: 'ST', order: 1, weight: 1.5, distribution: 10 },
    { name: 'AT', order: 2, weight: 1.2, distribution: 30 },
    { name: 'OT', order: 3, weight: 1.0, distribution: 50 },
    { name: 'BT', order: 4, weight: 0.8, distribution: 10 }
  ],
  payZones: [1, 2, 3, 4, 5, 6, 7, 8],
  bands: ['생산', '영업', '생산기술', '경영지원', '품질보증', '기획', '구매&물류', 'Facility']
}

/**
 * zone,grade 엑셀 파일에서 설정 읽기
 */
export async function loadGradeSettingsFromExcel(file?: File): Promise<GradeSettings> {
  try {
    // 파일이 제공되지 않으면 기본 파일 경로에서 읽기 시도
    if (!file) {
      // 클라이언트 사이드에서 기본 파일 로드
      if (typeof window !== 'undefined') {
        try {
          // 기본 파일 경로들 시도
          const defaultPaths = [
            '/data/SBL_employee_data_zone,grade.xlsx',
            '/data/default_employee_data_zone,grade.xlsx'
          ]
          
          for (const path of defaultPaths) {
            try {
              const response = await fetch(path)
              if (response.ok) {
                const blob = await response.blob()
                file = new File([blob], path.split('/').pop() || 'settings.xlsx')
                console.log(`기본 설정 파일 로드 성공: ${path}`)
                break
              }
            } catch (err) {
              console.log(`파일 로드 실패: ${path}`)
            }
          }
          
          if (!file) {
            console.log('기본 설정 파일을 찾을 수 없음, 기본값 사용')
            return DEFAULT_GRADE_SETTINGS
          }
        } catch (error) {
          console.error('기본 파일 로드 실패:', error)
          return DEFAULT_GRADE_SETTINGS
        }
      } else {
        // 서버 사이드에서는 기본값 반환
        return DEFAULT_GRADE_SETTINGS
      }
    }
    
    // 엑셀 파일 읽기
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    const settings: GradeSettings = {
      levels: [],
      performanceRatings: [],
      payZones: [],
      bands: []
    }
    
    // 직급순서 시트 읽기
    if (workbook.SheetNames.includes('직급순서')) {
      const levelSheet = workbook.Sheets['직급순서']
      const levelData = XLSX.utils.sheet_to_json(levelSheet)
      
      console.log('직급순서 시트 데이터:', levelData)
      
      settings.levels = levelData.map((row: any, index: number) => ({
        name: row['직급명'] || row['직급'] || `Lv.${index + 1}`,
        order: row['순서'] || (index + 1),
        baseUp: row['Base-up(%)'] || row['기본인상률'] || 0,
        merit: row['Merit(%)'] || row['성과인상률'] || 0
      }))
    }
    
    // 평가등급순서 시트 읽기
    if (workbook.SheetNames.includes('평가등급순서')) {
      const ratingSheet = workbook.Sheets['평가등급순서']
      const ratingData = XLSX.utils.sheet_to_json(ratingSheet)
      
      console.log('평가등급순서 시트 데이터:', ratingData)
      
      settings.performanceRatings = ratingData.map((row: any, index: number) => ({
        name: row['등급명'] || row['등급'] || `등급${index + 1}`,
        order: row['순서'] || (index + 1),
        weight: row['가중치'] || row['Weight'] || 1.0,
        distribution: row['분포(%)'] || row['분포'] || 0
      }))
    }
    
    // Pay Zone 정보 읽기 (있을 경우)
    if (workbook.SheetNames.includes('PayZone')) {
      const zoneSheet = workbook.Sheets['PayZone']
      const zoneData = XLSX.utils.sheet_to_json(zoneSheet)
      
      settings.payZones = zoneData.map((row: any) => 
        row['Zone'] || row['PayZone'] || row['구간']
      ).filter(zone => zone != null)
    } else {
      // 기본 Pay Zone 설정 (1~8)
      settings.payZones = [1, 2, 3, 4, 5, 6, 7, 8]
    }
    
    // 직군 정보 읽기 (있을 경우)
    if (workbook.SheetNames.includes('직군')) {
      const bandSheet = workbook.Sheets['직군']
      const bandData = XLSX.utils.sheet_to_json(bandSheet)
      
      settings.bands = bandData.map((row: any) => 
        row['직군명'] || row['직군'] || row['Band']
      ).filter(band => band != null)
    } else {
      // 기본 직군 설정
      settings.bands = ['생산', '영업', '생산기술', '경영지원', '품질보증', '기획', '구매&물류', 'Facility']
    }
    
    // 캐시에 저장
    cachedGradeSettings = settings
    
    console.log('직급 및 평가등급 설정 로드 완료:', settings)
    return settings
    
  } catch (error) {
    console.error('설정 파일 로드 실패:', error)
    return DEFAULT_GRADE_SETTINGS
  }
}

/**
 * 캐시된 설정 가져오기
 */
export function getCachedGradeSettings(): GradeSettings | null {
  return cachedGradeSettings
}

/**
 * 캐시 초기화
 */
export function clearGradeSettingsCache() {
  cachedGradeSettings = null
  console.log('직급 및 평가등급 설정 캐시가 초기화되었습니다.')
}

/**
 * 동적 타입 생성용 유틸리티 함수들
 */

// 직급 목록을 문자열 배열로 반환
export function getLevelNames(settings?: GradeSettings): string[] {
  const s = settings || cachedGradeSettings || DEFAULT_GRADE_SETTINGS
  return s.levels.map(l => l.name)
}

// 평가등급 목록을 문자열 배열로 반환
export function getPerformanceRatingNames(settings?: GradeSettings): string[] {
  const s = settings || cachedGradeSettings || DEFAULT_GRADE_SETTINGS
  return s.performanceRatings.map(r => r.name)
}

// 평가등급 가중치 객체 반환
export function getPerformanceWeights(settings?: GradeSettings): { [key: string]: number } {
  const s = settings || cachedGradeSettings || DEFAULT_GRADE_SETTINGS
  const weights: { [key: string]: number } = {}
  s.performanceRatings.forEach(rating => {
    weights[rating.name] = rating.weight
  })
  return weights
}

// 직급별 기본 인상률 객체 반환
export function getLevelRates(settings?: GradeSettings): { 
  [level: string]: { baseUp: number; merit: number } 
} {
  const s = settings || cachedGradeSettings || DEFAULT_GRADE_SETTINGS
  const rates: { [level: string]: { baseUp: number; merit: number } } = {}
  s.levels.forEach(level => {
    rates[level.name] = {
      baseUp: level.baseUp || 0,
      merit: level.merit || 0
    }
  })
  return rates
}

// 직급별 상세 인상률 객체 반환 (초기값)
export function getDetailedLevelRates(settings?: GradeSettings): { 
  [level: string]: { 
    baseUp: number; 
    merit: number; 
    promotion: number; 
    advancement: number; 
    additional: number 
  } 
} {
  const s = settings || cachedGradeSettings || DEFAULT_GRADE_SETTINGS
  const rates: { 
    [level: string]: { 
      baseUp: number; 
      merit: number; 
      promotion: number; 
      advancement: number; 
      additional: number 
    } 
  } = {}
  
  s.levels.forEach(level => {
    rates[level.name] = {
      baseUp: level.baseUp || 0,
      merit: level.merit || 0,
      promotion: 0,
      advancement: 0,
      additional: 0
    }
  })
  
  return rates
}