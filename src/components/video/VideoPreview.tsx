import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon, PlayIcon, ReloadIcon } from '@radix-ui/react-icons';

interface VideoPreviewProps {
    convertedVideoPath: string | null;
    isConverting: boolean;
    onDownload: () => void;
    onShowInFinder: () => void;
    thumbnailUrl: string | null;
    originalFileName: string;
    fileSize?: number;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
    convertedVideoPath,
    isConverting,
    onDownload,
    onShowInFinder,
    thumbnailUrl,
    originalFileName,
    fileSize
}) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = useCallback(async () => {
        setIsDownloading(true);
        try {
            await onDownload();
        } finally {
            setIsDownloading(false);
        }
    }, [onDownload]);

    const formatFileSize = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getOutputFileName = () => {
        const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, "");
        return `${nameWithoutExt}_converted.mp4`;
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Preview & Download
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Download your converted MP4 video
                </p>
            </div>

            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex flex-col">
                {!convertedVideoPath && !isConverting && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PlayIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                            Converted video will appear here
                        </p>
                    </div>
                )}

                {isConverting && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PlayIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                            Your video preview will be ready soon
                        </p>
                    </div>
                )}

                {convertedVideoPath && (
                    <div className="flex-1 flex flex-col">
                        <div className="flex-1 flex flex-col items-center justify-center mb-6">
                            {thumbnailUrl ? (
                                <div className="relative mb-4 mx-auto max-w-64 max-h-40">
                                    <img 
                                        src={thumbnailUrl} 
                                        alt="Converted video thumbnail" 
                                        className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg shadow-lg bg-gray-100 dark:bg-gray-800"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-black bg-opacity-50 rounded-full p-4">
                                            <PlayIcon className="w-10 h-10 text-white" />
                                        </div>
                                    </div>
                                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                        MP4
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-64 max-h-40 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4 mx-auto">
                                    <PlayIcon className="w-16 h-16 text-gray-400" />
                                </div>
                            )}
                            
                            <div className="text-center">
                                <p className="font-medium text-gray-900 dark:text-white mb-1">
                                    {getOutputFileName()}
                                </p>
                                {fileSize && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatFileSize(fileSize)}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="w-full"
                                style={{
                                    background: 'linear-gradient(135deg, #153592 0%, #26c9d5 100%)',
                                    backgroundSize: '200% 200%'
                                }}
                            >
                                {isDownloading ? (
                                    <>
                                        <ReloadIcon className="w-4 h-4 mr-2 animate-spin" />
                                        Downloading...
                                    </>
                                ) : (
                                    <>
                                        <DownloadIcon className="w-4 h-4 mr-2" />
                                        Download MP4
                                    </>
                                )}
                            </Button>

                            <Button
                                onClick={onShowInFinder}
                                variant="outline"
                                className="w-full"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5L9 5H5a2 2 0 00-2 2z" />
                                </svg>
                                Show in Finder
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoPreview;