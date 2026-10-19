// CELESTIA — desktop shell (Electron main process)
//
// Runs the production Next.js standalone server as an Electron utility process on a random
// loopback port, then shows it in a locked-down window. All data stays in the user's data folder.
'use strict'

const { app, BrowserWindow, Menu, dialog, ipcMain, nativeImage, session, shell, utilityProcess } = require('electron')
const fs = require('node:fs')
const http = require('node:http')
const net = require('node:net')
const path = require('node:path')

const APP_NAME = 'CELESTIA'
const HOMEPAGE = require('./package.json').homepage
app.setName(APP_NAME)
if (process.platform === 'linux') app.setDesktopName?.('celestia.desktop')

// ——— one observatory at a time ———
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

const isPackaged = app.isPackaged
const resources = isPackaged ? process.resourcesPath : path.join(__dirname, '..', 'desktop-build')
const serverDir = path.join(resources, 'server')
const templateDb = path.join(resources, 'template.db')
const iconPath = isPackaged ? path.join(process.resourcesPath, 'icon.png') : path.join(__dirname, '..', 'build', 'icons', '512x512.png')
// development: point the shell at a running `next dev` instead of the bundled server
const devUrl = process.env.CELESTIA_DEV_URL || process.argv.find((a) => a.startsWith('--dev-url='))?.slice('--dev-url='.length)

const MODULE_IDS = ['dashboard', 'moon', 'planets', 'almanac', 'natal', 'union', 'chrono', 'hours', 'oracle', 'grimoire', 'journal']
/** `celestia --open=almanac` (used by the launcher's quick actions) */
function moduleFromArgv(argv) {
  const id = argv.find((a) => a.startsWith('--open='))?.slice('--open='.length)
  return MODULE_IDS.includes(id) ? id : null
}

const userData = app.getPath('userData')
const dbPath = path.join(userData, 'celestia.db')
const logDir = path.join(userData, 'logs')
const statePath = path.join(userData, 'window-state.json')

let mainWindow = null
let splash = null
let server = null
let origin = null
let quitting = false

// ———————————————— helpers ————————————————

function log(line) {
  try {
    fs.mkdirSync(logDir, { recursive: true })
    fs.appendFileSync(path.join(logDir, 'main.log'), `[${new Date().toISOString()}] ${line}\n`)
  } catch { /* logging must never crash the app */ }
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.unref()
    srv.on('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

function waitForServer(url, timeoutMs = 45_000) {
  const started = Date.now()
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume()
        if (res.statusCode && res.statusCode < 500) return resolve()
        retry()
      })
      req.on('error', retry)
      req.setTimeout(2000, () => req.destroy())
    }
    const retry = () => {
      if (Date.now() - started > timeoutMs) return reject(new Error('The observatory engine did not start in time'))
      setTimeout(attempt, 250)
    }
    attempt()
  })
}

/** First launch: seed an empty database from the template shipped with the app */
function ensureDatabase() {
  fs.mkdirSync(userData, { recursive: true })
  if (!fs.existsSync(dbPath)) {
    fs.copyFileSync(templateDb, dbPath)
    log(`created database at ${dbPath}`)
  }
}

function readWindowState() {
  try {
    const s = JSON.parse(fs.readFileSync(statePath, 'utf8'))
    if (Number.isFinite(s.width) && Number.isFinite(s.height)) return s
  } catch { /* first run */ }
  return { width: 1360, height: 880 }
}

function saveWindowState(win) {
  try {
    const maximized = win.isMaximized()
    const b = maximized ? win.getNormalBounds() : win.getBounds()
    fs.writeFileSync(statePath, JSON.stringify({ ...b, maximized }))
  } catch { /* non-fatal */ }
}

// ———————————————— the bundled server ————————————————

async function startServer() {
  if (devUrl) return devUrl
  ensureDatabase()
  const port = await freePort()
  const host = `127.0.0.1:${port}`
  fs.mkdirSync(logDir, { recursive: true })
  const out = fs.createWriteStream(path.join(logDir, 'server.log'), { flags: 'a' })
  out.write(`\n——— ${new Date().toISOString()} · ${APP_NAME} ${app.getVersion()} · port ${port} ———\n`)

  server = utilityProcess.fork(path.join(serverDir, 'server.js'), [], {
    cwd: serverDir,
    serviceName: 'CELESTIA engine',
    stdio: 'pipe',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
      // forward slashes: the form Prisma's SQLite URL parser accepts on every platform
      DATABASE_URL: `file:${dbPath.replace(/\\/g, '/')}`,
      CELESTIA_ALLOWED_HOSTS: host,
      NEXT_TELEMETRY_DISABLED: '1',
    },
  })
  server.stdout?.pipe(out)
  server.stderr?.pipe(out)
  server.on('exit', (code) => {
    log(`server exited with code ${code}`)
    server = null
    if (!quitting) onServerCrash(code)
  })

  const url = `http://${host}`
  await waitForServer(`${url}/api/hours`)
  return url
}

async function onServerCrash(code) {
  const { response } = await dialog.showMessageBox({
    type: 'error',
    title: APP_NAME,
    message: 'The observatory engine stopped unexpectedly.',
    detail: `Exit code ${code}. Your journal and charts are safe. You can restart the engine, or open the logs to see what happened.`,
    buttons: ['Restart', 'Open logs', 'Quit'],
    defaultId: 0,
    cancelId: 2,
  })
  if (response === 0) {
    try {
      origin = await startServer()
      mainWindow?.loadURL(origin)
    } catch (err) {
      dialog.showErrorBox(APP_NAME, String(err))
      app.quit()
    }
  } else if (response === 1) {
    shell.openPath(logDir)
    onServerCrash(code)
  } else {
    app.quit()
  }
}

