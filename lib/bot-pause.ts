/**
 * Bot Pause System
 * When Victor (or any operator) takes control of a conversation,
 * the bot stops responding. Uses Redis for fast lookups with
 * Supabase as fallback/persistence.
 */

import { redis } from '@/lib/ratelimit';
import { getSupabase } from '@/lib/memory/supabase';

const BOT_PAUSE_TTL = 86400; // 24 hours
const BROADCAST_SUPPRESS_TTL = 7 * 86400; // 7 days

function getPauseKey(conversationId: string): string {
  return `bot_paused:${conversationId}`;
}

function getSuppressKey(conversationId: string): string {
  return `broadcast_suppress:${conversationId}`;
}

/**
 * Pause the bot for a conversation
 */
export async function pauseBot(conversationId: string, pausedBy: string = 'operator'): Promise<void> {
  try {
    // Set Redis key (fast check path)
    await redis.set(getPauseKey(conversationId), '1', { ex: BOT_PAUSE_TTL });

    // Persist to Supabase
    const supabase = getSupabase();
    await supabase
      .from('conversations')
      .update({
        bot_paused: true,
        paused_at: new Date().toISOString(),
        paused_by: pausedBy,
      })
      .eq('id', conversationId);

    console.log(`[BotPause] Paused conversation ${conversationId} by ${pausedBy}`);
  } catch (error) {
    console.error('[BotPause] Error pausing:', error);
  }
}

/**
 * Resume the bot for a conversation
 */
export async function resumeBot(conversationId: string): Promise<void> {
  try {
    // Delete Redis key
    await redis.del(getPauseKey(conversationId));

    // Update Supabase
    const supabase = getSupabase();
    await supabase
      .from('conversations')
      .update({
        bot_paused: false,
        paused_at: null,
        paused_by: null,
      })
      .eq('id', conversationId);

    console.log(`[BotPause] Resumed conversation ${conversationId}`);
  } catch (error) {
    console.error('[BotPause] Error resuming:', error);
  }
}

/**
 * Check if the bot is paused for a conversation
 * Fast path: Redis. Fallback: Supabase.
 */
export async function isBotPaused(conversationId: string): Promise<boolean> {
  try {
    // Fast path: check Redis
    const cached = await redis.get(getPauseKey(conversationId));
    if (cached) return true;

    // Fallback: check Supabase
    const supabase = getSupabase();
    const { data } = await supabase
      .from('conversations')
      .select('bot_paused')
      .eq('id', conversationId)
      .single();

    if (data?.bot_paused) {
      // Re-populate Redis cache
      await redis.set(getPauseKey(conversationId), '1', { ex: BOT_PAUSE_TTL });
      return true;
    }

    return false;
  } catch (error) {
    console.error('[BotPause] Error checking pause:', error);
    return true; // Fail closed - don't respond if we can't verify pause state
  }
}

/**
 * Suppress bot for a broadcast conversation
 * Stronger than pause — cannot be overridden by auto_reply_enabled
 */
export async function suppressBotForBroadcast(conversationId: string, campaignId: string): Promise<void> {
  try {
    await redis.set(getSuppressKey(conversationId), campaignId, { ex: BROADCAST_SUPPRESS_TTL });

    const supabase = getSupabase();
    await supabase
      .from('conversations')
      .update({
        broadcast_suppress_bot: true,
        broadcast_campaign_id: campaignId,
      })
      .eq('id', conversationId);

    console.log(`[BotSuppress] Suppressed conversation ${conversationId} for campaign ${campaignId}`);
  } catch (error) {
    console.error('[BotSuppress] Error suppressing:', error);
  }
}

/**
 * Un-suppress bot for a broadcast conversation
 */
export async function unsuppressBotForBroadcast(conversationId: string): Promise<void> {
  try {
    await redis.del(getSuppressKey(conversationId));

    const supabase = getSupabase();
    await supabase
      .from('conversations')
      .update({
        broadcast_suppress_bot: false,
        broadcast_campaign_id: null,
      })
      .eq('id', conversationId);

    console.log(`[BotSuppress] Unsuppressed conversation ${conversationId}`);
  } catch (error) {
    console.error('[BotSuppress] Error unsuppressing:', error);
  }
}

/**
 * Check if bot is suppressed for a broadcast conversation
 * Fast path: Redis. Fallback: Supabase.
 */
export async function isBotSuppressed(conversationId: string): Promise<boolean> {
  try {
    const cached = await redis.get(getSuppressKey(conversationId));
    if (cached) return true;

    const supabase = getSupabase();
    const { data } = await supabase
      .from('conversations')
      .select('broadcast_suppress_bot')
      .eq('id', conversationId)
      .single();

    if (data?.broadcast_suppress_bot) {
      // Re-populate Redis cache
      await redis.set(getSuppressKey(conversationId), '1', { ex: BROADCAST_SUPPRESS_TTL });
      return true;
    }

    return false;
  } catch (error) {
    console.error('[BotSuppress] Error checking suppress:', error);
    return false; // Fail open — don't block the bot if we can't verify
  }
}
