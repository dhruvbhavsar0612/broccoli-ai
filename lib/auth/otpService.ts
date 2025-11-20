import { getPool } from '../db/config';
import nodemailer from 'nodemailer';

// Generate a 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create email transporter
function getEmailTransporter() {
  // For development, use Ethereal (fake SMTP)
  // In production, use your actual email service
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Send OTP via email
export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  try {
    const transporter = getEmailTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Voice Agent" <noreply@voiceagent.com>',
      to: email,
      subject: 'Your Voice Agent OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
              padding: 40px;
              text-align: center;
            }
            .otp-box {
              background: white;
              border-radius: 8px;
              padding: 30px;
              margin: 20px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #667eea;
              margin: 20px 0;
            }
            .expires {
              color: #666;
              font-size: 14px;
              margin-top: 20px;
            }
            h1 {
              color: white;
              margin: 0 0 10px 0;
            }
            p {
              color: white;
              margin: 0 0 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎙️ Voice Agent</h1>
            <p>Your verification code is ready</p>
            <div class="otp-box">
              <div style="color: #333; font-size: 16px; margin-bottom: 10px;">Enter this code to continue:</div>
              <div class="otp-code">${otp}</div>
              <div class="expires">⏰ This code expires in 2 minutes</div>
            </div>
            <p style="font-size: 14px; margin-top: 20px;">If you didn't request this code, please ignore this email.</p>
          </div>
        </body>
        </html>
      `,
      text: `Your Voice Agent verification code is: ${otp}\n\nThis code expires in 2 minutes.\n\nIf you didn't request this code, please ignore this email.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent:', info.messageId);

    // For development with Ethereal, log preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
}

// Store OTP in database
export async function storeOTP(email: string, otp: string): Promise<void> {
  const pool = getPool();
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

  try {
    // Clean up old OTPs for this email
    await pool.query(
      'DELETE FROM otp_codes WHERE email = $1 AND expires_at < NOW()',
      [email]
    );

    // Store new OTP
    await pool.query(
      'INSERT INTO otp_codes (email, otp_code, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    console.log(`✅ OTP stored for ${email}`);
  } catch (error) {
    console.error('❌ Failed to store OTP:', error);
    throw error;
  }
}

// Verify OTP
export async function verifyOTP(email: string, otp: string): Promise<boolean> {
  const pool = getPool();

  try {
    const result = await pool.query(
      `SELECT * FROM otp_codes
       WHERE email = $1
       AND otp_code = $2
       AND expires_at > NOW()
       AND verified = FALSE
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, otp]
    );

    if (result.rows.length === 0) {
      return false;
    }

    // Mark OTP as verified
    await pool.query(
      'UPDATE otp_codes SET verified = TRUE WHERE id = $1',
      [result.rows[0].id]
    );

    return true;
  } catch (error) {
    console.error('❌ Failed to verify OTP:', error);
    return false;
  }
}

// Clean up expired OTPs (run periodically)
export async function cleanupExpiredOTPs(): Promise<void> {
  const pool = getPool();

  try {
    const result = await pool.query(
      'DELETE FROM otp_codes WHERE expires_at < NOW()'
    );
    console.log(`🧹 Cleaned up ${result.rowCount} expired OTPs`);
  } catch (error) {
    console.error('❌ Failed to cleanup OTPs:', error);
  }
}
