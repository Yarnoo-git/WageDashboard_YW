/**
 * Pay Zone 구간 설정 관련 타입 정의
 * Level별로 연봉 구간을 설정하여 자동으로 Pay Zone을 할당하는 시스템
 */

// Pay Zone 구간 정의
export interface PayZoneRange {
  zoneId: number          // Zone 번호 (1~5)
  minSalary: number       // 최소 연봉 (원 단위)
  maxSalary: number       // 최대 연봉 (원 단위)
  label?: string          // 선택적 라벨 (예: "Entry", "Junior", "Senior")
  isActive: boolean       // 해당 구간 사용 여부
}

// Level별 Pay Zone 설정
export interface LevelPayZoneConfig {
  level: string                      // "Lv.1", "Lv.2", "Lv.3", "Lv.4"
  ranges: PayZoneRange[]             // 해당 레벨의 Pay Zone 구간들
  defaultZone: number                // 구간에 속하지 않을 때 기본 Zone
  allowedZones: number[]             // 해당 레벨에서 사용 가능한 Zone 번호들
}

// 전체 Pay Zone 설정
export interface PayZoneConfiguration {
  mode: 'manual' | 'range'           // manual: 엑셀값 사용, range: 구간 기반 자동 할당
  levelConfigs: LevelPayZoneConfig[] // Level별 설정
  lastUpdated: Date                   // 마지막 수정 시간
  createdBy?: string                  // 설정 생성자
}

// Pay Zone 할당 결과
export interface PayZoneAssignment {
  employeeId: string
  employeeName: string
  level: string
  currentSalary: number
  previousZone?: number
  newZone: number
  isChanged: boolean
}

// Pay Zone 할당 요약
export interface PayZoneAssignmentSummary {
  totalEmployees: number
  reassigned: number
  unchanged: number
  byLevel: {
    [level: string]: {
      total: number
      reassigned: number
      zoneDistribution: { [zone: number]: number }
    }
  }
  details: PayZoneAssignment[]
}

// 기본 Pay Zone 설정 (이미지 참고)
export const DEFAULT_PAY_ZONE_CONFIG: PayZoneConfiguration = {
  mode: 'range',
  levelConfigs: [
    {
      level: 'Lv.4',
      ranges: [
        { zoneId: 5, minSalary: 109809604, maxSalary: 120000000, isActive: true },
        { zoneId: 4, minSalary: 99619203, maxSalary: 109809603, isActive: true },
        { zoneId: 3, minSalary: 89428802, maxSalary: 99619202, isActive: true },
        { zoneId: 2, minSalary: 79238401, maxSalary: 89428801, isActive: true },
        { zoneId: 1, minSalary: 0, maxSalary: 79238400, isActive: true }
      ],
      defaultZone: 1,
      allowedZones: [1, 2, 3, 4, 5]
    },
    {
      level: 'Lv.3',
      ranges: [
        { zoneId: 5, minSalary: 109809604, maxSalary: 120000000, isActive: true },
        { zoneId: 4, minSalary: 99619203, maxSalary: 109809603, isActive: true },
        { zoneId: 3, minSalary: 89428802, maxSalary: 99619202, isActive: true },
        { zoneId: 2, minSalary: 79238401, maxSalary: 89428801, isActive: true },
        { zoneId: 1, minSalary: 0, maxSalary: 79238400, isActive: true }
      ],
      defaultZone: 1,
      allowedZones: [1, 2, 3, 4, 5]
    },
    {
      level: 'Lv.2',
      ranges: [
        { zoneId: 3, minSalary: 72128001, maxSalary: 99999999, isActive: true },
        { zoneId: 2, minSalary: 62668001, maxSalary: 72128001, isActive: true },
        { zoneId: 1, minSalary: 0, maxSalary: 62668000, isActive: true }
      ],
      defaultZone: 1,
      allowedZones: [1, 2, 3]
    },
    {
      level: 'Lv.1',
      ranges: [
        { zoneId: 3, minSalary: 0, maxSalary: 99999999, isActive: false },
        { zoneId: 2, minSalary: 0, maxSalary: 99999999, isActive: true }
      ],
      defaultZone: 2,
      allowedZones: [2, 3]
    }
  ],
  lastUpdated: new Date()
}