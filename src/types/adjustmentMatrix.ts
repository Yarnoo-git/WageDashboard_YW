/**
 * 조정 매트릭스 타입 정의
 * Band × Level 매트릭스 구조에서 각 셀은 평가등급별 인상률을 가짐
 */

// 기본 인상률 타입
export interface RateValues {
  baseUp: number      // Base-up 비율 (%)
  merit: number       // 성과 인상률 (%)
  additional: number  // 추가 인상 (비율 또는 금액)
}

// 평가등급별 인상률
export interface GradeRates {
  [grade: string]: RateValues  // ST, AT, OT, BT 등
}

// Pay Zone별 세부 조정 (선택적)
export interface PayZoneOverrides {
  [zoneId: number]: RateValues
}

// 단일 셀 (Band × Level 교차점)
export interface MatrixCell {
  band: string
  level: string
  
  // 평가등급별 인상률 (핵심)
  gradeRates: GradeRates
  
  // 평가등급 내 Pay Zone별 세부 조정 (선택적)
  payZoneOverrides?: {
    [grade: string]: PayZoneOverrides
  }
  
  // 통계 정보
  statistics: {
    employeeCount: number           // 총 인원
    averageSalary: number          // 평균 연봉
    totalSalaryAmount: number      // 총 연봉액
    gradeDistribution: {           // 평가등급별 인원 분포
      [grade: string]: number
    }
    payZoneDistribution?: {         // Pay Zone별 인원 분포
      [zoneId: number]: number
    }
  }
  
  // 가중평균 계산용
  weightedAverage: {
    baseUp: number
    merit: number
    additional: number
    total: number
    weightInMatrix: number          // 전체 매트릭스에서의 비중
  }
}

// 전체 매트릭스
export interface AdjustmentMatrix {
  // 매트릭스 기본 정보
  bands: string[]                    // 직군 목록
  levels: string[]                   // 레벨 목록
  grades: string[]                   // 평가등급 목록
  
  // 2차원 매트릭스 (band index × level index)
  cells: MatrixCell[][]
  
  // 빠른 조회를 위한 맵
  cellMap: {
    [band: string]: {
      [level: string]: MatrixCell
    }
  }
  
  // 집계된 평균값
  aggregated: {
    // 전체 평균
    total: {
      baseUp: number
      merit: number
      additional: number
      total: number
      employeeCount: number
      totalSalary: number
    }
    
    // 직군별 평균
    byBand: {
      [band: string]: {
        baseUp: number
        merit: number
        additional: number
        total: number
        employeeCount: number
        averageSalary: number
      }
    }
    
    // 레벨별 평균
    byLevel: {
      [level: string]: {
        baseUp: number
        merit: number
        additional: number
        total: number
        employeeCount: number
        averageSalary: number
      }
    }
    
    // 평가등급별 평균
    byGrade: {
      [grade: string]: {
        baseUp: number
        merit: number
        additional: number
        total: number
        employeeCount: number
        averageSalary: number
      }
    }
  }
  
  // 메타데이터
  metadata: {
    lastUpdated: Date
    version: number
    createdBy?: string
  }
}

// 조정 모드
export type AdjustmentMode = 
  | 'all'        // 전체 일괄 조정
  | 'matrix'     // Band × Level 별 조정
  | 'band'       // 특정 직군 전체
  | 'level'      // 특정 레벨 전체
  | 'cell'       // 특정 셀 (Band × Level)
  | 'payzone'    // Pay Zone 세부 조정

// 조정 탬플릿
export interface AdjustmentTemplate {
  id: string
  name: string                        // "성과중심", "안정적 인상" 등
  description: string
  mode: AdjustmentMode
  
  // 탬플릿 규칙
  rules: {
    // 평가등급별 가중치
    gradeMultiplier?: { [grade: string]: number }
    
    // Pay Zone 우선순위
    payZonePriority?: 'lower' | 'higher' | 'equal'
    
    // 직군별 우선순위
    bandPriority?: { [band: string]: number }
    
    // 레벨별 차등
    levelDifferential?: { [level: string]: number }
    
    // 기본 비율
    defaultRates?: RateValues
  }
  
  // 탬플릿 적용 예시
  example?: {
    before: RateValues
    after: RateValues
  }
}

// 가중평균 계산 세부 정보
export interface WeightedAverageDetail {
  path: string                        // "생산 × Lv.1 × ST"
  band: string
  level: string
  grade: string
  payZone?: number
  
  employeeCount: number
  averageSalary: number
  totalSalary: number
  
  rates: RateValues
  weight: number                      // 가중치 (0~1)
  contribution: number                 // 기여도 (%)
}

// 가중평균 계산 결과
export interface WeightedAverageResult {
  totalAverage: RateValues
  details: WeightedAverageDetail[]
  summary: {
    totalEmployees: number
    totalSalary: number
    averageSalary: number
    effectiveRate: number              // 실효 인상률
  }
}