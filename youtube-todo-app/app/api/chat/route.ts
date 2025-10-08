import { auth } from '@/lib/auth';
import { streamText, UIMessage } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { ChatStorage } from '@/lib/chat-storage';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  
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
    
    const {
      messages,
      model,
      webSearch,
      threadId,
      attachments,
    }: { 
      messages: UIMessage[]; 
      model: string; 
      webSearch: boolean;
      threadId?: string;
      attachments?: string[];
    } = await request.json();

    // If there are attachments, convert the last user message to include images
    if (attachments && attachments.length > 0 && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        // Extract text from parts or use text property
        const textContent = lastMessage.parts 
          ? lastMessage.parts.find(part => part.type === 'text')?.text || ''
          : (lastMessage as unknown as { text?: string }).text || '';
        
        // Convert to AI SDK multimodal message format
        const content = [
          { type: 'text', text: textContent },
          ...attachments.map(url => ({ type: 'image', image: url }))
        ];
        
        // Set content property for AI SDK
        (lastMessage as unknown as { content: Array<{ type: string; text?: string; image?: string }> }).content = content;
        // Remove text and parts properties to avoid conflicts
        delete (lastMessage as unknown as { text?: string }).text;
        delete (lastMessage as unknown as { parts?: unknown }).parts;
        
        console.log('DEBUG: Modified message with attachments:', {
          messageId: lastMessage.id,
          role: lastMessage.role,
          content: content,
          attachments
        });
      }
    }

    // Debug: Log all messages being sent to AI
    console.log('DEBUG: Messages being sent to AI:', JSON.stringify(messages, null, 2));
    
    // Handle the conversion manually to avoid issues with the AI SDK conversion
    const convertedMessages = messages.map(message => ({
      role: message.role,
      content: (message as any).content || (message as any).text || (message as any).parts?.find((p: any) => p.type === 'text')?.text || ''
    }));
    console.log('DEBUG: Converted messages for AI:', JSON.stringify(convertedMessages, null, 2));
  
    const result = streamText({
      model: webSearch ? 'perplexity/sonar' : model,
      messages: convertedMessages,
      system:
        'You are a helpful assistant that can answer questions and help with tasks. You can also analyze images that users upload.',
    });
  
    // Save user message first if threadId is provided
    if (threadId && session?.user?.id && messages.length > 0) {
      try {
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage.role === 'user') {
          await ChatStorage.saveMessage(threadId, lastUserMessage, attachments);
        }
      } catch (error) {
        console.error('Failed to save user message:', error);
      }
    }

    // Handle message persistence if threadId is provided
    return result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
      onFinish: async ({ responseMessage }) => {
        if (threadId && session?.user?.id && responseMessage) {
          try {
            await ChatStorage.saveMessage(threadId, responseMessage);
          } catch (error) {
            console.error('Failed to save assistant message:', error);
          }
        }
      },
    });

  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat' },
      { status: 500 }
    );
  }

}