/**
 * Follow-up Scheduler Service
 * Handles scheduling, cancelling, and retrieving follow-ups
 *
 * Optimized with:
 * - Promise.all() for parallel operations (async-parallel)
 * - Early returns (js-early-exit)
 */

import { getSupabase } from '@/lib/memory/supabase';
import { FollowUp, FollowUpScheduleParams, FollowUpStatus, FollowUpType, FOLLOWUP_DELAYS } from './types';
import { generateFollowUpMessage, shouldSendReengagement } from './messages';
import { Lead } from '@/types';

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
