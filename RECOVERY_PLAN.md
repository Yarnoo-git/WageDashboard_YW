# 🛠️ Recovery Plan - 수습 계획서

> 작성일: 2025-08-28  
> 작성자: Claude  
> 목적: 과도한 리팩토링으로 인한 문제점 수정 및 개선

## 📋 현황 분석

### 1. 삭제된 파일들 (총 6개)
```
- src/app/person/[id]/getStaticPaths.ts
- src/app/person/[id]/layout.tsx
- src/app/person/[id]/page.tsx
- src/app/person/detail/page.tsx
- src/app/person/page.tsx
- src/app/person/redirect.tsx
```

### 2. 주요 변경사항
| 구분 | 이전 | 현재 | 문제점 |
|------|------|------|--------|
| Context | WageContext.tsx | WageContextNew/index.tsx | 디렉토리 구조로 변경 (불필요) |
| Adapter | useWageContextAdapter | 제거됨 (주석만 남음) | 5개 파일에서 미정리 |
| PracticalRecommendation | 완전한 컴포넌트 | placeholder 텍스트 | 기능 완전 상실 |
| 데이터 추출 | 하드코딩 | getCached* 함수들 | 2곳에서만 사용 중 |
| 테스트 | 포함됨 | tsconfig에서 제외 | 테스트 불가능 |

### 3. 정상 작동 부분
- ✅ 개발 서버 (포트 3005)
- ✅ 프로덕션 빌드
- ✅ TypeScript strict mode
- ✅ 엑셀 데이터 기반 동적 추출 (excelDataUtils.ts)

## 📝 수습 계획

### Phase 1: 손실된 기능 복구 (우선순위: 🔴 높음)

#### 1.1 PracticalRecommendation 컴포넌트 복구
```typescript
// 현재 상태: placeholder
<td colSpan={5} className="px-4 py-8 text-center text-gray-500">
  실무 추천안 기능을 준비 중입니다.
</td>

// 복구 필요: 실제 데이터 렌더링
- practicalData 구조에 맞게 테이블 생성
- 레벨별/PayZone별/밴드별 계층 구조 구현
- 인상률 입력 필드 활성화
- 가중평균 계산 로직 연결
```

#### 1.2 useWageContextAdapter 정리
```typescript
// 영향받는 파일들:
- src/app/dashboard/page.tsx
- src/app/simulation/page.tsx
- src/app/bands/page.tsx
- src/app/simulation/hooks/useBandData.ts
- src/components/navigation.tsx

// 선택사항:
1. Adapter 패턴 복구 (하위 호환성)
2. 완전 제거 및 직접 사용
```

### Phase 2: 아키텍처 개선 (우선순위: 🟡 중간)

#### 2.1 동적 데이터 추출 활용 확대
```typescript
// 현재: 2곳에서만 사용
- statisticsService.ts
- excelService.ts

// 확대 필요:
- WageContextNew의 metadata 초기화
- 모든 컴포넌트에서 하드코딩 제거
- Band/Level/Grade 선택 UI에 활용
```

#### 2.2 디렉토리 구조 단순화
```bash
# 현재 (불필요하게 복잡)
/context/WageContextNew/
  ├── index.tsx
  ├── useWageActions.ts
  └── useWageComputed.ts

# 개선안
/context/
  ├── WageContextNew.tsx
  ├── hooks/
  │   ├── useWageActions.ts
  │   └── useWageComputed.ts
```

### Phase 3: 테스트 및 검증 (우선순위: 🟢 낮음)

#### 3.1 테스트 파일 복구
```json
// tsconfig.json 수정
"exclude": [
  "node_modules",
  "src/scripts/**/*",
  "src/lib/bandDataGenerator.ts"
  // 테스트 파일 제외 제거
]
```

#### 3.2 데이터 무결성 검증
- [ ] 엑셀 업로드 → 데이터 표시 플로우
- [ ] 인상률 계산 정확도
- [ ] 예산 계산 정확도
- [ ] 가중평균 계산 로직
- [ ] Pay Zone 분류 정확도

### Phase 4: 최종 정리

#### 4.1 코드 정리
- 불필요한 주석 제거
- 미사용 import 정리
- 일관된 네이밍 컨벤션
- TODO 주석 해결

#### 4.2 문서화
- CLAUDE.md 업데이트
- API 인터페이스 문서
- 컴포넌트 JSDoc 추가
- README.md 업데이트

## 🔧 실행 체크리스트

### 즉시 실행 (30분)
- [ ] PracticalRecommendation 테이블 복구
- [ ] useWageContextAdapter 주석 정리
- [ ] 빌드 테스트

### 단기 실행 (1시간)
- [ ] getCached* 함수 활용 확대
- [ ] WageContextNew metadata 통합
- [ ] 하드코딩 제거

### 중기 실행 (2시간)
- [ ] 디렉토리 구조 개선
- [ ] 테스트 파일 복구
- [ ] 테스트 케이스 작성

### 장기 실행 (지속적)
- [ ] 코드 품질 개선
- [ ] 성능 최적화
- [ ] 문서화 완성

## 📊 위험 요소

| 위험 | 영향도 | 가능성 | 대응 방안 |
|------|--------|--------|-----------|
| PracticalRecommendation 복구 실패 | 높음 | 낮음 | Git 이전 버전 참조 |
| Adapter 제거로 인한 버그 | 중간 | 중간 | 점진적 마이그레이션 |
| 테스트 복구 시 대량 실패 | 낮음 | 높음 | 우선순위 낮게 설정 |
| 성능 저하 | 중간 | 낮음 | 프로파일링 도구 활용 |

## 💡 교훈

1. **점진적 변경**: 한 번에 너무 많은 것을 바꾸지 말 것
2. **기능 유지**: 리팩토링 시에도 기능은 유지되어야 함
3. **테스트 우선**: 테스트를 제거하지 말고 수정할 것
4. **사용자 요구사항 우선**: "엑셀 데이터가 기초"라는 핵심 요구사항 충족
5. **롤백 계획**: 항상 되돌릴 수 있는 방법 확보

## 🚀 다음 단계

1. 이 문서를 기반으로 Phase 1부터 순차적 실행
2. 각 Phase 완료 후 검증 및 테스트
3. 문제 발생 시 이전 단계로 롤백
4. 완료된 항목 체크 및 문서 업데이트

---

*이 문서는 지속적으로 업데이트됩니다.*