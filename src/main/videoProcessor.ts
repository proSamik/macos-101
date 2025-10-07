import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import * as path from 'path';

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

if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

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

export class VideoProcessor {
    private static getResolutionDimensions(resolution: string): [number, number] {
        const resolutions = {
            '720p': [1280, 720] as [number, number],
            '1080p': [1920, 1080] as [number, number],
            '1440p': [2560, 1440] as [number, number],
            '4k': [3840, 2160] as [number, number]
        };
        return resolutions[resolution as keyof typeof resolutions] || [1920, 1080];
    }

    private static calculateOptimalBitrate(
        settings: VideoSettingsConfig,
        duration: number
    ): number {
        if (settings.maxFileSizeMB >= 500) {
            return settings.bitrate;
        }

        // Fallback to user's bitrate if duration is invalid
        if (!duration || duration <= 0 || isNaN(duration)) {
            console.warn('Invalid duration for bitrate calculation, using user bitrate:', duration);
            return settings.bitrate;
        }

        const targetSizeBytes = settings.maxFileSizeMB * 1024 * 1024;
        const audioBitrate = 128;
        const overhead = 0.1;
        
        const availableForVideo = targetSizeBytes * (1 - overhead);
        const videoBitrate = Math.floor(
            (availableForVideo * 8) / (duration * 1000) - audioBitrate
        );
        
        const finalBitrate = Math.max(500, Math.min(videoBitrate, settings.bitrate));
        
        // Additional safety check
        if (isNaN(finalBitrate)) {
            console.warn('Calculated bitrate is NaN, using user bitrate');
            return settings.bitrate;
        }
        
        return finalBitrate;
    }
    static async getVideoMetadata(filePath: string): Promise<VideoMetadata> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
                if (err) {
                    reject(err);
                    return;
                }

                const videoStream = metadata.streams.find((stream: any) => stream.codec_type === 'video');
                if (!videoStream) {
                    reject(new Error('No video stream found'));
                    return;
                }

