/**
 * Follow-up Scheduler Service
 * Handles scheduling, cancelling, and retrieving follow-ups
 *
 * Optimized with:
 * - Promise.all() for parallel operations (async-parallel)
 * - Early returns (js-early-exit)
 */

import { getSupabase } from '@/lib/memory/supabase';
import { FollowUp, FollowUpScheduleParams, FollowUpStatus, FollowUpType, FOLLOWUP_DELAYS, MIN_FOLLOWUP_INTERVAL_MS } from './types';
import { generateFollowUpMessage, shouldSendReengagement } from './messages';
import { shouldStopFollowUps } from './opt-out';
import { Lead } from '@/types';

// Follow-up types that are exempt from the 24h rate limit (demo-related)
const RATE_LIMIT_EXEMPT_TYPES = new Set<FollowUpType>([
  'pre_demo_reminder',
  'pre_demo_24h',
  'post_demo',
  'no_show_followup'
]);

/**
 * Check if we can send a follow-up (respects 24h minimum interval)
 * Returns true if enough time has passed since last follow-up
 */
export async function canSendFollowUp(leadId: string, type: FollowUpType): Promise<boolean> {
  // Demo-related follow-ups are exempt from rate limiting
  if (RATE_LIMIT_EXEMPT_TYPES.has(type)) {
    return true;
  }

  const supabase = getSupabase();
  const cutoffTime = new Date(Date.now() - MIN_FOLLOWUP_INTERVAL_MS);

  try {
    // Check if any follow-up was sent in the last 24 hours
    const { data, error } = await supabase
      .from('follow_ups')
      .select('id, sent_at, type')
      .eq('lead_id', leadId)
      .eq('status', 'sent')
      .gte('sent_at', cutoffTime.toISOString())
      .limit(1);

    if (error) {
      console.error('[FollowUp] Error checking rate limit:', error);
      return true; // Allow on error to not block
    }

    if (data && data.length > 0) {
      console.log(`[FollowUp] Rate limited: lead ${leadId} received ${data[0].type} recently`);
      return false;
    }

    return true;
  } catch {
    return true; // Allow on error
  }
}

/**
 * Schedule a follow-up message
 */
export async function scheduleFollowUp(params: FollowUpScheduleParams): Promise<string | null> {
  const supabase = getSupabase();

  try {
    const { data, error } = await supabase
      .from('follow_ups')
      .insert({
        lead_id: params.leadId,
        appointment_id: params.appointmentId || null,
        scheduled_for: params.scheduledFor.toISOString(),
        type: params.type,
        message: params.message,
        status: 'pending',
        attempt: params.attempt || 1,
        metadata: params.metadata || null
      })
      .select('id')
      .single();

    if (error) {
      console.error('[FollowUp] Error scheduling:', error);
      return null;
    }

    console.log(`[FollowUp] Scheduled ${params.type} for lead ${params.leadId} at ${params.scheduledFor.toISOString()}`);
    return data.id;
  } catch (error) {
    console.error('[FollowUp] Error:', error);
    return null;
  }
}

/**
 * Cancel all pending follow-ups for a lead
 */
export async function cancelFollowUps(leadId: string, types?: FollowUpType[]): Promise<void> {
  const supabase = getSupabase();

  try {
    let query = supabase
      .from('follow_ups')
      .update({ status: 'cancelled' as FollowUpStatus })
      .eq('lead_id', leadId)
      .eq('status', 'pending');

    if (types && types.length > 0) {
      query = query.in('type', types);
    }

    const { error } = await query;

    if (error) {
      console.error('[FollowUp] Error cancelling:', error);
    } else {
      console.log(`[FollowUp] Cancelled follow-ups for lead ${leadId}`);
    }
  } catch (error) {
    console.error('[FollowUp] Error:', error);
  }
}

/**
 * Cancel follow-ups for a specific appointment
 */
export async function cancelAppointmentFollowUps(appointmentId: string): Promise<void> {
  const supabase = getSupabase();

  try {
    const { error } = await supabase
      .from('follow_ups')
      .update({ status: 'cancelled' as FollowUpStatus })
      .eq('appointment_id', appointmentId)
      .eq('status', 'pending');

    if (error) {
      console.error('[FollowUp] Error cancelling appointment follow-ups:', error);
    }
  } catch (error) {
    console.error('[FollowUp] Error:', error);
  }
}

/**
 * Mark all follow-ups as opted-out when user explicitly declines
 * Also marks the lead as opted-out to prevent future follow-ups
 */
