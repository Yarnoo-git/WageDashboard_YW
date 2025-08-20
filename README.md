# 인건비 대시보드 (Wage Dashboard)

실시간 급여 관리 및 인상률 시뮬레이션 웹 애플리케이션

## 개요

인건비 대시보드는 조직의 급여 데이터를 체계적으로 관리하고 인상률 시나리오를 시뮬레이션할 수 있는 웹 기반 도구입니다. Excel 데이터를 기반으로 실시간 분석과 의사결정을 지원합니다.

## 주요 기능

### 대시보드
- AI 기반 인상률 추천 시스템
- 예산 사용 현황 실시간 모니터링
- 직급별 차등 인상률 적용
- 경쟁사 대비 보상 수준 비교 분석

### Pay Band 분석
- 8개 직군별 급여 현황 분석
- 직군×직급 매트릭스 시각화
- 경쟁사 대비 포지셔닝 분석
- 급여 편차 및 분포 차트

### 직원 관리
- 대규모 직원 데이터 관리
- 실시간 검색 및 필터링
- 성과 등급별 가중치 적용
- Excel 내보내기 기능

### 시뮬레이션
- 다중 시나리오 생성 및 비교
- What-if 분석
- 시나리오별 예산 영향도 분석

## 시작하기

### 요구사항
- Node.js 18.0+
- npm 8.0+
- 모던 브라우저 (Chrome 90+, Edge 90+, Safari 14+, Firefox 88+)

### 설치

```bash
# 저장소 클론
git clone https://github.com/Yarnoo-git/WageDashboard_YW.git
cd WageDashboard_YW

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 프로덕션 실행
npm run start
```

## 데이터 구조

### Excel 파일 형식

애플리케이션은 다음 시트를 포함한 Excel 파일(.xlsx)을 요구합니다:

#### 직원기본정보
필수 컬럼:
- `사번`: 직원 고유 식별자
- `이름`: 직원명
- `부서`: 소속 부서
- `직군`: 8개 직군 중 하나 (생산, 영업, 생산기술, 경영지원, 품질보증, 기획, 구매&물류, Facility)
- `직급`: Lv.1 ~ Lv.4
- `직책`: 직책명
- `입사일`: YYYY-MM-DD 형식
- `현재연봉`: 원 단위 숫자
- `평가등급`: S/A/B/C

#### C사데이터
경쟁사 직군×직급별 평균 급여 데이터 (천원 단위)

#### AI설정
AI 추천 인상률 설정값:
- `항목`: Base-up(%), 성과인상률(%) 또는 성과 인상률(%), 총인상률(%) 또는 총 인상률(%)
- `값`: 해당 비율 값 (숫자)
- `설명`: 설명 텍스트 (선택사항)

**Note**: 항목명은 띄어쓰기가 있어도 없어도 모두 지원됩니다.

#### C사인상률
경쟁사 평균 인상률 정보

## 기술 스택

### Frontend
- **Framework**: Next.js 14.2 (App Router)
- **UI Library**: React 18.3
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 3.4 + Pretendard Font
- **Charts**: Recharts 3.1

### Data Management
- **Storage**: IndexedDB + localStorage (클라이언트 전용, 서버 DB 없음)
- **State**: React Context API (WageContext)
- **Excel Processing**: xlsx 라이브러리
- **PDF Export**: jsPDF

### Development
- **Package Manager**: npm
- **Linter**: ESLint
- **Formatter**: Prettier
- **Testing**: Jest + React Testing Library

### Deployment
- **Platform**: Vercel (서버리스)
- **Environment**: Node.js 20+

## 프로젝트 구조

```
src/
├── app/              # Next.js App Router 페이지
│   ├── api/         # API 라우트
│   ├── dashboard/   # 대시보드 페이지
│   ├── bands/       # Pay Band 분석
│   ├── employees/   # 직원 관리
│   └── simulation/  # 시뮬레이션
├── components/      # React 컴포넌트
├── context/         # 전역 상태 관리
├── hooks/          # 커스텀 훅
├── lib/            # 유틸리티 함수
├── services/       # 데이터 서비스 레이어
├── types/          # TypeScript 타입 정의
└── utils/          # 헬퍼 함수
```

## API 엔드포인트

### 데이터 관리
- `GET /api/employees` - 직원 목록 조회
- `GET /api/dashboard` - 대시보드 데이터
- `POST /api/upload` - Excel 파일 업로드
- `GET /api/bands` - Pay Band 데이터

### 시나리오 관리
- `GET /api/scenarios` - 시나리오 목록
- `POST /api/scenarios` - 시나리오 저장
- `DELETE /api/scenarios/:id` - 시나리오 삭제

## 성과 가중치

| 등급 | 가중치 | 설명 |
|------|--------|------|
| S | 1.5 | 최우수 |
| A | 1.2 | 우수 |
| B | 1.0 | 보통 |
| C | 0.8 | 개선필요 |

## 환경 변수

```bash
# .env.local
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 배포

### Vercel (권장)
프로젝트는 Vercel 자동 배포가 설정되어 있습니다. main 브랜치에 push하면 자동으로 배포됩니다.

### Docker
```bash
docker build -t wage-dashboard .
docker run -p 3000:3000 wage-dashboard
```

## 트러블슈팅

### Excel 업로드 실패
- 파일 형식이 .xlsx인지 확인
- 필수 시트가 모두 포함되었는지 확인
- 컬럼명이 정확히 일치하는지 확인

### 빌드 에러
```bash
# 캐시 삭제 후 재빌드
rm -rf .next node_modules
npm install
npm run build
```

### 메모리 부족
```bash
# Node.js 메모리 증가
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

## 성능 최적화

- 대용량 데이터는 가상화(virtualization) 적용
- 이미지 최적화 및 lazy loading
- 코드 스플리팅 자동 적용
- IndexedDB를 통한 클라이언트 캐싱

## 보안

- 모든 데이터는 클라이언트에만 저장
- 서버로 민감한 데이터 전송 없음
- Content Security Policy 적용
- XSS 방지 처리

## 최근 업데이트

### v1.2.1 (2025-08-20)
- generateEmployeeData() 자동 호출 제거 (Excel 업로드 필수화)
- 빌드 에러 수정 및 TypeScript 타입 개선
- 불필요한 문서 정리

### v1.2.0 (2025-08-18)
- Excel 데이터 읽기 유연성 개선 (띄어쓰기 변형 지원)
- 최대인상가능폭 계산 공식 수정
- 성과인상률 가중평균 표시 개선
- UI 텍스트 띄어쓰기 수정 (보상 경쟁력, 인상 재원 예산 현황 등)

## 버전 관리

[Semantic Versioning](https://semver.org/)을 따릅니다.

- v1.2.0 - Excel 데이터 처리 개선 및 계산 공식 수정
- v1.1.3 - README 개선 및 문서화
- v1.1.2 - 타입 에러 수정
- v1.1.1 - Vercel 빌드 이슈 해결
- v1.1.0 - 시나리오 관리 기능 추가
- v1.0.0 - 초기 릴리즈

## 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일 참조

## 지원

- Issues: [GitHub Issues](https://github.com/Yarnoo-git/WageDashboard_YW/issues)
- Email: losica97@naver.com