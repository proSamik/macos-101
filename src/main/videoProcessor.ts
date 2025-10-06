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

        const targetSizeBytes = settings.maxFileSizeMB * 1024 * 1024;
        const audioBitrate = 128;
        const overhead = 0.1;
        
        const availableForVideo = targetSizeBytes * (1 - overhead);
        const videoBitrate = Math.floor(
            (availableForVideo * 8) / (duration * 1000) - audioBitrate
        );
        
        return Math.max(500, Math.min(videoBitrate, settings.bitrate));
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
            const outputPath = path.join(outputDir, 'thumbnail.png');
            
            ffmpeg(filePath)
                .screenshots({
                    timestamps: ['00:00:02.000'],
                    filename: 'thumbnail.png',
                    folder: outputDir,
                    size: '320x240'
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
                const [width, height] = this.getResolutionDimensions(settings.resolution);
                const optimalBitrate = this.calculateOptimalBitrate(settings, metadata.duration);
                
                const outputOptions = [
                    '-c:v libx264',
                    `-preset ${settings.preset}`,
                    `-b:v ${optimalBitrate}k`,
                    '-c:a aac',
                    '-b:a 128k',
                    '-movflags +faststart',
                    `-vf scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`
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
                        resolution: '1080:1080',
                        maxDuration: 60
                    },
                    twitter: {
                        resolution: '1280:720',
                        maxDuration: 140
                    },
                    youtube: {
                        resolution: '1920:1080',
                        maxDuration: 0
                    },
                    facebook: {
                        resolution: '1280:720',
                        maxDuration: 240
                    },
                    general: {
                        resolution: `${this.getResolutionDimensions(settings.resolution).join(':')}`,
                        maxDuration: 0
                    }
                };

                const platformSetting = platformSettings[settings.platform];
                
                const outputOptions = [
                    '-c:v libx264',
                    `-preset ${settings.preset}`,
                    `-b:v ${optimalBitrate}k`,
                    '-c:a aac',
                    '-b:a 128k',
                    '-movflags +faststart',
                    `-vf scale=${platformSetting.resolution}:force_original_aspect_ratio=decrease,pad=${platformSetting.resolution}:(ow-iw)/2:(oh-ih)/2`
                ];

                let command = ffmpeg(inputPath);
                
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