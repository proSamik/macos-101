'use client'

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import SuccessModal from '@/components/ui/success-modal';
import VideoUpload from '@/components/video/VideoUpload';
import VideoProcessor from '@/components/video/VideoProcessor';
import VideoPreview from '@/components/video/VideoPreview';
import { VideoService } from '@/services/videoService';
import { VideoConversionProgress, VideoSettingsConfig } from '@/preload/preload';
import { UploadIcon } from '@radix-ui/react-icons';
import ogThumbnail from './og-thumbnail.webp';

const App = () => {
    const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [convertedVideoPath, setConvertedVideoPath] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [conversionProgress, setConversionProgress] = useState<VideoConversionProgress | null>(null);
    const [conversionStatus, setConversionStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
    const [savedFilePath, setSavedFilePath] = useState<string>('');
    const [savedFileName, setSavedFileName] = useState<string>('');
    const [convertedFileSize, setConvertedFileSize] = useState<number>(0);
    const [currentVideoPath, setCurrentVideoPath] = useState<string>('');

    const handleVideoSelect = useCallback(async (file: File) => {
        setSelectedVideo(file);
        setConversionStatus('idle');
        setThumbnailUrl(null);
        setConvertedVideoPath(null);
        setCurrentVideoPath(''); // Clear old path immediately
        setIsProcessing(true);
        
        try {
            const tempDir = await window.electronAPI.getTempDir();
            // Use timestamp to ensure unique filename
            const timestamp = Date.now();
            const fileExtension = file.name.split('.').pop() || 'mp4';
            const uniqueFileName = `video_${timestamp}.${fileExtension}`;
            const filePath = `${tempDir}/${uniqueFileName}`;
            
            const buffer = await file.arrayBuffer();
            await window.electronAPI.writeFile(filePath, new Uint8Array(buffer));
            
            // Store the current video path for conversion
            console.log('Setting currentVideoPath to:', filePath);
            console.log('New video file name:', file.name);
            setCurrentVideoPath(filePath);
            
            const thumbnailPath = await VideoService.extractFirstFrame(filePath, tempDir);
            const thumbnailUrl = await window.electronAPI.getFileUrl(thumbnailPath);
            if (thumbnailUrl.success && thumbnailUrl.url) {
                // Add timestamp to prevent caching issues
                const urlWithTimestamp = `${thumbnailUrl.url}?t=${Date.now()}`;
                setThumbnailUrl(urlWithTimestamp);
            }
        } catch (error) {
            console.error('Error processing video:', error);
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const handleUploadVideo = async () => {
        try {
            const result = await window.electronAPI.showOpenDialog({
                filters: [
                    { name: 'Video Files', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', 'm4v', 'hevc', 'h265'] }
                ]
            });
            if (result.success && result.filePath) {
                const file = new File([await fetch(`file://${result.filePath}`).then(r => r.blob())], 
                    result.filePath.split('/').pop() || 'video', 
                    { type: 'video/mp4' }
                );
                await handleVideoSelect(file);
            }
        } catch (error) {
            console.error('Error uploading video:', error);
        }
    };

    const handleStartConversion = useCallback(async (settings: VideoSettingsConfig) => {
        if (!selectedVideo || !currentVideoPath) {
            console.error('No video selected or currentVideoPath is empty');
            return;
        }
        
        // Ask for save location first
        try {
            const outputFileName = generateOutputFileName(settings, selectedVideo.name);
            const result = await window.electronAPI.showSaveDialog(outputFileName);
            
            if (result.canceled || !result.filePath) {
                return; // User canceled save dialog
            }
            
            const finalOutputPath = result.filePath;
            setSavedFilePath(finalOutputPath);
            setSavedFileName(finalOutputPath.split('/').pop() || 'converted.mp4');
            
            setConversionStatus('processing');
            setIsProcessing(true);
            setConversionProgress(null);
            
            const tempDir = await window.electronAPI.getTempDir();
            const inputPath = currentVideoPath; // Use the stored unique path
            console.log('Converting video from path:', inputPath);
            console.log('Current video path state:', currentVideoPath);
            console.log('Selected video name:', selectedVideo?.name);
            const timestamp = Date.now();
            const tempOutputPath = `${tempDir}/converted_${timestamp}.mp4`;
            
            const convertedPath = await VideoService.convertToMp4(
                inputPath,
                tempOutputPath,
                settings,
                (progress) => {
                    setConversionProgress(progress);
                }
            );
            
            // Copy to final location
            await window.electronAPI.copyFile(convertedPath, finalOutputPath);
            
            const stats = await window.electronAPI.getFileStats(finalOutputPath);
            setConvertedFileSize(stats.size);
            setConvertedVideoPath(finalOutputPath);
            setConversionStatus('completed');
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Conversion error:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Conversion failed');
            setConversionStatus('error');
        } finally {
            setIsProcessing(false);
        }
    }, [selectedVideo, currentVideoPath]);

    const handleCancelConversion = useCallback(() => {
        setConversionStatus('idle');
        setIsProcessing(false);
        setConversionProgress(null);
    }, []);

    const handleDownload = useCallback(async () => {
        if (!convertedVideoPath) return;
        
        try {
            const result = await window.electronAPI.showSaveDialog(
                selectedVideo?.name.replace(/\.[^/.]+$/, '') + '_converted.mp4'
            );
            
            if (!result.canceled && result.filePath) {
                await window.electronAPI.copyFile(convertedVideoPath, result.filePath);
                setSavedFilePath(result.filePath);
                setSavedFileName(result.filePath.split('/').pop() || 'converted.mp4');
                setShowSuccessModal(true);
            }
        } catch (error) {
            console.error('Download error:', error);
        }
    }, [convertedVideoPath, selectedVideo]);

    const handleShowInFinder = useCallback(async () => {
        if (convertedVideoPath) {
            await window.electronAPI.showInFinder(convertedVideoPath);
        }
    }, [convertedVideoPath]);

    const handleCloseModal = useCallback(() => {
        setShowSuccessModal(false);
        setSavedFilePath('');
        setSavedFileName('');
    }, []);

    const handleShowInFinderFromModal = useCallback(async () => {
        if (savedFilePath) {
            await window.electronAPI.showInFinder(savedFilePath);
            handleCloseModal();
        }
    }, [savedFilePath, handleCloseModal]);

    const handleConvertAgain = useCallback(() => {
        setConversionStatus('idle');
        setConvertedVideoPath(null);
        setConversionProgress(null);
        setShowSuccessModal(false);
        setSavedFilePath('');
        setSavedFileName('');
        setErrorMessage('');
        // Keep currentVideoPath so user can convert the same video again
    }, []);

    const generateOutputFileName = useCallback((settings: VideoSettingsConfig, originalName: string) => {
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
        const parts = [nameWithoutExt];
        
        // Add quality info
        if (settings.maxFileSizeMB < 500) {
            parts.push(`${settings.maxFileSizeMB}MB`);
        } else if (settings.socialMediaOptimization) {
            parts.push(settings.platform);
        } else {
            parts.push(settings.quality);
            parts.push(settings.resolution);
        }
        
        // Add preset if not using max file size
        if (settings.maxFileSizeMB >= 500) {
            parts.push(settings.preset);
        }
        
        return `${parts.join('_')}.mp4`;
    }, []);
    
    return (
        <div className="h-screen w-full overflow-hidden">
            <header className='flex flex-row items-center justify-between p-6 px-8 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60' style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="32" viewBox="0 0 375 122.25" className="h-8">
                    <g transform="matrix(1, 0, 0, 1, 3, 4)">
                        <g fill="#153592" fillOpacity="1">
                            <g transform="translate(1.525528, 80.262872)">
                                <path d="M 35.578125 2.578125 C 29.546875 2.578125 24.113281 1.632812 19.28125 -0.25 C 14.445312 -2.132812 10.535156 -4.910156 7.546875 -8.578125 C 4.566406 -12.253906 2.804688 -16.726562 2.265625 -22 L 18.296875 -24.984375 C 18.847656 -20.597656 20.769531 -17.082031 24.0625 -14.4375 C 27.351562 -11.800781 31.429688 -10.484375 36.296875 -10.484375 C 40.679688 -10.484375 44.140625 -11.390625 46.671875 -13.203125 C 49.210938 -15.023438 50.484375 -17.34375 50.484375 -20.15625 C 50.484375 -22.414062 49.523438 -24.25 47.609375 -25.65625 C 45.691406 -27.0625 42.570312 -28.207031 38.25 -29.09375 L 28.078125 -31.046875 C 19.984375 -32.628906 14.066406 -35.097656 10.328125 -38.453125 C 6.597656 -41.816406 4.734375 -46.378906 4.734375 -52.140625 C 4.734375 -56.929688 5.984375 -61.09375 8.484375 -64.625 C 10.984375 -68.15625 14.441406 -70.894531 18.859375 -72.84375 C 23.285156 -74.800781 28.3125 -75.78125 33.9375 -75.78125 C 39.070312 -75.78125 43.710938 -74.90625 47.859375 -73.15625 C 52.015625 -71.414062 55.410156 -68.96875 58.046875 -65.8125 C 60.679688 -62.65625 62.3125 -58.953125 62.9375 -54.703125 L 47.203125 -51.203125 C 46.722656 -54.773438 45.25 -57.601562 42.78125 -59.6875 C 40.3125 -61.78125 37.296875 -62.828125 33.734375 -62.828125 C 30.160156 -62.828125 27.3125 -61.96875 25.1875 -60.25 C 23.0625 -58.539062 22 -56.382812 22 -53.78125 C 22 -51.582031 22.875 -49.832031 24.625 -48.53125 C 26.375 -47.226562 29.132812 -46.203125 32.90625 -45.453125 L 43.296875 -43.5 C 51.648438 -42.125 57.78125 -39.6875 61.6875 -36.1875 C 65.601562 -32.695312 67.5625 -27.96875 67.5625 -22 C 67.5625 -16.925781 66.207031 -12.539062 63.5 -8.84375 C 60.789062 -5.144531 57.035156 -2.316406 52.234375 -0.359375 C 47.429688 1.597656 41.878906 2.578125 35.578125 2.578125 Z M 35.578125 2.578125 "/>
                            </g>
                            <g transform="translate(70.625707, 80.262872)">
                                <path d="M 21.1875 1.546875 C 15.769531 1.546875 11.515625 -0.03125 8.421875 -3.1875 C 5.335938 -6.34375 3.796875 -10.726562 3.796875 -16.34375 L 3.796875 -52.640625 L 19.53125 -52.640625 L 19.53125 -21.1875 C 19.53125 -18.238281 20.316406 -15.890625 21.890625 -14.140625 C 23.472656 -12.390625 25.632812 -11.515625 28.375 -11.515625 C 31.800781 -11.515625 34.578125 -12.628906 36.703125 -14.859375 C 38.828125 -17.085938 39.890625 -19.984375 39.890625 -23.546875 L 39.890625 -52.640625 L 55.625 -52.640625 L 55.625 0 L 42.359375 0 L 40 -9.5625 L 39.890625 -9.5625 C 37.972656 -6 35.421875 -3.253906 32.234375 -1.328125 C 29.046875 0.585938 25.363281 1.546875 21.1875 1.546875 Z M 21.1875 1.546875 "/>
                            </g>
                            <g transform="translate(130.471386, 80.262872)">
                                <path d="M 38.15625 1.546875 C 29.65625 1.546875 23.519531 -2.328125 19.75 -10.078125 L 19.640625 -10.078125 L 17.28125 0 L 4.109375 0 L 4.109375 -76.296875 L 19.84375 -76.296875 L 19.84375 -42.578125 L 19.953125 -42.578125 C 23.722656 -50.316406 29.789062 -54.1875 38.15625 -54.1875 C 42.738281 -54.1875 46.796875 -53.019531 50.328125 -50.6875 C 53.859375 -48.363281 56.617188 -45.125 58.609375 -40.96875 C 60.597656 -36.820312 61.59375 -31.941406 61.59375 -26.328125 C 61.59375 -20.773438 60.597656 -15.90625 58.609375 -11.71875 C 56.617188 -7.539062 53.859375 -4.285156 50.328125 -1.953125 C 46.796875 0.378906 42.738281 1.546875 38.15625 1.546875 Z M 32.5 -11.71875 C 36.40625 -11.71875 39.609375 -13.101562 42.109375 -15.875 C 44.609375 -18.65625 45.859375 -22.140625 45.859375 -26.328125 C 45.859375 -30.503906 44.609375 -33.976562 42.109375 -36.75 C 39.609375 -39.53125 36.40625 -40.921875 32.5 -40.921875 C 28.65625 -40.921875 25.484375 -39.53125 22.984375 -36.75 C 20.484375 -33.976562 19.234375 -30.503906 19.234375 -26.328125 C 19.234375 -23.578125 19.796875 -21.101562 20.921875 -18.90625 C 22.054688 -16.71875 23.632812 -14.972656 25.65625 -13.671875 C 27.675781 -12.367188 29.957031 -11.71875 32.5 -11.71875 Z M 32.5 -11.71875 "/>
                            </g>
                        </g>
                        <g fill="#26c9d5" fillOpacity="1">
                            <g transform="translate(194.467932, 80.262872)">
                                <path d="M 30.75 2.0625 C 25.125 2.0625 20.164062 0.863281 15.875 -1.53125 C 11.59375 -3.9375 8.269531 -7.265625 5.90625 -11.515625 C 3.539062 -15.765625 2.359375 -20.703125 2.359375 -26.328125 C 2.359375 -31.941406 3.503906 -36.875 5.796875 -41.125 C 8.097656 -45.375 11.320312 -48.695312 15.46875 -51.09375 C 19.625 -53.5 24.40625 -54.703125 29.8125 -54.703125 C 34.269531 -54.703125 38.296875 -53.878906 41.890625 -52.234375 C 45.492188 -50.585938 48.492188 -48.289062 50.890625 -45.34375 C 53.296875 -42.394531 54.875 -38.96875 55.625 -35.0625 L 41.34375 -31.359375 C 40.789062 -34.785156 39.46875 -37.40625 37.375 -39.21875 C 35.28125 -41.039062 32.898438 -41.953125 30.234375 -41.953125 C 26.671875 -41.953125 23.738281 -40.507812 21.4375 -37.625 C 19.144531 -34.75 18 -30.984375 18 -26.328125 C 18.0625 -21.660156 19.34375 -17.882812 21.84375 -15 C 24.351562 -12.125 27.492188 -10.6875 31.265625 -10.6875 C 34.554688 -10.6875 37.382812 -11.816406 39.75 -14.078125 C 42.113281 -16.347656 43.5 -19.265625 43.90625 -22.828125 L 58.515625 -20.765625 C 58.035156 -16.242188 56.539062 -12.269531 54.03125 -8.84375 C 51.53125 -5.414062 48.273438 -2.738281 44.265625 -0.8125 C 40.253906 1.101562 35.75 2.0625 30.75 2.0625 Z M 30.75 2.0625 "/>
                            </g>
                            <g transform="translate(254.724925, 80.262872)">
                                <path d="M 4.109375 0 L 4.109375 -76.296875 L 19.84375 -76.296875 L 19.84375 0 Z M 4.109375 0 "/>
                            </g>
                            <g transform="translate(278.683766, 80.262872)">
                                <path d="M 12.34375 -59.84375 C 9.59375 -59.84375 7.359375 -60.664062 5.640625 -62.3125 C 3.929688 -63.957031 3.078125 -66.117188 3.078125 -68.796875 C 3.078125 -71.535156 3.929688 -73.726562 5.640625 -75.375 C 7.359375 -77.019531 9.59375 -77.84375 12.34375 -77.84375 C 15.15625 -77.84375 17.414062 -77.019531 19.125 -75.375 C 20.84375 -73.726562 21.703125 -71.535156 21.703125 -68.796875 C 21.703125 -66.117188 20.84375 -63.957031 19.125 -62.3125 C 17.414062 -60.664062 15.15625 -59.84375 12.34375 -59.84375 Z M 4.53125 0 L 4.53125 -52.640625 L 20.15625 -52.640625 L 20.15625 0 Z M 4.53125 0 "/>
                            </g>
                            <g transform="translate(303.465232, 80.262872)">
                                <path d="M 4.109375 21.59375 L 4.109375 -52.640625 L 17.28125 -52.640625 L 19.640625 -42.578125 L 19.75 -42.578125 C 23.519531 -50.316406 29.65625 -54.1875 38.15625 -54.1875 C 42.738281 -54.1875 46.796875 -53.019531 50.328125 -50.6875 C 53.859375 -48.363281 56.617188 -45.125 58.609375 -40.96875 C 60.597656 -36.820312 61.59375 -31.941406 61.59375 -26.328125 C 61.59375 -20.773438 60.597656 -15.90625 58.609375 -11.71875 C 56.617188 -7.539062 53.859375 -4.285156 50.328125 -1.953125 C 46.796875 0.378906 42.738281 1.546875 38.15625 1.546875 C 29.789062 1.546875 23.722656 -2.328125 19.953125 -10.078125 L 19.84375 -10.078125 L 19.84375 21.59375 Z M 32.5 -11.828125 C 36.40625 -11.828125 39.609375 -13.210938 42.109375 -15.984375 C 44.609375 -18.765625 45.859375 -22.210938 45.859375 -26.328125 C 45.859375 -30.578125 44.609375 -34.070312 42.109375 -36.8125 C 39.609375 -39.550781 36.40625 -40.921875 32.5 -40.921875 C 28.65625 -40.921875 25.484375 -39.53125 22.984375 -36.75 C 20.484375 -33.976562 19.234375 -30.503906 19.234375 -26.328125 C 19.234375 -22.210938 20.484375 -18.765625 22.984375 -15.984375 C 25.484375 -13.210938 28.65625 -11.828125 32.5 -11.828125 Z M 32.5 -11.828125 "/>
                            </g>
                        </g>
                    </g>
                </svg>
                
                <div className='hidden md:flex flex-col items-center text-center'>
                    <p className='text-sm font-bold text-black dark:text-white'>
                        Desktop Edition (Video Converter)
                    </p>
                </div>
                
                <div className='flex gap-2 items-center' style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    <Button onClick={handleUploadVideo} variant="secondary">
                        <UploadIcon className="w-4 h-4 mr-2" />
                        Upload Video
                    </Button>
                </div>
            </header>
            <Separator /> 
            {selectedVideo || conversionStatus !== 'idle' ? (
                <div className='flex flex-col h-[calc(100vh-100px)]'>
                    <div className='flex flex-row items-start justify-center gap-6 w-full flex-1 px-4 py-8 overflow-x-auto'>
                        <div className="flex-shrink-0 w-[320px] h-[500px]">
                            <VideoUpload
                                onVideoSelect={handleVideoSelect}
                                isProcessing={isProcessing}
                                selectedVideo={selectedVideo}
                                thumbnailUrl={thumbnailUrl}
                            />
                        </div>
                        
                        <div className="flex-shrink-0 w-[320px] h-[500px]">
                            <VideoProcessor
                                isProcessing={isProcessing}
                                progress={conversionProgress}
                                onStartConversion={handleStartConversion}
                                onCancelConversion={handleCancelConversion}
                                onConvertAgain={handleConvertAgain}
                                selectedVideo={selectedVideo}
                                conversionStatus={conversionStatus}
                                errorMessage={errorMessage}
                            />
                        </div>
                        
                        <div className="flex-shrink-0 w-[320px] h-[500px]">
                            <VideoPreview
                                convertedVideoPath={convertedVideoPath}
                                isConverting={conversionStatus === 'processing'}
                                onDownload={handleDownload}
                                onShowInFinder={handleShowInFinder}
                                thumbnailUrl={thumbnailUrl}
                                originalFileName={selectedVideo?.name || ''}
                                fileSize={convertedFileSize}
                            />
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-center">
                        <img 
                            src={ogThumbnail}
                            alt="App promotion"
                            className="cursor-pointer hover:opacity-80 transition-opacity max-w-md h-auto"
                            onClick={() => window.open('https://subclip.app', '_blank')}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-between min-h-screen w-full">
                    <div></div>
                    
                    <div className="text-center">
                        <p className="text-muted-foreground mb-6">
                            Get started by uploading a video or drag & drop one here
                        </p>
                        <button 
                            onClick={handleUploadVideo}
                            className="lg:h-14 md:w-[220px] w-full h-12 rounded-[8px] relative font-semibold text-white inline-flex items-center justify-center lg:w-[240px] text-lg leading-none overflow-hidden group"
                            style={{
                                background: 'linear-gradient(135deg, #153592 0%, #26c9d5 100%)',
                                backgroundSize: '200% 200%'
                            }}
                        >
                            <UploadIcon className="w-5 h-5 mr-2" />
                            Upload Video
                        </button>
                    </div>
                    
                    <div className="text-center pb-8">
                        <img 
                            src={ogThumbnail}
                            alt="App promotion"
                            className="cursor-pointer hover:opacity-80 transition-opacity mx-auto"
                            onClick={() => window.open('https://subclip.app', '_blank')}
                            style={{ width: '100%', height: 'auto' }}
                        />
                    </div>

                    <div></div>
                </div>
            )} 

            <SuccessModal 
                isOpen={showSuccessModal}
                onClose={handleCloseModal}
                onShowInFinder={handleShowInFinderFromModal}
                fileName={savedFileName}
            />
        </div>
    );
}

export default App;