import { auth } from '@/lib/auth';
import { ChatStorage } from '@/lib/chat-storage';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { UIMessage } from 'ai';

const SaveMessageSchema = z.object({
  message: z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant']),
    content: z.any().optional(),
    text: z.string().optional(),
    parts: z.array(z.any()).optional(),
  }),
  attachments: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { threadId } = await context.params;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    const messages = await ChatStorage.getThreadMessages(threadId, session.user.id);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching thread messages:', error);
    
    if (error instanceof Error && error.message === 'Thread not found or access denied') {
      return NextResponse.json(
        { error: 'Thread not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { threadId } = await context.params;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    // Verify thread exists and user has access
    const thread = await ChatStorage.getThread(threadId, session.user.id);
    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { message, attachments } = SaveMessageSchema.parse(body);

    const savedMessage = await ChatStorage.saveMessage(threadId, message as UIMessage, attachments);

    // Auto-generate thread title if this is the first user message and no title exists
    if (!thread.title && message.role === 'user') {
      const messageText = message.text || (typeof message.content === 'string' ? message.content : '');
      if (messageText) {
        const title = ChatStorage.generateThreadTitle(messageText);
        await ChatStorage.updateThread(threadId, session.user.id, { title });
      }
    }

    return NextResponse.json({ message: savedMessage }, { status: 201 });
  } catch (error) {
    console.error('Error saving message:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { threadId } = await context.params;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!threadId || !messageId) {
      return NextResponse.json(
        { error: 'Thread ID and Message ID are required' },
        { status: 400 }
      );
    }

    const success = await ChatStorage.deleteMessage(messageId, threadId, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Message not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    
    if (error instanceof Error && error.message === 'Thread not found or access denied') {
      return NextResponse.json(
        { error: 'Thread not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}