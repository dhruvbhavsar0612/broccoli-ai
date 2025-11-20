import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { getUserByEmail, getUserStats } from '@/lib/auth/userService';

// JWT secret (should be in environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface JWTPayload {
  email: string;
  userId: number;
  iat: number;
  exp: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

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

    // Get user details
    const user = await getUserByEmail(decoded.email);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user statistics
    const stats = await getUserStats(decoded.email);

    return NextResponse.json(
      {
        success: true,
        user: {
          email: user.email,
          remainingSeconds: user.remaining_seconds,
          totalUsageSeconds: user.total_usage_seconds,
          lastUsedAt: user.last_used_at,
        },
        stats: {
          totalUsed: stats.totalUsed,
          remaining: stats.remaining,
          percentageUsed: Math.round(stats.percentageUsed),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
