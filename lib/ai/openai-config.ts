// lib/ai/openai-config.ts
import { openai } from '@ai-sdk/openai';
import { availableModels } from './model-config';

// Map our friendly IDs to OpenAI models
const modelNameMap: Record<string, string> = {
  'gpt-4-turbo-preview': 'gpt-4-turbo-preview',
  'gpt-4': 'gpt-4',
  'gpt-3.5-turbo': 'gpt-3.5-turbo',
  'gpt-4o': 'gpt-4o',
};

export const openAIConfig = {
  defaultModel: 'gpt-4o' as keyof typeof modelNameMap,
  fallbackModel: 'gpt-3.5-turbo' as keyof typeof modelNameMap,
  temperature: 0.7,
  maxTokens: 1000,
};

export function getOpenAIModel(modelId: string = openAIConfig.defaultModel) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  
  // Get the model name from our map
  const modelName = modelNameMap[modelId];
  
  if (!modelName) {
    console.warn(`⚠️ Model ID ${modelId} not found, falling back to ${openAIConfig.defaultModel}`);
    return openai(openAIConfig.defaultModel);
  }
  
  console.log(`✅ Using OpenAI model: ${modelName}`);
  return openai(modelName);
}

// Helper to validate if a model ID is available
export function isModelAvailable(modelId: string): boolean {
  return !!modelNameMap[modelId];
}