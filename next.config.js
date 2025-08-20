/** @type {import('next').NextConfig} */

// 빌드 대상 확인 (Electron용 정적 빌드 vs Vercel/일반 빌드)
const isElectronBuild = process.env.BUILD_TARGET === 'electron'

const nextConfig = {
  // 빌드 출력 설정
  // - Electron: 'export' (정적 HTML)
  // - Vercel/일반: undefined (서버 사이드 렌더링)
  output: isElectronBuild ? 'export' : undefined,
  
  // 빌드 디렉토리 설정
  // - Electron: 'out' 폴더로 직접 출력
  // - Vercel/일반: '.next' 폴더 (기본값)
  distDir: isElectronBuild ? 'out' : '.next',
  
  // 이미지 최적화 설정
  // - Electron: 비활성화 (로컬 파일 시스템 사용)
  // - Vercel/일반: 활성화 (Next.js 이미지 최적화 사용)
  images: {
    unoptimized: isElectronBuild,
  },
  
  // 한글 폰트 최적화
  optimizeFonts: true,
  
  // 타입 체크 활성화 (에러 수정 후)
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // 실험적 기능
  experimental: {
    // Electron 빌드 시 불필요
    outputFileTracingRoot: isElectronBuild ? undefined : undefined,
  },
}

module.exports = nextConfig