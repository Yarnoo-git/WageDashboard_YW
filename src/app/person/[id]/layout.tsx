// Electron 빌드 시 동적 라우팅 비활성화
export default function EmployeeDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Electron 빌드 환경에서는 404 페이지로 리다이렉트
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">페이지를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">
            Electron 환경에서는 직원 상세 페이지를 직접 접근할 수 없습니다.
          </p>
          <a href="/employees" className="text-primary-600 hover:text-primary-700">
            직원 목록으로 돌아가기
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// 정적 빌드를 위한 빈 경로 생성
export async function generateStaticParams() {
  return []
}