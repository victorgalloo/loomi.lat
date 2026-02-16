/**
 * Meta Conversions API Integration
 *
 * Sends conversion events to Meta when leads progress in the pipeline.
 * This allows Meta to optimize ad targeting for higher quality leads.
 *
 * Events:
 * - Lead: When lead is qualified (isQualified = true)
 * - CompleteRegistration: When demo is scheduled
 * - Purchase: When customer is won (Stripe payment or manual stage change)
 *
 * All PII (phone, email) is hashed with SHA256 before sending.
 */

import { createHash } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { fetchWithTimeout } from '@/lib/utils/fetch-with-timeout';

// Configuration
const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE; // Optional, for testing
const META_API_URL = 'https://graph.facebook.com/v24.0';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

// Lazy Supabase initialization
let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }
  return supabaseClient;
}

// ============================================
// Data Normalization & Hashing
// ============================================

/**
 * Normalize phone number for Meta (E.164 format without +)
 */
function normalizePhone(phone: string): string {
  // Remove all non-digits
  return phone.replace(/\D/g, '');
}

/**
 * Normalize email for Meta (lowercase, trimmed)
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Hash value with SHA256 (required by Meta for PII)
 */
function hashSHA256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Prepare user data with proper normalization and hashing
 */
function prepareUserData(params: {
  phone: string;
  email?: string;
  leadId?: string;
  name?: string;
  country?: string;
}): Record<string, string | string[]> {
  const userData: Record<string, string | string[]> = {};

  // Phone (required) - normalized and hashed
  const normalizedPhone = normalizePhone(params.phone);
  userData.ph = [hashSHA256(normalizedPhone)];

  // Email (optional) - normalized and hashed
  if (params.email) {
    const normalizedEmail = normalizeEmail(params.email);
    userData.em = [hashSHA256(normalizedEmail)];
  }

  // External ID (lead ID) - hashed for consistency
  if (params.leadId) {
    userData.external_id = [hashSHA256(params.leadId)];
  }

  // First name (optional) - normalized and hashed
  if (params.name) {
    const firstName = params.name.split(' ')[0].toLowerCase().trim();
    if (firstName) {
      userData.fn = [hashSHA256(firstName)];
    }
  }

  // Country (default to MX)
  userData.country = [hashSHA256(params.country || 'mx')];

  return userData;
}

// ============================================
// Event Types
// ============================================

interface ConversionEventParams {
  eventName: 'Lead' | 'CompleteRegistration' | 'Purchase';
  phone: string;
  email?: string;
  leadId?: string;
  name?: string;
  value?: number;
  currency?: string;
  eventSourceUrl?: string;
}

interface MetaEventPayload {
  event_name: string;
  event_time: number;
  action_source: string;
  user_data: Record<string, string | string[] | number>;
  custom_data: Record<string, unknown>;
  event_source_url?: string;
  event_id?: string;
}

// ============================================
// Core API Functions
// ============================================

/**
 * Send a conversion event to Meta Conversions API
 */
