import OpenAI from 'openai';
import { GPTModel, ChatMessage } from './types';

// Only initialize on server side
const openai = typeof window === 'undefined' ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
}) : null;

export async function generateChatResponse(
  messages: ChatMessage[],
  model: GPTModel = 'gpt-5'
): Promise<{ content: string; error?: string }> {
  try {
    // Check if we're on server side and client is initialized
    if (!openai) {
      return { content: '', error: 'OpenAI client is not available. This function should only be called on the server side.' };
    }

    // Check if API key is properly configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key') {
      return { content: '', error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.' };
    }

    // Filter out system messages and prepare messages for OpenAI
    const openaiMessages = messages
      .filter(msg => msg.role !== 'system' || msg.content)
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.image_url && { image_url: msg.image_url }),
      }));

    const response = await openai.chat.completions.create({
      model,
      messages: openaiMessages as any,
      max_tokens: GPT_MODELS.find(m => m.id === model)?.maxTokens || 4096,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '';
    return { content };
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    if (error.status === 401) {
      return { content: '', error: 'Invalid API key. Please check your OpenAI API key configuration.' };
    } else if (error.status === 429) {
      return { content: '', error: 'Rate limit exceeded. Please try again later.' };
    } else if (error.status === 500) {
      return { content: '', error: 'OpenAI server error. Please try again later.' };
    } else {
      return { content: '', error: 'Failed to generate response. Please try again.' };
    }
  }
}

export async function generateChatTitle(firstMessage: string): Promise<string> {
  try {
    // Check if we're on server side and client is initialized
    if (!openai) {
      return 'New Chat';
    }

    // Check if API key is properly configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key') {
      return 'New Chat';
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content: 'Generate a short, descriptive title (max 50 characters) for a chat conversation based on the first message. Return only the title, no quotes or extra text.',
        },
        {
          role: 'user',
          content: firstMessage,
        },
      ],
      max_tokens: 50,
      temperature: 0.7,
    });

    const title = response.choices[0]?.message?.content?.trim() || 'New Chat';
    return title.length > 50 ? title.substring(0, 47) + '...' : title;
  } catch (error) {
    console.error('Title generation error:', error);
    return 'New Chat';
  }
}