// ———————————————— windows ————————————————

function createSplash() {
  splash = new BrowserWindow({
    width: 420, height: 320, frame: false, resizable: false, movable: true, center: true,
    show: false, backgroundColor: '#000000', skipTaskbar: true, icon: iconPath,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  })
  splash.loadFile(path.join(__dirname, 'splash.html'))
  splash.once('ready-to-show', () => splash?.show())
  splash.on('closed', () => { splash = null })
}

function createMainWindow(url) {
  const state = readWindowState()
  mainWindow = new BrowserWindow({
    ...state,
    minWidth: 380,
    minHeight: 560,
    show: false,
    title: APP_NAME,
    backgroundColor: '#000000',
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  })
  if (state.maximized) mainWindow.maximize()

  const wc = mainWindow.webContents
  // keep the window on the observatory; everything else opens in the system browser
  wc.setWindowOpenHandler(({ url: target }) => {
    if (/^https?:\/\//i.test(target) && !target.startsWith(url)) shell.openExternal(target)
    return { action: 'deny' }
  })
  wc.on('will-navigate', (event, target) => {
    if (!target.startsWith(url)) {
      event.preventDefault()
      if (/^https?:\/\//i.test(target)) shell.openExternal(target)
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    splash?.close()
  })
  mainWindow.on('close', () => saveWindowState(mainWindow))
  mainWindow.on('closed', () => { mainWindow = null })
  const start = moduleFromArgv(process.argv)
  mainWindow.loadURL(start ? `${url}/#/${start}` : url)
}

function go(moduleId) {
  mainWindow?.webContents.executeJavaScript(`location.hash = '/${moduleId}'`).catch(() => {})
}

function buildMenu() {
  const mod = process.platform === 'darwin' ? 'Cmd' : 'Ctrl'
  const modules = [
    ['dashboard', 'Sky Now'], ['moon', 'Moon'], ['planets', 'Planets & Sky Dome'], ['almanac', 'Almanac'],
    ['natal', 'Natal Chart'], ['union', 'Union (Synastry)'], ['chrono', 'Chronomancer'], ['hours', 'Planetary Hours'],
    ['oracle', 'Transit Oracle'], ['grimoire', 'Grimoire'], ['journal', 'Journal'],
  ]
  const template = [
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'Export backup…', accelerator: `${mod}+Shift+E`, click: () => origin && mainWindow?.webContents.downloadURL(`${origin}/api/backup`) },
        { label: 'Export a year of events (.ics)…', click: () => origin && mainWindow?.webContents.downloadURL(`${origin}/api/events?days=365&format=ics`) },
        { type: 'separator' },
        { label: 'Open data folder', click: () => shell.openPath(userData) },
        { type: 'separator' },
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit', label: 'Quit CELESTIA' },
      ],
    },
    { role: 'editMenu' },
    {
      label: 'Go',
      submenu: modules.map(([id, label], i) => ({ label, accelerator: i < 9 ? `${mod}+${i + 1}` : undefined, click: () => go(id) })),
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' }, { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isPackaged ? [] : [{ role: 'toggleDevTools' }]),
      ],
    },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        { label: 'Keyboard shortcuts', accelerator: 'F1', click: () => mainWindow?.webContents.executeJavaScript(`document.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))`).catch(() => {}) },
        { label: 'Project page', click: () => shell.openExternal(HOMEPAGE) },
        { label: 'Report a problem', click: () => shell.openExternal(`${HOMEPAGE}/issues/new/choose`) },
        { label: 'Open logs', click: () => shell.openPath(logDir) },
        { type: 'separator' },
        {
          label: `About ${APP_NAME}`,
          click: () => dialog.showMessageBox({
            type: 'info', title: APP_NAME, icon: nativeImage.createFromPath(iconPath),
            message: `${APP_NAME} ${app.getVersion()}`,
            detail: 'A living astronomy & astrology observatory.\nEphemeris: astronomy-engine · Stars: HYG v4.1 · Time zones: IANA.\n\nYour data lives in:\n' + userData,
          }),
        },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function lockDownSession() {
  const allowed = new Set(['notifications', 'geolocation', 'clipboard-sanitized-write', 'fullscreen'])
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => callback(allowed.has(permission)))
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => allowed.has(permission))
}

// ———————————————— lifecycle ————————————————

ipcMain.on('celestia:version', (e) => { e.returnValue = app.getVersion() })
ipcMain.handle('celestia:open-data-folder', () => shell.openPath(userData))
ipcMain.handle('celestia:open-logs', () => shell.openPath(logDir))

app.on('second-instance', (_event, argv) => {
  if (!mainWindow) return
  const target = moduleFromArgv(argv)
  if (target) go(target)
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.focus()
})

app.whenReady().then(async () => {
  lockDownSession()
  buildMenu()
  createSplash()
  try {
    origin = await startServer()
    createMainWindow(origin)
  } catch (err) {
    log(`startup failed: ${err && err.stack ? err.stack : err}`)
    splash?.close()
    dialog.showErrorBox(APP_NAME, `The observatory could not start.\n\n${err && err.message ? err.message : err}\n\nLogs: ${logDir}`)
    app.quit()
  }
})

app.on('activate', () => {
  if (!mainWindow && origin) createMainWindow(origin)
})

app.on('before-quit', () => {
  quitting = true
  server?.kill()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
