// app/api/chat/route.ts
import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { createSystemPrompt, formatUserDataForPrompt } from '@/components/prompt/prompt';
import { getOpenAIModel, openAIConfig } from '@/lib/ai/openai-config';
import { availableModels } from '@/lib/ai/model-config';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Define the message type locally since it's not exported
interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Extract model from request body
    const { messages, userId, model } = await req.json();

    // Validate required fields
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate that the requested model exists
    const selectedModel = model || openAIConfig.defaultModel;
    const modelExists = availableModels.some(m => m.id === selectedModel);
    
    if (!modelExists) {
      console.warn(`⚠️ Requested model ${selectedModel} not found, using default`);
    }

    // Check if Firebase Admin is initialized
    if (!adminDb) {
      console.error('❌ Firebase Admin not initialized');
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. FETCH USER'S ONBOARDING DATA FROM FIRESTORE
    console.log('📊 Fetching patient data for user:', userId);
    
    // Get patient profile from Firestore
    const patientDoc = await adminDb.collection('patients').doc(userId).get();
    
    if (!patientDoc.exists) {
      console.log('⚠️ No patient profile found for user:', userId);
      return new Response(
        JSON.stringify({ error: 'Patient profile not found. Please complete onboarding first.' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const patientData = patientDoc.data();

    // Also get user data for additional context
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // 2. FORMAT DATA FOR THE PROMPT
    const formattedData = formatUserDataForPrompt(patientData, userData);

    // 3. CREATE THE SYSTEM PROMPT
    const systemPrompt = createSystemPrompt(formattedData);

    console.log('🤖 System prompt created successfully');
    console.log('🚀 Using OpenAI model:', selectedModel);

    // 4. PREPARE MESSAGES FOR AI SDK
    // The AI SDK expects messages in a specific format
    const apiMessages = [
      // System message first
      {
        role: 'system' as const,
        content: systemPrompt
      },
      // Then the conversation history
      ...messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }))
    ];

    // 5. CALL THE AI SDK TO STREAM THE RESPONSE WITH OPENAI
    try {
      const result = streamText({
        model: getOpenAIModel(selectedModel),
        messages: apiMessages,
        temperature: openAIConfig.temperature,
       
        onError: ({ error }) => {
          console.error('❌ OpenAI Stream Error:', error);
        },
      });

      return result.toTextStreamResponse();

    } catch (aiError: any) {
      console.error('❌ OpenAI API Error:', aiError);
      
      // Handle specific OpenAI errors
      if (aiError.message?.includes('API key')) {
        return new Response(
          JSON.stringify({ error: 'Invalid or missing API key' }), 
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiError.message?.includes('rate limit') || aiError.statusCode === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again in a moment.',
            rateLimitExceeded: true
          }), 
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (aiError.message?.includes('insufficient_quota')) {
        return new Response(
          JSON.stringify({ 
            error: 'OpenAI quota exceeded. Please check your billing details.',
            quotaExceeded: true
          }), 
          { status: 402, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Log and re-throw unexpected errors
      console.error('Unexpected AI error:', aiError);
      throw aiError;
    }

  } catch (error) {
    console.error('❌ Error in chat API:', error);
    
    // Return a user-friendly error message
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process your request. Please try again.' 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}