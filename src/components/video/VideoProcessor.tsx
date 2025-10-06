import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ReloadIcon, StopIcon, PlayIcon } from '@radix-ui/react-icons';
import { VideoConversionProgress } from '@/preload/preload';
import VideoSettings, { VideoSettingsConfig } from './VideoSettings';

interface VideoProcessorProps {
    isProcessing: boolean;
    progress: VideoConversionProgress | null;
    onStartConversion: (settings: VideoSettingsConfig) => void;
    onCancelConversion: () => void;
    selectedVideo: File | null;
    conversionStatus: 'idle' | 'processing' | 'completed' | 'error';
    errorMessage?: string;
}

const VideoProcessor: React.FC<VideoProcessorProps> = ({
    isProcessing,
    progress,
    onStartConversion,
    onCancelConversion,
    selectedVideo,
    conversionStatus,
    errorMessage
}) => {
    const [videoSettings, setVideoSettings] = useState<VideoSettingsConfig>({
        quality: 'medium',
        resolution: '1080p',
        bitrate: 5000,
        preset: 'medium',
        socialMediaOptimization: false,
        platform: 'general',
        enableHardwareAcceleration: true
    });
    const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('');

    useEffect(() => {
        if (progress && progress.progress > 0) {
            const elapsed = new Date().getTime();
            const estimated = (elapsed * (100 - progress.progress)) / progress.progress;
            const minutes = Math.floor(estimated / 60000);
            const seconds = Math.floor((estimated % 60000) / 1000);
            setEstimatedTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
    }, [progress]);

    const formatFileSize = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Video Conversion
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Convert your video to MP4 for social media
                </p>
            </div>

            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex flex-col justify-center">
                {conversionStatus === 'idle' && (
                    <div className="text-center">
                        <div className="mb-6">
                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PlayIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400">
                                {selectedVideo ? 'Ready to convert' : 'Upload a video to start'}
                            </p>
                        </div>

                        {selectedVideo && (
                            <div className="space-y-3">
                                <Button
                                    onClick={() => onStartConversion(videoSettings)}
                                    disabled={!selectedVideo}
                                    className="w-full"
                                    style={{
                                        background: 'linear-gradient(135deg, #153592 0%, #26c9d5 100%)',
                                        backgroundSize: '200% 200%'
                                    }}
                                >
                                    <PlayIcon className="w-4 h-4 mr-2" />
                                    Start Conversion
                                </Button>
                                
                                <div className="flex justify-center">
                                    <VideoSettings
                                        config={videoSettings}
                                        onConfigChange={setVideoSettings}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {conversionStatus === 'processing' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <ReloadIcon className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Converting Video...
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Please wait while we process your video
                            </p>
                        </div>

                        {progress && (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        <span>Progress</span>
                                        <span>{Math.round(progress.progress)}%</span>
                                    </div>
                                    <Progress value={progress.progress} className="w-full" />
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400">Time Processed</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {progress.timemark}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400">Current FPS</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {Math.round(progress.currentFps)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400">Output Size</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {formatFileSize(progress.targetSize * 1024)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400">Est. Time Left</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {estimatedTimeRemaining || '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Button
                                onClick={onCancelConversion}
                                variant="outline"
                                className="w-full"
                            >
                                <StopIcon className="w-4 h-4 mr-2" />
                                Cancel Conversion
                            </Button>
                            
                            <div className="flex justify-center">
                                <VideoSettings
                                    config={videoSettings}
                                    onConfigChange={setVideoSettings}
                                    disabled={true}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {conversionStatus === 'completed' && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Conversion Complete!
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Your video has been successfully converted to MP4
                        </p>
                    </div>
                )}

                {conversionStatus === 'error' && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Conversion Failed
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {errorMessage || 'An error occurred during conversion'}
                        </p>
                        {selectedVideo && (
                            <div className="space-y-3">
                                <Button
                                    onClick={() => onStartConversion(videoSettings)}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <ReloadIcon className="w-4 h-4 mr-2" />
                                    Try Again
                                </Button>
                                
                                <div className="flex justify-center">
                                    <VideoSettings
                                        config={videoSettings}
                                        onConfigChange={setVideoSettings}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoProcessor;