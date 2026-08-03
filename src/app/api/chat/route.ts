import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import OpenAI from 'openai';
import { getCachedSettings } from '@/lib/data-fetching';
import { getTenantDomain } from '@/lib/tenant';

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 2000;

export async function POST(req: NextRequest) {
  try {
    const domain = await getTenantDomain();
    
    // Fetch store-specific AI configuration
    const settings = await getCachedSettings(domain);
    const aiConfig = settings?.aiConfig || {};
    
    const apiKey = aiConfig.openRouterApiKey || aiConfig.geminiApiKey;
    const systemPrompt = aiConfig.systemPrompt || 'You are a helpful e-commerce assistant for ELYJEN.';

    if (!apiKey) {
      console.error('API key is missing in database settings');
      return NextResponse.json({ error: 'AI Service Unavailable' }, { status: 503 });
    }

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': `${settings?.brandName || 'ELYJEN'} - AI Assistant`,
      },
    });

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const validatedMessages = messages
      .filter((msg: any) => {
        return (
          msg &&
          typeof msg === 'object' &&
          typeof msg.content === 'string' &&
          msg.content.trim().length > 0 &&
          (msg.role === 'user' || msg.role === 'assistant')
        );
      })
      .map((msg: any) => ({
        role: msg.role,
        content: msg.content.substring(0, MAX_CONTENT_LENGTH)
      }));

    if (validatedMessages.length === 0) {
      return NextResponse.json({ error: 'Valid messages are required' }, { status: 400 });
    }

    if (validatedMessages.length > MAX_MESSAGES) {
      return NextResponse.json({ error: `Too many messages. Max allowed: ${MAX_MESSAGES}` }, { status: 422 });
    }

    const completion = await openai.chat.completions.create({
      model: 'z-ai/glm-4.5-air:free',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...validatedMessages,
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiMessage = completion?.choices?.[0]?.message?.content;

    if (!aiMessage) {
      throw new Error('Empty response from AI model');
    }

    return NextResponse.json({ message: aiMessage });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to connect to AI' }, { status: 500 });
  }
}

