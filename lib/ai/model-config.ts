// lib/ai/model-config.ts
export interface ModelInfo {
  id: string;
  name: string;
  provider: 'openai';
  description: string;
  tier: 'paid' | 'limited-free';
  rateLimit: string;
  bestFor: string;
  contextWindow: string;
  fullName?: string;
  costPer1kTokens?: {
    input: number;
    output: number;
  };
}

export const availableModels: ModelInfo[] = [
  {
    id: 'gpt-4-turbo-preview',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'Most capable model, best for complex medical analysis',
    tier: 'paid',
    rateLimit: '10,000 RPM',
    bestFor: 'Complex medical history analysis, detailed explanations',
    contextWindow: '128K tokens',
    costPer1kTokens: {
      input: 0.01,
      output: 0.03
    }
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    description: 'High capability for complex tasks',
    tier: 'paid',
    rateLimit: '10,000 RPM',
    bestFor: 'Medical document analysis, insurance queries',
    contextWindow: '32K tokens',
    costPer1kTokens: {
      input: 0.03,
      output: 0.06
    }
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Fast, efficient for basic queries',
    tier: 'paid',
    rateLimit: '10,000 RPM',
    bestFor: 'Quick answers, basic medical history lookup',
    contextWindow: '16K tokens',
    costPer1kTokens: {
      input: 0.001,
      output: 0.002
    }
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Latest model, optimized for speed and quality',
    tier: 'paid',
    rateLimit: '10,000 RPM',
    bestFor: 'General purpose, best balance of speed and accuracy',
    contextWindow: '128K tokens',
    costPer1kTokens: {
      input: 0.005,
      output: 0.015
    }
  }
];

// Helper functions
export const getProductionModels = () => availableModels;

export const getExperimentalModels = () => []; // OpenAI doesn't have experimental in same way

export const getTierBadgeColor = (tier: ModelInfo['tier']) => {
  switch (tier) {
    case 'paid':
      return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300';
    case 'limited-free':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getTierDisplay = (tier: ModelInfo['tier']) => {
  switch (tier) {
    case 'paid':
      return 'Paid';
    case 'limited-free':
      return 'Free Limit';
    default:
      return tier;
  }
};

export const DEFAULT_MODEL = 'gpt-4o';

