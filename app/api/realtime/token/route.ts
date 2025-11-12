import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Generate ephemeral session token for OpenAI Realtime API
export async function POST(request: NextRequest) {
  try {
    // Get API key from server-side environment variable (never exposed to client)
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server configuration error: API key not set' },
        { status: 500 }
      );
    }

    // Get model and configuration from server environment
    const model = process.env.MODEL_NAME || 'gpt-realtime-mini';

    // Call OpenAI API to create an ephemeral token
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        voice: process.env.VOICE || 'sage',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);

      return NextResponse.json(
        {
          error: 'Failed to create session',
          details: errorData.error?.message || 'Unknown error'
        },
        { status: response.status }
      );
    }

    const sessionData = await response.json();

    // Return session configuration to client (ephemeral token only, not the main API key)
    return NextResponse.json({
      client_secret: sessionData.client_secret?.value || null,
      session_id: sessionData.id,
      expires_at: sessionData.expires_at,
      model: sessionData.model,
      voice: sessionData.voice,
      // Additional configuration
      temperature: parseFloat(process.env.TEMPERATURE || '0.8'),
      maxTokens: parseInt(process.env.MAX_TOKENS || '4096'),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      }
    });

  } catch (error) {
    console.error('Error creating session token:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Realtime API token endpoint is available',
    configured: !!process.env.OPENAI_API_KEY
  });
}
