# BUSINESS_CONSTANTS.md - 하드코딩된 비즈니스 상수 완전 가이드

> 📊 **중요**: 이 문서는 WageDashboard 프로젝트에 하드코딩된 모든 비즈니스 로직 상수를 상세히 기록합니다.
> 각 값의 의미, 사용 위치, 변경 시 영향을 명확히 설명하여 누구나 이해하고 유지보수할 수 있도록 작성되었습니다.

## 📌 문서 사용법

1. **찾고자 하는 상수가 있을 때**: Ctrl+F로 검색 (예: "17.8", "ST", "억원")
2. **수정이 필요할 때**: 해당 섹션의 "변경 시 영향" 확인 후 진행
3. **새로운 상수 추가 시**: 동일한 형식으로 문서 업데이트

---

## 🎯 평가등급 시스템 (Performance Rating)

### 등급 명칭 (⚠️ 절대 변경 금지)

| 등급코드 | 의미 | 설명 | 변경 이력 |
|---------|------|------|----------|
| **ST** | 최우수 (Superior Top) | 상위 10% 성과자 | S → ST (2025-08-18) |
| **AT** | 우수 (Above Top) | 상위 11-30% 성과자 | A → AT (2025-08-18) |
| **OT** | 보통 (On Target) | 중간 31-70% 성과자 | O/B → OT (2025-08-18) |
| **BT** | 미흡 (Below Target) | 하위 30% 성과자 | C → BT (2025-08-18) |

### 성과 가중치 (Performance Weights)

| 등급 | 가중치 | 적용률 | 설명 | 예시 (Merit 2.5% 기준) |
|------|--------|--------|------|------------------------|
| **ST** | 1.5 | 150% | 기준 대비 50% 추가 | 2.5% × 1.5 = 3.75% |
| **AT** | 1.2 | 120% | 기준 대비 20% 추가 | 2.5% × 1.2 = 3.00% |
| **OT** | 1.0 | 100% | 기준 그대로 적용 | 2.5% × 1.0 = 2.50% |
| **BT** | 0.8 | 80% | 기준 대비 20% 감소 | 2.5% × 0.8 = 2.00% |

**실제 코드 예시**:
```typescript
// src/context/WageContext.tsx:123-128
const PERFORMANCE_WEIGHTS = {
  ST: 1.5,
  AT: 1.2,
  OT: 1.0,
  BT: 0.8
}

// 적용 공식
const effectiveMeritRate = baseMeritRate * PERFORMANCE_WEIGHTS[employeeGrade]
const salaryIncrease = currentSalary * (effectiveMeritRate / 100)
```

**비즈니스 근거**:
- 성과 상위 10%는 50% 추가 보상으로 인재 유지
- 하위 30%는 20% 감소로 성과 개선 동기 부여
- 가중치 격차로 성과 차별화 명확히 구현

---

## 💰 간접비용 구성 (Indirect Costs)

### 간접비용 상세 내역

| 항목 | 비율 | 퍼센트 | 설명 | 법적 근거 |
|------|------|--------|------|----------|
| **퇴직급여충당분** | 0.045 | 4.5% | 근로자 퇴직급여 보장법 | 연봉의 1/12 (8.33%)의 약 절반 |
| **4대보험** | 0.113 | 11.3% | 사업주 부담분 | 건강보험, 국민연금, 고용보험, 산재보험 |
| **개인연금** | 0.020 | 2.0% | 기업 복지제도 | 퇴직연금 외 추가 지원 |
| **합계** | **0.178** | **17.8%** | 총 간접비용 | 직접 인건비의 17.8% 추가 발생 |

### 계산 공식 상세

```typescript
// 간접비용 계산 예시
const directCost = 100000000  // 직접 인건비 1억원
const indirectCost = directCost * 0.178  // 1,780만원
const totalCost = directCost + indirectCost  // 1억 1,780만원

// 역산 공식 (최대인상가능폭 계산)
const totalBudget = 200000000  // 총 예산 2억
const maxDirectCost = totalBudget / 1.178  // 1.698억 (직접비용)
// 1.178 = 1 + 0.178 (간접비용 포함 계수)
```

**실제 적용 코드**:
```typescript
// src/components/dashboard/BudgetUtilizationDetail.tsx:94-118
const indirectCostRatio = 0.178
const retirementCost = totalBasisAmount * 0.045
const insuranceCost = totalBasisAmount * 0.113
const pensionCost = totalBasisAmount * 0.020
const indirectTotal = retirementCost + insuranceCost + pensionCost
```

