/**
 * Bot Pause System
 * When Victor (or any operator) takes control of a conversation,
 * the bot stops responding. Uses Redis for fast lookups with
 * Supabase as fallback/persistence.
 */

import { redis } from '@/lib/ratelimit';
import { getSupabase } from '@/lib/memory/supabase';

const BOT_PAUSE_TTL = 86400; // 24 hours

function getPauseKey(conversationId: string): string {
  return `bot_paused:${conversationId}`;
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
    return false; // Fail open - let bot respond if we can't check
  }
}
