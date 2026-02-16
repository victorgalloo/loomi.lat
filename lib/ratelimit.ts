/**
 * Rate Limiting and Redis Operations
 * Uses Upstash Redis for rate limiting and temporary state
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_TOKEN || ''
});

// Rate limiters
const minuteRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1m'),  // 20 messages per minute per user
  analytics: true,
  prefix: 'ratelimit:minute:'
});

const hourRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1h'),  // 100 messages per hour per user
  analytics: true,
  prefix: 'ratelimit:hour:'
});

const globalRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1m'),  // 1000 messages per minute globally
  analytics: true,
  prefix: 'ratelimit:global:'
});

export interface RateLimitResult {
  allowed: boolean;
  reason?: 'minute_limit' | 'hour_limit' | 'global_limit';
  remaining?: number;
}

/**
 * Check rate limits for a phone number
 */
export async function checkRateLimit(phone: string): Promise<RateLimitResult> {
  // If Redis is not configured, allow all requests
  if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
    console.warn('[RateLimit] Redis not configured, allowing request');
    return { allowed: true };
  }

  try {
    // Check minute limit with timeout
    const minuteResult = await Promise.race([
      minuteRateLimiter.limit(phone),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Rate limit timeout')), 3000)
      )
    ]);
    if (!minuteResult.success) {
      return { allowed: false, reason: 'minute_limit', remaining: minuteResult.remaining };
    }

    // Check hour limit
    const hourResult = await hourRateLimiter.limit(phone);
    if (!hourResult.success) {
      return { allowed: false, reason: 'hour_limit', remaining: hourResult.remaining };
    }

    // Check global limit
    const globalResult = await globalRateLimiter.limit('global');
    if (!globalResult.success) {
      return { allowed: false, reason: 'global_limit', remaining: globalResult.remaining };
    }

    return { allowed: true, remaining: minuteResult.remaining };

  } catch (error) {
    console.error('[RateLimit] Error:', error);
    // On error, allow the message (fail open)
    return { allowed: true };
  }
}

// ============================================
// Message Processing Lock
// ============================================

const PROCESSING_TTL = 30; // 30 seconds

/**
 * Check if a message is already being processed
 */
export async function isProcessing(messageId: string): Promise<boolean> {
  // If Redis is not configured, skip processing check
  if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
    return false;
  }

  try {
    const key = `processing:${messageId}`;

    // Add timeout to Redis operations
    const existing = await Promise.race([
      redis.get(key),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
    ]);

    if (existing) {
      return true;
    }

    // Set processing flag with timeout
    await Promise.race([
      redis.set(key, '1', { ex: PROCESSING_TTL }),
      new Promise<void>((resolve) => setTimeout(resolve, 2000))
    ]);
    return false;

  } catch (error) {
    console.error('[Processing] Error:', error);
    return false; // Fail open
  }
}

/**
 * Clear processing flag for a message
 */
export async function clearProcessing(messageId: string): Promise<void> {
  try {
    await redis.del(`processing:${messageId}`);
  } catch (error) {
    console.error('[Processing] Clear error:', error);
  }
}

// ============================================
// Conversation Lock (prevent duplicate responses)
// ============================================

const CONVERSATION_LOCK_TTL = 30; // 30 seconds

/**
 * Acquire a conversation-level lock to prevent duplicate responses.
 * Uses Redis NX (set-if-not-exists) for atomic locking.
 * Returns true if lock acquired, false if already locked.
 */
export async function acquireConversationLock(phone: string, timeoutMs: number = 5000, tenantId?: string): Promise<boolean> {
  if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
    return true; // No Redis = no lock needed
  }

  const key = tenantId ? `conv_lock:${tenantId}:${phone}` : `conv_lock:${phone}`;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const result = await redis.set(key, Date.now().toString(), {
        nx: true,
        ex: CONVERSATION_LOCK_TTL
      });
      if (result === 'OK') return true;
    } catch (error) {
      console.error('[ConversationLock] Error:', error);
      return true; // Fail open
    }

    // Wait 200ms before retrying
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.warn(`[ConversationLock] Timeout acquiring lock for ${phone}`);
  return false;
}

/**
 * Release the conversation lock
 */
export async function releaseConversationLock(phone: string, tenantId?: string): Promise<void> {
  try {
    const key = tenantId ? `conv_lock:${tenantId}:${phone}` : `conv_lock:${phone}`;
    await redis.del(key);
  } catch (error) {
    console.error('[ConversationLock] Release error:', error);
  }
}

// ============================================
// Pending Slot Storage
// ============================================

export interface PendingSlot {
  date: string;
  time: string;
  displayText: string;
  selectedAt: number;
}

const PENDING_SLOT_TTL = 3600; // 1 hour

/**
 * Store a pending slot selection
 */
export async function setPendingSlot(phone: string, slot: PendingSlot, tenantId?: string): Promise<void> {
  try {
    const key = tenantId ? `pending_slot:${tenantId}:${phone}` : `pending_slot:${phone}`;
    await redis.set(key, JSON.stringify(slot), { ex: PENDING_SLOT_TTL });
  } catch (error) {
    console.error('[PendingSlot] Set error:', error);
  }
}

/**
 * Get a pending slot selection
 */