**변경 시 영향**:
- 예산 계산 전체에 영향 (과소/과대 계상 위험)
- 최대인상가능폭 계산 오류 발생
- 재무팀과 협의 필수

---

## 📊 직급 체계 (Level System)

### 직급 구분
```typescript
const LEVELS = ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4']
```

### 직급별 기본 구조
```typescript
const LEVEL_STRUCTURE = {
  'Lv.1': { order: 1, seniorityWeight: 1.0 },
  'Lv.2': { order: 2, seniorityWeight: 1.1 },
  'Lv.3': { order: 3, seniorityWeight: 1.2 },
  'Lv.4': { order: 4, seniorityWeight: 1.3 }
}
```

---

## 📂 데이터 소스 및 우선순위

### 데이터 로드 우선순위
1. **Excel 파일 (필수)**
   - 실제 운영 데이터
   - 직원기본정보, AI설정, C사데이터 시트
   - Excel 없으면 빈 데이터 표시

2. **샘플 Excel 파일**
   - public/data 폴더에 제공
   - 개발/테스트용 샘플 데이터
   - 실제 운영 시 실제 데이터로 교체

### 직군 및 직원 데이터
- **실제 운영**: Excel 파일에서 동적으로 읽음
- **Excel 없을 때**: 빈 화면 표시 (데이터 업로드 필요)
- **개발/테스트**: `npm run generate:test-excel`로 샘플 생성 가능

---

## 🧮 핵심 계산 공식

### 최대인상가능폭 계산
```typescript
// 남은 예산에서 간접비용을 고려한 직접비용 추출
const maxIncreasePossible = remainingBudget / 1.178
// 1.178 = 1 + 0.178 (간접비용률)
```

### Merit 인상률 적용 우선순위
```typescript
// 1. 가중평균이 있고 0보다 큰 경우
if (meritWeightedAverage && meritWeightedAverage > 0) {
  effectiveMeritRate = meritWeightedAverage
} 
// 2. 기본 Merit Rate 사용
else {
  effectiveMeritRate = meritRate
}
```

### TO-BE 급여 계산
```typescript
// 1단계: 적용할 인상률 결정
// 우선순위: 직군별 최종 인상률 > 직급별 인상률
const rates = bandFinalRates[band]?.[level] || levelRates[level]

// 2단계: 성과 가중치 적용
let effectiveMeritRate = rates.merit
if (performanceRating) {
  effectiveMeritRate *= PERFORMANCE_WEIGHTS[performanceRating]
}

// 3단계: 최종 계산
const totalRate = rates.baseUp + effectiveMeritRate
const toBeSalary = currentSalary * (1 + totalRate / 100)
```

---

## 📁 Excel 데이터 구조

### 필수 시트명
```typescript
const EXCEL_SHEETS = {
  employees: '직원기본정보',
  aiSettings: 'AI설정',
  competitorData: 'C사데이터',
  competitorRate: 'C사인상률'
}
```

### AI설정 시트 컬럼명 (띄어쓰기 변형 모두 지원)
```typescript
const AI_SETTINGS_COLUMNS = {
  baseUp: ['Base-up(%)'],
  merit: [
    '성과인상률(%)',
    '성과 인상률(%)',
    '성과인상률 (%)',
    '성과 인상률 (%)'
  ],
  total: [
    '총인상률(%)',
    '총 인상률(%)',
    '총인상률 (%)',
    '총 인상률 (%)'
  ],
  minRange: ['최소범위(%)'],
  maxRange: ['최대범위(%)']
}
```

### 직원 데이터 필수 필드
```typescript
interface EmployeeRecord {
  employeeId: string      // 사번
  name: string           // 이름
  level: string          // 직급 (Lv.1~4)
  band: string           // 직군
  department: string     // 부서
  currentSalary: number  // 현재급여
  performanceRating: string  // 평가등급 (ST/AT/OT/BT)
  hireDate: string       // 입사일
  position: string       // 직책
}
```

---

## 💵 통화 및 숫자 포맷

### 통화 단위 변환표

| 단위 | 한글 | 숫자값 | 변환 공식 | 사용 예시 |
|------|------|--------|----------|----------|
| **원** | 원 | 1 | value | 52,000,000원 |
| **천원** | 천원 | 1,000 | value / 1,000 | 52,000천원 |
| **만원** | 만원 | 10,000 | value / 10,000 | 5,200만원 |
| **백만원** | 백만원 | 1,000,000 | value / 1,000,000 | 52백만원 |
| **억원** | 억원 | 100,000,000 | value / 100,000,000 | 0.52억원 |

### 숫자 포맷팅 규칙

