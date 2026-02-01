/**
 * Cron Job: Meta Conversions Queue Processor
 *
 * Processes failed conversion events from the queue and retries sending them to Meta.
 * Should be called periodically (every 5-15 minutes) via Vercel Cron.
 *
 * Configure in vercel.json:
 * "crons": [{ "path": "/api/cron/meta-conversions", "schedule": "0/10 * * * *" }]
 */

import { NextRequest, NextResponse } from 'next/server';
import { processEventQueue } from '@/lib/integrations/meta-conversions';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron or has the secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = request.nextUrl.searchParams.get('secret');

  // Allow Vercel Cron (no auth required on Vercel) or valid secret
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const hasValidSecret = CRON_SECRET && (
    authHeader === `Bearer ${CRON_SECRET}` ||
    cronSecret === CRON_SECRET
  );

  if (!isVercelCron && !hasValidSecret && CRON_SECRET) {
    console.log('[Cron] Unauthorized request to meta-conversions');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron] Starting Meta Conversions queue processing');

  try {
    const result = await processEventQueue(20); // Process up to 20 events

    console.log(`[Cron] Meta Conversions complete: ${result.processed} processed, ${result.succeeded} succeeded, ${result.failed} failed`);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Cron] Meta Conversions error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
