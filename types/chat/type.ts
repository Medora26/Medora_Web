export interface ChatMessageMetadata {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: number;
  processingTime?: number;
  feedback?: 'positive' | 'negative' | null;
}

export interface ChatSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  model: string;
  summary?: string;
}

export interface ChatHistoryFilters {
  startDate?: Date;
  endDate?: Date;
  role?: 'user' | 'assistant';
  model?: string;
  limit?: number;
}