```typescript
// src/lib/utils.ts
export function formatKoreanCurrency(value: number, unit: string) {
  // 억원: 정수로 표시 (300억원)
  // 만원: 정수로 표시 (5,200만원)
  // 원: 천단위 구분 (52,000,000원)
  
  // 퍼센트: 소수점 1자리 (3.5%)
  // 인원수: 정수 (4,925명)
}
```

## 📈 급여 구간 설정

### 급여 범위 구간 (Salary Ranges)

| 구간 | 최소 (원) | 최대 (원) | 표시명 | 대상 직급 (예상) |
|------|-----------|-----------|--------|-----------------|
| 1 | 0 | 30,000,000 | ~3천만 | 신입, Lv.1 초반 |
| 2 | 30,000,000 | 40,000,000 | 3~4천만 | Lv.1 |
| 3 | 40,000,000 | 50,000,000 | 4~5천만 | Lv.1~2 |
| 4 | 50,000,000 | 60,000,000 | 5~6천만 | Lv.2 |
| 5 | 60,000,000 | 70,000,000 | 6~7천만 | Lv.2~3 |
| 6 | 70,000,000 | 80,000,000 | 7~8천만 | Lv.3 |
| 7 | 80,000,000 | 90,000,000 | 8~9천만 | Lv.3~4 |
| 8 | 90,000,000 | 100,000,000 | 9천만~1억 | Lv.4 |
| 9 | 100,000,000 | Infinity | 1억 이상 | Lv.4, 임원 |

### 근속년수 구간

| 구간 | 최소 (년) | 최대 (년) | 표시명 | 설명 |
|------|-----------|-----------|--------|------|
| 1 | 0 | 2 | 2년 미만 | 신입/경력 초반 |
| 2 | 2 | 5 | 2-5년 | 주니어 |
| 3 | 5 | 10 | 5-10년 | 시니어 |
| 4 | 10 | Infinity | 10년 이상 | 전문가 |

## 🔢 기타 상수

### 기본값 설정

| 항목 | 기본값 | 설명 | 변경 이력 |
|------|--------|------|----------|
| **Base-up Rate** | 0% | Excel 미업로드 시 | 3.2% → 0% |
| **Merit Rate** | 0% | Excel 미업로드 시 | 2.5% → 0% |
| **Total Budget** | 0원 | Excel 미업로드 시 | 300억 → 0원 |
| **Employee Count** | Excel 기반 | 실제 직원 수 사용 | 4,925명(테스트) → Excel 데이터 |

### 슬라이더 범위 제한

| 컴포넌트 | 최소값 | 최대값 | 단계 | 용도 |
|----------|--------|--------|------|------|
| **성과 가중치** | 0.5 | 2.0 | 0.1 | 평가등급별 가중치 조정 |
| **인상률** | 0% | 10% | 0.1% | Base-up/Merit 조정 |
| **예산** | 0억 | 1000억 | 1억 | 총 예산 설정 |

---

## ⚠️ 변경 금지 항목

### 절대 변경하면 안 되는 값들
1. **평가등급 명칭**: ST, AT, OT, BT
2. **성과 가중치**: 1.5, 1.2, 1.0, 0.8
3. **간접비용률**: 17.8% (0.178)
4. **계산식 분모**: 1.178 (최대인상가능폭)

### 신중히 변경해야 하는 값들
1. **간접비용 세부 구성**: 퇴직 4.5%, 보험 11.3%, 연금 2.0%
2. **직급 체계**: Lv.1~Lv.4
3. **직군 목록**: 8개 직군
4. **Excel 시트명**: 한글 명칭 유지

---

## 📝 변경 이력

### 주요 변경 사항
- **2025-08-18**: 평가등급 S/A/B/C → ST/AT/OT/BT 변경
- **2025-08-18**: 최대인상가능폭 계산 공식 수정
- **2025-08-18**: Excel 컬럼명 띄어쓰기 유연성 추가
- **2025-08-14**: 기본값 하드코딩 제거 (모두 0으로)

---

## 🎨 UI/UX 상수

### 차트 색상 코드

| 용도 | 색상 코드 | 색상명 | 미리보기 | Tailwind Class |
|------|-----------|--------|----------|----------------|
| **기본** | #8884d8 | 보라 | ![#8884d8](https://via.placeholder.com/15/8884d8/000000?text=+) | - |
| **주요** | #6366F1 | 인디고 | ![#6366F1](https://via.placeholder.com/15/6366F1/000000?text=+) | indigo-500 |
| **보조** | #8B5CF6 | 바이올렛 | ![#8B5CF6](https://via.placeholder.com/15/8B5CF6/000000?text=+) | violet-500 |
| **강조** | #EC4899 | 핑크 | ![#EC4899](https://via.placeholder.com/15/EC4899/000000?text=+) | pink-500 |
| **정보** | #3b82f6 | 파랑 | ![#3b82f6](https://via.placeholder.com/15/3b82f6/000000?text=+) | blue-500 |
| **성공** | #059669 | 녹색 | ![#059669](https://via.placeholder.com/15/059669/000000?text=+) | emerald-600 |

