/**
 * API endpoint to reset test data
 * POST /api/test/reset - Reset specific phone number
 * POST /api/test/reset?all=true - Reset ALL test data
 */

import { NextRequest, NextResponse } from 'next/server';
import { resetTestLead, resetAllTestData } from '@/lib/memory/supabase';

// Secret key to prevent accidental calls (optional security)
const RESET_SECRET = process.env.TEST_RESET_SECRET || 'reset-test-data';

export async function POST(request: NextRequest) {
  try {
    // Check for secret (basic protection)
    const authHeader = request.headers.get('x-reset-secret');
    const { searchParams } = new URL(request.url);

    if (authHeader !== RESET_SECRET && searchParams.get('secret') !== RESET_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if resetting all test data
    if (searchParams.get('all') === 'true') {
      const result = await resetAllTestData();
      return NextResponse.json(result);
    }

    // Reset specific phone number
    const body = await request.json().catch(() => ({}));
    const phone = body.phone || searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number required. Use ?phone=NUMBER or body { phone: "NUMBER" }' },
        { status: 400 }
      );
    }

    const result = await resetTestLead(phone);
    return NextResponse.json(result);

  } catch (error) {
    console.error('[API] Reset error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
