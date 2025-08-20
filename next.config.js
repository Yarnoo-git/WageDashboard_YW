/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone 빌드 설정 (Electron 패키징용)
  output: 'standalone',
  
  // 이미지 최적화 비활성화 (Electron에서 필요)
  images: {
    unoptimized: true,
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
  
  // 실험적 기능 (standalone 최적화)
  experimental: {
    outputFileTracingRoot: undefined,
  },
}

module.exports = nextConfig