/**
 * 글로벌 에러 바운더리 컴포넌트
 * 애플리케이션 전체의 에러를 처리하고 복구 UI를 제공
 */

'use client'

import React, { Component, ReactNode } from 'react'
import { ERROR_MESSAGES } from '@/config/constants'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorCount: number
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅 (추후 에러 리포팅 서비스 연동 가능)
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))

    // 로컬스토리지에 에러 기록 (디버깅용)
    if (typeof window !== 'undefined') {
      const errorLog = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      }
      
      try {
        const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]')
        existingLogs.push(errorLog)
        // 최대 10개의 에러 로그만 유지
        if (existingLogs.length > 10) {
          existingLogs.shift()
        }
        localStorage.setItem('errorLogs', JSON.stringify(existingLogs))
      } catch (e) {
        console.error('Failed to save error log:', e)
      }
    }
  }

  handleReset = () => {
    // 상태 초기화
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })

    // 페이지 새로고침이 필요한 경우
    if (this.state.errorCount >= 3) {
      window.location.reload()
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state
    const { children, fallback } = this.props

    if (hasError) {
      // 커스텀 fallback이 제공된 경우
      if (fallback) {
        return <>{fallback}</>
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              문제가 발생했습니다
            </h1>
            
            <p className="text-gray-600 text-center mb-6">
              예기치 않은 오류가 발생했습니다. 불편을 드려 죄송합니다.
            </p>

            {/* 개발 환경에서만 에러 상세 정보 표시 */}
            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  에러 정보 (개발 모드)
                </h3>
                <pre className="text-xs text-red-600 overflow-auto max-h-40">
                  {error.toString()}
                  {errorInfo?.componentStack}
                </pre>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                다시 시도
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                페이지 새로고침
              </button>
            </div>

            {errorCount >= 2 && (
              <p className="text-sm text-gray-500 text-center mt-4">
                문제가 계속 발생하면 페이지를 새로고침해주세요.
              </p>
            )}
          </div>
        </div>
      )
    }

    return children
  }
}

// 특정 영역용 에러 바운더리 (더 세밀한 에러 처리가 필요한 경우)
export class SectionErrorBoundary extends ErrorBoundary {
  render() {
    const { hasError, error } = this.state
    const { children } = this.props

    if (hasError) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                이 섹션을 표시하는 중 문제가 발생했습니다
              </h3>
              {process.env.NODE_ENV === 'development' && error && (
                <p className="mt-1 text-xs text-yellow-700">
                  {error.message}
                </p>
              )}
              <button
                onClick={this.handleReset}
                className="mt-2 text-sm text-yellow-700 hover:text-yellow-800 underline"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      )
    }

    return children
  }
}

// 에러 바운더리 with Suspense
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }
        >
          <Component {...props} />
        </React.Suspense>
      </ErrorBoundary>
    )
  }
}