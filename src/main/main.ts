import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { VideoProcessor, VideoConversionProgress } from './videoProcessor';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

class AppUpdater {
  constructor() {
    // Configure auto-updater for GitHub releases
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'proSamik',
      repo: 'subclip-free-tool-thumbnail-releases',
      releaseType: 'release'
    });

    // Set auto-updater options
    autoUpdater.autoDownload = true; // Automatically download updates
    autoUpdater.autoInstallOnAppQuit = true; // Install on next restart

    // Silent update - download automatically but don't notify user immediately
    autoUpdater.checkForUpdatesAndNotify();

    // Optional: Log update events for debugging
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info);
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available:', info);
    });

    autoUpdater.on('error', (err) => {
      console.log('Error in auto-updater:', err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      console.log(`Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`);
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded, will install on restart:', info);
    });
  }
}

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    minHeight: 600,
    minWidth: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    title: 'Video Converter',
    titleBarStyle: 'hidden',
    frame: false,
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

// IPC handlers for file operations
ipcMain.handle('show-open-dialog', async (_, options?: { filters?: Array<{ name: string; extensions: string[] }> }) => {
  const filters = options?.filters || [
    { name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', 'm4v'] }
  ];
  
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: filters
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    
    return {
      success: true,
      filePath: filePath,
      fileName: path.basename(filePath)
    };
  }
  
  return { success: false };
});

ipcMain.handle('show-save-dialog', async (_, defaultName: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultName,
    filters: [
      { name: 'MP4 Videos', extensions: ['mp4'] },
      { name: 'PNG Images', extensions: ['png'] },
      { name: 'JPEG Images', extensions: ['jpg', 'jpeg'] }
    ]
  });
  
  return result;
});

ipcMain.handle('save-image', async (_, imagePath: string, imageData: string) => {
  try {
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(imagePath, buffer);
    return { success: true, filePath: imagePath };
  } catch (error) {
    console.error('Error saving image:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('show-in-finder', async (_, filePath: string) => {
  try {
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error showing in finder:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Handle drag and drop
ipcMain.handle('process-dropped-file', async (_, filePath: string) => {
  try {
    return {
      success: true,
      filePath: filePath,
      fileName: path.basename(filePath)
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Get file URL for renderer
ipcMain.handle('get-file-url', async (_, filePath: string) => {
  try {
    return {
      success: true,
      url: `file://${filePath}`
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Video processing handlers
ipcMain.handle('get-temp-dir', async () => {
  return os.tmpdir();
});

ipcMain.handle('write-file', async (_, filePath: string, data: Uint8Array) => {
  try {
    fs.writeFileSync(filePath, Buffer.from(data));
  } catch (error) {
    console.error('Error writing file:', error);
    throw error;
  }
});

ipcMain.handle('copy-file', async (_, sourcePath: string, destPath: string) => {
  try {
    fs.copyFileSync(sourcePath, destPath);
  } catch (error) {
    console.error('Error copying file:', error);
    throw error;
  }
});

ipcMain.handle('get-file-stats', async (_, filePath: string) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      isFile: stats.isFile()
    };
  } catch (error) {
    console.error('Error getting file stats:', error);
    throw error;
  }
});

// Video processing IPC handlers
ipcMain.handle('extract-first-frame', async (_, filePath: string, outputDir: string) => {
  try {
    const thumbnailPath = await VideoProcessor.extractFirstFrame(filePath, outputDir);
    return { success: true, thumbnailPath };
  } catch (error) {
    console.error('Error extracting first frame:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('get-video-metadata', async (_, filePath: string) => {
  try {
    const metadata = await VideoProcessor.getVideoMetadata(filePath);
    return { success: true, metadata };
  } catch (error) {
    console.error('Error getting video metadata:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Store active conversions to handle progress updates
const activeConversions = new Map<string, BrowserWindow>();

ipcMain.handle('convert-video', async (event, inputPath: string, outputPath: string, conversionId: string) => {
  try {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    if (senderWindow) {
      activeConversions.set(conversionId, senderWindow);
    }

    const convertedPath = await VideoProcessor.convertToMp4(
      inputPath,
      outputPath,
      (progress: VideoConversionProgress) => {
        const window = activeConversions.get(conversionId);
        if (window && !window.isDestroyed()) {
          window.webContents.send('conversion-progress', conversionId, progress);
        }
      }
    );

    activeConversions.delete(conversionId);
    return { success: true, convertedPath };
  } catch (error) {
    console.error('Error converting video:', error);
    activeConversions.delete(conversionId);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('optimize-for-social-media', async (
  event, 
  inputPath: string, 
  outputPath: string, 
  platform: 'instagram' | 'twitter' | 'youtube' | 'facebook',
  conversionId: string
) => {
  try {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    if (senderWindow) {
      activeConversions.set(conversionId, senderWindow);
    }

    const convertedPath = await VideoProcessor.optimizeForSocialMedia(
      inputPath,
      outputPath,
      platform,
      (progress: VideoConversionProgress) => {
        const window = activeConversions.get(conversionId);
        if (window && !window.isDestroyed()) {
          window.webContents.send('conversion-progress', conversionId, progress);
        }
      }
    );

    activeConversions.delete(conversionId);
    return { success: true, convertedPath };
  } catch (error) {
    console.error('Error optimizing video for social media:', error);
    activeConversions.delete(conversionId);
    return { success: false, error: (error as Error).message };
  }
});

