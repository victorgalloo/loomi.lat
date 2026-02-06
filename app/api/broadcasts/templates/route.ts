import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { getSupabase } from '@/lib/memory/supabase';
import { decryptAccessToken } from '@/lib/crypto';

const GRAPH_API_VERSION = 'v22.0';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    // Get first active WhatsApp account for this tenant (templates are per WABA)
    const db = getSupabase();
    const { data: accounts, error: accountError } = await db
      .from('whatsapp_accounts')
      .select('waba_id, access_token_encrypted')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .limit(1);

    if (accountError || !accounts || accounts.length === 0) {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 });
    }

    const account = accounts[0];
    const accessToken = decryptAccessToken(account.access_token_encrypted);

    // Fetch templates from Meta API
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${account.waba_id}/message_templates?fields=name,status,language,category,components&limit=100`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Broadcasts] Templates fetch error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch templates from Meta' }, { status: 502 });
    }

    const data = await response.json();
    const templates = (data.data || [])
      .filter((t: { status: string }) => t.status === 'APPROVED')
      .map((t: { name: string; language: string; category: string; components: unknown[] }) => ({
        name: t.name,
        language: t.language,
        category: t.category,
        components: t.components,
      }));

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error in GET /api/broadcasts/templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
