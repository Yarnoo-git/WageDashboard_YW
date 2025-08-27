/**
 * WageSystemFacade - 임금 시스템의 복잡성을 숨기는 파사드
 * 
 * 파사드 패턴을 사용하여 복잡한 Context, Adapter, Calculator 등을
 * 단순한 인터페이스로 제공
 */

import { useWageContextNew } from '@/context/WageContextNew'
import { useWageContextAdapter } from '@/hooks/useWageContextAdapter'
import { Employee } from '@/types/employee'
import { BudgetUsage } from '@/utils/matrixCalculations'

/**
 * 임금 시스템 파사드 클래스
 * 모든 임금 관련 작업을 단순화된 메서드로 제공
 */
export class WageSystemFacade {
  private context: ReturnType<typeof useWageContextNew>
  private adapter: ReturnType<typeof useWageContextAdapter>
  
  constructor(
    context: ReturnType<typeof useWageContextNew>,
    adapter: ReturnType<typeof useWageContextAdapter>
  ) {
    this.context = context
    this.adapter = adapter
  }
  
  // ===== 예산 관리 =====
  
  /**
   * 예산 업데이트
   */
  updateBudget(total: number, welfare: number = 0): void {
    this.context.actions.updateBudget(total, welfare)
  }
  
  /**
   * 현재 예산 정보 가져오기
   */
  getBudget(): { total: number; welfare: number; available: number } {
    return this.context.config.budget
  }
  
  /**
   * 예산 사용량 가져오기
   */
  getBudgetUsage(): BudgetUsage {
    return this.context.computed.budgetUsage
  }
  
  // ===== 인상률 관리 =====
  
  /**
   * 전체 인상률 조정
   */
  adjustAllRates(baseUp: number, merit: number): void {
    const gradeRates: any = {}
    this.context.originalData.metadata.grades.forEach(grade => {
      gradeRates[grade] = { baseUp, merit, additional: 0 }
    })
    this.context.actions.updateAllCells(gradeRates)
  }
  
  /**
   * 특정 셀의 인상률 조정
   */
  adjustCellRate(band: string, level: string, grade: string, rates: any): void {
    this.context.actions.updateCellGradeRate(band, level, grade, rates)
  }
  
  /**
   * 현재 인상률 정보 가져오기
   */
  getRates(): { baseUpRate: number; meritRate: number; totalRate: number } {
    return {
      baseUpRate: this.adapter.baseUpRate,
      meritRate: this.adapter.meritRate,
      totalRate: this.adapter.baseUpRate + this.adapter.meritRate
    }
  }
  
  // ===== 직원 데이터 =====
  
  /**
   * 모든 직원 데이터 가져오기
   */
  getEmployees(): Employee[] {
    return this.context.originalData.employees
  }
  
  /**
   * 직원 통계 가져오기
   */
  getStatistics() {
    return {
      totalEmployees: this.context.computed.statistics.totalEmployees,
      averageSalary: this.context.computed.statistics.averageSalary,
      totalPayroll: this.context.computed.statistics.totalPayroll,
      competitiveness: this.context.computed.statistics.competitiveness
    }
  }
  
  // ===== 계산 =====
  
  /**
   * 가중평균 계산 결과
   */
  getWeightedAverage() {
    return this.context.computed.weightedAverage
  }
  
  /**
   * 예상 총 비용 계산
   */
  calculateTotalCost(): number {
    const usage = this.context.computed.budgetUsage
    return usage.totalCost
  }
  
  // ===== 상태 관리 =====
  
  /**
   * 변경사항 적용
   */
  applyChanges(): void {
    this.context.actions.applyPendingChanges()
  }
  
  /**
   * 변경사항 취소
   */
  discardChanges(): void {
    this.context.actions.discardPendingChanges()
  }
  
  /**
   * Undo
   */
  undo(): void {
    if (this.context.canUndo) {
      this.context.actions.undo()
    }
  }
  
  /**
   * Redo
   */
  redo(): void {
    if (this.context.canRedo) {
      this.context.actions.redo()
    }
  }
  
  /**
   * 변경사항 여부
   */
  hasChanges(): boolean {
    return this.context.hasChanges
  }
  
  // ===== 유틸리티 =====
  
  /**
   * 로딩 상태
   */
  isLoading(): boolean {
    return this.context.isLoading
  }
  
  /**
   * AI 설정 가져오기
   */
  getAISettings() {
    return this.context.originalData.aiSettings
  }
  
  /**
   * 메타데이터 가져오기
   */
  getMetadata() {
    return this.context.originalData.metadata
  }
}

/**
 * React Hook for using WageSystemFacade
 */
export function useWageSystemFacade(): WageSystemFacade {
  const context = useWageContextNew()
  const adapter = useWageContextAdapter()
  
  return new WageSystemFacade(context, adapter)
}