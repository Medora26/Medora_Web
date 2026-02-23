// app/api/list-models/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );
    
    const data = await response.json();
    
    // Filter models that support generateContent
    const supportedModels = data.models?.filter((model: any) => 
      model.supportedGenerationMethods?.includes('generateContent')
    ) || [];
    
    return NextResponse.json({
      allModels: data.models,
      supportedForChat: supportedModels.map((m: any) => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        version: m.version
      }))
    });
  } catch (error) {
    console.error('Error listing models:', error);
    return NextResponse.json({ error: 'Failed to list models' }, { status: 500 });
  }
}