export async function markOptedOut(
  leadId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();

  try {
    // 1. Mark all pending follow-ups as opted_out
    const { error: followUpError } = await supabase
      .from('follow_ups')
      .update({
        status: 'opted_out' as FollowUpStatus,
        metadata: { opt_out_reason: reason }
      })
      .eq('lead_id', leadId)
      .eq('status', 'pending');

    if (followUpError) {
      console.error('[FollowUp] Error marking as opted out:', followUpError);
    }

    // 2. Mark the lead as opted-out (prevents future follow-ups)
    const { error: leadError } = await supabase
      .from('leads')
      .update({
        opted_out: true,
        opted_out_at: new Date().toISOString(),
        opted_out_reason: reason
      })
      .eq('id', leadId);

    if (leadError) {
      // Log but don't fail - the column might not exist yet
      console.warn('[FollowUp] Could not mark lead as opted out (column may not exist):', leadError.message);
    }

    console.log(`[FollowUp] Lead ${leadId} opted out: ${reason || 'no reason provided'}`);
    return { success: true };

  } catch (error) {
    console.error('[FollowUp] Error in markOptedOut:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Check if a message indicates opt-out and handle accordingly
 * Returns true if follow-ups should stop
 */
export async function checkAndHandleOptOut(
  leadId: string,
  message: string,
  recentMessages?: Array<{ role: string; content: string }>
): Promise<boolean> {
  const result = shouldStopFollowUps(message, recentMessages);

  if (result.stop) {
    await markOptedOut(leadId, result.reason);
    return true;
  }

  return false;
}

/**
 * Check if a lead has opted out of follow-ups
 */
export async function isOptedOut(leadId: string): Promise<boolean> {
  const supabase = getSupabase();

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('opted_out')
      .eq('id', leadId)
      .single();

    if (error || !data) return false;
    return data.opted_out === true;
  } catch {
    return false;
  }
}

/**
 * Get pending follow-ups that are due (within the specified window)
 */
export async function getPendingFollowUps(windowMinutes: number = 5): Promise<FollowUp[]> {
  const supabase = getSupabase();

  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMinutes * 60 * 1000);

  try {
    const { data, error } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', windowEnd.toISOString())
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error('[FollowUp] Error getting pending:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      leadId: row.lead_id,
      appointmentId: row.appointment_id,
      scheduledFor: new Date(row.scheduled_for),
      type: row.type as FollowUpType,
      message: row.message,
      status: row.status as FollowUpStatus,
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      createdAt: new Date(row.created_at),
      attempt: row.attempt,
      metadata: row.metadata
    }));
  } catch (error) {
    console.error('[FollowUp] Error:', error);
    return [];
  }
}

/**
 * Mark a follow-up as sent
 */
export async function markFollowUpSent(followUpId: string): Promise<void> {
  const supabase = getSupabase();

  try {
    const { error } = await supabase
      .from('follow_ups')
      .update({
        status: 'sent' as FollowUpStatus,
        sent_at: new Date().toISOString()
      })
      .eq('id', followUpId);

    if (error) {
      console.error('[FollowUp] Error marking as sent:', error);
    }
  } catch (error) {
    console.error('[FollowUp] Error:', error);
  }
}

/**
 * Mark a follow-up as failed
 */
export async function markFollowUpFailed(followUpId: string): Promise<void> {
  const supabase = getSupabase();

  try {
    const { error } = await supabase
      .from('follow_ups')
      .update({ status: 'failed' as FollowUpStatus })
      .eq('id', followUpId);

    if (error) {
      console.error('[FollowUp] Error marking as failed:', error);
    }
  } catch (error) {
    console.error('[FollowUp] Error:', error);
  }
}

/**
 * Get follow-up count for a lead (for re-engagement tracking)
 */
