/**
 * Pay Zone 관리 서비스
 * Pay Zone 구간 설정, 자동 할당, 저장/불러오기 등의 기능 제공
 */

import { Employee } from '@/types/employee'
import {
  PayZoneConfiguration,
  PayZoneAssignment,
  PayZoneAssignmentSummary,
  DEFAULT_PAY_ZONE_CONFIG,
  LevelPayZoneConfig
} from '@/types/payZone'

class PayZoneService {
  private static instance: PayZoneService
  private currentConfig: PayZoneConfiguration = DEFAULT_PAY_ZONE_CONFIG
  private readonly STORAGE_KEY = 'payZoneConfig'

  private constructor() {
    this.loadConfig()
  }

  static getInstance(): PayZoneService {
    if (!PayZoneService.instance) {
      PayZoneService.instance = new PayZoneService()
    }
    return PayZoneService.instance
  }

  /**
   * Pay Zone 설정 불러오기
   */
  private loadConfig(): void {
    try {
      // Check if running in browser environment
      if (typeof window === 'undefined') {
        return
      }
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const config = JSON.parse(stored)
        // Date 객체 복원
        config.lastUpdated = new Date(config.lastUpdated)
        this.currentConfig = config
      }
    } catch (error) {
      // Failed to load Pay Zone config
      this.currentConfig = DEFAULT_PAY_ZONE_CONFIG
    }
  }

  /**
   * Pay Zone 설정 저장
   */
  saveConfig(config: PayZoneConfiguration): void {
    try {
      this.currentConfig = config
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config))
    } catch (error) {
      // Failed to save Pay Zone config
      throw error
      throw error
    }
  }

  /**
   * 현재 Pay Zone 설정 가져오기
   */
  getConfig(): PayZoneConfiguration {
    return this.currentConfig
  }

  /**
   * 기본 설정으로 초기화
   */
  resetToDefault(): void {
    this.currentConfig = DEFAULT_PAY_ZONE_CONFIG
    this.saveConfig(DEFAULT_PAY_ZONE_CONFIG)
  }

  /**
   * 단일 직원의 Pay Zone 할당
   */
  assignPayZone(employee: Employee, config?: PayZoneConfiguration): number {
    const cfg = config || this.currentConfig

    // 수동 모드: 기존 엑셀값 사용
    if (cfg.mode === 'manual') {
      // payZone이 문자열일 수도 있음 ('Lv.1', 'Lv.2' 등)
      if (typeof employee.payZone === 'string') {
        // 'Lv.X' 형태에서 숫자 추출 시도
        const match = employee.payZone.match(/\d+/)
        return match ? parseInt(match[0]) : 1
      }
      return employee.payZone as number || 1
    }

    // 구간 모드: 연봉 기반 자동 할당
    const levelConfig = cfg.levelConfigs.find(
      lc => lc.level === employee.level
    )

    if (!levelConfig) {
      // No Pay Zone config for level, using default
      return 1
    }

    const salary = employee.currentSalary

    // 활성화된 구간에서 연봉에 맞는 Zone 찾기
    for (const range of levelConfig.ranges) {
      if (range.isActive && 
          salary >= range.minSalary && 
          salary <= range.maxSalary) {
        return range.zoneId
      }
    }

    // 구간에 속하지 않으면 기본값
    return levelConfig.defaultZone
  }

  /**
   * 전체 직원 Pay Zone 일괄 재할당
   */
  reassignAll(
    employees: Employee[],
    config?: PayZoneConfiguration
  ): PayZoneAssignmentSummary {
    const cfg = config || this.currentConfig
    const assignments: PayZoneAssignment[] = []
    const summary: PayZoneAssignmentSummary = {
      totalEmployees: employees.length,
      reassigned: 0,
      unchanged: 0,
      byLevel: {},
      details: []
    }

    // Level별 초기화
    const levels = [...new Set(employees.map(e => e.level))]
    levels.forEach(level => {
      summary.byLevel[level] = {
        total: 0,
        reassigned: 0,
        zoneDistribution: {}
      }
    })

    // 각 직원 처리
    for (const emp of employees) {
      const previousZone = typeof emp.payZone === 'string' 
        ? parseInt(emp.payZone.match(/\d+/)?.[0] || '1')
        : (emp.payZone as number || 1)
      
      const newZone = this.assignPayZone(emp, cfg)
      const isChanged = previousZone !== newZone

      const assignment: PayZoneAssignment = {
        employeeId: emp.id,
        employeeName: emp.name,
        level: emp.level,
        currentSalary: emp.currentSalary,
        previousZone,
        newZone,
        isChanged
      }

      assignments.push(assignment)

      // 요약 업데이트
      if (isChanged) {
        summary.reassigned++
      } else {
        summary.unchanged++
      }

      // Level별 통계
      const levelStats = summary.byLevel[emp.level]
      if (levelStats) {
        levelStats.total++
        if (isChanged) levelStats.reassigned++
        levelStats.zoneDistribution[newZone] = 
          (levelStats.zoneDistribution[newZone] || 0) + 1
      }
    }

    summary.details = assignments.filter(a => a.isChanged)
    return summary
  }

  /**
   * Level별 사용 가능한 Pay Zone 목록
   */
  getAvailableZones(level: string): number[] {
    const levelConfig = this.currentConfig.levelConfigs.find(
      lc => lc.level === level
    )
    return levelConfig?.allowedZones || [1, 2, 3, 4, 5]
  }

  /**
   * Pay Zone 구간 설정 업데이트
   */
  updateLevelConfig(level: string, config: LevelPayZoneConfig): void {
    const index = this.currentConfig.levelConfigs.findIndex(
      lc => lc.level === level
    )
    
    if (index !== -1) {
      this.currentConfig.levelConfigs[index] = config
      this.currentConfig.lastUpdated = new Date()
      this.saveConfig(this.currentConfig)
    } else {
      throw new Error(`Level ${level} not found in configuration`)
    }
  }

  /**
   * 모드 전환 (manual <-> range)
   */
  switchMode(mode: 'manual' | 'range'): void {
    this.currentConfig.mode = mode
    this.currentConfig.lastUpdated = new Date()
    this.saveConfig(this.currentConfig)
  }

  /**
   * Pay Zone 분포 통계
   */
  getDistributionStatistics(employees: Employee[]): {
    byLevel: { [level: string]: { [zone: number]: number } }
    total: { [zone: number]: number }
  } {
    const stats = {
      byLevel: {} as { [level: string]: { [zone: number]: number } },
      total: {} as { [zone: number]: number }
    }

    for (const emp of employees) {
      const zone = this.assignPayZone(emp)
      
      // 전체 통계
      stats.total[zone] = (stats.total[zone] || 0) + 1
      
      // Level별 통계
      if (!stats.byLevel[emp.level]) {
        stats.byLevel[emp.level] = {}
      }
      stats.byLevel[emp.level][zone] = 
        (stats.byLevel[emp.level][zone] || 0) + 1
    }

    return stats
  }
}

// Lazy initialization to avoid SSR issues
let _instance: PayZoneService | null = null

export const getPayZoneService = () => {
  if (!_instance) {
    _instance = PayZoneService.getInstance()
  }
  return _instance
}

export const payZoneService = typeof window !== 'undefined' ? PayZoneService.getInstance() : ({} as PayZoneService)
export default payZoneService