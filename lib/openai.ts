import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const GPT_MODELS = [
  { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo Preview', maxTokens: 128000 },
  { id: 'gpt-4', name: 'GPT-4', maxTokens: 8192 },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 4096 },
  { id: 'gpt-4-vision-preview', name: 'GPT-4 Vision Preview', maxTokens: 128000 },
] as const;

export type GPTModel = typeof GPT_MODELS[number]['id'];

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image_url?: string;
}

export async function generateChatResponse(
  messages: ChatMessage[],
  model: GPTModel = 'gpt-3.5-turbo'
): Promise<{ content: string; error?: string }> {
  try {
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
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
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
