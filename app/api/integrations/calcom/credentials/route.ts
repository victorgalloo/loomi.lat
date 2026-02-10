import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { saveCalCredentials } from '@/lib/integrations/tenant-integrations';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = await getTenantIdForUser(user.email);
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
  }

  const body = await request.json();
  const { clientId, clientSecret } = body;

  if (!clientId || typeof clientId !== 'string' || !clientSecret || typeof clientSecret !== 'string') {
    return NextResponse.json({ error: 'clientId and clientSecret are required' }, { status: 400 });
  }

  try {
    await saveCalCredentials(tenantId, clientId.trim(), clientSecret.trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Cal.com] Save credentials error:', err);
    return NextResponse.json({ error: 'Failed to save credentials' }, { status: 500 });
  }
}
