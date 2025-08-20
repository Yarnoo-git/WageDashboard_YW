// 정적 빌드를 위한 경로 생성
export async function generateStaticParams() {
  // Electron 빌드 시에는 빈 배열 반환 (클라이언트 사이드 라우팅 사용)
  if (process.env.BUILD_TARGET === 'electron') {
    return []
  }
  
  // Vercel 빌드 시에는 기존 로직 유지
  return []
}