import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ReloadIcon, UploadIcon, PlayIcon } from '@radix-ui/react-icons';

interface VideoUploadProps {
    onVideoSelect: (file: File) => void;
    isProcessing: boolean;
    selectedVideo: File | null;
    thumbnailUrl: string | null;
}

const VideoUpload: React.FC<VideoUploadProps> = ({
    onVideoSelect,
    isProcessing,
    selectedVideo,
    thumbnailUrl
}) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileSelect = useCallback(async () => {
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
                onVideoSelect(file);
            }
        } catch (error) {
            console.error('Error selecting video:', error);
        }
    }, [onVideoSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        const videoFile = files.find(file => file.type.startsWith('video/'));
        
        if (videoFile) {
            onVideoSelect(videoFile);
        }
    }, [onVideoSelect]);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Video Upload
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload your video to convert to MP4
                </p>
            </div>

            <div 
                className={`flex-1 border-2 border-dashed rounded-lg p-6 transition-colors ${
                    isDragOver 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                        : 'border-gray-300 dark:border-gray-600'
                } ${
                    selectedVideo ? 'bg-gray-50 dark:bg-gray-800' : ''
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {selectedVideo ? (
                    <div className="h-full flex flex-col items-center justify-center">
                        {thumbnailUrl ? (
                            <div className="relative mb-4 mx-auto max-w-48 max-h-32">
                                <img 
                                    src={thumbnailUrl} 
                                    alt="Video thumbnail" 
                                    className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg shadow-md bg-gray-100 dark:bg-gray-800"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-black bg-opacity-50 rounded-full p-3">
                                        <PlayIcon className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                            </div>
                        ) : isProcessing ? (
                            <div className="mb-4 p-8">
                                <ReloadIcon className="w-12 h-12 animate-spin text-gray-400 mx-auto" />
                            </div>
                        ) : (
                            <div className="mb-4 p-8 bg-gray-200 dark:bg-gray-700 rounded-lg">
                                <PlayIcon className="w-12 h-12 text-gray-400 mx-auto" />
                            </div>
                        )}
                        
                        <div className="text-center">
                            <p className="font-medium text-gray-900 dark:text-white mb-1">
                                {selectedVideo.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {(selectedVideo.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                        </div>

                        <Button
                            onClick={handleFileSelect}
                            variant="outline"
                            className="mt-4"
                            disabled={isProcessing}
                        >
                            <UploadIcon className="w-4 h-4 mr-2" />
                            Choose Different Video
                        </Button>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <UploadIcon className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Upload Video
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                            Drag and drop a video file here, or click to browse
                        </p>
                        <Button
                            onClick={handleFileSelect}
                            className="mb-4"
                            style={{
                                background: 'linear-gradient(135deg, #153592 0%, #26c9d5 100%)',
                                backgroundSize: '200% 200%'
                            }}
                        >
                            <UploadIcon className="w-4 h-4 mr-2" />
                            Choose Video
                        </Button>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Supports: MP4, AVI, MOV, MKV, WebM, FLV, WMV
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoUpload;