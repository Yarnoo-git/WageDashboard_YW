const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const isDev = process.env.NODE_ENV === 'development'

let mainWindow
let serverProcess = null

function createWindow() {
  // 메인 윈도우 생성
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: '인건비 대시보드',
    // icon: path.join(__dirname, 'icon.ico'),  // 아이콘 파일 생성 후 주석 해제
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: false // 개발자 도구 완전 비활성화
    },
    show: false, // 로딩 완료 후 표시
  })

  // 메뉴바 설정
  const menu = Menu.buildFromTemplate([
    {
      label: '파일',
      submenu: [
        {
          label: '새로고침',
          accelerator: 'F5',
          click: () => mainWindow.reload()
        },
        {
          type: 'separator'
        },
        {
          label: '종료',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: '편집',
      submenu: [
        { label: '실행 취소', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '다시 실행', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '잘라내기', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '복사', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '붙여넣기', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      ]
    },
    {
      label: '보기',
      submenu: [
        { label: '확대', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '축소', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: '실제 크기', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: '전체 화면', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: '도움말',
      submenu: [
        {
          label: '정보',
          click: () => {
            const { dialog } = require('electron')
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '인건비 대시보드',
              message: '인건비 대시보드 v1.2.1',
              detail: '실시간 급여 관리 및 인상률 시뮬레이션 도구\n\n© 2025 WageDashboard',
              buttons: ['확인']
            })
          }
        }
      ]
    }
  ])
  
  Menu.setApplicationMenu(menu)

  // 개발 모드와 프로덕션 모드 분기
  if (isDev) {
    // 개발 모드: Next.js 개발 서버 사용
    mainWindow.loadURL('http://localhost:3000')
    // 개발 모드에서도 개발자 도구는 수동으로 열도록 변경
    // mainWindow.webContents.openDevTools()
  } else {
    // 프로덕션 모드: 정적 HTML 파일 직접 로드
    // 먼저 app.asar.unpacked에서 찾기
    let indexPath = path.join(__dirname, '..', '..', 'app.asar.unpacked', 'out', 'index.html')
    
    // app.asar.unpacked에 없으면 일반 out 폴더에서 찾기
    if (!fs.existsSync(indexPath)) {
      indexPath = path.join(__dirname, '..', 'out', 'index.html')
    }
    
    // 개발 환경에서는 프로젝트 루트의 out 폴더
    if (!fs.existsSync(indexPath)) {
      indexPath = path.join(process.cwd(), 'out', 'index.html')
    }
    
    console.log('Looking for index.html at:', indexPath)
    console.log('File exists:', fs.existsSync(indexPath))
    
    if (fs.existsSync(indexPath)) {
      // 정적 HTML 파일 로드
      mainWindow.loadFile(indexPath)
    } else {
      // 파일을 찾을 수 없으면 에러 메시지 표시
      mainWindow.loadURL(`data:text/html;charset=utf-8,
        <html>
          <body style="font-family: sans-serif; padding: 20px;">
            <h1>빌드된 파일을 찾을 수 없습니다</h1>
            <p>index.html 파일이 없습니다.</p>
            <p>npm run build:electron을 실행하여 빌드를 완료하세요.</p>
            <p style="color: #666; font-size: 12px;">경로: ${indexPath}</p>
          </body>
        </html>
      `)
    }
  }

  // 윈도우가 준비되면 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // 프로덕션에서 개발자 도구 관련 단축키 차단
  if (!isDev) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C 차단 (F5 새로고침은 허용)
      if (input.key === 'F12' || 
          (input.control && input.shift && (input.key === 'I' || input.key === 'J' || input.key === 'C'))) {
        event.preventDefault()
      }
    })

    // 우클릭 컨텍스트 메뉴 차단
    mainWindow.webContents.on('context-menu', (event) => {
      event.preventDefault()
    })
  }

  // 외부 링크는 기본 브라우저에서 열기
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 윈도우가 닫힐 때
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC 핸들러 설정
function setupIpcHandlers() {
  // 파일 선택 다이얼로그
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    
    if (!result.canceled) {
      return result.filePaths[0]
    }
    return null
  })
  
  // 파일 저장 다이얼로그
  ipcMain.handle('dialog:saveFile', async (event, data) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'Excel Files', extensions: ['xlsx'] },
        { name: 'PDF Files', extensions: ['pdf'] }
      ]
    })
    
    if (!result.canceled) {
      fs.writeFileSync(result.filePath, data)
      return result.filePath
    }
    return null
  })
  
  // Excel 파일 처리
  ipcMain.handle('process:excel', async (event, arrayBuffer) => {
    try {
      // 여기서는 단순히 ArrayBuffer를 반환
      // 실제 처리는 렌더러 프로세스에서 수행
      return { success: true, data: arrayBuffer }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
  
  // 파일 읽기
  ipcMain.handle('file:readAsBuffer', async (event, filePath) => {
    try {
      const buffer = fs.readFileSync(filePath)
      return buffer
    } catch (error) {
      console.error('File read error:', error)
      return null
    }
  })
  
  // 앱 정보
  ipcMain.handle('app:getInfo', () => {
    return {
      version: app.getVersion(),
      name: app.getName(),
      path: app.getPath('userData')
    }
  })
}

// 프로덕션 서버 시작 함수 (사용하지 않음 - 정적 파일 직접 로드)
function startProductionServer() {
  // 이 함수는 더 이상 사용되지 않지만 호환성을 위해 남겨둠
  return Promise.resolve(null)
}

// Electron이 준비되면 윈도우 생성
app.whenReady().then(() => {
  createWindow()
  setupIpcHandlers()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 모든 윈도우가 닫히면 앱 종료 (macOS 제외)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 서버 프로세스 종료
    if (serverProcess) {
      serverProcess.kill()
      serverProcess = null
    }
    app.quit()
  }
})

// 보안 설정
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    // 로컬 파일이 아닌 경우 네비게이션 차단
    if (parsedUrl.protocol !== 'file:' && parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      event.preventDefault()
    }
  })
})