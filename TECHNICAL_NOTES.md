# TECHNICAL_NOTES.md - 기술적 배포 주의사항

> ⚠️ **중요**: 이 문서는 WageDashboard 프로젝트의 기술적 배포 관련 주의사항을 담고 있습니다.
> 향후 업데이트나 배포 시 반드시 참고해야 할 기술적 제약사항과 해결 방법을 기록합니다.

## 📌 핵심 아키텍처 결정사항

### 데이터 저장 구조 (⚠️ 중대 변경 이력)

#### 변경 과정
1. **초기**: Prisma + SQLite 데이터베이스 구현
2. **문제 발생**: Vercel 배포 시 Prisma 빌드 실패
3. **최종 결정**: **Prisma 완전 제거**, 클라이언트 전용 구조로 전환

#### 현재 구조 (확정)
```typescript
// ✅ 현재 사용
- IndexedDB: 대용량 데이터 저장 (직원 데이터, Excel 파일)
- localStorage: 메타데이터, 시나리오, 설정값
- Excel 파일: 유일한 데이터 소스

// ❌ 사용 금지
- Prisma
- SQLite
- 서버 데이터베이스
- API 기반 데이터 저장
```

#### 주의사항
- **절대 Prisma 재도입 금지**: Vercel 서버리스 환경과 호환 불가
- 모든 데이터는 브라우저에 저장
- 서버는 단순 정적 호스팅만 담당

---

## 🚀 Vercel 배포 환경

### 환경 변수 처리
```typescript
// 임시 디렉토리 처리
const tempDir = process.env.VERCEL === '1' ? '/tmp' : path.join(process.cwd(), 'temp')

// 캐시 정책
if (cachedEmployeeData && process.env.VERCEL !== '1') {
  return cachedEmployeeData // 로컬에서만 캐시 사용
}
```

### 서버리스 제약사항
- **파일 시스템**: `/tmp` 디렉토리만 쓰기 가능 (512MB 제한)
- **실행 시간**: 최대 10초 (Pro: 60초)
- **메모리**: 1024MB (Pro: 3008MB)
- **상태 유지 불가**: 요청 간 메모리 공유 없음

### 배포 시 주의사항
```bash
# 배포 전 체크리스트
1. Prisma 관련 import 제거 확인
2. TypeScript 빌드 에러 확인
3. 환경 변수 체크 (process.env.VERCEL)
4. 파일명 대소문자 확인 (Linux 호환)
```

---

## 📝 TypeScript 관련

### 자주 발생하는 타입 에러 패턴

#### 1. null/undefined 처리
```typescript
// ❌ 에러 발생 패턴
const value = data.property // data가 null일 수 있음

// ✅ 올바른 처리
const value = data?.property ?? defaultValue
```

#### 2. 타입 단언이 필요한 케이스
```typescript
// contextLevelRates 타입 단언
const rates = contextLevelRates as {
  [key: string]: { baseUp: number; merit: number }
}

// localStorage 데이터 파싱
const scenarios = JSON.parse(stored) as Scenario[]
```

#### 3. Performance Rating 타입
```typescript
// 통일된 타입 사용
type PerformanceRating = 'ST' | 'AT' | 'OT' | 'BT'
// 절대 'S' | 'A' | 'O' | 'B' 사용 금지
```

---

## 📁 파일 시스템 관련

### 대소문자 민감도
```bash
# ❌ 문제 발생
Navigation.tsx  # Windows에서는 동작, Linux에서 실패

# ✅ 올바른 명명
navigation.tsx  # 모든 환경에서 동작
```

### Excel 파일 처리
```typescript
// 클라이언트에서 직접 처리
const reader = new FileReader()
reader.onload = (e) => {
  const workbook = XLSX.read(e.target?.result, { type: 'binary' })
  // IndexedDB에 저장
}
```

### 임시 파일 위치
- **로컬 개발**: `./temp/`
- **Vercel 배포**: `/tmp/`
- **브라우저**: IndexedDB (파일 시스템 미사용)

---

## ✅ 배포 전 체크리스트