### 스타일 상수

| 속성 | 값 | 용도 | 위치 |
|------|-----|------|------|
| **strokeDasharray** | "3 3" | 차트 점선 그리드 | 모든 차트 컴포넌트 |
| **transition** | 200ms | 호버 효과 시간 | 버튼, 카드 |
| **rounded** | lg (8px) | 모서리 둥글기 | 카드, 버튼 |
| **shadow** | default | 그림자 효과 | 카드 컴포넌트 |
| **breakpoint** | md (768px) | 반응형 기준점 | 전체 레이아웃 |

---

## 🧮 계산 공식 모음

### 1. TO-BE 급여 계산

```typescript
// 단계별 계산 과정
1. 인상률 결정 (우선순위)
   - 1순위: bandFinalRates[band][level]  // 직군별 최종 인상률
   - 2순위: levelRates[level]             // 직급별 인상률
   - 3순위: baseUpRate + meritRate        // 기본 인상률

2. 성과 가중치 적용
   effectiveMeritRate = meritRate * performanceWeight[rating]

3. 최종 계산
   totalRate = baseUpRate + effectiveMeritRate
   toBeSalary = Math.round(currentSalary * (1 + totalRate / 100))
```

### 2. 예산 계산

```typescript
// 직접비용
directCost = totalSalary * (baseUpRate + meritRate) / 100

// 간접비용
indirectCost = directCost * 0.178

// 총 예산
totalBudget = directCost + indirectCost

// 최대인상가능폭 (역산)
remainingBudget = totalBudget - usedCost
maxIncreasePossible = remainingBudget / 1.178
```

### 3. 경쟁력 지수

```typescript
// SBL/CA 지수
competitiveness = (ourAvgSalary / competitorAvgSalary) * 100

// 해석
// > 100: 경쟁사 대비 우위
// = 100: 경쟁사와 동등
// < 100: 경쟁사 대비 열위
```

---

## 📋 유지보수 가이드

### 상수 변경 절차

1. **영향도 분석**
   - 이 문서에서 "변경 시 영향" 섹션 확인
   - 관련 파일 목록 확인
   - 연관된 계산 로직 파악

2. **테스트 체크리스트**
   ```bash
   □ TypeScript 빌드 확인 (npm run build)
   □ 계산 로직 단위 테스트
   □ UI 표시 확인
   □ Excel 데이터 연동 테스트
   □ 시나리오 저장/로드 테스트
   ```

3. **변경 기록**
   - 이 문서의 "변경 이력" 업데이트
   - Git 커밋 메시지에 상수 변경 명시
   - CLAUDE.md 업데이트 (필요시)

### 새 상수 추가 시

1. **위치 선정**
   - 비즈니스 로직: 해당 도메인 파일
   - UI 관련: 컴포넌트 또는 tailwind.config
   - 전역 사용: context 또는 constants 파일

2. **문서화**
   - 이 문서에 추가
   - 의미, 용도, 기본값 명시
   - 사용 위치 기록

3. **타입 정의**
   - TypeScript 타입 추가
   - JSDoc 주석 작성

---

## 🔍 파일별 상수 위치 빠른 참조

### 핵심 파일
- **WageContext.tsx**: 평가등급, 가중치, 직급별 인상률
- **BudgetUtilizationDetail.tsx**: 간접비용 계산
- **utils.ts**: 통화 포맷, 계산 함수
- **bandDataGenerator.ts**: 직군별 특성, 비율

### 컴포넌트별
- **PerformanceWeightModal**: 가중치 슬라이더 범위
- **BudgetCard**: 예산 계산 로직
- **차트 컴포넌트들**: 색상 코드, 스타일

### 데이터 처리
- **employeeDataService.ts**: Excel 시트명, 컬럼 매핑
- **clientStorage.ts**: IndexedDB 키값
- **hooks/useAnalyticsData.ts**: 급여/근속 구간

---

*Last Updated: 2025-08-19*
*Version: 2.0.0 (상세 버전)*
*이전 버전 대비: 누락 상수 추가, 표 형식 개선, 예시 코드 보강*