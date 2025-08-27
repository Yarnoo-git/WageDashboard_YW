# New Wage Dashboard System Test Plan

## 완료된 리팩토링 사항

### 1. 핵심 아키텍처 개선
- ✅ **Pay Zone 구간 설정**: Level별 min/max 연봉 구간 설정으로 자동 Zone 할당
- ✅ **매트릭스 구조**: Band × Level × Grade 계층 구조 (평가등급이 항상 가로축)
- ✅ **중앙 설정 관리**: 모든 하드코딩 제거, constants.ts에 통합
- ✅ **상태 관리 재구성**: WageContextNew로 완전 재설계

### 2. 구현된 주요 기능
- ✅ **전체 일괄 조정**: 모든 셀에 동일한 평가등급별 비율 적용
- ✅ **Band × Level 매트릭스**: 개별 셀별 세밀한 조정 가능
- ✅ **Pay Zone 설정**: 구간별 자동 할당 및 수동 모드 지원
- ✅ **가중평균 시각화**: 계산 과정의 투명한 표시
- ✅ **Apply/Reset/Undo/Redo**: 완전한 변경사항 관리

### 3. 새로운 컴포넌트 구조
```
/src
├── /types
│   ├── adjustmentMatrix.ts   # 매트릭스 타입 정의
│   └── payZone.ts            # Pay Zone 타입 및 기본 설정
├── /services
│   └── payZoneService.ts     # Pay Zone 관리 서비스
├── /utils
│   └── matrixCalculations.ts # 통합 계산 로직
├── /config
│   └── constants.ts          # 중앙 설정 파일
├── /context
│   └── WageContextNew.tsx    # 새로운 Context
└── /components
    ├── /matrix
    │   ├── MatrixGrid.tsx          # Band × Level 그리드
    │   └── MatrixAdjustmentView.tsx # 셀별 조정 UI
    ├── /payzone
    │   └── PayZoneSettings.tsx     # Pay Zone 설정 UI
    └── /common
        ├── WeightedAverageVisualization.tsx # 가중평균 시각화
        └── ApplyResetBar.tsx               # 적용/취소 바
```

## 테스트 시나리오

### 1. 데이터 로드 테스트
1. 홈 페이지에서 Excel 파일 업로드
2. 시뮬레이션 페이지로 이동
3. 데이터가 정상적으로 로드되는지 확인

### 2. Pay Zone 설정 테스트
1. Pay Zone 설정 탭 클릭
2. Level별 min/max 구간 설정
3. 자동 재할당 결과 미리보기
4. 적용 후 직원들의 Pay Zone 변경 확인

### 3. 매트릭스 조정 테스트
1. 전체 조정 모드에서 평가등급별 비율 입력
2. Band × Level 모드에서 개별 셀 조정
3. 가중평균 계산 결과 확인
4. 예산 사용률 확인

### 4. Apply/Reset 테스트
1. 변경사항 입력
2. 미적용 상태에서 예상 결과 표시 확인
3. Apply 클릭으로 적용
4. Reset으로 취소
5. Undo/Redo 동작 확인

## 마이그레이션 상태

### 완료
- ✅ `/simulation` 페이지를 새 시스템으로 대체
- ✅ 구 컴포넌트들을 `_archived` 폴더로 이동
- ✅ 새로운 타입 정의 및 서비스 구현

### 진행 중
- 🔄 데이터 흐름 검증
- 🔄 TypeScript 오류 수정

### 예정
- ⏳ 다른 페이지들과의 통합
- ⏳ 성능 최적화
- ⏳ 사용자 피드백 반영

## 알려진 이슈

1. **TypeScript 오류**: 테스트 파일들의 타입 오류 (테스트는 실제 기능과 무관)
2. **데이터 호환성**: 기존 localStorage 데이터와의 호환성 확인 필요

## 다음 단계

1. 실제 Excel 데이터로 전체 기능 테스트
2. 사용자 피드백 수집 및 반영
3. 성능 최적화 (대량 데이터 처리)
4. 문서화 업데이트