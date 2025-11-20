import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/auth/otpService';
import { getUserByEmail, hasRemainingTime } from '@/lib/auth/userService';
import { sign } from 'jsonwebtoken';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// JWT secret (should be in environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    // Validate inputs
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== 'string') {
      return NextResponse.json(
        { error: 'OTP is required' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      return NextResponse.json(
        { error: 'Invalid OTP format' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP
    const isValid = await verifyOTP(normalizedEmail, otp);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    // Check if user has remaining time
    const hasTime = await hasRemainingTime(normalizedEmail);

    if (!hasTime) {
      return NextResponse.json(
        { error: 'No remaining usage time available' },
        { status: 403 }
      );
    }

    // Get user details
    const user = await getUserByEmail(normalizedEmail);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate JWT token
    const token = sign(
      {
        email: normalizedEmail,
        userId: user.id,
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      {
        expiresIn: '24h', // Token valid for 24 hours
      }
    );

    // Return success with token and user info
    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          email: user.email,
          remainingSeconds: user.remaining_seconds,
          totalUsageSeconds: user.total_usage_seconds,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
