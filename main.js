const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    frame: true, // We will keep standard window controls but styled beautifully inside
    title: "Auto File Organizer"
  });

  mainWindow.loadFile('index.html');
  
  // Open devtools in development if needed
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Paths for storing configuration and results
const getAppPaths = () => {
  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  return {
    settingsPath: path.join(userDataPath, 'settings.json'),
    configPath: path.join(userDataPath, 'organizer_config.txt'),
    resultsPath: path.join(userDataPath, 'organizer_results.txt')
  };
};

// IPC Handlers

// Get default Downloads folder
ipcMain.handle('get-default-downloads-dir', () => {
  try {
    return app.getPath('downloads');
  } catch (err) {
    return path.join(process.env.USERPROFILE, 'Downloads');
  }
});

// Select a directory
ipcMain.handle('select-directory', async (event, defaultPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    defaultPath: defaultPath || undefined
  });
  if (result.canceled) {
    return null;
  }
  return result.filePaths[0];
});

// Load settings
ipcMain.handle('load-settings', () => {
  const { settingsPath } = getAppPaths();
  if (fs.existsSync(settingsPath)) {
    try {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }
  return null; // Return null if no settings exist
});

// Save settings
ipcMain.handle('save-settings', (event, settings) => {
  const { settingsPath } = getAppPaths();
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to save settings:', e);
    return false;
  }
});

// Run Organizer backend
ipcMain.handle('run-organizer', async (event, settings) => {
  const { configPath, resultsPath } = getAppPaths();
  
  try {
    // 1. Generate config file content
    const sourceDir = settings.sourceDir;
    let configContent = `${sourceDir}\n`;
    
    // Add extension mappings
    // Settings mappings is an array or object like: { 'install': ['.exe', '.msi'], 'pictures': ['.png'] }
    // Or simpler: mapping ext -> destFolder
    for (const category of settings.categories) {
      const targetDir = category.customPath || path.join(settings.baseDestDir || sourceDir, category.folderName);
      for (const ext of category.extensions) {
        // Clean extension to ensure it starts with a dot
        const cleanExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
        configContent += `${cleanExt}|${targetDir}\n`;
      }
    }
    
    // Write configuration file in UTF-8
    fs.writeFileSync(configPath, configContent, 'utf8');

    // Remove old results file if it exists
    if (fs.existsSync(resultsPath)) {
      fs.unlinkSync(resultsPath);
    }

    // Determine backend executable path
    // In development: bin/organizer.exe
    // In production: packaged binary
    const backendPath = path.join(__dirname, 'bin', 'organizer.exe');

    if (!fs.existsSync(backendPath)) {
      throw new Error(`Organizer backend executable not found at: ${backendPath}`);
    }

    // 2. Execute compiled C++ binary
    return new Promise((resolve) => {
      execFile(backendPath, [configPath, resultsPath], { windowsHide: true }, (error, stdout, stderr) => {
        // Even if the exit code is non-zero, let's see if results file was generated
        if (!fs.existsSync(resultsPath)) {
          resolve({
            success: false,
            error: error ? error.message : 'Backend executable failed without producing results.'
          });
          return;
        }

        // 3. Read and parse results.txt
        try {
          const resultsContent = fs.readFileSync(resultsPath, 'utf8');
          const lines = resultsContent.split('\n');
          const movedFiles = [];
          const errors = [];
          let summary = { moved: 0, errors: 0 };

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const parts = trimmed.split('|');
            const status = parts[0];

            if (status === 'OK') {
              // Format: OK|original_path|new_path|extension
              movedFiles.push({
                from: parts[1],
                to: parts[2],
                ext: parts[3],
                name: path.basename(parts[1])
              });
            } else if (status === 'ERROR') {
              // Format: ERROR|file_path|error_message
              errors.push({
                file: parts[1],
                message: parts[2]
              });
            } else if (status === 'SUMMARY') {
              // Format: SUMMARY|moved_count|error_count
              summary = {
                moved: parseInt(parts[1], 10),
                errors: parseInt(parts[2], 10)
              };
            }
          }

          resolve({
            success: true,
            movedFiles,
            errors,
            summary
          });
        } catch (readErr) {
          resolve({
            success: false,
            error: `Failed to read backend results: ${readErr.message}`
          });
        }
      });
    });

  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
});
