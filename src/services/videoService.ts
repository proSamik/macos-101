import { VideoConversionProgress, VideoMetadata, VideoSettingsConfig } from '../preload/preload';

export class VideoService {
    static async getVideoMetadata(filePath: string): Promise<VideoMetadata> {
        const result = await window.electronAPI.getVideoMetadata(filePath);
        if (result.success && result.metadata) {
            return result.metadata;
        }
        throw new Error(result.error || 'Failed to get video metadata');
    }

    static async extractFirstFrame(filePath: string, outputDir: string): Promise<string> {
        const result = await window.electronAPI.extractFirstFrame(filePath, outputDir);
        if (result.success && result.thumbnailPath) {
            return result.thumbnailPath;
        }
        throw new Error(result.error || 'Failed to extract first frame');
    }

    static async convertToMp4(
        inputPath: string,
        outputPath: string,
        settings: VideoSettingsConfig,
        onProgress: (progress: VideoConversionProgress) => void
    ): Promise<string> {
        const conversionId = `conversion-${Date.now()}-${Math.random()}`;
        
        // Set up progress listener
        const progressCallback = (id: string, progress: VideoConversionProgress) => {
            if (id === conversionId) {
                onProgress(progress);
            }
        };
        
        window.electronAPI.onConversionProgress(progressCallback);
        
        try {
            const result = await window.electronAPI.convertVideo(inputPath, outputPath, settings, conversionId);
            if (result.success && result.convertedPath) {
                return result.convertedPath;
            }
            throw new Error(result.error || 'Failed to convert video');
        } finally {
            window.electronAPI.removeConversionProgressListener(progressCallback);
        }
    }

    static async optimizeForSocialMedia(
        inputPath: string,
        outputPath: string,
        settings: VideoSettingsConfig,
        onProgress: (progress: VideoConversionProgress) => void
    ): Promise<string> {
        const conversionId = `social-conversion-${Date.now()}-${Math.random()}`;
        
        // Set up progress listener
        const progressCallback = (id: string, progress: VideoConversionProgress) => {
            if (id === conversionId) {
                onProgress(progress);
            }
        };
        
        window.electronAPI.onConversionProgress(progressCallback);
        
        try {
            const result = await window.electronAPI.optimizeForSocialMedia(inputPath, outputPath, settings, conversionId);
            if (result.success && result.convertedPath) {
                return result.convertedPath;
            }
            throw new Error(result.error || 'Failed to optimize video for social media');
        } finally {
            window.electronAPI.removeConversionProgressListener(progressCallback);
        }
    }
}