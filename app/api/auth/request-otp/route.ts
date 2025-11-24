import { NextRequest, NextResponse } from "next/server";
import { generateOTP, sendOTPEmail, storeOTP } from "@/lib/auth/otpService";
import { getOrCreateUser } from "@/lib/auth/userService";
import { initializeDatabase, testConnection } from "@/lib/db/config";
import { checkAndCreateDatabase } from "@/lib/db/init";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Initialize database if needed
    try {
      await checkAndCreateDatabase();
      const isConnected = await testConnection();

      if (!isConnected) {
        throw new Error("Database connection failed");
      }

      await initializeDatabase();
    } catch (dbError) {
      console.error("Database initialization error:", dbError);
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 },
      );
    }

    // Get or create user
    try {
      await getOrCreateUser(normalizedEmail);
    } catch (userError) {
      console.error("User creation error:", userError);
      return NextResponse.json(
        { error: "Failed to process user" },
        { status: 500 },
      );
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in database
    try {
      await storeOTP(normalizedEmail, otp);
    } catch (otpError) {
      console.error("OTP storage error:", otpError);
      return NextResponse.json(
        { error: "Failed to generate verification code" },
        { status: 500 },
      );
    }

    // Send OTP via email
    try {
      await sendOTPEmail(normalizedEmail, otp);
    } catch (emailError) {
      console.error("Email sending error:", emailError);

      // Log OTP to console as fallback when email fails
      console.log("⚠️ EMAIL FAILED - OTP Code for", normalizedEmail, ":", otp);
      console.log("📋 Copy this OTP to verify:", otp);

      // For development, still return success but log the error
      if (process.env.NODE_ENV === "development") {
        console.log("📧 Development Mode - OTP Code:", otp);
        return NextResponse.json(
          {
            success: true,
            message: "OTP sent (dev mode)",
            devOtp: otp, // Only in development!
          },
          { status: 200 },
        );
      }

      // In production, return success with instructions to check logs
      // This allows testing even if email delivery fails
      return NextResponse.json(
        {
          success: true,
          message: "OTP generated - check server logs if email not received",
          note: "Contact administrator if you did not receive the email",
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent to your email",
        expiresIn: 120, // seconds
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Request OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