                resolve({
                    duration: metadata.format.duration || 0,
                    width: videoStream.width || 0,
                    height: videoStream.height || 0,
                    fps: eval(videoStream.r_frame_rate || '30') || 30,
                    format: metadata.format.format_name || ''
                });
            });
        });
    }

    static async extractFirstFrame(filePath: string, outputDir: string): Promise<string> {
        return new Promise((resolve, reject) => {
            // Use timestamp to ensure unique thumbnail filename
            const timestamp = Date.now();
            const thumbnailFilename = `thumbnail_${timestamp}.png`;
            const outputPath = path.join(outputDir, thumbnailFilename);
            
            ffmpeg(filePath)
                .screenshots({
                    timestamps: ['00:00:02.000'],
                    filename: thumbnailFilename,
                    folder: outputDir,
                    size: '320x?'  // Maintain aspect ratio, max width 320px
                })
                .on('end', () => {
                    resolve(outputPath);
                })
                .on('error', (err: any) => {
                    reject(err);
                });
        });
    }

    static async convertToMp4(
        inputPath: string,
        outputPath: string,
        settings: VideoSettingsConfig,
        onProgress: (progress: VideoConversionProgress) => void
    ): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const metadata = await this.getVideoMetadata(inputPath);
                const optimalBitrate = this.calculateOptimalBitrate(settings, metadata.duration);
                
                // Maintain original aspect ratio - only scale if needed for size constraints
                let videoFilter = '';
                if (settings.maxFileSizeMB < 500) {
                    // For file size constraints, we may need to reduce resolution
                    const [maxWidth, maxHeight] = this.getResolutionDimensions(settings.resolution);
                    videoFilter = `scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease`;
                } else {
                    // Maintain original resolution and aspect ratio
                    videoFilter = 'scale=trunc(iw/2)*2:trunc(ih/2)*2'; // Ensure even dimensions for h264
                }
                
                const outputOptions = [
                    '-c:v libx264',
                    `-preset ${settings.preset}`,
                    `-b:v ${optimalBitrate}k`,
                    '-c:a aac',
                    '-b:a 128k',
                    '-movflags +faststart',
                    `-vf ${videoFilter}`
                ];

                let command = ffmpeg(inputPath);
                
                // Add HEVC/H.265 input codec detection
                if (inputPath.toLowerCase().includes('.hevc') || inputPath.toLowerCase().includes('.h265')) {
                    command = command.inputOptions(['-c:v hevc']);
                }
                
                if (settings.enableHardwareAcceleration) {
                    command = command.inputOptions(['-hwaccel auto']);
                }

                command = command
                    .outputOptions(outputOptions)
                    .output(outputPath);

                command
                    .on('progress', (progress: any) => {
                        onProgress({
                            progress: progress.percent || 0,
                            timemark: progress.timemark || '00:00:00',
                            targetSize: progress.targetSize || 0,
                            currentFps: progress.currentFps || 0
                        });
                    })
                    .on('end', () => {
                        resolve(outputPath);
                    })
                    .on('error', (err: any) => {
                        console.error('FFmpeg conversion error:', err);
                        console.error('FFmpeg command that failed:', command._getArguments().join(' '));
                        reject(new Error(`FFmpeg conversion failed: ${err.message}`));
                    })
                    .on('stderr', (stderrLine: string) => {
                        console.log('FFmpeg stderr:', stderrLine);
                    })
                    .run();
            } catch (error) {
                reject(error);
            }
        });
    }

    static async optimizeForSocialMedia(
        inputPath: string,
        outputPath: string,
        settings: VideoSettingsConfig,
        onProgress: (progress: VideoConversionProgress) => void
    ): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const metadata = await this.getVideoMetadata(inputPath);
                const optimalBitrate = this.calculateOptimalBitrate(settings, metadata.duration);
                
                const platformSettings = {
                    instagram: {
                        maxWidth: 1080,
                        maxHeight: 1920, // Support both square and vertical
                        maxDuration: 60
                    },
                    twitter: {
                        maxWidth: 1080,
                        maxHeight: 1920, // Support vertical videos
                        maxDuration: 140
                    },
                    youtube: {
                        maxWidth: 1920,
                        maxHeight: 1080,
                        maxDuration: 0
                    },
                    facebook: {
                        maxWidth: 1280,
                        maxHeight: 720,
                        maxDuration: 240
                    },
                    general: {
                        maxWidth: 1920,
                        maxHeight: 1080,
                        maxDuration: 0
                    }
                };

                const platformSetting = platformSettings[settings.platform];
                
                // Maintain aspect ratio while respecting platform limits
                const videoFilter = `scale='min(${platformSetting.maxWidth},iw)':'min(${platformSetting.maxHeight},ih)':force_original_aspect_ratio=decrease`;
                
                const outputOptions = [
                    '-c:v libx264',
                    `-preset ${settings.preset}`,
                    `-b:v ${optimalBitrate}k`,
                    '-c:a aac',
                    '-b:a 128k',
                    '-movflags +faststart',
                    `-vf ${videoFilter}`
                ];

                let command = ffmpeg(inputPath);
                
                // Add HEVC/H.265 input codec detection
                if (inputPath.toLowerCase().includes('.hevc') || inputPath.toLowerCase().includes('.h265')) {
                    command = command.inputOptions(['-c:v hevc']);
                }
                
                if (settings.enableHardwareAcceleration) {
                    command = command.inputOptions(['-hwaccel auto']);
                }

                command = command.outputOptions(outputOptions);

                if (platformSetting.maxDuration > 0) {
                    command = command.duration(platformSetting.maxDuration);
                }

                command
                    .output(outputPath)
                    .on('progress', (progress: any) => {
                        onProgress({
                            progress: progress.percent || 0,
                            timemark: progress.timemark || '00:00:00',
                            targetSize: progress.targetSize || 0,
                            currentFps: progress.currentFps || 0
                        });
                    })
                    .on('end', () => {
                        resolve(outputPath);
                    })
                    .on('error', (err: any) => {
                        reject(err);
                    })
                    .run();
            } catch (error) {
                reject(error);
            }
        });
    }
}