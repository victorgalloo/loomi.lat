import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { purchaseNumber } from '@/lib/twilio/numbers';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
    }

    const { phoneNumber } = await request.json();

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json({ error: 'phoneNumber is required' }, { status: 400 });
    }

    const webhookBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!webhookBaseUrl) {
      return NextResponse.json({ error: 'App URL not configured' }, { status: 500 });
    }

    const number = await purchaseNumber(phoneNumber, tenantId, webhookBaseUrl);

    return NextResponse.json({ success: true, number });
  } catch (error: unknown) {
    console.error('Twilio purchase error:', error);
    const message = error instanceof Error ? error.message : 'Failed to purchase number';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
