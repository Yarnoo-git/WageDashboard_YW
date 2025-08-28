# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Wage Dashboard (인건비 대시보드) project for displaying real-time salary metrics, compensation planning, and wage distribution analysis. The dashboard is designed to show Korean wage data with various visualizations and metrics.

## 🚨 Major Restructuring Plan (2025-08-21)

### Core Changes
- **Pay Zone Integration**: Adding Pay Zone field (1-8) for salary level grouping
- **4-Page Structure**: Upload → Dashboard → Simulation → Person
- **Centralized Control**: All adjustments moved to Simulation page
- **Hierarchical Adjustment**: 3-level system (Simple → Advanced → Expert)

## Current Architecture

### Technology Stack (실제 구현)
- **Frontend Framework**: Next.js 14.2 (App Router)
- **UI Library**: React 18.3 + TypeScript 5
- **Styling**: TailwindCSS 3.4 with Pretendard font
- **Charts**: Recharts 3.1
- **Data Storage**: Client-side only (IndexedDB + localStorage)
- **File Processing**: xlsx for Excel, jsPDF for PDF export
- **Testing**: Jest + React Testing Library

### Data Flow Architecture
1. **Client-Side First**: All data processing happens in the browser
2. **No Database**: Uses IndexedDB for persistent storage
3. **Excel-Based**: Primary data source is Excel file upload
4. **Server-Less**: Minimal API routes, mainly for data transformation

## Key Features (현재 구현 상태)

1. **AI-Based Wage Planning** (AI 제안 적정 인상률)
   - Base-up/Merit percentages loaded from Excel
   - Default values: 0% (changed from hardcoded 3.2%/2.5%)
   - Dynamic calculation based on uploaded data
   - Flexible Excel column name matching (handles spacing variations)

2. **Budget Management** (예산 관리)
   - Total budget from Excel data or manual input
   - Default: 0원 (changed from hardcoded 300억원)
   - Indirect costs: 17.8% (retirement 4.5% + insurance 11.3% + pension 2.0%)
   - Maximum possible increase calculation (최대인상가능폭)

3. **Performance Weights** (평가 가중치)
   - S: 1.5, A: 1.2, B: 1.0, C: 0.8 (필수 유지)
   - Applied to merit increase calculations

4. **Data Sources**
   - Employee data from Excel
   - Competitor (C사) data from Excel
   - All calculations done client-side
   - Supports various Excel column name formats

## Development Setup Commands

```bash
# Install dependencies
npm install

# Development
npm run dev          # Start development server (http://localhost:3000)

# Build & Production
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Excel Generation (for testing)
npm run generate:excel      # Generate dummy Excel file
npm run generate:test-excel # Generate test Excel file
```

## Project Structure

```
/src
├── /app              # Next.js App Router pages
│   ├── /bands       # Pay band analysis
│   ├── /dashboard   # Main dashboard page
│   ├── /employees   # Employee management (VirtualizedTable 적용)
│   └── /simulation  # Wage simulation
├── /components      # React components
│   ├── /dashboard   # Dashboard-specific components
│   ├── /band        # Pay band components
│   ├── /employees   # VirtualizedEmployeeTable 컴포넌트
│   ├── /charts      # Chart components
│   └── ErrorBoundary.tsx # 글로벌 에러 핸들링
├── /config          # 설정 파일
│   └── constants.ts # 중앙화된 상수 (간접비용, 성과 가중치 등)
├── /context         # React Context (WageContextNew 통합)
│   └── WageContextNew.tsx # 통합된 새 Context 시스템
├── /hooks           # Custom hooks
│   └── useClientExcelData.ts # Excel 데이터 처리
├── /lib             # Utility functions
│   └── clientStorage.ts # IndexedDB management
├── /services        # Data services
│   └── employeeDataService.ts # Excel data processing
└── /utils           # Calculation utilities
    └── matrixCalculations.ts # 매트릭스 계산 통합
```

## Data Flow

1. **Excel Upload** → `useClientExcelData` hook
2. **IndexedDB Storage** → `clientStorage.ts`
3. **Context Distribution** → `WageContextNew` (통합 Context)
4. **Component Rendering** → Dashboard/Bands/Employees pages
5. **Export** → PDF/Excel generation

