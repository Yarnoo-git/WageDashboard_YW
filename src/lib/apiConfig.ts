// API 라우트 설정
// Electron 빌드 시 API 라우트를 비활성화하기 위한 설정

const isElectronBuild = process.env.BUILD_TARGET === 'electron'

// 정적 export 모드에서는 dynamic을 사용할 수 없음
export const apiConfig = {
  dynamic: isElectronBuild ? undefined : 'force-dynamic' as const,
  runtime: isElectronBuild ? undefined : 'nodejs' as const,
}

export default apiConfig