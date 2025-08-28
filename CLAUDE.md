# Claude AI Development Guide

AI 개발자를 위한 WageDashboard 프로젝트 가이드

## 🎯 프로젝트 개요

인건비 대시보드는 한국 기업의 급여 관리 및 시뮬레이션을 위한 엔터프라이즈 웹 애플리케이션입니다. 5,000명+ 직원 데이터를 실시간으로 처리하며, 복잡한 급여 조정 시나리오를 시뮬레이션합니다.

### 핵심 특징
- **고성능 렌더링**: VirtualizedTable로 대용량 데이터 처리
- **클린 아키텍처**: Facade 패턴 + Context API
- **타입 안전성**: TypeScript strict mode
- **모듈화**: 모든 파일 300줄 이하

## 🏗️ 아키텍처 원칙

### 1. Context System (⚠️ 중요)
```typescript
// ✅ 올바른 사용
import { useWageContextNew } from '@/context/WageContextNew'

// ❌ 잘못된 사용 (삭제됨)
import { useWageContext } from '@/context/WageContext' // 존재하지 않음
import { useWageContextAdapter } from '@/hooks/useWageContextAdapter' // 삭제됨
```

### 2. Facade Pattern
```typescript
// 복잡한 Context 대신 Facade 사용
import { useWageSystemFacade } from '@/facades/WageSystemFacade'

const facade = useWageSystemFacade()
facade.updateBudget(30000000000, 0)
facade.adjustAllRates(3.2, 2.5)
```

### 3. 파일 크기 제한
- **Maximum**: 300줄 per 파일
- **Split Strategy**: 로직 분리 → 컴포넌트 분할 → 타입 추출
- **Folder Structure**: 분할 시 폴더 생성 + index.tsx

### 4. 상수 중앙화
```typescript
// ✅ 올바른 사용
import { PERFORMANCE_WEIGHTS, INDIRECT_COST } from '@/config/constants'

// ❌ 잘못된 사용
const INDIRECT_COST = 0.178 // 하드코딩 금지!
```

## 📁 프로젝트 구조

### 분할된 컴포넌트 구조
```
components/
├── dashboard/
│   └── GradeSalaryAdjustmentTable/
│       ├── index.tsx          # Main orchestrator (<300 lines)
│       ├── TableHeader.tsx    # Header component
│       ├── TableRow.tsx       # Row component
│       └── types.ts          # Type definitions
│
├── simulation/
│   └── PracticalRecommendation/
│       ├── index.tsx
│       ├── BandSelector.tsx
│       └── DisplayControls.tsx
│
└── ErrorBoundary.tsx         # Global error handling
```

### Context 구조
```
context/
└── WageContextNew/           # 통합 Context (WageContext 삭제됨)
    ├── index.tsx            # Provider & main logic
    ├── useWageActions.ts    # All action functions
    └── useWageComputed.ts   # All computed values
```

### Utils 구조
```
utils/
└── simulationHelpers/       # 분할된 계산 함수
    ├── index.ts            # Re-exports only
    ├── calculations.ts     # Basic calculations
    ├── bandRates.ts       # Band-related
    ├── payZoneRates.ts    # PayZone-related
    ├── gradeRates.ts      # Grade-related
    └── budget.ts          # Budget calculations
```

## 💻 개발 가이드라인

### 1. 컴포넌트 작성
```typescript
// ✅ Good: 작은 단위로 분할
// components/EmployeeTable/TableRow.tsx
export const TableRow: React.FC<Props> = React.memo(({ ... }) => {
  // 100줄 이하의 focused component
})

// ❌ Bad: 거대한 단일 파일
// components/EmployeeTable.tsx (600+ lines)
```

### 2. State 관리
```typescript
// ✅ Good: WageContextNew 사용
const { 
  originalData,
  computed,
  actions,
  hasChanges 
} = useWageContextNew()

// ❌ Bad: 컴포넌트 내부 복잡한 state
const [employees, setEmployees] = useState()
const [calculations, setCalculations] = useState()
// ... 20+ state variables
```

### 3. 성능 최적화
```typescript
// ✅ Good: Virtual rendering for large lists
import { VirtualizedEmployeeTable } from '@/components/employees/VirtualizedEmployeeTable'

// ✅ Good: Memoization
const MemoizedComponent = React.memo(Component)
const memoizedValue = useMemo(() => expensiveCalculation(), [deps])

// ❌ Bad: Rendering 5000+ rows directly
employees.map(emp => <tr key={emp.id}>...</tr>)
```

### 4. 에러 처리
```typescript
// ✅ Good: ErrorBoundary 사용
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// ✅ Good: try-catch with context
try {
  await processData()
} catch (error) {
  console.error('Processing failed:', error)
  // User-friendly error handling
}
```

## 🚀 성능 고려사항

### 렌더링 최적화
1. **VirtualizedTable**: 5,000+ rows는 반드시 가상화
2. **React.memo**: 불필요한 re-render 방지
3. **useMemo/useCallback**: 계산 비용이 큰 작업 memoize
4. **Code Splitting**: 동적 import 활용