## Important Implementation Notes

- **No Server Database**: All data stored in browser (IndexedDB)
- **Excel as Primary Source**: All data comes from Excel upload
- **Dynamic Calculations**: All values calculated from Excel data
- **Zero Defaults**: Most values default to 0 until Excel is uploaded
- **Client-Side Processing**: Heavy calculations done in browser

## Korean Language Support

- UTF-8 encoding throughout
- Pretendard font for Korean text
- Number formatting: `toLocaleString('ko-KR')`
- Currency: 원, 만원, 억원 units

## Recent Improvements (2025-08-28)

### 성능 최적화
- ✅ **VirtualizedEmployeeTable 적용**: 4,925명+ 직원 데이터 가상화 렌더링
- ✅ **Error Boundary 구현**: 글로벌 에러 처리 시스템 추가

### 코드 품질 개선
- ✅ **Context 통합**: WageContext → WageContextNew로 완전 마이그레이션
- ✅ **하드코딩 제거**: 모든 상수를 constants.ts로 중앙화
- ✅ **TypeScript 엄격 모드**: 타입 안전성 강화
- ✅ **미사용 코드 제거**: 6개 미사용 파일 삭제
  - _api_backup 폴더 전체 제거
  - 구 Context 시스템 제거
  - 미사용 hooks 및 services 제거

## Current Limitations

1. **Test Coverage**: 테스트 커버리지 부족
2. **Performance Monitoring**: 성능 모니터링 시스템 미구축

## Environment Variables (Optional)

```bash
# .env.local (example)
NEXT_PUBLIC_BASE_UP_PERCENTAGE=0
NEXT_PUBLIC_MERIT_INCREASE_PERCENTAGE=0
NEXT_PUBLIC_TOTAL_BUDGET=0
NEXT_PUBLIC_TOTAL_EMPLOYEES=0
```

Note: Currently not implemented, values are loaded from Excel

## Pages Overview

### 1. Home (`/home`)
- Excel file upload interface
- Stored data management
- Entry point to dashboard

### 2. Dashboard (`/dashboard`)
- AI recommendation display
- Budget status monitoring
- Level-wise salary adjustment
- Industry comparison

### 3. Pay Bands (`/bands`)
- 8 bands (생산, 영업, 생산기술, 경영지원, 품질보증, 기획, 구매&물류, Facility)
- Band×Level matrix analysis
- Competitiveness index (SBL/CA)
- Market positioning

### 4. Employees (`/employees`)
- Employee list with filters
- Individual salary calculations
- Performance weight management
- Export functionality

### 5. Simulation (`/simulation`)
- What-if analysis
- Scenario comparison
- Independent mode for testing

## Key Algorithms

### Merit Calculation
```typescript
merit = baseSalary * meritRate * performanceWeight[rating]
```

### Budget Calculation
```typescript
// constants.ts에서 정의된 상수 사용
import { INDIRECT_COST } from '@/config/constants'

directCost = totalSalary * (baseUp + merit) / 100
indirectCost = directCost * INDIRECT_COST.TOTAL
totalBudget = directCost + indirectCost

// 최대인상가능폭 계산 (Fixed)
usedDirectCost = aiTotalBudget + promotionTotal
usedIndirectCost = usedDirectCost * INDIRECT_COST.TOTAL
totalUsedCost = usedDirectCost + usedIndirectCost
remainingBudget = totalBudget - totalUsedCost
maxIncreasePossible = remainingBudget / (1 + INDIRECT_COST.TOTAL)  // 간접비용 포함 역산
```

### Competitiveness Index
```typescript
competitiveness = (ourAvgSalary / competitorAvgSalary) * 100
```

## Excel File Requirements

### AI설정 Sheet
The following column names are supported (with or without spaces):
- `Base-up(%)`
- `성과인상률(%)` or `성과 인상률(%)`
- `총인상률(%)` or `총 인상률(%)`
- `최소범위(%)`
- `최대범위(%)`

### Known Issues (Resolved)

1. **Excel Data Reading** - Fixed flexible column name matching for spacing variations
2. **Maximum Increase Calculation** - Fixed formula to correctly calculate from remaining budget
3. **Merit Rate Display** - Shows weighted average when available, falls back to base rate