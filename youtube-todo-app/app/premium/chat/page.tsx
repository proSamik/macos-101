'use client';

import React, { useState } from 'react';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { ProjectsSidebar } from '@/components/chat/ProjectsSidebar';
import { ThreadsList } from '@/components/chat/ThreadsList';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { v4 as uuidv4 } from 'uuid';

export default function ChatPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>();

  const handleProjectSelect = (projectId: string | undefined) => {
    setSelectedProjectId(projectId);
    // Reset thread selection when project changes
    setSelectedThreadId(undefined);
  };

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  const handleNewThread = async () => {
    try {
      // Create a new thread
      const response = await fetch('/api/chat/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title: undefined, // Will be auto-generated from first message
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedThreadId(data.thread.id);
      }
    } catch (error) {
      console.error('Failed to create new thread:', error);
      
      // Fallback: generate a temporary thread ID
      // In a real implementation, you might want to handle this better
      const tempThreadId = uuidv4();
      setSelectedThreadId(tempThreadId);
    }
  };

  return (
    <ChatLayout
      sidebar={
        <ProjectsSidebar
          selectedProjectId={selectedProjectId}
          onProjectSelect={handleProjectSelect}
        />
      }
      threadsList={
        <ThreadsList
          selectedProjectId={selectedProjectId}
          selectedThreadId={selectedThreadId}
          onThreadSelect={handleThreadSelect}
          onNewThread={handleNewThread}
        />
      }
      chatInterface={
        <ChatInterface
          threadId={selectedThreadId}
        />
      }
    />
  );
}