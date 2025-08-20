const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing Electron build...');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const backupDir = path.join(__dirname, '..', 'src', 'app', '_api_backup');

// API 라우트를 임시로 백업
if (fs.existsSync(apiDir)) {
  // 기존 백업 삭제
  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true, force: true });
  }
  
  // Windows에서 권한 문제로 폴더 이동이 안 되면 폴더를 삭제
  try {
    // API 폴더 전체를 임시로 삭제 (빌드 후 복원)
    fs.cpSync(apiDir, backupDir, { recursive: true });
    fs.rmSync(apiDir, { recursive: true, force: true });
    console.log('✅ API routes temporarily removed');
  } catch (error) {
    console.error('Failed to prepare build:', error);
    process.exit(1);
  }
}