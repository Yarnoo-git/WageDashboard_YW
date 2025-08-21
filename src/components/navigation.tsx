'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useState, Fragment } from 'react'
import { useWageContext } from '@/context/WageContext'
import { ScenarioManager } from './ScenarioManager'
import * as XLSX from 'xlsx'

interface NavigationProps {
  children?: ReactNode
}

export function Navigation({ children }: NavigationProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showScenarioManager, setShowScenarioManager] = useState(false)
  
  const {
    scenarios,
    activeScenarioId,
    saveScenario,
    loadScenario,
    deleteScenario,
    renameScenario,
    contextEmployeeData,
    baseUpRate,
    meritRate,
    levelRates,
    bandFinalRates,
    payZoneRates,
    adjustmentMode
  } = useWageContext()

  // 홈 화면에서는 네비게이션 바를 숨김
  if (pathname === '/home' || pathname === '/') {
    return null
  }

  const navItems = [
    { href: '/dashboard', label: '예산 설정' },
    { href: '/simulation', label: '인상률 조정' },
    { href: '/person', label: '개인별 결과' },
  ]

  // Excel 내보내기 함수
  const handleExport = () => {
    if (!contextEmployeeData || contextEmployeeData.length === 0) {
      alert('내보낼 데이터가 없습니다.')
      return
    }

    // 페이지별 다른 데이터 준비
    let exportData: any[] = []
    let fileName = ''

    if (pathname === '/dashboard') {
      // 대시보드: 예산 요약 데이터
      exportData = [{
        '항목': '예산 정보',
        'Base-up(%)': baseUpRate,
        '성과인상률(%)': meritRate,
        '총인상률(%)': baseUpRate + meritRate,
        '조정모드': adjustmentMode
      }]
      fileName = '예산_요약.xlsx'
    } else if (pathname === '/simulation') {
      // 시뮬레이션: 인상률 조정 데이터
      if (adjustmentMode === 'simple') {
        exportData = Object.entries(levelRates).map(([level, rates]) => ({
          '직급': level,
          'Base-up(%)': rates.baseUp,
          '성과인상률(%)': rates.merit,
          '총인상률(%)': rates.baseUp + rates.merit
        }))
      } else if (adjustmentMode === 'advanced') {
        exportData = Object.entries(bandFinalRates).flatMap(([band, levels]) =>
          Object.entries(levels).map(([level, rates]) => ({
            '직군': band,
            '직급': level,
            'Base-up(%)': rates.baseUp,
            '성과인상률(%)': rates.merit,
            '총인상률(%)': rates.baseUp + rates.merit
          }))
        )
      } else if (adjustmentMode === 'expert') {
        exportData = Object.entries(payZoneRates).flatMap(([zone, bands]) =>
          Object.entries(bands).flatMap(([band, levels]) =>
            Object.entries(levels).map(([level, rates]) => ({
              'Pay Zone': zone,
              '직군': band,
              '직급': level,
              'Base-up(%)': rates.baseUp,
              '성과인상률(%)': rates.merit,
              '추가인상률(%)': rates.additional,
              '총인상률(%)': rates.baseUp + rates.merit + rates.additional
            }))
          )
        )
      }
      fileName = '인상률_조정.xlsx'
    } else if (pathname === '/person') {
      // 개인별 결과: 직원 데이터
      exportData = contextEmployeeData.map(emp => ({
        '사번': emp.employeeId,
        '이름': emp.name,
        '부서': emp.department,
        '직군': emp.band,
        '직급': emp.level,
        'Pay Zone': emp.payZone,
        '현재연봉': emp.currentSalary,
        '평가등급': emp.performanceRating,
        'Base-up(%)': levelRates[emp.level]?.baseUp || baseUpRate,
        '성과인상률(%)': levelRates[emp.level]?.merit || meritRate
      }))
      fileName = '개인별_결과.xlsx'
    }

    // Excel 파일 생성
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, fileName)
  }

  return (
    <Fragment>
      {/* 시나리오 매니저 팝업 */}
      {showScenarioManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <ScenarioManager
              scenarios={scenarios}
              activeScenarioId={activeScenarioId}
              onSave={saveScenario}
              onLoad={loadScenario}
              onDelete={deleteScenario}
              onRename={renameScenario}
              isNavigation={true}
            />
            <button
              onClick={() => setShowScenarioManager(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
      
      <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text mr-4 md:mr-8">
              인건비 대시보드
            </h1>
            {/* 데스크톱 네비게이션 */}
            <div className="hidden md:flex space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
                    pathname === item.href
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.href === '/dashboard' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {item.href === '/simulation' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )}
                  {item.href === '/person' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )}
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 시나리오 버튼 */}
            <button 
              onClick={() => setShowScenarioManager(!showScenarioManager)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm font-medium">시나리오</span>
            </button>
            
            {/* 내보내기 버튼 */}
            <button 
              onClick={() => handleExport()}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium">내보내기</span>
            </button>
            
            {/* 홈으로 돌아가기 버튼 */}
            <Link
              href="/home"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              홈
            </Link>
            
            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden py-2 border-t">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {/* 모바일에서 홈으로 돌아가기 */}
            <Link
              href="/home"
              onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors mt-2 border-t pt-4"
            >
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                홈으로 돌아가기
              </div>
            </Link>
            {/* 모바일에서 버튼들 */}
            {(pathname === '/dashboard' || pathname === '/simulation') && children && (
              <div className="flex flex-col gap-2 px-3 py-2 mt-2 border-t">
                {children}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
    </Fragment>
  )
}