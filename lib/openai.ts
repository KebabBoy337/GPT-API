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

    // Map model to actual OpenAI model names
    const modelMapping: Record<string, string> = {
      'gpt-5': 'gpt-5-2025-08-07',
      'gpt-4o': 'gpt-4o-2024-11-20',
      'gpt-4o-mini': 'gpt-4o-mini-2024-07-18',
      'gpt-4-turbo': 'gpt-4-turbo-2024-04-09',
    };

    const actualModel = modelMapping[model] || 'gpt-4o';

    // Filter out system messages and prepare messages for OpenAI
    const openaiMessages = messages
      .filter(msg => msg.role !== 'system' || msg.content)
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.image_url && { image_url: msg.image_url }),
      }));

    console.log('Sending request to OpenAI with model:', actualModel);

    // GPT-5 uses max_completion_tokens instead of max_tokens and only supports default temperature (1)
    const requestConfig: any = {
      model: actualModel,
      messages: openaiMessages as any,
    };

    // Configure parameters based on model type
    if (actualModel.includes('gpt-5')) {
      requestConfig.max_completion_tokens = 4096;
      // GPT-5 only supports default temperature (1), don't set temperature parameter
    } else {
      requestConfig.max_tokens = 4096;
      requestConfig.temperature = 0.7;
    }

    const response = await openai.chat.completions.create(requestConfig);

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
      return { content: '', error: `Failed to generate response: ${error.message || 'Unknown error'}` };
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

    // GPT-5 uses max_completion_tokens instead of max_tokens and only supports default temperature (1)
    const requestConfig: any = {
      model: 'gpt-4o-mini-2024-07-18', // Use a cheaper model for title generation
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
    };

    // Configure parameters based on model type
    if (requestConfig.model.includes('gpt-5')) {
      requestConfig.max_completion_tokens = 50;
      // GPT-5 only supports default temperature (1), don't set temperature parameter
    } else {
      requestConfig.max_tokens = 50;
      requestConfig.temperature = 0.7;
    }

    const response = await openai.chat.completions.create(requestConfig);

    const title = response.choices[0]?.message?.content?.trim() || 'New Chat';
    return title.length > 50 ? title.substring(0, 47) + '...' : title;
  } catch (error) {
    console.error('Title generation error:', error);
    return 'New Chat';
  }
}
