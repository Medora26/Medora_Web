import { useState, useCallback } from 'react';
import { useAuth } from '@/context/auth/authContext';
import { chatHistoryService } from  '@/lib/firebase/service/chat/service'
import { ChatMessageMetadata,ChatHistoryFilters } from '@/types/chat/type';

export const useChatHistory = () => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Save a single message
   */
  const saveMessage = useCallback(async (
    message: Omit<ChatMessageMetadata, 'id' | 'timestamp'>
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsSaving(true);
    setError(null);

    try {
      const messageId = await chatHistoryService.saveMessage(user.uid, message);
      return messageId;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  /**
   * Save a conversation pair (user message + assistant response)
   */
  const saveConversation = useCallback(async (
    userMessage: string,
    assistantMessage: string,
    metadata: {
      model: string;
      tokens?: number;
      processingTime?: number;
    }
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await chatHistoryService.saveConversation(
        user.uid,
        userMessage,
        assistantMessage,
        metadata
      );
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  /**
   * Load chat history with filters
   */
  const loadHistory = useCallback(async (
    filters: ChatHistoryFilters = {}
  ): Promise<ChatMessageMetadata[]> => {
    if (!user) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const history = await chatHistoryService.getChatHistory(user.uid, filters);
      return history;
    } catch (err) {
      setError(err as Error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Load today's chat history
   */
  const loadTodayHistory = useCallback(async (): Promise<ChatMessageMetadata[]> => {
    if (!user) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const history = await chatHistoryService.getTodayChatHistory(user.uid);
      return history;
    } catch (err) {
      setError(err as Error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Load recent messages
   */
 const loadRecentMessages = useCallback(async (
  count: number = 50,
  order: 'asc' | 'desc' = 'asc' // Default to ascending (oldest first)
): Promise<ChatMessageMetadata[]> => {
  if (!user) {
    return [];
  }

  setIsLoading(true);
  setError(null);

  try {
    const messages = await chatHistoryService.getRecentMessages(user.uid, count);
    
    // If service already returns in correct order, just return
    // If you want to ensure order, you can sort here
    if (order === 'asc') {
      return messages.sort((a, b) => 
        (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0)
      );
    } else {
      return messages.sort((a, b) => 
        (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
      );
    }
  } catch (err) {
    setError(err as Error);
    return [];
  } finally {
    setIsLoading(false);
  }
}, [user]);


  /**
   * Add feedback to a message
   */
  const addFeedback = useCallback(async (
    messageId: string,
    feedback: 'positive' | 'negative'
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setError(null);

    try {
      await chatHistoryService.addFeedback(user.uid, messageId, feedback);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [user]);

  /**
   * Get chat statistics
   */
  const getStats = useCallback(async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const stats = await chatHistoryService.getChatStats(user.uid);
      return stats;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Clear chat history
   */
  const clearHistory = useCallback(async (filters?: { before?: Date; after?: Date }) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsSaving(true);
    setError(null);

    try {
      await chatHistoryService.deleteHistory(user.uid, filters);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  return {
    saveMessage,
    saveConversation,
    loadHistory,
    loadTodayHistory,
    loadRecentMessages,
    addFeedback,
    getStats,
    clearHistory,
    isSaving,
    isLoading,
    error
  };
};