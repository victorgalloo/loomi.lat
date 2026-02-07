import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { getVerificationCode } from '@/lib/twilio/numbers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const result = await getVerificationCode(id, tenantId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Verification poll error:', error);
    return NextResponse.json(
      { error: 'Failed to get verification code' },
      { status: 500 }
    );
  }
}
