import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { getProvisionedNumbers } from '@/lib/twilio/numbers';

export async function GET() {
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

    const numbers = await getProvisionedNumbers(tenantId);

    return NextResponse.json({ numbers });
  } catch (error) {
    console.error('Twilio list error:', error);
    return NextResponse.json(
      { error: 'Failed to list numbers' },
      { status: 500 }
    );
  }
}
