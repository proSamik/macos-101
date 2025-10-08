'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  PlusIcon, 
  MessageCircleIcon, 
  SearchIcon, 
  EditIcon,
  TrashIcon,
  ClockIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatThread } from '@/lib/db/schema';

interface ThreadsListProps {
  selectedProjectId?: string;
  selectedThreadId?: string;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
  className?: string;
}

export function ThreadsList({
  selectedProjectId,
  selectedThreadId,
  onThreadSelect,
  onNewThread,
  className,
}: ThreadsListProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Fetch threads based on selected project
  const fetchThreads = async () => {
    try {
      const url = selectedProjectId 
        ? `/api/chat/threads?projectId=${selectedProjectId}`
        : '/api/chat/threads';
        
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads);
      }
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchThreads();
  }, [selectedProjectId]);

  // Filter threads based on search
  const filteredThreads = threads.filter(thread => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      thread.title?.toLowerCase().includes(query) ||
      thread.id.toLowerCase().includes(query)
    );
  });

  // Update thread title
  const handleUpdateThreadTitle = async (threadId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    try {
      const response = await fetch('/api/chat/threads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          title: newTitle,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setThreads(threads.map(t => t.id === threadId ? data.thread : t));
        setEditingThreadId(null);
        setEditingTitle('');
      }
    } catch (error) {
      console.error('Failed to update thread title:', error);
    }
  };

  // Delete thread
  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/chat/threads?threadId=${threadId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setThreads(threads.filter(t => t.id !== threadId));
        if (selectedThreadId === threadId) {
          // Select another thread or create new one
          if (threads.length > 1) {
            const remainingThreads = threads.filter(t => t.id !== threadId);
            onThreadSelect(remainingThreads[0].id);
          } else {
            onNewThread();
          }
        }
      }
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  };

  // Format time
  const formatTime = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const startEditing = (thread: ChatThread) => {
    setEditingThreadId(thread.id);
    setEditingTitle(thread.title || 'Untitled');
  };

  const cancelEditing = () => {
    setEditingThreadId(null);
    setEditingTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, threadId: string) => {
    if (e.key === 'Enter') {
      handleUpdateThreadTitle(threadId, editingTitle);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  if (loading) {
    return (
      <div className={cn("flex flex-col h-full p-4", className)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Conversations</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading conversations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <Button size="sm" onClick={onNewThread}>
          <PlusIcon className="w-4 h-4 mr-1" />
          New
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Threads List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {filteredThreads.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircleIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={onNewThread}
                >
                  Start a new conversation
                </Button>
              )}
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <Card
                key={thread.id}
                className={cn(
                  "p-3 cursor-pointer hover:bg-accent transition-colors group",
                  selectedThreadId === thread.id && "bg-accent border-primary"
                )}
                onClick={() => onThreadSelect(thread.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircleIcon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                      {editingThreadId === thread.id ? (
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => handleKeyPress(e, thread.id)}
                          onBlur={() => handleUpdateThreadTitle(thread.id, editingTitle)}
                          className="h-auto p-0 border-none bg-transparent focus-visible:ring-0"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h3 className="font-medium truncate text-sm">
                          {thread.title || 'Untitled Conversation'}
                        </h3>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ClockIcon className="w-3 h-3" />
                      {formatTime(thread.updatedAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(thread);
                      }}
                    >
                      <EditIcon className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteThread(thread.id);
                      }}
                    >
                      <TrashIcon className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}