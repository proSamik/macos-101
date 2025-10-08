'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Loader } from '@/components/ai-elements/loader';
import { EnhancedPromptInput } from './EnhancedPromptInput';
import { MessageDisplay } from './MessageDisplay';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MessageCircleIcon, SparklesIcon } from 'lucide-react';

interface ChatInterfaceProps {
  threadId?: string;
  className?: string;
}

const models = [
  {
    name: 'GPT 4o',
    value: 'openai/gpt-4o',
  },
  {
    name: 'Deepseek R1',
    value: 'deepseek/deepseek-r1',
  },
];

export function ChatInterface({ threadId, className }: ChatInterfaceProps) {
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Initialize chat with persistence support
  const { messages, sendMessage, status, setMessages } = useChat();

  // Load messages when threadId changes
  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const response = await fetch(`/api/chat/messages/${threadId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [threadId, setMessages]);

  const handleSubmit = async (text: string, uploadedFiles: string[] = []) => {
    if (!text.trim() && uploadedFiles.length === 0) return;

    // Send message to chat API with attachments 
    sendMessage(
      { text },
      {
        body: {
          model,
          webSearch,
          threadId,
          attachments: uploadedFiles,
        },
      }
    );

    // If there are uploaded files, update the local message to include images for UI display
    if (uploadedFiles.length > 0) {
      setTimeout(() => {
        setMessages(currentMessages => {
          const lastMessage = currentMessages[currentMessages.length - 1];
          if (lastMessage && lastMessage.role === 'user') {
            const updatedMessage = {
              ...lastMessage,
              content: [
                { type: 'text', text: (lastMessage as any).text || (lastMessage as any).content || '' },
                ...uploadedFiles.map(url => ({ type: 'image', image: url }))
              ]
            } as any;
            return [...currentMessages.slice(0, -1), updatedMessage];
          }
          return currentMessages;
        });
      }, 10);
    }
  };

  if (!threadId) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="bg-primary/10 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <MessageCircleIcon className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Welcome to Chat</h2>
            <p className="text-muted-foreground mb-6">
              Start a new conversation or select an existing one from the sidebar to begin chatting.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 justify-center">
                <SparklesIcon className="w-4 h-4" />
                <span>AI-powered conversations</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <SparklesIcon className="w-4 h-4" />
                <span>Image upload support</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <SparklesIcon className="w-4 h-4" />
                <span>Persistent chat history</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadingMessages) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading conversation...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Chat Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Chat</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {models.find(m => m.value === model)?.name || 'Unknown Model'}
              </Badge>
              {webSearch && (
                <Badge variant="secondary" className="text-xs">
                  Web Search
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 relative">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.length === 0 && status !== 'streaming' ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircleIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Start a conversation...</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <MessageDisplay key={message.id} message={message} />
              ))
            )}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background">
        <EnhancedPromptInput
          onSubmit={handleSubmit}
          status={status}
          model={model}
          onModelChange={setModel}
          webSearch={webSearch}
          onWebSearchChange={setWebSearch}
          models={models}
        />
      </div>
    </div>
  );
}