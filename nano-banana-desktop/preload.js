const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Activation related APIs
  activateApp: (activationCode) => ipcRenderer.invoke('activate-app', activationCode),
  getRemainingCredits: () => ipcRenderer.invoke('get-remaining-credits'),
  useCredits: (count) => ipcRenderer.invoke('use-credits', count),
  
  // App info APIs
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Platform info
  platform: process.platform,
  
  // Version info
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

// Expose a limited API for the activation page
contextBridge.exposeInMainWorld('activationAPI', {
  activate: (code) => ipcRenderer.invoke('activate-app', code),
  getAppInfo: () => ipcRenderer.invoke('get-app-info')
});

// Expose API for the main application
contextBridge.exposeInMainWorld('nanoBananaAPI', {
  // Credits management
  getRemainingCredits: () => ipcRenderer.invoke('get-remaining-credits'),
  useCredits: (count) => ipcRenderer.invoke('use-credits', count),

  // Image generation APIs
  generateImage: (request) => ipcRenderer.invoke('generate-image', request),
  editImage: (request) => ipcRenderer.invoke('edit-image', request),

  // App utilities
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  getActivationHistory: () => ipcRenderer.invoke('get-activation-history'),

  // Platform detection
  isElectron: true,
  platform: process.platform
});
