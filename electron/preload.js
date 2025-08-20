/**
 * Preload 스크립트
 * 렌더러 프로세스와 메인 프로세스 사이의 안전한 통신을 위한 브릿지
 */

const { contextBridge, ipcRenderer } = require('electron')

// 렌더러 프로세스에 안전하게 노출할 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 버전 정보
  version: () => '1.2.1',
  
  // 플랫폼 정보
  platform: process.platform,
  
  // 파일 선택 다이얼로그
  selectFile: () => ipcRenderer.invoke('dialog:openFile'),
  
  // 파일 저장 다이얼로그
  saveFile: (data) => ipcRenderer.invoke('dialog:saveFile', data),
  
  // Excel 파일 처리 (Electron 환경용)
  processExcelFile: (arrayBuffer) => ipcRenderer.invoke('process:excel', arrayBuffer),
  
  // 파일 읽기 (바이너리)
  readFileAsBuffer: (filePath) => ipcRenderer.invoke('file:readAsBuffer', filePath),
  
  // 앱 정보
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  
  // 알림 표시
  showNotification: (title, body) => {
    new Notification(title, { body })
  },
  
  // 개발자 도구 토글
  toggleDevTools: () => ipcRenderer.send('toggle-dev-tools'),
  
  // 윈도우 컨트롤
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
})

// DOM 로드 완료 시 초기화
window.addEventListener('DOMContentLoaded', () => {
  // 버전 정보 표시 (있는 경우)
  const versionElement = document.getElementById('app-version')
  if (versionElement) {
    versionElement.innerText = '1.2.1'
  }
  
  console.log('Electron 앱으로 실행 중')
  console.log('플랫폼:', process.platform)
  console.log('Node.js:', process.versions.node)
  console.log('Electron:', process.versions.electron)
})