export async function sendConversionEvent(
  params: ConversionEventParams,
  attempt: number = 1
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  // Check for required credentials
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) {
    console.log('[Meta] Missing credentials, skipping conversion event');
    return { success: false, error: 'Missing credentials' };
  }

  const eventId = `${params.eventName}_${params.phone}_${Date.now()}`;

  const eventPayload: MetaEventPayload = {
    event_name: params.eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'system_generated', // Required for CRM events
    user_data: prepareUserData({
      phone: params.phone,
      email: params.email,
      leadId: params.leadId,
      name: params.name
    }),
    custom_data: {
      event_source: 'crm',
      lead_event_source: 'Loomi'
    },
    event_id: eventId
  };

  // Add value and currency for Purchase events (required by Meta)
  if (params.eventName === 'Purchase') {
    eventPayload.custom_data.value = params.value || 0;
    eventPayload.custom_data.currency = params.currency || 'MXN';
  }

  // Add event source URL if provided
  if (params.eventSourceUrl) {
    eventPayload.event_source_url = params.eventSourceUrl;
  }

  const requestBody: Record<string, unknown> = {
    data: [eventPayload],
    access_token: META_ACCESS_TOKEN
  };

  // Add test event code for development
  if (META_TEST_EVENT_CODE) {
    requestBody.test_event_code = META_TEST_EVENT_CODE;
    console.log(`[Meta] Using test event code: ${META_TEST_EVENT_CODE}`);
  }

  try {
    const response = await fetchWithTimeout(
      `${META_API_URL}/${META_PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        timeoutMs: 6000,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.error?.message || 'Unknown error';
      console.error(`[Meta] API error (attempt ${attempt}):`, errorMessage);

      // Retry with exponential backoff
      if (attempt < MAX_RETRIES) {
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        console.log(`[Meta] Retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
        return sendConversionEvent(params, attempt + 1);
      }

      // Queue for later retry if all attempts failed
      await queueFailedEvent(params, errorMessage);
      return { success: false, error: errorMessage };
    }

    console.log(`[Meta] Event sent successfully: ${params.eventName} for ${params.phone}`);
    return { success: true, eventId };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error';
    console.error(`[Meta] Request failed (attempt ${attempt}):`, errorMessage);

    // Retry with exponential backoff
    if (attempt < MAX_RETRIES) {
      const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
      console.log(`[Meta] Retrying in ${backoffMs}ms...`);
      await sleep(backoffMs);
      return sendConversionEvent(params, attempt + 1);
    }

    // Queue for later retry if all attempts failed
    await queueFailedEvent(params, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Sleep helper for backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Queue failed event for later retry by cron job
 */
async function queueFailedEvent(
  params: ConversionEventParams,
  errorMessage: string
): Promise<void> {
  try {
    const supabase = getSupabase();

    await supabase.from('conversion_events_queue').insert({
      event_name: params.eventName,
      lead_id: params.leadId || null,
      phone: params.phone,
      email: params.email || null,
      payload: params,
      status: 'pending',
      attempts: MAX_RETRIES,
      last_error: errorMessage
    });

    console.log(`[Meta] Event queued for retry: ${params.eventName}`);
  } catch (queueError) {
    console.error('[Meta] Failed to queue event:', queueError);
  }
}

// ============================================
// High-Level Tracking Functions
// ============================================

/**
 * Track when a lead is qualified (completes WhatsApp Flow)
 * Event: Lead
 */
export async function trackLeadQualified(params: {
  phone: string;
  leadId?: string;
  name?: string;
  email?: string;
}): Promise<void> {
  console.log(`[Meta] Tracking lead qualified: ${params.phone}`);

  await sendConversionEvent({
    eventName: 'Lead',
    phone: params.phone,
    leadId: params.leadId,
    name: params.name,
    email: params.email
  });
}

/**
 * Track when a demo is scheduled
 * Event: CompleteRegistration
 */
export async function trackDemoScheduled(params: {
  phone: string;
  leadId?: string;
  name?: string;
  email?: string;
}): Promise<void> {
  console.log(`[Meta] Tracking demo scheduled: ${params.phone}`);

  await sendConversionEvent({
    eventName: 'CompleteRegistration',
    phone: params.phone,
    leadId: params.leadId,
    name: params.name,
    email: params.email
  });
}

/**
 * Track when a customer is won (payment completed or manual stage change)
 * Event: Purchase
 */
export async function trackCustomerWon(params: {
  phone: string;
  leadId?: string;
  name?: string;
  email?: string;
  value?: number;
  currency?: string;
}): Promise<void> {
  console.log(`[Meta] Tracking customer won: ${params.phone}`);

  await sendConversionEvent({
    eventName: 'Purchase',
    phone: params.phone,
    leadId: params.leadId,
    name: params.name,
    email: params.email,
    value: params.value,
    currency: params.currency || 'MXN'
  });
}

// ============================================
// Queue Processing (for cron job)
// ============================================

/**
 * Process pending events from the queue
 * Called by cron job to retry failed events
 */
export async function processEventQueue(limit: number = 10): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const supabase = getSupabase();
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    // Get pending events
    const { data: events, error } = await supabase
      .from('conversion_events_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 10) // Max 10 total attempts
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error || !events || events.length === 0) {
      console.log('[Meta] No pending events to process');
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    console.log(`[Meta] Processing ${events.length} queued events`);

    for (const event of events) {
      processed++;

      // Attempt to send the event
      const result = await sendConversionEventDirect(event.payload as ConversionEventParams);

      if (result.success) {
        // Mark as sent
        await supabase
          .from('conversion_events_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', event.id);

        succeeded++;
      } else {
        // Update attempt count and error
        const newAttempts = (event.attempts || 0) + 1;
        const newStatus = newAttempts >= 10 ? 'failed' : 'pending';

        await supabase
          .from('conversion_events_queue')
          .update({
            attempts: newAttempts,
            last_error: result.error,
            status: newStatus
          })
          .eq('id', event.id);

        failed++;
      }
    }

    console.log(`[Meta] Queue processing complete: ${succeeded}/${processed} succeeded`);

  } catch (error) {
    console.error('[Meta] Queue processing error:', error);
  }

  return { processed, succeeded, failed };
}

/**
 * Direct send without retry (for queue processing)
 */
async function sendConversionEventDirect(
  params: ConversionEventParams
): Promise<{ success: boolean; error?: string }> {
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) {
    return { success: false, error: 'Missing credentials' };
  }

  const eventId = `${params.eventName}_${params.phone}_${Date.now()}`;

  const eventPayload: MetaEventPayload = {
    event_name: params.eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'system_generated',
    user_data: prepareUserData({
      phone: params.phone,
      email: params.email,
      leadId: params.leadId,
      name: params.name
    }),
    custom_data: {
      event_source: 'crm',
      lead_event_source: 'Loomi'
    },
    event_id: eventId
  };

  if (params.eventName === 'Purchase') {
    eventPayload.custom_data.value = params.value || 0;
    eventPayload.custom_data.currency = params.currency || 'MXN';
  }

  const requestBody: Record<string, unknown> = {
    data: [eventPayload],
    access_token: META_ACCESS_TOKEN
  };

  if (META_TEST_EVENT_CODE) {
    requestBody.test_event_code = META_TEST_EVENT_CODE;
  }

  try {
    const response = await fetchWithTimeout(
      `${META_API_URL}/${META_PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        timeoutMs: 6000,
      }
    );

    if (!response.ok) {
      const result = await response.json();
      return { success: false, error: result.error?.message || 'API error' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}
