import { contextBridge, ipcRenderer } from 'electron';

export interface VideoConversionProgress {
  progress: number;
  timemark: string;
  targetSize: number;
  currentFps: number;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  format: string;
}

export interface VideoSettingsConfig {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: '720p' | '1080p' | '1440p' | '4k';
  bitrate: number;
  preset: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow';
  socialMediaOptimization: boolean;
  platform: 'instagram' | 'twitter' | 'youtube' | 'facebook' | 'general';
  enableHardwareAcceleration: boolean;
  maxFileSizeMB: number;
}

export interface ElectronAPI {
  showOpenDialog: (options?: { filters?: Array<{ name: string; extensions: string[] }> }) => Promise<{ success: boolean; filePath?: string; fileName?: string }>;
  showSaveDialog: (defaultName: string) => Promise<{ canceled: boolean; filePath?: string }>;
  saveImage: (imagePath: string, imageData: string) => Promise<{ success: boolean; error?: string; filePath?: string }>;
  showInFinder: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  getFileUrl: (filePath: string) => Promise<{ success: boolean; url?: string; error?: string }>;
  getTempDir: () => Promise<string>;
  writeFile: (filePath: string, data: Uint8Array) => Promise<void>;
  copyFile: (sourcePath: string, destPath: string) => Promise<void>;
  getFileStats: (filePath: string) => Promise<{ size: number; isFile: boolean }>;
  extractFirstFrame: (filePath: string, outputDir: string) => Promise<{ success: boolean; thumbnailPath?: string; error?: string }>;
  getVideoMetadata: (filePath: string) => Promise<{ success: boolean; metadata?: VideoMetadata; error?: string }>;
  convertVideo: (inputPath: string, outputPath: string, settings: VideoSettingsConfig, conversionId: string) => Promise<{ success: boolean; convertedPath?: string; error?: string }>;
  optimizeForSocialMedia: (inputPath: string, outputPath: string, settings: VideoSettingsConfig, conversionId: string) => Promise<{ success: boolean; convertedPath?: string; error?: string }>;
  onConversionProgress: (callback: (conversionId: string, progress: VideoConversionProgress) => void) => void;
  removeConversionProgressListener: (callback: (conversionId: string, progress: VideoConversionProgress) => void) => void;
}

const electronAPI: ElectronAPI = {
  showOpenDialog: (options?: { filters?: Array<{ name: string; extensions: string[] }> }) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (defaultName: string) => ipcRenderer.invoke('show-save-dialog', defaultName),
  saveImage: (imagePath: string, imageData: string) => ipcRenderer.invoke('save-image', imagePath, imageData),
  showInFinder: (filePath: string) => ipcRenderer.invoke('show-in-finder', filePath),
  getFileUrl: (filePath: string) => ipcRenderer.invoke('get-file-url', filePath),
  getTempDir: () => ipcRenderer.invoke('get-temp-dir'),
  writeFile: (filePath: string, data: Uint8Array) => ipcRenderer.invoke('write-file', filePath, data),
  copyFile: (sourcePath: string, destPath: string) => ipcRenderer.invoke('copy-file', sourcePath, destPath),
  getFileStats: (filePath: string) => ipcRenderer.invoke('get-file-stats', filePath),
  extractFirstFrame: (filePath: string, outputDir: string) => ipcRenderer.invoke('extract-first-frame', filePath, outputDir),
  getVideoMetadata: (filePath: string) => ipcRenderer.invoke('get-video-metadata', filePath),
  convertVideo: (inputPath: string, outputPath: string, settings: VideoSettingsConfig, conversionId: string) => ipcRenderer.invoke('convert-video', inputPath, outputPath, settings, conversionId),
  optimizeForSocialMedia: (inputPath: string, outputPath: string, settings: VideoSettingsConfig, conversionId: string) => ipcRenderer.invoke('optimize-for-social-media', inputPath, outputPath, settings, conversionId),
  onConversionProgress: (callback: (conversionId: string, progress: VideoConversionProgress) => void) => {
    ipcRenderer.on('conversion-progress', (_, conversionId, progress) => callback(conversionId, progress));
  },
  removeConversionProgressListener: (callback: (conversionId: string, progress: VideoConversionProgress) => void) => {
    ipcRenderer.removeListener('conversion-progress', callback as any);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);