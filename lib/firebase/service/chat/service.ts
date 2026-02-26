import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp, 
  limit,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { db } from '../../config';
import { ChatMessageMetadata,ChatHistoryFilters,ChatSession } from '@/types/chat/type';


class ChatHistoryService {
  private getChatCollection(userId: string) {
    return collection(db, 'users', userId, 'chatHistory');
  }

  private getSessionsCollection(userId: string) {
    return collection(db, 'users', userId, 'chatSessions');
  }

  /**
   * Save a single chat message
   */
  async saveMessage(
    userId: string, 
    message: Omit<ChatMessageMetadata, 'id' | 'timestamp'>
  ): Promise<string> {
    try {
      const chatRef = this.getChatCollection(userId);
      const docRef = await addDoc(chatRef, {
        ...message,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now()
      });
      
      // Update session message count
      await this.incrementSessionMessageCount(userId, message.model || 'default');
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving chat message:', error);
      throw error;
    }
  }

  /**
   * Save multiple messages in a batch (for conversation pairs)
   */
  async saveMessageBatch(
    userId: string,
    messages: Array<Omit<ChatMessageMetadata, 'id' | 'timestamp'>>
  ): Promise<string[]> {
    try {
      const batch = writeBatch(db);
      const chatRef = this.getChatCollection(userId);
      const ids: string[] = [];

      messages.forEach(message => {
        const docRef = doc(chatRef);
        batch.set(docRef, {
          ...message,
          timestamp: Timestamp.now(),
          createdAt: Timestamp.now()
        });
        ids.push(docRef.id);
      });

      await batch.commit();
      
      // Update session count once for the batch
      if (messages.length > 0) {
        await this.incrementSessionMessageCount(
          userId, 
          messages[0].model || 'default',
          messages.length
        );
      }

      return ids;
    } catch (error) {
      console.error('Error saving message batch:', error);
      throw error;
    }
  }

  /**
   * Save a conversation pair (user message + assistant response)
   */
  async saveConversation(
    userId: string,
    userMessage: string,
    assistantMessage: string,
    metadata: {
      model: string;
      tokens?: number;
      processingTime?: number;
    }
  ): Promise<{ userId: string; assistantId: string }> {
    try {
      const batch = writeBatch(db);
      const chatRef = this.getChatCollection(userId);
      const timestamp = Timestamp.now();

      // Save user message
      const userDocRef = doc(chatRef);
      batch.set(userDocRef, {
        role: 'user',
        content: userMessage,
        model: metadata.model,
        timestamp,
        createdAt: timestamp,
        metadata: {
          tokens: metadata.tokens,
          processingTime: metadata.processingTime
        }
      });

      // Save assistant message
      const assistantDocRef = doc(chatRef);
      batch.set(assistantDocRef, {
        role: 'assistant',
        content: assistantMessage,
        model: metadata.model,
        timestamp: Timestamp.now(), // Slightly later timestamp
        createdAt: Timestamp.now(),
        metadata: {
          tokens: metadata.tokens,
          processingTime: metadata.processingTime
        }
      });

      await batch.commit();

      // Update session count
      await this.incrementSessionMessageCount(userId, metadata.model, 2);

      return {
        userId: userDocRef.id,
        assistantId: assistantDocRef.id
      };
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }

  /**
   * Get chat history for a user with filters
   */
  async getChatHistory(
    userId: string,
    filters: ChatHistoryFilters = {}
  ): Promise<ChatMessageMetadata[]> {
    try {
      let constraints = [];

      // Date filters
      if (filters.startDate) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
      }
      if (filters.endDate) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
      }

      // Role filter
      if (filters.role) {
        constraints.push(where('role', '==', filters.role));
      }

      // Model filter
      if (filters.model) {
        constraints.push(where('model', '==', filters.model));
      }

      // Always order by timestamp
      constraints.push(orderBy('timestamp', 'desc'));

      // Apply limit if specified
      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }

      const q = query(this.getChatCollection(userId), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })) as ChatMessageMetadata[];
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  /**
   * Get today's chat history
   */
