import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/crypto';
import { saveCalTokens, upsertIntegration, getCalCredentials } from '@/lib/integrations/tenant-integrations';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  if (errorParam) {
    return NextResponse.redirect(`${appUrl}/dashboard/agent/tools?calcom=error&message=${encodeURIComponent(errorParam)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard/agent/tools?calcom=error&message=missing_params`);
  }

  // Decrypt and validate state
  let tenantId: string;
  try {
    const parsed = JSON.parse(decrypt(state));
    tenantId = parsed.tenantId;

    // Reject if state is older than 10 minutes
    if (Date.now() - parsed.ts > 10 * 60 * 1000) {
      return NextResponse.redirect(`${appUrl}/dashboard/agent/tools?calcom=error&message=expired`);
    }
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/agent/tools?calcom=error&message=invalid_state`);
  }

  // Get tenant's Cal.com credentials from DB
  const credentials = await getCalCredentials(tenantId);
  if (!credentials) {
    return NextResponse.redirect(`${appUrl}/dashboard/agent/tools?calcom=error&message=no_credentials`);
  }

  // Exchange code for tokens
  try {
    const tokenRes = await fetch('https://app.cal.com/api/auth/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        redirect_uri: `${appUrl}/api/integrations/calcom/callback`,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[Cal.com] Token exchange failed:', errText);
      await upsertIntegration(tenantId, 'calcom', {
        status: 'error',
        error_message: `Token exchange failed: ${tokenRes.status}`,
      });
      return NextResponse.redirect(`${appUrl}/dashboard/agent/tools?calcom=error`);
    }

    const tokens = await tokenRes.json();

    // Fetch user info to get username
    let calUsername: string | undefined;
    try {
      const meRes = await fetch('https://api.cal.com/v2/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        calUsername = meData.data?.username || meData.username;
      }
    } catch {
      // non-critical
    }

    // Fetch event types to auto-save the first event type ID
    let calEventTypeId: string | undefined;
    try {
      const etRes = await fetch(`https://api.cal.com/v1/event-types?apiKey=${tokens.access_token}`);
      if (etRes.ok) {
        const etData = await etRes.json();
        const eventTypes = etData.event_types || etData.data || [];
        if (eventTypes.length > 0) {
          calEventTypeId = String(eventTypes[0].id);
          console.log(`[Cal.com] Auto-detected event type ID: ${calEventTypeId} (${eventTypes[0].title || eventTypes[0].slug})`);
        } else {
          console.warn(`[Cal.com] No event types found for tenant ${tenantId}. Booking will fail until one is created.`);
        }
      }
    } catch {
      console.warn(`[Cal.com] Failed to fetch event types for tenant ${tenantId}`);
    }

    await saveCalTokens(tenantId, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
      calUsername,
      calEventTypeId,
    });

    return NextResponse.redirect(`${appUrl}/dashboard/agent/tools?calcom=connected`);
  } catch (err) {
    console.error('[Cal.com] OAuth callback error:', err);
    await upsertIntegration(tenantId, 'calcom', {
      status: 'error',
      error_message: String(err),
    });
    return NextResponse.redirect(`${appUrl}/dashboard/agent/tools?calcom=error`);
  }
}
