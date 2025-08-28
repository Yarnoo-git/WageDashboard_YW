import { notFound } from 'next/navigation'

// 정적 빌드를 위한 빈 경로 생성 (Electron 빌드용)
export async function generateStaticParams() {
  return []
}

export default function EmployeeDetailPage() {
  // Electron 빌드에서는 404 처리
  // 직원 상세 페이지는 /employees/detail?id=xxx 로 이동
  notFound()
}