import type { Metadata, Viewport } from 'next'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { WageContextNewProvider } from '@/context/WageContextNew'
import './globals.css'

export const metadata: Metadata = {
  title: '인건비 대시보드',
  description: '실시간 인상률 조정 및 인건비 배분 최적화 대시보드',
  keywords: '인건비, 급여, 임금, 대시보드, HR, 인사관리',
  authors: [{ name: '인사팀' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0ea5e9',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <WageContextNewProvider>
            <div className="flex flex-col min-h-screen">
              <Navigation />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </div>
          </WageContextNewProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}