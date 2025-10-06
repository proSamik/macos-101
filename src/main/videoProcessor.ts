import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import * as path from 'path';

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
                    timestamps: ['00:00:01.000'],
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
        onProgress: (progress: VideoConversionProgress) => void
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const command = ffmpeg(inputPath)
                .outputOptions([
                    '-c:v libx264',
                    '-preset medium',
                    '-crf 23',
                    '-c:a aac',
                    '-b:a 128k',
                    '-movflags +faststart',
                    '-vf scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2'
                ])
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
                    reject(err);
                })
                .run();
        });
    }

    static async optimizeForSocialMedia(
        inputPath: string,
        outputPath: string,
        platform: 'instagram' | 'twitter' | 'youtube' | 'facebook',
        onProgress: (progress: VideoConversionProgress) => void
    ): Promise<string> {
        const platformSettings = {
            instagram: {
                resolution: '1080:1080',
                bitrate: '3500k',
                maxDuration: 60
            },
            twitter: {
                resolution: '1280:720',
                bitrate: '2000k',
                maxDuration: 140
            },
            youtube: {
                resolution: '1920:1080',
                bitrate: '8000k',
                maxDuration: 0 // No limit
            },
            facebook: {
                resolution: '1280:720',
                bitrate: '4000k',
                maxDuration: 240
            }
        };

        const settings = platformSettings[platform];
        
        return new Promise((resolve, reject) => {
            let command = ffmpeg(inputPath)
                .outputOptions([
                    '-c:v libx264',
                    '-preset medium',
                    '-crf 23',
                    '-c:a aac',
                    '-b:a 128k',
                    '-movflags +faststart',
                    `-b:v ${settings.bitrate}`,
                    `-vf scale=${settings.resolution}:force_original_aspect_ratio=decrease,pad=${settings.resolution}:(ow-iw)/2:(oh-ih)/2`
                ]);

            if (settings.maxDuration > 0) {
                command = command.duration(settings.maxDuration);
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
        });
    }
}