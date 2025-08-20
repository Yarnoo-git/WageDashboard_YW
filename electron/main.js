const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV !== 'production'

let mainWindow

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
      devTools: isDev // 프로덕션에서 개발자 도구 비활성화
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
        { label: '전체 화면', accelerator: 'F11', role: 'togglefullscreen' },
        ...(isDev ? [
          { type: 'separator' },
          { 
            label: '개발자 도구', 
            accelerator: 'F12',
            click: () => mainWindow.webContents.toggleDevTools()
          }
        ] : [])
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
    mainWindow.webContents.openDevTools()
  } else {
    // 프로덕션 모드: Standalone 서버 실행
    const { spawn } = require('child_process')
    const fs = require('fs')
    
    // Standalone 서버 경로 설정
    const standaloneDir = path.join(__dirname, '..', '.next', 'standalone')
    const serverPath = path.join(standaloneDir, 'server.js')
    
    // 서버 파일이 존재하는지 확인
    if (fs.existsSync(serverPath)) {
      // 환경 변수 설정
      const env = {
        ...process.env,
        PORT: '3000',
        NODE_ENV: 'production'
      }
      
      // Node.js로 standalone 서버 실행
      const serverProcess = spawn('node', [serverPath], {
        cwd: standaloneDir,
        env: env,
        stdio: 'pipe'
      })
      
      let serverReady = false
      
      // 서버 출력 모니터링
      serverProcess.stdout.on('data', (data) => {
        const output = data.toString()
        console.log('Server:', output)
        
        // 서버가 준비되었는지 확인
        if (!serverReady && (output.includes('started server') || output.includes('Ready'))) {
          serverReady = true
          setTimeout(() => {
            mainWindow.loadURL('http://localhost:3000')
          }, 1000)
        }
      })
      
      serverProcess.stderr.on('data', (data) => {
        console.error('Server Error:', data.toString())
      })
      
      serverProcess.on('error', (error) => {
        console.error('Failed to start server:', error)
        mainWindow.loadURL(`data:text/html;charset=utf-8,
          <html>
            <body style="font-family: sans-serif; padding: 20px;">
              <h1>서버 시작 실패</h1>
              <p>오류: ${error.message}</p>
              <p>Standalone 서버를 시작할 수 없습니다.</p>
            </body>
          </html>
        `)
      })
      
      // 타임아웃 설정 (10초 후에도 서버가 준비되지 않으면 강제 로드)
      setTimeout(() => {
        if (!serverReady) {
          console.log('Server timeout, loading anyway...')
          mainWindow.loadURL('http://localhost:3000')
        }
      }, 10000)
      
      // 앱 종료 시 서버도 종료
      app.on('before-quit', () => {
        if (serverProcess) {
          serverProcess.kill()
        }
      })
    } else {
      // Standalone 서버가 없는 경우 에러 메시지
      console.error('Standalone server not found at:', serverPath)
      mainWindow.loadURL(`data:text/html;charset=utf-8,
        <html>
          <body style="font-family: sans-serif; padding: 20px;">
            <h1>서버 파일을 찾을 수 없음</h1>
            <p>Standalone 서버가 빌드되지 않았습니다.</p>
            <p>npm run build를 실행하여 빌드를 완료하세요.</p>
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
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, F5 차단
      if (input.key === 'F12' || 
          (input.control && input.shift && (input.key === 'I' || input.key === 'J' || input.key === 'C')) ||
          (input.key === 'F5' && !input.control)) {
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

// Electron이 준비되면 윈도우 생성
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 모든 윈도우가 닫히면 앱 종료 (macOS 제외)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
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