export async function getFollowUpCount(
  leadId: string,
  type: FollowUpType
): Promise<number> {
  const supabase = getSupabase();

  try {
    const { count, error } = await supabase
      .from('follow_ups')
      .select('*', { count: 'exact', head: true })
      .eq('lead_id', leadId)
      .eq('type', type)
      .in('status', ['sent', 'pending']);

    if (error) {
      console.error('[FollowUp] Error counting:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('[FollowUp] Error:', error);
    return 0;
  }
}

// ============================================
// Convenience functions for common follow-up types
// ============================================

/**
 * Schedule demo reminders (24h and 30min before)
 * Optimized: Schedules all reminders in parallel (async-parallel)
 */
export async function scheduleDemoReminders(
  leadId: string,
  appointmentId: string,
  scheduledAt: Date,
  lead: Lead
): Promise<void> {
  const now = new Date();
  const dateStr = scheduledAt.toISOString().split('T')[0];
  const timeStr = scheduledAt.toTimeString().slice(0, 5);
  const promises: Promise<string | null>[] = [];

  // 24h reminder (only if demo is more than 24h away)
  const reminder24h = new Date(scheduledAt.getTime() - FOLLOWUP_DELAYS.pre_demo_24h);
  if (reminder24h > now) {
    promises.push(scheduleFollowUp({
      leadId,
      appointmentId,
      type: 'pre_demo_24h',
      scheduledFor: reminder24h,
      message: generateFollowUpMessage('pre_demo_24h', { lead, appointmentDate: dateStr, appointmentTime: timeStr })
    }));
  }

  // 30 min reminder
  const reminder30min = new Date(scheduledAt.getTime() - FOLLOWUP_DELAYS.pre_demo_reminder);
  if (reminder30min > now) {
    promises.push(scheduleFollowUp({
      leadId,
      appointmentId,
      type: 'pre_demo_reminder',
      scheduledFor: reminder30min,
      message: generateFollowUpMessage('pre_demo_reminder', { lead, appointmentDate: dateStr, appointmentTime: timeStr })
    }));
  }

  // Post-demo follow-up (after demo end, assuming 30 min demo)
  const postDemo = new Date(scheduledAt.getTime() + 30 * 60 * 1000 + FOLLOWUP_DELAYS.post_demo);
  promises.push(scheduleFollowUp({
    leadId,
    appointmentId,
    type: 'post_demo',
    scheduledFor: postDemo,
    message: generateFollowUpMessage('post_demo', { lead })
  }));

  // Execute all in parallel (async-parallel)
  await Promise.all(promises);
}

/**
 * Schedule "said later" follow-up
 */
export async function scheduleSaidLaterFollowUp(
  leadId: string,
  lead: Lead
): Promise<void> {
  // Check if lead has opted out of follow-ups
  if (await isOptedOut(leadId)) {
    console.log(`[FollowUp] Skipping said-later for lead ${leadId} - opted out`);
    return;
  }

  const scheduledFor = new Date(Date.now() + FOLLOWUP_DELAYS.said_later);
  const message = generateFollowUpMessage('said_later', { lead });

  await scheduleFollowUp({
    leadId,
    type: 'said_later',
    scheduledFor,
    message
  });
}

/**
 * Schedule cold lead re-engagement sequence
 */
export async function scheduleReengagement(
  leadId: string,
  lead: Lead,
  memory?: string | null
): Promise<void> {
  // Check if lead has opted out of follow-ups
  if (await isOptedOut(leadId)) {
    console.log(`[FollowUp] Skipping re-engagement for lead ${leadId} - opted out`);
    return;
  }

  // Check current attempt count
  const currentCount = await getFollowUpCount(leadId, 'cold_lead_reengagement');
  const nextAttempt = currentCount + 1;

  if (!shouldSendReengagement(lead, nextAttempt)) {
    console.log(`[FollowUp] Skipping re-engagement for lead ${leadId} - max attempts or wrong stage`);
    return;
  }

  // Determine delay based on attempt
  let delay: number;
  let type: FollowUpType;

  switch (nextAttempt) {
    case 1:
      delay = FOLLOWUP_DELAYS.cold_lead_reengagement;
      type = 'cold_lead_reengagement';
      break;
    case 2:
      delay = FOLLOWUP_DELAYS.reengagement_2;
      type = 'reengagement_2';
      break;
    case 3:
      delay = FOLLOWUP_DELAYS.reengagement_3;
      type = 'reengagement_3';
      break;
    default:
      return; // Max attempts reached
  }

  const scheduledFor = new Date(Date.now() + delay);
  const message = generateFollowUpMessage(type, {
    lead,
    memory,
    attemptNumber: nextAttempt
  });

  await scheduleFollowUp({
    leadId,
    type,
    scheduledFor,
    message,
    attempt: nextAttempt
  });
}

/**
 * Check if lead needs re-engagement and schedule if so
 */
export async function checkAndScheduleReengagement(
  leadId: string,
  lead: Lead,
  lastInteraction: Date,
  memory?: string | null
): Promise<void> {
  // Only re-engage if no interaction in 48h
  const hoursSinceInteraction = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60);

  if (hoursSinceInteraction < 48) {
    return; // Too soon for re-engagement
  }

  // Check if there's already a pending re-engagement
  const existingCount = await getFollowUpCount(leadId, 'cold_lead_reengagement');
  const existingCount2 = await getFollowUpCount(leadId, 'reengagement_2');
  const existingCount3 = await getFollowUpCount(leadId, 'reengagement_3');

  const totalAttempts = existingCount + existingCount2 + existingCount3;

  if (totalAttempts >= 3) {
    return; // Max attempts reached
  }

  await scheduleReengagement(leadId, lead, memory);
}
