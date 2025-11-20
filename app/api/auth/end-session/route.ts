import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { endSession } from '@/lib/auth/userService';

// JWT secret (should be in environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface JWTPayload {
  email: string;
  userId: number;
  iat: number;
  exp: number;
}

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token
    let decoded: JWTPayload;
    try {
      decoded = verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get session start time from request body
    const body = await request.json();
    const { sessionStart } = body;

    if (!sessionStart) {
      return NextResponse.json(
        { error: 'Session start time is required' },
        { status: 400 }
      );
    }

    // Parse session start time
    const startTime = new Date(sessionStart);

    if (isNaN(startTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid session start time' },
        { status: 400 }
      );
    }

    // End session and calculate usage
    const secondsUsed = await endSession(decoded.email, startTime);

    return NextResponse.json(
      {
        success: true,
        secondsUsed,
        message: 'Session ended successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('End session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