export async function getPendingSlot(phone: string, tenantId?: string): Promise<PendingSlot | null> {
  try {
    const key = tenantId ? `pending_slot:${tenantId}:${phone}` : `pending_slot:${phone}`;
    const data = await redis.get(key);

    if (!data) return null;

    return typeof data === 'string' ? JSON.parse(data) : data as PendingSlot;

  } catch (error) {
    console.error('[PendingSlot] Get error:', error);
    return null;
  }
}

/**
 * Clear a pending slot selection
 */
export async function clearPendingSlot(phone: string, tenantId?: string): Promise<void> {
  try {
    const key = tenantId ? `pending_slot:${tenantId}:${phone}` : `pending_slot:${phone}`;
    await redis.del(key);
  } catch (error) {
    console.error('[PendingSlot] Clear error:', error);
  }
}

// ============================================
// Pending Plan Storage (Stripe)
// ============================================

export interface PendingPlan {
  plan: 'starter' | 'growth' | 'business';
  displayText: string;
  selectedAt: number;
}

const PENDING_PLAN_TTL = 3600; // 1 hour

/**
 * Store a pending plan selection
 */
export async function setPendingPlan(phone: string, plan: PendingPlan, tenantId?: string): Promise<void> {
  try {
    const key = tenantId ? `pending_plan:${tenantId}:${phone}` : `pending_plan:${phone}`;
    await redis.set(key, JSON.stringify(plan), { ex: PENDING_PLAN_TTL });
  } catch (error) {
    console.error('[PendingPlan] Set error:', error);
  }
}

/**
 * Get a pending plan selection
 */
export async function getPendingPlan(phone: string, tenantId?: string): Promise<PendingPlan | null> {
  try {
    const key = tenantId ? `pending_plan:${tenantId}:${phone}` : `pending_plan:${phone}`;
    const data = await redis.get(key);

    if (!data) return null;

    return typeof data === 'string' ? JSON.parse(data) : data as PendingPlan;

  } catch (error) {
    console.error('[PendingPlan] Get error:', error);
    return null;
  }
}

/**
 * Clear a pending plan selection
 */
export async function clearPendingPlan(phone: string, tenantId?: string): Promise<void> {
  try {
    const key = tenantId ? `pending_plan:${tenantId}:${phone}` : `pending_plan:${phone}`;
    await redis.del(key);
  } catch (error) {
    console.error('[PendingPlan] Clear error:', error);
  }
}

// ============================================
// Schedule List Tracking (prevent schedule_demo loop)
// ============================================

const SCHEDULE_LIST_TTL = 1800; // 30 minutes

/**
 * Mark that a schedule list was sent to this phone
 */
export async function setScheduleListSent(phone: string, tenantId?: string): Promise<void> {
  try {
    const key = tenantId ? `schedule_list_sent:${tenantId}:${phone}` : `schedule_list_sent:${phone}`;
    await redis.set(key, Date.now().toString(), { ex: SCHEDULE_LIST_TTL });
  } catch (error) {
    console.error('[ScheduleList] Set error:', error);
  }
}

/**
 * Check if a schedule list was already sent to this phone
 */
export async function wasScheduleListSent(phone: string, tenantId?: string): Promise<boolean> {
  if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
    return false;
  }

  try {
    const key = tenantId ? `schedule_list_sent:${tenantId}:${phone}` : `schedule_list_sent:${phone}`;
    const data = await redis.get(key);
    return !!data;
  } catch (error) {
    console.error('[ScheduleList] Get error:', error);
    return false;
  }
}

/**
 * Clear the schedule list sent flag (after slot is selected)
 */
export async function clearScheduleListSent(phone: string, tenantId?: string): Promise<void> {
  try {
    const key = tenantId ? `schedule_list_sent:${tenantId}:${phone}` : `schedule_list_sent:${phone}`;
    await redis.del(key);
  } catch (error) {
    console.error('[ScheduleList] Clear error:', error);
  }
}

// ============================================
// Conversation State Storage
// ============================================

const CONVERSATION_STATE_TTL = 86400; // 24 hours

/**
 * Store conversation state
 */
export async function setConversationState(
  phone: string,
  state: Record<string, unknown>
): Promise<void> {
  try {
    const key = `conversation_state:${phone}`;
    await redis.set(key, JSON.stringify(state), { ex: CONVERSATION_STATE_TTL });
  } catch (error) {
    console.error('[ConversationState] Set error:', error);
  }
}

/**
 * Get conversation state
 */
export async function getConversationState(
  phone: string
): Promise<Record<string, unknown> | null> {
  try {
    const key = `conversation_state:${phone}`;
    const data = await redis.get(key);

    if (!data) return null;

    return typeof data === 'string' ? JSON.parse(data) : data as Record<string, unknown>;

  } catch (error) {
    console.error('[ConversationState] Get error:', error);
    return null;
  }
}

// ============================================
// API Route Rate Limiters (Upstash Redis)
// ============================================

/** Demo chat: 15 requests per minute per IP */
export const demoRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, '1m'),
  analytics: true,
  prefix: 'ratelimit:demo:',
});

/** Sandbox chat: 10 requests per minute per IP */
export const sandboxRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1m'),
  analytics: true,
  prefix: 'ratelimit:sandbox:',
});

// Export Redis client for direct use if needed
export { redis };
