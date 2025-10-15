// Shared types for the application

export const GPT_MODELS = [
  { id: 'gpt-5', name: 'GPT-5' },
] as const;

export type GPTModel = typeof GPT_MODELS[number]['id'];

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image_url?: string;
}
