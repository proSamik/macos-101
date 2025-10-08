import { db } from '@/lib/db';
import { chatProjects, chatThreads, chatMessages } from '@/lib/db/schema';
import type { ChatProject, NewChatProject, ChatThread, NewChatThread, ChatMessage, NewChatMessage } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { UIMessage } from 'ai';

export class ChatStorage {
  // Project Management
  static async createProject(userId: string, name: string, description?: string): Promise<ChatProject> {
    const project: NewChatProject = {
      id: uuidv4(),
      name,
      description,
      userId,
    };

    const [createdProject] = await db.insert(chatProjects).values(project).returning();
    return createdProject;
  }

  static async getUserProjects(userId: string): Promise<ChatProject[]> {
    return await db
      .select()
      .from(chatProjects)
      .where(eq(chatProjects.userId, userId))
      .orderBy(desc(chatProjects.updatedAt));
  }

  static async updateProject(projectId: string, userId: string, updates: Partial<Pick<ChatProject, 'name' | 'description'>>): Promise<ChatProject | null> {
    const [updatedProject] = await db
      .update(chatProjects)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(chatProjects.id, projectId), eq(chatProjects.userId, userId)))
      .returning();
    
    return updatedProject || null;
  }

  static async deleteProject(projectId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(chatProjects)
      .where(and(eq(chatProjects.id, projectId), eq(chatProjects.userId, userId)));
    
    return Array.isArray(result) ? result.length > 0 : ((result as { rowCount?: number }).rowCount ?? 0) > 0;
  }

  // Thread Management
  static async createThread(userId: string, projectId?: string, title?: string): Promise<ChatThread> {
    const thread: NewChatThread = {
      id: uuidv4(),
      title,
      projectId,
      userId,
    };

    const [createdThread] = await db.insert(chatThreads).values(thread).returning();
    return createdThread;
  }

  static async getUserThreads(userId: string, projectId?: string): Promise<ChatThread[]> {
    if (projectId) {
      return await db
        .select()
        .from(chatThreads)
        .where(and(eq(chatThreads.userId, userId), eq(chatThreads.projectId, projectId)))
        .orderBy(desc(chatThreads.updatedAt));
    }
    
    return await db
      .select()
      .from(chatThreads)
      .where(eq(chatThreads.userId, userId))
      .orderBy(desc(chatThreads.updatedAt));
  }

  static async getThread(threadId: string, userId: string): Promise<ChatThread | null> {
    const [thread] = await db
      .select()
      .from(chatThreads)
      .where(and(eq(chatThreads.id, threadId), eq(chatThreads.userId, userId)))
      .limit(1);
    
    return thread || null;
  }

  static async updateThread(threadId: string, userId: string, updates: Partial<Pick<ChatThread, 'title' | 'projectId'>>): Promise<ChatThread | null> {
    const [updatedThread] = await db
      .update(chatThreads)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(chatThreads.id, threadId), eq(chatThreads.userId, userId)))
      .returning();
    
    return updatedThread || null;
  }

  static async deleteThread(threadId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(chatThreads)
      .where(and(eq(chatThreads.id, threadId), eq(chatThreads.userId, userId)));
    
    return Array.isArray(result) ? result.length > 0 : ((result as { rowCount?: number }).rowCount ?? 0) > 0;
  }

  // Message Management
  static async saveMessage(threadId: string, message: UIMessage, attachments?: string[]): Promise<ChatMessage> {
    // Generate a new ID if the message doesn't have one or if it's empty
    const messageId = message.id && message.id.trim() !== '' ? message.id : uuidv4();
    
    // Extract content from different possible sources
    let content = '';
    if (message.parts && message.parts.length > 0) {
      // Try to find text parts and combine them
      const textParts = message.parts.filter((part: unknown) => 
        (part as { type?: string }).type === 'text' && (part as { text?: string }).text
      );
      content = textParts.map((part: unknown) => (part as { text?: string }).text || '').join(' ');
    } else {
      content = (message as { content?: string; text?: string }).content || 
                (message as { content?: string; text?: string }).text || '';
    }
    
    const parts = (message as { parts?: unknown }).parts;
    
    const chatMessage: NewChatMessage = {
      id: messageId,
      threadId,
      role: message.role as 'user' | 'assistant',
      content: JSON.stringify(content),
      attachments: attachments ? JSON.stringify(attachments) : null,
      metadata: parts ? JSON.stringify(parts) : null,
    };

    // Check if message already exists to prevent duplicates
    const [existingMessage] = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.id, messageId))
      .limit(1);
    
    if (existingMessage) {
      return existingMessage;
    }
    
    const [savedMessage] = await db.insert(chatMessages).values(chatMessage).returning();
    
    // Update thread's updatedAt timestamp
    await db
      .update(chatThreads)
      .set({ updatedAt: new Date() })
      .where(eq(chatThreads.id, threadId));

    return savedMessage;
  }

  static async getThreadMessages(threadId: string, userId: string): Promise<UIMessage[]> {
    // Verify user owns the thread
    const thread = await this.getThread(threadId, userId);
    if (!thread) {
      throw new Error('Thread not found or access denied');
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.threadId, threadId))
      .orderBy(chatMessages.createdAt);

    return messages.map(this.convertToUIMessage);
  }

  static async deleteMessage(messageId: string, threadId: string, userId: string): Promise<boolean> {
    // Verify user owns the thread
    const thread = await this.getThread(threadId, userId);
    if (!thread) {
      throw new Error('Thread not found or access denied');
    }

    const result = await db
      .delete(chatMessages)
      .where(and(eq(chatMessages.id, messageId), eq(chatMessages.threadId, threadId)));
    
    return Array.isArray(result) ? result.length > 0 : ((result as { rowCount?: number }).rowCount ?? 0) > 0;
  }

  // Utility Functions
  static convertToUIMessage(message: ChatMessage): UIMessage {
    const baseMessage: { id: string; role: string; parts: unknown[]; text?: string; content?: unknown } = {
      id: message.id,
      role: message.role,
      parts: [],
    };

    // Handle content
    try {
      const parsedContent = JSON.parse(message.content);
      if (typeof parsedContent === 'string') {
        baseMessage.text = parsedContent;
      } else {
        baseMessage.content = parsedContent;
      }
    } catch {
      baseMessage.text = message.content;
    }

    // Handle metadata (sources, reasoning, etc.)
    if (message.metadata) {
      try {
        const parsedMetadata = JSON.parse(message.metadata);
        baseMessage.parts = parsedMetadata;
      } catch {
        // Ignore invalid metadata
      }
    }

    return baseMessage as UIMessage;
  }

  static generateThreadTitle(firstMessage: string): string {
    // Generate a title from the first message (max 50 chars)
    const title = firstMessage.trim().substring(0, 50);
    return title.length === 50 ? title + '...' : title;
  }

  // Analytics and Stats
  static async getUserChatStats(userId: string): Promise<{
    projectCount: number;
    threadCount: number;
    messageCount: number;
  }> {
    const [projectCountResult] = await db
      .select({ count: sql`count(*)` })
      .from(chatProjects)
      .where(eq(chatProjects.userId, userId));

    const [threadCountResult] = await db
      .select({ count: sql`count(*)` })
      .from(chatThreads)
      .where(eq(chatThreads.userId, userId));

    const [messageCountResult] = await db
      .select({ count: sql`count(*)` })
      .from(chatMessages)
      .innerJoin(chatThreads, eq(chatMessages.threadId, chatThreads.id))
      .where(eq(chatThreads.userId, userId));

    return {
      projectCount: Number(projectCountResult?.count) || 0,
      threadCount: Number(threadCountResult?.count) || 0,
      messageCount: Number(messageCountResult?.count) || 0,
    };
  }
}