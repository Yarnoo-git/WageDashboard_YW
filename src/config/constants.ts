/**
 * 전역 상수 설정
 * 하드코딩 제거를 위한 중앙 관리
 */

// 간접비용 상수 (별도 export)
export const INDIRECT_COST = {
  RETIREMENT: 0.045,      // 퇴직금 4.5%
  INSURANCE: 0.113,       // 보험 11.3%
  PENSION: 0.020,         // 연금 2.0%
  TOTAL: 0.178           // 총계 17.8%
}

// 예산 관련 상수
export const BUDGET_CONFIG = {
  // 간접비용 참조
  INDIRECT_COST,
  
  // 기본값
  DEFAULT_BUDGET: 0,          // 기본 예산 (원)
  DEFAULT_WELFARE: 0,         // 기본 복리후생 (원)
  
  // 경고 임계값
  WARNING_THRESHOLD: 80,      // 예산 사용률 경고 임계 (%)
  DANGER_THRESHOLD: 100       // 예산 사용률 위험 임계 (%)
}

// 단위 변환 상수
export const UNITS = {
  WON: 1,                     // 원
  MAN_WON: 10000,             // 만원
  THOUSAND_MAN: 10000000,    // 천만원
  EOK_WON: 100000000          // 억원
}

// 평가등급 가중치 기본값
export const DEFAULT_PERFORMANCE_WEIGHTS = {
  ST: 1.5,  // S등급
  AT: 1.2,  // A등급
  OT: 1.0,  // O등급 (기준)
  BT: 0.8   // B등급
}

// Pay Zone 설정 기본값
export const PAY_ZONE_DEFAULTS = {
  MAX_ZONES: 8,               // 최대 Pay Zone 개수
  DEFAULT_ZONE: 1,            // 기본 Zone
  MIN_SALARY: 0,              // 최소 연봉
  MAX_SALARY: 999999999       // 최대 연봉 (상한선 없음)
}

// 조정 모드 설정
export const ADJUSTMENT_CONFIG = {
  // 최대/최소 인상률
  MIN_RATE: -10,              // 최소 인상률 (-10%)
  MAX_RATE: 20,               // 최대 인상률 (20%)
  
  // 기본 인상률
  DEFAULT_BASE_UP: 0,         // 기본 Base-up (%)
  DEFAULT_MERIT: 0,           // 기본 성과인상 (%)
  DEFAULT_ADDITIONAL: 0,      // 기본 추가인상 (%)
  
  // 스텝 크기
  RATE_STEP: 0.1,             // 인상률 조정 단위 (%)
  AMOUNT_STEP: 10             // 금액 조정 단위 (만원)
}

// UI 설정
export const UI_CONFIG = {
  // 테이블 페이지네이션
  DEFAULT_PAGE_SIZE: 50,      // 기본 페이지 크기
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100, 200],
  
  // 가상화 설정
  VIRTUAL_ROW_HEIGHT: 40,     // 가상 행 높이 (px)
  OVERSCAN_COUNT: 5,          // 버퍼링을 위한 추가 행 수
  
  // 애니메이션
  TRANSITION_DURATION: 200,   // 트랜지션 시간 (ms)
  DEBOUNCE_DELAY: 300,        // 디바운스 지연 (ms)
  
  // 차트 색상
  CHART_COLORS: {
    primary: '#3B82F6',       // 파란색
    success: '#10B981',       // 초록색
    warning: '#F59E0B',       // 노란색
    danger: '#EF4444',        // 빨간색
    info: '#6366F1'          // 보라색
  },
  
  // 평가등급 색상
  GRADE_COLORS: {
    ST: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
    AT: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
    OT: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
    BT: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' }
  }
}

// 파일 업로드 설정
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024,  // 50MB
  ALLOWED_EXTENSIONS: ['.xlsx', '.xls'],
  ALLOWED_MIME_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
}

// 로케일 설정
export const LOCALE_CONFIG = {
  DEFAULT_LOCALE: 'ko-KR',
  CURRENCY: '원',
  DATE_FORMAT: 'YYYY-MM-DD',
  NUMBER_FORMAT: {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }
}

// 스토리지 키
export const STORAGE_KEYS = {
  PAY_ZONE_CONFIG: 'payZoneConfig',
  ADJUSTMENT_MATRIX: 'adjustmentMatrix',
  USER_PREFERENCES: 'userPreferences',
  EXCEL_DATA: 'excelData',
  SCENARIOS: 'scenarios'
}

// API 엔드포인트 (필요 시)
export const API_ENDPOINTS = {
  // 현재는 클라이언트 전용이므로 비워둠
}

// 에러 메시지
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: '파일 크기가 50MB를 초과합니다.',
  INVALID_FILE_TYPE: '엑셀 파일만 업로드 가능합니다.',
  NO_DATA: '데이터가 없습니다. 엑셀 파일을 업로드해주세요.',
  CALCULATION_ERROR: '계산 중 오류가 발생했습니다.',
  SAVE_ERROR: '저장에 실패했습니다.',
  LOAD_ERROR: '데이터를 불러오는데 실패했습니다.',
  OVER_BUDGET: '예산을 초과했습니다.'
}

// 성공 메시지
export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: '파일이 성공적으로 업로드되었습니다.',
  DATA_SAVED: '데이터가 저장되었습니다.',
  SETTINGS_UPDATED: '설정이 업데이트되었습니다.',
  APPLIED: '변경사항이 적용되었습니다.',
  RESET: '초기화되었습니다.'
}