### 데이터 처리
1. **IndexedDB**: 대용량 데이터는 IndexedDB 사용
2. **Web Workers**: CPU 집약적 작업 고려 (future)
3. **Batch Updates**: 여러 업데이트는 한 번에 처리
4. **Debounce/Throttle**: 사용자 입력 최적화

## 🧪 테스팅 전략

### 단위 테스트
```typescript
// calculations.test.ts
describe('calculateMerit', () => {
  it('should apply performance weight correctly', () => {
    const result = calculateMerit(50000000, 2.5, 'S')
    expect(result).toBe(1875000) // 50M * 2.5% * 1.5
  })
})
```

### 컴포넌트 테스트
```typescript
// AIRecommendationCard.test.tsx
describe('AIRecommendationCard', () => {
  it('should display correct rates', () => {
    render(<AIRecommendationCard baseUp={3.2} merit={2.5} />)
    expect(screen.getByText('3.2%')).toBeInTheDocument()
  })
})
```

## 🔥 일반적인 작업 패턴

### Excel 데이터 처리
```typescript
// hooks/useClientExcelData.ts
const { uploadExcel, data, loading, error } = useClientExcelData()

// 업로드 처리
const handleUpload = async (file: File) => {
  const result = await uploadExcel(file)
  if (result.success) {
    // Navigate to dashboard
  }
}
```

### 시나리오 관리
```typescript
// Context actions 사용
const { actions } = useWageContextNew()
actions.saveScenario('시나리오 1')
actions.loadScenario('scenario-id')
actions.compareScenarios(['id1', 'id2'])
```

### 매트릭스 조정
```typescript
// Band×Level×Grade 조정
actions.updateCellGradeRate('생산', 'Lv.3', 'S', {
  baseUp: 3.5,
  merit: 3.0,
  additional: 0
})
```

## ⚠️ 주의사항

### 삭제된 기능/파일
- ❌ `WageContext` (구 context system)
- ❌ `useWageContextAdapter` (adapter pattern)
- ❌ `_api_backup` 폴더
- ❌ `generateEmployeeData()` 함수
- ❌ 모든 Prisma 관련 코드

### SSR 호환성
```typescript
// ✅ Good: Browser API 체크
if (typeof window !== 'undefined') {
  localStorage.setItem('key', value)
}

// ❌ Bad: Direct usage
localStorage.setItem('key', value) // SSR에서 에러!
```

### 타입 안전성
```typescript
// ✅ Good: Strict types
interface Employee {
  id: string
  name: string
  salary: number
  // ... all fields typed
}

// ❌ Bad: any type
const processData = (data: any) => { ... }
```

## 📊 비즈니스 로직

### 평가 등급 체계
| 등급 | 가중치 | 코드에서 사용 |
|-----|--------|-------------|
| S | 1.5 | `PERFORMANCE_WEIGHTS.S` |
| A | 1.2 | `PERFORMANCE_WEIGHTS.A` |
| B | 1.0 | `PERFORMANCE_WEIGHTS.B` |
| C | 0.8 | `PERFORMANCE_WEIGHTS.C` |

### 간접비용 계산
```typescript
import { INDIRECT_COST } from '@/config/constants'

const indirectCost = directCost * INDIRECT_COST.TOTAL // 0.178
// 구성: 퇴직급여(4.5%) + 4대보험(11.3%) + 개인연금(2.0%)
```

### 예산 계산 공식
```typescript
// 최대인상가능폭 (중요!)
const maxIncrease = remainingBudget / (1 + INDIRECT_COST.TOTAL)
// 간접비용 포함하여 역산
```

## 🔄 마이그레이션 가이드

### WageContext → WageContextNew
```typescript
// Before
const { employees, updateEmployee } = useWageContext()

// After
const { originalData, actions } = useWageContextNew()
const employees = originalData.employees
// updateEmployee는 다른 패턴으로 처리
```

### 파일 분할 예시
```typescript
// Before: SingleFile.tsx (600+ lines)
// After: 
// SingleFile/
//   ├── index.tsx (200 lines)
//   ├── SubComponent1.tsx (150 lines)
//   ├── SubComponent2.tsx (150 lines)
//   └── types.ts (100 lines)
```

## 🛠️ 디버깅 팁

### Context 상태 확인
```typescript
const { originalData, computed, hasChanges } = useWageContextNew()
console.log('Current state:', { originalData, computed, hasChanges })
```

### 성능 프로파일링
```typescript
// React DevTools Profiler 사용
// Chrome DevTools Performance 탭 활용
// React.Profiler 컴포넌트 사용
```

### 에러 추적
```typescript
// ErrorBoundary에서 에러 로깅
// Sentry 등 에러 트래킹 서비스 연동 고려
```

## 📚 추가 리소스

- [Next.js Documentation](https://nextjs.org/docs)
- [React Context API](https://react.dev/reference/react/createContext)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS](https://tailwindcss.com/docs)
- [Recharts](https://recharts.org/en-US/)

---

**Important**: 이 문서는 프로젝트의 현재 상태를 반영합니다. 구조 변경 시 반드시 업데이트해주세요.