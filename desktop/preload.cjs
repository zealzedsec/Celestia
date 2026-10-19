// Minimal, read-only bridge: the web app learns it is running on the desktop and can ask for
// two harmless native actions. No Node APIs are exposed to the page.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('celestiaDesktop', {
  isDesktop: true,
  platform: process.platform,
  version: ipcRenderer.sendSync('celestia:version'),
  openDataFolder: () => ipcRenderer.invoke('celestia:open-data-folder'),
  openLogs: () => ipcRenderer.invoke('celestia:open-logs'),
})
