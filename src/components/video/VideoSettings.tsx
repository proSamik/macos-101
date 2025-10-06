import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { GearIcon } from '@radix-ui/react-icons';

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

interface VideoSettingsProps {
    config: VideoSettingsConfig;
    onConfigChange: (config: VideoSettingsConfig) => void;
    onStartConversion?: (config: VideoSettingsConfig) => void;
    disabled?: boolean;
}

const VideoSettings: React.FC<VideoSettingsProps> = ({
    config,
    onConfigChange,
    disabled = false
}) => {
    const [localConfig, setLocalConfig] = useState<VideoSettingsConfig>(config);
    const [isOpen, setIsOpen] = useState(false);

    const handleSave = () => {
        onConfigChange(localConfig);
        setIsOpen(false);
    };

    const handleReset = () => {
        const defaultConfig: VideoSettingsConfig = {
            quality: 'medium',
            resolution: '1080p',
            bitrate: 5000,
            preset: 'medium',
            socialMediaOptimization: false,
            platform: 'general',
            enableHardwareAcceleration: true,
            maxFileSizeMB: 50
        };
        setLocalConfig(defaultConfig);
    };

    const qualitySettings = {
        low: { bitrate: 2000, description: 'Smaller file size, lower quality' },
        medium: { bitrate: 5000, description: 'Balanced quality and file size' },
        high: { bitrate: 8000, description: 'High quality, larger file size' },
        ultra: { bitrate: 12000, description: 'Maximum quality, largest file size' }
    };

    const platformSettings = {
        instagram: { maxBitrate: 3500, resolution: '1080p', description: 'Square format, optimized for IG' },
        twitter: { maxBitrate: 2000, resolution: '720p', description: 'Compressed for quick loading' },
        youtube: { maxBitrate: 8000, resolution: '1080p', description: 'High quality for YT standards' },
        facebook: { maxBitrate: 4000, resolution: '720p', description: 'Optimized for FB video posts' },
        general: { maxBitrate: 10000, resolution: '1080p', description: 'General purpose MP4' }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className="flex items-center gap-2"
                >
                    <GearIcon className="w-4 h-4" />
                    Settings
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Video Conversion Settings</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                    {/* Quality Preset */}
                    <div className="space-y-3">
                        <Label className="text-base font-medium">Quality Preset</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(qualitySettings).map(([key, setting]) => (
                                <Button
                                    key={key}
                                    variant={localConfig.quality === key ? 'default' : 'outline'}
                                    className="flex flex-col items-start p-3 h-auto"
                                    onClick={() => setLocalConfig({
                                        ...localConfig,
                                        quality: key as any,
                                        bitrate: setting.bitrate
                                    })}
                                >
                                    <span className="font-medium capitalize">{key}</span>
                                    <span className="text-xs text-muted-foreground">{setting.description}</span>
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Resolution */}
                    <div className="space-y-3">
                        <Label className="text-base font-medium">Output Resolution</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {['720p', '1080p', '1440p', '4k'].map((res) => (
                                <Button
                                    key={res}
                                    variant={localConfig.resolution === res ? 'default' : 'outline'}
                                    onClick={() => setLocalConfig({...localConfig, resolution: res as any})}
                                >
                                    {res}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Bitrate */}
                    <div className="space-y-3">
                        <Label className="text-base font-medium">
                            Bitrate: {localConfig.bitrate} kbps
                        </Label>
                        <Slider
                            value={[localConfig.bitrate]}
                            onValueChange={([value]) => setLocalConfig({...localConfig, bitrate: value})}
                            max={15000}
                            min={1000}
                            step={500}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>1000 kbps (Low)</span>
                            <span>15000 kbps (Ultra)</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Encoding Preset */}
                    <div className="space-y-3">
                        <Label className="text-base font-medium">Encoding Speed</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { key: 'ultrafast', label: 'Ultra Fast', desc: 'Quick but larger files' },
                                { key: 'fast', label: 'Fast', desc: 'Good balance' },
                                { key: 'medium', label: 'Medium', desc: 'Recommended' },
                                { key: 'slow', label: 'Slow', desc: 'Better compression' },
                                { key: 'veryslow', label: 'Very Slow', desc: 'Best compression' }
                            ].map((preset) => (
                                <Button
                                    key={preset.key}
                                    variant={localConfig.preset === preset.key ? 'default' : 'outline'}
                                    className="flex flex-col items-center p-3 h-auto text-xs"
                                    onClick={() => setLocalConfig({...localConfig, preset: preset.key as any})}
                                >
                                    <span className="font-medium text-sm">{preset.label}</span>
                                    <span className="text-xs text-muted-foreground text-center">{preset.desc}</span>
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Social Media Optimization */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">Social Media Optimization</Label>
                            <Switch
                                checked={localConfig.socialMediaOptimization}
                                onCheckedChange={(checked) => setLocalConfig({
                                    ...localConfig,
                                    socialMediaOptimization: checked
                                })}
                            />
                        </div>
                        
                        {localConfig.socialMediaOptimization && (
                            <div className="space-y-2">
                                <Label className="text-sm">Platform</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(platformSettings).map(([key, setting]) => (
                                        <Button
                                            key={key}
                                            variant={localConfig.platform === key ? 'default' : 'outline'}
                                            className="flex flex-col items-start p-3 h-auto"
                                            onClick={() => setLocalConfig({
                                                ...localConfig,
                                                platform: key as any,
                                                bitrate: setting.maxBitrate,
                                                resolution: setting.resolution as any
                                            })}
                                        >
                                            <span className="font-medium capitalize">{key}</span>
                                            <span className="text-xs text-muted-foreground">{setting.description}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Hardware Acceleration */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base font-medium">Hardware Acceleration</Label>
                            <p className="text-sm text-muted-foreground">Use GPU acceleration when available</p>
                        </div>
                        <Switch
                            checked={localConfig.enableHardwareAcceleration}
                            onCheckedChange={(checked) => setLocalConfig({
                                ...localConfig,
                                enableHardwareAcceleration: checked
                            })}
                        />
                    </div>

                    <Separator />

                    {/* File Size Constraint */}
                    <div className="space-y-3">
                        <Label className="text-base font-medium">
                            Max File Size: {localConfig.maxFileSizeMB} MB
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Automatically adjust settings to stay under this file size limit
                        </p>
                        <Slider
                            value={[localConfig.maxFileSizeMB]}
                            onValueChange={([value]) => setLocalConfig({...localConfig, maxFileSizeMB: value})}
                            max={500}
                            min={10}
                            step={5}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>10 MB (Highly compressed)</span>
                            <span>500 MB (No constraint)</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={handleReset}>
                        Reset to Default
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            Apply Settings
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default VideoSettings;