async getTodayChatHistory(userId: string): Promise<ChatMessageMetadata[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  try {
    const q = query(
      this.getChatCollection(userId),
      where('timestamp', '>=', Timestamp.fromDate(today)),
      where('timestamp', '<', Timestamp.fromDate(tomorrow)),
      orderBy('timestamp', 'asc') // Directly order ascending for today
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    })) as ChatMessageMetadata[];
  } catch (error) {
    console.error('Error getting today chat history:', error);
    throw error;
  }
}

  /**
   * Get recent chat messages (last N messages)
   */
  async getRecentMessages(
  userId: string, 
  messageCount: number = 50
): Promise<ChatMessageMetadata[]> {
  try {
    // Query in DESCENDING order (newest first) for efficient query
    const q = query(
      this.getChatCollection(userId),
      orderBy('timestamp', 'desc'),
      limit(messageCount)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Get documents and then REVERSE them to get chronological order (oldest first)
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }))
      .reverse() as ChatMessageMetadata[]; // This puts oldest messages first
  } catch (error) {
    console.error('Error getting recent messages:', error);
    throw error;
  }
}
  /**
   * Start a new chat session
   */
  async startSession(userId: string, model: string): Promise<string> {
    try {
      const sessionsRef = this.getSessionsCollection(userId);
      const docRef = await addDoc(sessionsRef, {
        startTime: Timestamp.now(),
        messageCount: 0,
        model,
        status: 'active',
        createdAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error starting chat session:', error);
      throw error;
    }
  }

  /**
   * End a chat session
   */
  async endSession(userId: string, sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(this.getSessionsCollection(userId), sessionId);
      await updateDoc(sessionRef, {
        endTime: Timestamp.now(),
        status: 'completed'
      });
    } catch (error) {
      console.error('Error ending chat session:', error);
      throw error;
    }
  }

  /**
   * Increment message count for current session
   */
  private async incrementSessionMessageCount(
    userId: string, 
    model: string,
    count: number = 1
  ): Promise<void> {
    try {
      // Get active session or create new one
      const sessionsRef = this.getSessionsCollection(userId);
      const q = query(
        sessionsRef,
        where('status', '==', 'active'),
        orderBy('startTime', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Update existing session
        const sessionDoc = querySnapshot.docs[0];
        const sessionRef = doc(sessionsRef, sessionDoc.id);
        const currentCount = sessionDoc.data().messageCount || 0;
        await updateDoc(sessionRef, {
          messageCount: currentCount + count
        });
      } else {
        // Create new session
        await addDoc(sessionsRef, {
          startTime: Timestamp.now(),
          messageCount: count,
          model,
          status: 'active',
          createdAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error incrementing session count:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Add feedback to a message
   */
  async addFeedback(
    userId: string, 
    messageId: string, 
    feedback: 'positive' | 'negative'
  ): Promise<void> {
    try {
      const messageRef = doc(this.getChatCollection(userId), messageId);
      await updateDoc(messageRef, {
        feedback,
        feedbackTime: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding feedback:', error);
      throw error;
    }
  }

  /**
   * Delete chat history (with optional date range)
   */
  async deleteHistory(
    userId: string, 
    filters: { before?: Date; after?: Date } = {}
  ): Promise<void> {
    try {
      let constraints = [];

      if (filters.before) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.before)));
      }
      if (filters.after) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.after)));
      }

      const q = query(this.getChatCollection(userId), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting chat history:', error);
      throw error;
    }
  }

  /**
   * Get chat statistics
   */
  async getChatStats(userId: string): Promise<{
    totalMessages: number;
    totalSessions: number;
    averageResponseTime?: number;
    topModels: Array<{ model: string; count: number }>;
  }> {
    try {
      // Get total messages
      const messagesRef = this.getChatCollection(userId);
      const messagesSnapshot = await getDocs(messagesRef);
      const totalMessages = messagesSnapshot.size;

      // Get total sessions
      const sessionsRef = this.getSessionsCollection(userId);
      const sessionsSnapshot = await getDocs(sessionsRef);
      const totalSessions = sessionsSnapshot.size;

      // Get model usage
      const modelCount: Record<string, number> = {};
      messagesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.model) {
          modelCount[data.model] = (modelCount[data.model] || 0) + 1;
        }
      });

      const topModels = Object.entries(modelCount)
        .map(([model, count]) => ({ model, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalMessages,
        totalSessions,
        topModels
      };
    } catch (error) {
      console.error('Error getting chat stats:', error);
      throw error;
    }
  }
}

export const chatHistoryService = new ChatHistoryService();