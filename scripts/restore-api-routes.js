const fs = require('fs');
const path = require('path');

console.log('🔄 Restoring API routes...');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const backupDir = path.join(__dirname, '..', 'src', 'app', '_api_backup');

// 백업된 API 라우트 복원
if (fs.existsSync(backupDir)) {
  try {
    // 이미 api 폴더가 있으면 삭제
    if (fs.existsSync(apiDir)) {
      fs.rmSync(apiDir, { recursive: true, force: true });
    }
    // 백업 폴더를 원래 위치로 복사
    fs.cpSync(backupDir, apiDir, { recursive: true });
    // 백업 폴더 삭제
    fs.rmSync(backupDir, { recursive: true, force: true });
    console.log('✅ API routes restored');
  } catch (error) {
    console.error('⚠️ Could not restore API routes:', error);
  }
}