import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const upgradeHeader = request.headers.get('upgrade');

  if (upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  // Get API key from server environment (not exposed to client)
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new Response('API key not configured', { status: 500 });
  }

  const model = process.env.MODEL_NAME || 'gpt-realtime-mini';

  try {
    // In Next.js, WebSocket upgrade needs to be handled differently
    // We'll return a token that the client can use with a separate WS server
    // For now, return instructions for client-side proxy

    return new Response(
      JSON.stringify({
        error: 'WebSocket proxy not available in this configuration',
        message: 'Use server-side API route for token generation',
        endpoint: '/api/realtime/token'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('WebSocket proxy error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
