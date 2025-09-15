const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Import activation system
const ActivationManager = require('./activation/activationManager');

class NanoBananaApp {
  constructor() {
    this.mainWindow = null;
    this.backendProcess = null;
    this.activationManager = new ActivationManager();
    this.isActivated = false;
  }

  async initialize() {
    // Clear user data in production only on first run after installation
    if (app.isPackaged) {
      await this.clearUserDataOnFirstRun();
    }

    // Check activation status
    this.isActivated = await this.activationManager.checkActivationStatus();
    console.log('Activation status:', this.isActivated);

    // Create main window
    this.createWindow();

    // Start backend service if activated
    if (this.isActivated) {
      await this.startBackendService();
    }
  }

  // Clear user data only on first run after installation
  async clearUserDataOnFirstRun() {
    try {
      const fs = require('fs').promises;
      const userDataPath = app.getPath('userData');
      const firstRunMarkerPath = path.join(userDataPath, '.first-run-completed');

      // Check if this is the first run
      try {
        await fs.access(firstRunMarkerPath);
        // Marker file exists, not first run - skip clearing
        console.log('Not first run, skipping user data clearing');
        return;
      } catch (error) {
        // Marker file doesn't exist, this is first run
        console.log('First run detected, clearing cache data...');
      }

      console.log('User data path:', userDataPath);

      // List of files/directories to clear (KEEP activation.json and other important data)
      const itemsToClear = [
        // 'activation.json',     // DON'T clear activation data - we want it to persist!
        'Local Storage',          // Browser local storage
        'Session Storage',        // Browser session storage
        'IndexedDB',             // IndexedDB data
        'databases',             // Web SQL databases
        'Cache',                 // Application cache
        'Code Cache',            // V8 code cache
        'GPUCache',              // GPU cache
        'logs',                  // Application logs
        'Preferences',           // User preferences
        'Network Persistent State', // Network state
        'TransportSecurity',     // Transport security state
        'blob_storage',          // Blob storage
        'Local Extension Settings', // Extension settings
        'Extension State',       // Extension state
        'shared_proto_db',       // Shared protocol database
        'WebStorage'             // Web storage
      ];

      // Clear each item
      for (const item of itemsToClear) {
        const itemPath = path.join(userDataPath, item);
        try {
          const stat = await fs.stat(itemPath);
          if (stat.isDirectory()) {
            await fs.rmdir(itemPath, { recursive: true });
            console.log(`Cleared directory: ${item}`);
          } else {
            await fs.unlink(itemPath);
            console.log(`Cleared file: ${item}`);
          }
        } catch (error) {
          // Item doesn't exist, which is fine
          if (error.code !== 'ENOENT') {
            console.log(`Warning: Could not clear ${item}:`, error.message);
          }
        }
      }

      // Create marker file to indicate first run is completed
      await fs.writeFile(firstRunMarkerPath, new Date().toISOString());
      console.log('First run cleanup completed, marker file created');

    } catch (error) {
      console.error('Error in first run cleanup:', error);
      // Don't throw error, just log it - app should still start
    }
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: false // Disable web security for local files
      },
      icon: path.join(__dirname, 'assets', 'icon.png'),
      show: false,
      titleBarStyle: 'default',
      autoHideMenuBar: true // 隐藏菜单栏
    });

    // Load appropriate page based on activation status
    if (this.isActivated) {
      this.loadMainApp();
    } else {
      this.loadActivationPage();
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
      this.cleanup();
    });
  }

  loadActivationPage() {
    // Load activation page (we'll create this)
    const activationPath = path.join(__dirname, 'activation', 'activation.html');
    console.log('Loading activation page from:', activationPath);
    this.mainWindow.loadFile(activationPath);
  }

  loadMainApp() {
    // Load main application
    if (process.env.NODE_ENV === 'development') {
      console.log('Loading development app from localhost:5173');
      this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      const appPath = path.join(__dirname, 'frontend', 'dist', 'index.html');
      console.log('Loading production app from:', appPath);

      // Clear storage BEFORE loading the app to prevent any cached data from being loaded
      this.mainWindow.webContents.session.clearStorageData({
        storages: ['localstorage', 'sessionstorage', 'indexdb', 'websql', 'cookies']
      }).then(() => {
        console.log('All storage data cleared before app load');
        this.mainWindow.loadFile(appPath);

        // Additional cleanup after DOM is ready
        this.mainWindow.webContents.once('dom-ready', () => {
          this.mainWindow.webContents.executeJavaScript(`
            // Double-check: Clear ALL localStorage and sessionStorage data
            localStorage.clear();
            sessionStorage.clear();

            // Also clear any IndexedDB data
            if (window.indexedDB) {
              indexedDB.databases().then(databases => {
                databases.forEach(db => {
                  indexedDB.deleteDatabase(db.name);
                });
              }).catch(console.error);
            }

            console.log('Additional storage cleanup completed');
          `);
        });
      });

      // DevTools disabled in production for better user experience
      // Uncomment the line below if you need to debug in production
      // this.mainWindow.webContents.openDevTools();
    }
  }

  async checkPortAvailable(port) {
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();

      server.listen(port, () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });

      server.on('error', () => {
        resolve(false);
      });
    });
  }

  async startBackendService() {
    if (this.backendProcess) return;

    // Check if port 3001 is already in use
    const portAvailable = await this.checkPortAvailable(3001);

    if (!portAvailable) {
      console.log('Backend service already running on port 3001, skipping internal backend startup');
      return;
    }

    const backendPath = path.join(__dirname, 'backend', 'server.js');

    // Set environment variables for Electron mode
    const env = {
      ...process.env,
      ELECTRON_ENV: 'true',
      NODE_ENV: 'production',
      PORT: '3001'
    };

    // In packaged app, we need to use the bundled Node.js executable
    let nodePath;
    if (app.isPackaged) {
      // In packaged app, use the Node.js executable bundled with Electron
      if (process.platform === 'win32') {
        nodePath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'electron', 'dist', 'node.exe');
        // Fallback to system node if bundled node doesn't exist
        if (!fs.existsSync(nodePath)) {
          nodePath = 'node';
        }
      } else {
        nodePath = 'node';
      }
    } else {
      // In development, use the current Node.js executable
      nodePath = process.execPath;
    }

    console.log('Using Node.js path:', nodePath);

    this.backendProcess = spawn(nodePath, [backendPath], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'pipe',
      env: env,
      shell: false, // Don't use shell to avoid path issues
      encoding: 'utf8',
      windowsHide: true
    });

    this.backendProcess.stdout.on('data', (data) => {
      const output = data.toString('utf8');
      console.log(`Backend: ${output}`);
    });

    this.backendProcess.stderr.on('data', (data) => {
      const output = data.toString('utf8');
      console.error(`Backend Error: ${output}`);
    });

    this.backendProcess.on('error', (error) => {
      console.error('Failed to start backend process:', error);
      this.backendProcess = null;

      // Show user-friendly error message
      if (error.code === 'ENOENT') {
        console.log('Node.js not found, backend service will not be available');
        // Don't show error dialog, just log it
      }
    });

    this.backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
      this.backendProcess = null;
    });
  }

  cleanup() {
    if (this.backendProcess) {
      this.backendProcess.kill();
      this.backendProcess = null;
    }
  }

  setupIPC() {
    // Handle activation code submission
    ipcMain.handle('activate-app', async (event, activationCode) => {
      try {
        const result = await this.activationManager.activateCode(activationCode);

        if (result.success) {
          this.isActivated = true;
          await this.startBackendService();
          this.loadMainApp();
          return { success: true, data: result.data };
        } else {
          return { success: false, error: result.error };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Handle getting remaining credits
    ipcMain.handle('get-remaining-credits', async () => {
      try {
        const credits = await this.activationManager.getRemainingCredits();
        return { success: true, credits };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Handle using credits
    ipcMain.handle('use-credits', async (event, count = 1) => {
      try {
        const remaining = await this.activationManager.useCredits(count);
        return { success: true, remaining };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Handle app info requests
    ipcMain.handle('get-app-info', async () => {
      try {
        const activationData = await this.activationManager.loadActivationData();
        return {
          version: app.getVersion(),
          name: app.getName(),
          isActivated: this.isActivated,
          currentPlan: activationData.planType || null
        };
      } catch (error) {
        return {
          version: app.getVersion(),
          name: app.getName(),
          isActivated: this.isActivated,
          currentPlan: null
        };
      }
    });

    // Handle activation history requests
    ipcMain.handle('get-activation-history', async () => {
      try {
        const activationData = await this.activationManager.loadActivationData();
        return {
          success: true,
          history: activationData.activationHistory || []
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Handle image generation
    ipcMain.handle('generate-image', async (event, request) => {
      try {
        // Check if activated and has credits (but don't consume yet)
        const remainingCredits = await this.activationManager.getRemainingCredits();
        if (remainingCredits <= 0) {
          return { success: false, error: '额度不足，请购买更多额度' };
        }

        // Convert frontend request format to backend expected format
        const backendRequest = {
          prompt: request.prompt,
          referenceImages: request.referenceImages || [],
          refImages: (request.referenceImages || []).map(img => ({
            mimeType: 'image/png',
            data: img
          })),
          options: {
            temperature: request.temperature || 0.7,
            seed: request.seed
          }
        };

        // Make request to proxy service (云服务器 - gemini-proxy)
        const proxyUrl = process.env.PROXY_ENDPOINT || 'http://43.142.153.33:3001';
        console.log('Making request to:', `${proxyUrl}/api/generate`);
        console.log('Request payload:', JSON.stringify(backendRequest, null, 2));

        const response = await fetch(`${proxyUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer electron-app' // Special token for Electron
          },
          body: JSON.stringify(backendRequest)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            errorData: errorData,
            url: `${proxyUrl}/api/generate`
          });
          throw new Error(errorData.error || `Generation failed (${response.status}: ${response.statusText})`);
        }

        const result = await response.json();

        // Only consume credit after successful generation
        await this.activationManager.useCredits(1, 'generate', {
          prompt: request.prompt,
          requestId: result.requestId || Date.now().toString()
        });

        return {
          success: true,
          data: result,
          remainingCredits: await this.activationManager.getRemainingCredits()
        };
      } catch (error) {
        console.error('Image generation failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Handle image editing
    ipcMain.handle('edit-image', async (event, request) => {
      try {
        // Check if activated and has credits (but don't consume yet)
        const remainingCredits = await this.activationManager.getRemainingCredits();
        if (remainingCredits <= 0) {
          return { success: false, error: '额度不足，请购买更多额度' };
        }

        // Convert frontend request format to backend expected format
        const backendRequest = {
          imageId: request.imageId,
          instruction: request.instruction,
          mask: request.mask,
          refImages: request.refImages || []
        };

        // Make request to proxy service (云服务器)
        const proxyUrl = process.env.PROXY_ENDPOINT || 'http://43.142.153.33:3001';
        const response = await fetch(`${proxyUrl}/api/edit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer electron-app' // Special token for Electron
          },
          body: JSON.stringify(backendRequest)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Edit failed');
        }

        const result = await response.json();

        // Only consume credit after successful editing
        await this.activationManager.useCredits(1, 'edit', {
          instruction: request.instruction,
          requestId: result.requestId || Date.now().toString()
        });

        return {
          success: true,
          data: result,
          remainingCredits: await this.activationManager.getRemainingCredits()
        };
      } catch (error) {
        console.error('Image editing failed:', error);
        return { success: false, error: error.message };
      }
    });
  }
}

// App event handlers
const nanoBananaApp = new NanoBananaApp();

app.whenReady().then(() => {
  nanoBananaApp.setupIPC();
  nanoBananaApp.initialize();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    nanoBananaApp.initialize();
  }
});

app.on('before-quit', () => {
  nanoBananaApp.cleanup();
});

// Handle certificate errors for development
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (process.env.NODE_ENV === 'development') {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
