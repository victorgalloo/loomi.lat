import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { encrypt } from '@/lib/crypto';
import { getCalCredentials } from '@/lib/integrations/tenant-integrations';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL));
  }

  const tenantId = await getTenantIdForUser(user.email);
  if (!tenantId) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL));
  }

  const credentials = await getCalCredentials(tenantId);
  if (!credentials) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    return NextResponse.redirect(
      `${appUrl}/dashboard/agent/tools?calcom=error&message=no_credentials`
    );
  }

  // Encrypt tenantId + timestamp as state to prevent CSRF
  const state = encrypt(JSON.stringify({ tenantId, ts: Date.now() }));
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/calcom/callback`;

  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  });

  const calAuthUrl = `https://app.cal.com/auth/oauth2/authorize?${params.toString()}`;
  return NextResponse.redirect(calAuthUrl);
}
