import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { getUserByEmail, startSession } from "@/lib/auth/userService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// JWT secret (should be in environment variable)
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

interface JWTPayload {
  email: string;
  userId: number;
  iat: number;
  exp: number;
}

// Generate ephemeral session token for OpenAI Realtime API
export async function POST(request: NextRequest) {
  try {
    const enableAuth = process.env.ENABLE_AUTH === "true";

    let userEmail = "anonymous@user.com";
    let sessionStart = new Date();
    let remainingSeconds = 180;

    // Only verify authentication if ENABLE_AUTH is true
    if (enableAuth) {
      // Verify authentication
      const authHeader = request.headers.get("authorization");

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 },
        );
      }

      const token = authHeader.substring(7);

      // Verify JWT token
      let decoded: JWTPayload;
      try {
        decoded = verify(token, JWT_SECRET) as JWTPayload;
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 },
        );
      }

      // Check if user exists and has remaining time
      const user = await getUserByEmail(decoded.email);

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (user.remaining_seconds <= 0) {
        return NextResponse.json(
          { error: "No remaining usage time available" },
          { status: 403 },
        );
      }

      // Start session tracking
      sessionStart = await startSession(decoded.email);
      userEmail = decoded.email;
      remainingSeconds = user.remaining_seconds;
    }

    // Get API key from server-side environment variable (never exposed to client)
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: API key not set" },
        { status: 500 },
      );
    }

    // Get model and configuration from server environment
    const model = process.env.MODEL_NAME || "gpt-realtime-mini";
    const voice = process.env.VOICE || "sage";
    const openaiBaseUrl =
      process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

    // Call OpenAI GA Realtime API to create an ephemeral client secret
    const response = await fetch(`${openaiBaseUrl}/realtime/client_secrets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model,
          audio: {
            output: {
              voice,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);

      return NextResponse.json(
        {
          error: "Failed to create session",
          details: errorData.error?.message || "Unknown error",
        },
        { status: response.status },
      );
    }

    const sessionData = await response.json();
    const session = sessionData.session;

    const websocketBaseUrl = openaiBaseUrl.replace(/^http/, "ws");

    // Return session configuration to client (ephemeral token only, not the main API key)
    return NextResponse.json(
      {
        client_secret: sessionData.value || null,
        session_id: session?.id,
        expires_at: sessionData.expires_at,
        model: session?.model || model,
        voice: session?.audio?.output?.voice || voice,
        websocket_url: `${websocketBaseUrl}/realtime`,
        // Additional configuration
        temperature: parseFloat(process.env.TEMPERATURE || "0.8"),
        maxTokens: parseInt(process.env.MAX_TOKENS || "4096"),
        // User session info
        userEmail: userEmail,
        sessionStart: sessionStart.toISOString(),
        remainingSeconds: remainingSeconds,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (error) {
    console.error("Error creating session token:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Realtime API token endpoint is available",
    configured: !!process.env.OPENAI_API_KEY,
    authEnabled: process.env.ENABLE_AUTH === "true",
  });
}
