/**
 * 직원 데이터 서비스 - 통합 인터페이스
 * 기존 코드와의 호환성을 위한 래퍼
 */

// 새로운 서비스들로 재구성
export {
  loadEmployeeDataFromExcel,
  getAISettings,
  getCompetitorData,
  getCompetitorIncreaseRate,
  clearCache
} from './excelService'

export {
  getEmployeeData,
  updateEmployee,
  searchEmployees,
  calculateEmployeeSalary,
  uploadEmployeeExcel,
  exportCurrentData
} from './employeeService'

export {
  getLevelStatistics,
  getBandStatistics,
  getBandLevelDetails,
  getDashboardData,
  getDashboardSummary
} from './statisticsService'

// 타입 재내보내기
export type { AISettings, CompetitorData } from './excelService'