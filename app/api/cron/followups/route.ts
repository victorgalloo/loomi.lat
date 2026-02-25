/**
 * Cron Job: Follow-up Sender
 * Runs every 5 minutes to send pending follow-ups
 *
 * Vercel Cron schedule: every 5 minutes
 *
 * Optimized with:
 * - Promise.all() for parallel processing (async-parallel)
 * - Early returns (js-early-exit)
 * - after() for non-blocking operations (server-after-nonblocking)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPendingFollowUps, markFollowUpSent, markFollowUpFailed, scheduleReengagement, isOptedOut, markOptedOut, canSendFollowUp } from '@/lib/followups/scheduler';
import { sendWhatsAppMessage } from '@/lib/whatsapp/send';
import { saveMessage, getLeadById } from '@/lib/memory/supabase';
import { getActiveConversation } from '@/lib/memory/context';
import { isInServiceWindow } from '@/lib/whatsapp/service-window';
import { FollowUp } from '@/lib/followups/types';

// Stages that should skip re-engagement (Set for O(1) lookup)
const SKIP_REENGAGEMENT_STAGES = new Set(['demo_scheduled', 'demo_completed']);

// Verify cron secret to prevent unauthorized execution
function verifyCronAuth(request: NextRequest): boolean {
  // In development, allow without auth
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Vercel cron jobs include this header
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Also check for Vercel's cron signature
  if (request.headers.get('x-vercel-cron')) {
    return true;
  }

  return false;
}

/**
 * Process a single follow-up
 */
async function processFollowUp(followUp: FollowUp): Promise<{ success: boolean; error?: string }> {
  try {
    // Get lead info
    const lead = await getLeadById(followUp.leadId);

    // Early exit: Lead not found
    if (!lead) {
      console.log(`[Cron] Lead ${followUp.leadId} not found, marking as failed`);
      await markFollowUpFailed(followUp.id);
      return { success: false, error: 'Lead not found' };
    }

    // Early exit: Lead has opted out of follow-ups
    if (await isOptedOut(followUp.leadId)) {
      console.log(`[Cron] Lead ${lead.phone} has opted out, skipping follow-up`);
      await markOptedOut(followUp.leadId, 'Skipped by cron - already opted out');
      return { success: true }; // Don't count as failure, just skip
    }

    // Early exit: Skip re-engagement for certain stages
    if (followUp.type.includes('reengagement') || followUp.type === 'cold_lead_reengagement') {
      if (SKIP_REENGAGEMENT_STAGES.has(lead.stage)) {
        console.log(`[Cron] Skipping re-engagement for ${lead.phone} - stage is ${lead.stage}`);
        await markFollowUpSent(followUp.id);
        return { success: true };
      }
    }

    // Early exit: Rate limit - max 1 follow-up per 24h (except demo reminders)
    if (!await canSendFollowUp(followUp.leadId, followUp.type)) {
      console.log(`[Cron] Rate limited: ${lead.phone} received follow-up in last 24h, rescheduling`);
      // Reschedule for 24h later instead of failing
      const supabase = await import('@/lib/memory/supabase').then(m => m.getSupabase());
      const newTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await supabase
        .from('follow_ups')
        .update({ scheduled_for: newTime.toISOString() })
        .eq('id', followUp.id);
      return { success: true }; // Don't count as failure
    }

    // Send the message
    console.log(`[Cron] Sending ${followUp.type} to ${lead.phone}`);
    const sent = await sendWhatsAppMessage(lead.phone, followUp.message);

    // Early exit: Send failed
    if (!sent) {
      console.error(`[Cron] Failed to send message to ${lead.phone}`);
      await markFollowUpFailed(followUp.id);
      return { success: false, error: 'WhatsApp send failed' };
    }

    // Mark as sent
    await markFollowUpSent(followUp.id);

    // Non-blocking: Save message and schedule next re-engagement
    const windowActive = isInServiceWindow(lead.serviceWindowStart, lead.serviceWindowType);
    (async () => {
      try {
        // Save message to conversation history
        const conversation = await getActiveConversation(followUp.leadId);
        if (conversation) {
          await saveMessage(conversation.id, 'assistant', followUp.message, followUp.leadId, windowActive);
        }

        // Schedule next re-engagement if applicable
        if (followUp.type === 'cold_lead_reengagement' || followUp.type === 'reengagement_2') {
          await scheduleReengagement(followUp.leadId, lead);
        }
      } catch (err) {
        console.error(`[Cron] After error for ${followUp.id}:`, err);
      }
    })().catch(console.error);

    console.log(`[Cron] Successfully sent ${followUp.type} to ${lead.phone}`);
    return { success: true };

  } catch (error) {
    console.error(`[Cron] Error processing follow-up ${followUp.id}:`, error);
    await markFollowUpFailed(followUp.id);
    return { success: false, error: String(error) };
  }
}

export async function GET(request: NextRequest) {
  // Early exit: Unauthorized
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Get pending follow-ups due in the next 5 minutes
    const pendingFollowUps = await getPendingFollowUps(5);

    // Early exit: No pending follow-ups
    if (pendingFollowUps.length === 0) {
      return NextResponse.json({
        status: 'ok',
        processed: 0,
        message: 'No pending follow-ups'
      });
    }

    console.log(`[Cron] Processing ${pendingFollowUps.length} follow-ups`);

    // Process all follow-ups in parallel (async-parallel)
    const results = await Promise.all(
      pendingFollowUps.map(processFollowUp)
    );

    // Count results in single iteration (js-combine-iterations)
    let successful = 0;
    let failed = 0;
    for (const result of results) {
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }

    const duration = Date.now() - startTime;

    console.log(`[Cron] Completed: ${successful} sent, ${failed} failed in ${duration}ms`);

    return NextResponse.json({
      status: 'ok',
      processed: pendingFollowUps.length,
      successful,
      failed,
      duration_ms: duration
    });

  } catch (error) {
    console.error('[Cron] Error:', error);
    return NextResponse.json(
      { error: 'Internal error', details: String(error) },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