### 필수 확인 사항
- [ ] **Prisma 제거 확인**
  ```bash
  grep -r "prisma" src/
  grep -r "@prisma" src/
  ```

- [ ] **TypeScript 빌드**
  ```bash
  npm run build
  # 에러 없이 완료되어야 함
  ```

- [ ] **환경 변수 체크**
  ```typescript
  // process.env.VERCEL 처리 확인
  // 하드코딩된 경로 없는지 확인
  ```

- [ ] **파일명 대소문자**
  ```bash
  # Git에서 대소문자 변경 감지
  git config core.ignorecase false
  ```

- [ ] **의존성 확인**
  ```json
  // package.json에 Prisma 관련 없는지 확인
  // devDependencies에도 확인
  ```

---

## 🔧 트러블슈팅

### 일반적인 문제와 해결

#### 1. "Module not found" 에러
- **원인**: 파일명 대소문자 불일치
- **해결**: 모든 import 경로 소문자 확인

#### 2. Vercel 빌드 실패
- **원인**: Prisma 잔재, TypeScript 에러
- **해결**: 
  ```bash
  npm run build  # 로컬에서 먼저 확인
  npx tsc --noEmit  # 타입 체크
  ```

#### 3. IndexedDB 용량 초과
- **원인**: 브라우저 저장 한계 (일반적으로 50MB)
- **해결**: 오래된 데이터 정리 로직 구현

#### 4. Excel 파일 읽기 실패
- **원인**: 시트명 불일치, 컬럼명 변경
- **해결**: employeeDataService.ts의 시트명/컬럼명 매핑 확인

---

## 📊 성능 최적화

### 클라이언트 사이드 최적화
- **대량 데이터 렌더링**: 가상화(virtualization) 필요 (현재 미구현)
- **IndexedDB 접근**: 비동기 처리 필수
- **Excel 파싱**: Web Worker 고려 (현재 메인 스레드)

### 번들 크기
- **현재 이슈**: xlsx 라이브러리가 번들 크기 증가
- **개선 방안**: dynamic import 고려
  ```typescript
  const XLSX = await import('xlsx')
  ```

---

## 📊 데이터 관리 정책

### Excel 데이터 필수 요구사항
```typescript
// ⚠️ 2025-08-20 변경: 테스트 데이터 생성 제거
// 이전: generateEmployeeData(4925) 
// 현재: Excel 파일 필수, 없으면 빈 배열 반환
```

### 데이터 소스 계층
1. **프로덕션**: Excel 파일만 사용 (필수)
2. **개발/테스트**: `npm run generate:test-excel` 사용 가능
3. **폴백**: 더 이상 자동 생성 없음, Excel 업로드 안내

### 제거된 기능들
- ❌ `generateEmployeeData()` 자동 호출
- ❌ 하드코딩된 4,925명 직원 생성
- ❌ `generateDummyExcel.ts`
- ❌ `generateCompetitorExcel.ts`
- ❌ `addCompetitorRate.ts`

### 유지되는 개발 도구
- ✅ `generateTestExcel.ts` - 개발 환경 전용
- ✅ `bandDataGenerator.ts` - 개발 환경 전용, process.env.NODE_ENV 체크

---

## 🚨 절대 하지 말아야 할 것들

1. **Prisma 재도입 시도** - Vercel과 호환 불가
2. **서버 데이터베이스 추가** - 클라이언트 전용 구조 유지
3. **파일명 대문자 사용** - Linux 호환성 문제
4. **환경 변수 하드코딩** - 배포 환경 차이 고려
5. **동기적 파일 시스템 접근** - 브라우저에서 불가능
6. **테스트 데이터 자동 생성 복원** - Excel 기반 원칙 위반

---

## 📚 참고 자료

- [Vercel Limits](https://vercel.com/docs/limits)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## 📝 변경 이력

- **2025-08-20**: 테스트 데이터 자동 생성 제거, Excel 필수화
- **2025-08-19**: 초기 문서 작성
- **2025-08-14**: Prisma 제거, 클라이언트 전용 전환

---

*Last Updated: 2025-08-20*
*Version: 1.3.0*