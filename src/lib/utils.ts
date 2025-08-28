/**
 * 숫자를 한국식 통화 형식으로 포맷팅
 * @param value - 포맷할 숫자
 * @param unit - 단위 ('원', '만원', '억원', '백만원')
 * @param divisor - 커스텀 나누기 값 (백만원 등을 위해)
 * @returns 포맷된 문자열
 */
export function formatKoreanCurrency(value: number, unit: '원' | '만원' | '억원' | '백만원' = '원', divisor?: number): string {
  if (unit === '억원') {
    const billions = Math.round(value / 100000000)
    return `${billions.toLocaleString('ko-KR')}억 원`
  }
  
  if (unit === '백만원' && divisor) {
    const millions = Math.round(value / divisor)
    return `${millions.toLocaleString('ko-KR')}백만 원`
  }
  
  if (unit === '만원') {
    const tenThousands = Math.round(value / 10000)
    return `${tenThousands.toLocaleString('ko-KR')}만 원`
  }
  
  // 원 단위는 소수점 없이 정수로 표시
  return `${Math.round(value).toLocaleString('ko-KR')}원`
}

/**
 * 퍼센트 포맷팅
 * @param value - 퍼센트 값
 * @param decimals - 소수점 자리수
 * @returns 포맷된 문자열
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (!isFinite(value) || isNaN(value)) {
    return '0.0%'
  }
  // 정확한 반올림을 위해 Math.round 사용
  const multiplier = Math.pow(10, decimals)
  const rounded = Math.round(value * multiplier) / multiplier
  return `${rounded.toFixed(decimals)}%`
}

/**
 * 직급을 숫자로 변환
 * @param level - 직급 레벨
 * @returns 숫자 값
 */
export function levelToNumber(level: string): number {
  const match = level.match(/Lv\.(\d+)/)
  return match && match[1] ? parseInt(match[1]) : 0
}

/**
 * 인상액 계산
 * @param salary - 현재 급여
 * @param percentage - 인상률
 * @returns 인상액
 */
export function calculateIncreaseAmount(salary: number, percentage: number): number {
  return Math.round(salary * (percentage / 100))
}