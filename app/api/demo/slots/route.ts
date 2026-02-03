/**
 * GET /api/demo/slots
 * Returns available calendar slots for demo booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAvailability } from '@/lib/tools/calendar';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dates = searchParams.get('dates');

    if (!dates) {
      return NextResponse.json({ error: 'dates parameter required' }, { status: 400 });
    }

    const slots = await checkAvailability(dates);

    return NextResponse.json({ slots });

  } catch (error) {
    console.error('[Demo Slots] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}
