import { getPool } from '../db/config';

export interface User {
  id: number;
  email: string;
  created_at: Date;
  total_usage_seconds: number;
  remaining_seconds: number;
  last_used_at: Date | null;
}

// Get or create user
export async function getOrCreateUser(email: string): Promise<User> {
  const pool = getPool();

  try {
    // Check if user exists
    let result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length > 0) {
      return result.rows[0] as User;
    }

    // Create new user with 3 minutes (180 seconds) of usage
    result = await pool.query(
      `INSERT INTO users (email, remaining_seconds)
       VALUES ($1, 180)
       RETURNING *`,
      [email]
    );

    console.log(`✅ New user created: ${email}`);
    return result.rows[0] as User;
  } catch (error) {
    console.error('❌ Failed to get or create user:', error);
    throw error;
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const pool = getPool();

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as User;
  } catch (error) {
    console.error('❌ Failed to get user:', error);
    return null;
  }
}

// Check if user has remaining time
export async function hasRemainingTime(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  return user ? user.remaining_seconds > 0 : false;
}

// Get remaining time for user
export async function getRemainingTime(email: string): Promise<number> {
  const user = await getUserByEmail(email);
  return user ? user.remaining_seconds : 0;
}

// Update user usage
export async function updateUsage(
  email: string,
  secondsUsed: number
): Promise<void> {
  const pool = getPool();

  try {
    await pool.query(
      `UPDATE users
       SET total_usage_seconds = total_usage_seconds + $2,
           remaining_seconds = GREATEST(remaining_seconds - $2, 0),
           last_used_at = CURRENT_TIMESTAMP
       WHERE email = $1`,
      [email, secondsUsed]
    );

    console.log(`📊 Updated usage for ${email}: ${secondsUsed}s used`);
  } catch (error) {
    console.error('❌ Failed to update usage:', error);
    throw error;
  }
}

// Start a session and return the start time
export async function startSession(email: string): Promise<Date> {
  const user = await getUserByEmail(email);

  if (!user) {
    throw new Error('User not found');
  }

  if (user.remaining_seconds <= 0) {
    throw new Error('No remaining time');
  }

  // Update last used timestamp
  const pool = getPool();
  await pool.query(
    'UPDATE users SET last_used_at = CURRENT_TIMESTAMP WHERE email = $1',
    [email]
  );

  return new Date();
}

// End session and calculate usage
export async function endSession(
  email: string,
  startTime: Date
): Promise<number> {
  const endTime = new Date();
  const secondsUsed = Math.floor(
    (endTime.getTime() - startTime.getTime()) / 1000
  );

  // Cap at remaining time
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }

  const actualSecondsUsed = Math.min(secondsUsed, user.remaining_seconds);

  if (actualSecondsUsed > 0) {
    await updateUsage(email, actualSecondsUsed);
  }

  return actualSecondsUsed;
}

// Get user statistics
export async function getUserStats(email: string): Promise<{
  totalUsed: number;
  remaining: number;
  percentageUsed: number;
}> {
  const user = await getUserByEmail(email);

  if (!user) {
    return {
      totalUsed: 0,
      remaining: 0,
      percentageUsed: 0,
    };
  }

  const totalAllowed = 180; // 3 minutes
  const percentageUsed = (user.total_usage_seconds / totalAllowed) * 100;

  return {
    totalUsed: user.total_usage_seconds,
    remaining: user.remaining_seconds,
    percentageUsed: Math.min(percentageUsed, 100),
  };
}
