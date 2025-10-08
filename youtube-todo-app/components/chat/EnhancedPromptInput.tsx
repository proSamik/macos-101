'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  GlobeIcon, 
  ImageIcon, 
  PaperclipIcon, 
  XIcon, 
  UploadIcon,
  AlertCircleIcon,
  CheckIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlobStorage } from '@/lib/blob-helpers';
import type { ChatStatus } from 'ai';

interface EnhancedPromptInputProps {
  onSubmit: (message: string, attachments?: string[]) => void;
  status: ChatStatus;
  model: string;
  onModelChange: (model: string) => void;
  webSearch: boolean;
  onWebSearchChange: (enabled: boolean) => void;
  models: Array<{ name: string; value: string }>;
  className?: string;
}

interface UploadedFile {
  file: File;
  url?: string;
  uploading: boolean;
  progress: number;
  error?: string;
}

export function EnhancedPromptInput({
  onSubmit,
  status,
  model,
  onModelChange,
  webSearch,
  onWebSearchChange,
  models,
  className,
}: EnhancedPromptInputProps) {
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file uploads
  const uploadFiles = async (files: File[]) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      file,
      uploading: true,
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload each file
    for (let i = 0; i < newFiles.length; i++) {
      const fileIndex = uploadedFiles.length + i;
      
      try {
        // Simulate progress updates
        const updateProgress = (progress: number) => {
          setUploadedFiles(prev => prev.map((f, idx) => 
            idx === fileIndex ? { ...f, progress } : f
          ));
        };

        updateProgress(10);

        const formData = new FormData();
        formData.append('files', newFiles[i].file);

        const response = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
        });

        updateProgress(90);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();
        const uploadedFile = result.files[0];

        updateProgress(100);

        // Update file with URL
        setUploadedFiles(prev => prev.map((f, idx) => 
          idx === fileIndex 
            ? { ...f, url: uploadedFile.url, uploading: false, progress: 100 }
            : f
        ));
      } catch (error) {
        setUploadedFiles(prev => prev.map((f, idx) => 
          idx === fileIndex 
            ? { ...f, uploading: false, error: error instanceof Error ? error.message : 'Upload failed' }
            : f
        ));
      }
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      if (!BlobStorage.validateFileType(file)) {
        errors.push(`${file.name}: Invalid file type`);
        return;
      }
      if (!BlobStorage.validateFileSize(file)) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length > 0) {
      console.error('File validation errors:', errors);
      // You might want to show these errors in a toast or alert
    }

    if (validFiles.length > 0) {
      uploadFiles(validFiles);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || uploadedFiles.some(f => f.url)) {
      const validUrls = uploadedFiles.filter(f => f.url).map(f => f.url!);
      onSubmit(input, validUrls);
      setInput('');
      setUploadedFiles([]);
    }
  };

  const hasUploadingFiles = uploadedFiles.some(f => f.uploading);
  const hasErrors = uploadedFiles.some(f => f.error);

  return (
    <div 
      className={cn("relative", className)}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragActive && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <UploadIcon className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium text-primary">Drop images here to upload</p>
          </div>
        </div>
      )}

      {/* File previews */}
      {uploadedFiles.length > 0 && (
        <div className="p-4 space-y-2 border-b">
          {uploadedFiles.map((file, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {file.error ? (
                    <AlertCircleIcon className="w-5 h-5 text-destructive" />
                  ) : file.uploading ? (
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <CheckIcon className="w-5 h-5 text-green-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">{file.file.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {BlobStorage.formatFileSize(file.file.size)}
                    </Badge>
                  </div>
                  
                  {file.uploading && (
                    <Progress value={file.progress} className="mt-2 h-1" />
                  )}
                  
                  {file.error && (
                    <p className="text-xs text-destructive mt-1">{file.error}</p>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(index)}
                  className="h-8 w-8 p-0"
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Input form */}
      <PromptInput onSubmit={handleSubmit} className="border-0 shadow-none">
        <PromptInputTextarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder="Type your message... (or drag & drop images)"
        />
        <PromptInputToolbar>
          <PromptInputTools>
            {/* File upload button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files)}
              accept="image/*"
              multiple
              className="hidden"
            />
            <PromptInputButton
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={hasUploadingFiles}
            >
              <PaperclipIcon size={16} />
              <span>Attach</span>
            </PromptInputButton>

            {/* Web search toggle */}
            <PromptInputButton
              variant={webSearch ? 'default' : 'ghost'}
              onClick={() => onWebSearchChange(!webSearch)}
            >
              <GlobeIcon size={16} />
              <span>Search</span>
            </PromptInputButton>

            {/* Model selector */}
            <PromptInputModelSelect
              onValueChange={onModelChange}
              value={model}
            >
              <PromptInputModelSelectTrigger>
                <PromptInputModelSelectValue />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                {models.map((model) => (
                  <PromptInputModelSelectItem key={model.value} value={model.value}>
                    {model.name}
                  </PromptInputModelSelectItem>
                ))}
              </PromptInputModelSelectContent>
            </PromptInputModelSelect>
          </PromptInputTools>
          
          <PromptInputSubmit 
            disabled={!input.trim() && !uploadedFiles.some(f => f.url) || hasUploadingFiles || hasErrors} 
            status={status} 
          />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}