// Shared types for the application

export const GPT_MODELS = [
  { id: 'gpt-5', name: 'GPT-5', maxTokens: 200000 },
  { id: 'gpt-4o-2024-12-01', name: 'GPT-4o (December 2024)', maxTokens: 128000 },
  { id: 'gpt-4o-mini-2024-11-20', name: 'GPT-4o Mini (November 2024)', maxTokens: 128000 },
  { id: 'gpt-4-turbo-2024-11-20', name: 'GPT-4 Turbo (November 2024)', maxTokens: 128000 },
  { id: 'gpt-4o-vision-2024-11-20', name: 'GPT-4o Vision (November 2024)', maxTokens: 128000 },
] as const;

export type GPTModel = typeof GPT_MODELS[number]['id'];

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image_url?: string;
}

// Re-export for compatibility
export { GPT_MODELS };
