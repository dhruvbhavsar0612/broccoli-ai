import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get API key from server-side environment variable (not exposed to client)
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured on server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get model from environment or use default
    const model = process.env.MODEL_NAME || 'gpt-realtime-mini';

    // Get configuration from environment
    const voice = process.env.VOICE || 'sage';
    const temperature = parseFloat(process.env.TEMPERATURE || '0.8');
    const maxTokens = parseInt(process.env.MAX_TOKENS || '4096');

    // Return configuration for client (without exposing API key)
    return new Response(
      JSON.stringify({
        model,
        voice,
        temperature,
        maxTokens,
        websocketUrl: '/api/realtime/ws'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    console.error('Error in realtime config:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
