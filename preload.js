const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getDefaultDownloadsDir: () => ipcRenderer.invoke('get-default-downloads-dir'),
  selectDirectory: (defaultPath) => ipcRenderer.invoke('select-directory', defaultPath),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  runOrganizer: (settings) => ipcRenderer.invoke('run-organizer', settings)
});
