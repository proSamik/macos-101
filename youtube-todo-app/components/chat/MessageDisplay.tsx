'use client';

import React from 'react';
import Image from 'next/image';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/source';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, DownloadIcon, ExternalLinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UIMessage } from 'ai';

interface MessageDisplayProps {
  message: UIMessage;
  className?: string;
}

interface AttachmentDisplayProps {
  url: string;
  filename?: string;
  type?: string;
  className?: string;
}

function AttachmentDisplay({ url, filename, type, className }: AttachmentDisplayProps) {
  const isImage = type?.startsWith('image/') || url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
  const displayName = filename || url.split('/').pop() || 'Attachment';

  if (isImage) {
    return (
      <div className={cn("relative group max-w-sm", className)}>
        <Image
          src={url}
          alt={displayName}
          width={400}
          height={300}
          className="rounded-lg max-w-full h-auto shadow-sm border"
          unoptimized
        />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0"
            asChild
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          </Button>
        </div>
        {filename && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              <ImageIcon className="w-3 h-3 mr-1" />
              {displayName}
            </Badge>
          </div>
        )}
      </div>
    );
  }

  // For non-image files
  return (
    <div className={cn("flex items-center gap-2 p-3 border rounded-lg bg-muted/30", className)}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{displayName}</p>
        {type && (
          <p className="text-xs text-muted-foreground">{type}</p>
        )}
      </div>
      <Button size="sm" variant="outline" asChild>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <DownloadIcon className="w-4 h-4" />
        </a>
      </Button>
    </div>
  );
}

function MessageAttachments({ attachments }: { attachments: string[] }) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="space-y-2 mb-3">
      {attachments.map((url, index) => (
        <AttachmentDisplay
          key={index}
          url={url}
          filename={`attachment-${index + 1}`}
        />
      ))}
    </div>
  );
}

export function MessageDisplay({ message, className }: MessageDisplayProps) {
  // Parse attachments from different sources
  const attachments = React.useMemo(() => {
    // First try the attachments property
    if (typeof message === 'object' && 'attachments' in message) {
      try {
        return JSON.parse((message as { attachments: string }).attachments) || [];
      } catch {
        // Continue to other sources
      }
    }
    
    // Then try extracting from content property (AI SDK format)
    if (message.content && Array.isArray(message.content)) {
      const imageUrls = message.content
        .filter((part: any) => part.type === 'image' && part.image)
        .map((part: any) => part.image);
      if (imageUrls.length > 0) {
        return imageUrls;
      }
    }
    
    // Finally try extracting from parts property
    if (message.parts && Array.isArray(message.parts)) {
      const imageUrls = message.parts
        .filter((part: any) => part.type === 'image' && part.image)
        .map((part: any) => part.image);
      if (imageUrls.length > 0) {
        return imageUrls;
      }
    }
    
    return [];
  }, [message]);

  return (
    <div className={className}>
      {/* Display Sources if this is an assistant message */}
      {message.role === 'assistant' && (
        <Sources>
          {message.parts?.map((part, i) => {
            switch (part.type) {
              case 'source-url':
                return (
                  <React.Fragment key={`${message.id}-${i}`}>
                    <SourcesTrigger
                      count={
                        message.parts?.filter(
                          (part) => part.type === 'source-url',
                        ).length || 0
                      }
                    />
                    <SourcesContent>
                      <Source
                        href={part.url}
                        title={part.url}
                      />
                    </SourcesContent>
                  </React.Fragment>
                );
              default:
                return null;
            }
          })}
        </Sources>
      )}

      <Message from={message.role} key={message.id}>
        <MessageContent>
          {/* Display attachments for user messages */}
          {message.role === 'user' && <MessageAttachments attachments={attachments} />}
          
          {/* Display message content from parts */}
          {message.parts?.map((part, i) => {
            switch (part.type) {
              case 'text':
                return (
                  <Response key={`${message.id}-${i}`}>
                    {part.text}
                  </Response>
                );
              case 'reasoning':
                return (
                  <Reasoning
                    key={`${message.id}-${i}`}
                    className="w-full"
                    isStreaming={false}
                  >
                    <ReasoningTrigger />
                    <ReasoningContent>{part.text}</ReasoningContent>
                  </Reasoning>
                );
              default:
                return null;
            }
          })}
          
          {/* Display message content from content array (AI SDK format) */}
          {message.content && Array.isArray(message.content) && (
            <>
              {message.content.map((part: any, i) => {
                switch (part.type) {
                  case 'text':
                    return (
                      <Response key={`${message.id}-content-${i}`}>
                        {part.text}
                      </Response>
                    );
                  case 'image':
                    // Images are displayed above in MessageAttachments
                    return null;
                  default:
                    return null;
                }
              })}
            </>
          )}
          
          {/* Fallback for messages without parts or content */}
          {(!message.parts || message.parts.length === 0) && 
           (!message.content || !Array.isArray(message.content)) && (
            <Response>
              {(message as { text?: string; content?: string }).text || 
               (typeof (message as { text?: string; content?: string }).content === 'string' ? 
                (message as { text?: string; content?: string }).content : 'No content')}
            </Response>
          )}
        </MessageContent>
      </Message>
    </div>
  );
}