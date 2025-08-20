const fs = require('fs');
const path = require('path');

// 폴더 복사 함수
function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) {
    console.log(`Source folder does not exist: ${from}`);
    return;
  }
  
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    
    if (fs.lstatSync(fromPath).isFile()) {
      fs.copyFileSync(fromPath, toPath);
    } else {
      copyFolderSync(fromPath, toPath);
    }
  });
}

console.log('Post-build script: Copying static files...');

const projectRoot = path.join(__dirname, '..');
const standaloneDir = path.join(projectRoot, '.next', 'standalone');

// .next/static 폴더를 standalone/.next/static으로 복사
const staticSource = path.join(projectRoot, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');

if (fs.existsSync(staticSource)) {
  console.log('Copying .next/static...');
  copyFolderSync(staticSource, staticDest);
  console.log('✓ Static files copied');
} else {
  console.log('⚠ .next/static folder not found');
}

// public 폴더를 standalone/public으로 복사
const publicSource = path.join(projectRoot, 'public');
const publicDest = path.join(standaloneDir, 'public');

if (fs.existsSync(publicSource)) {
  console.log('Copying public folder...');
  copyFolderSync(publicSource, publicDest);
  console.log('✓ Public folder copied');
} else {
  console.log('⚠ Public folder not found');
}

console.log('Post-build script completed!');