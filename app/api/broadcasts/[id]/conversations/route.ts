import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    // 1. Get campaign (validate ownership)
    const { data: campaign, error: campaignError } = await supabase
      .from('broadcast_campaigns')
      .select('id, started_at, tenant_id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (!campaign.started_at) {
      return NextResponse.json({ conversations: [] });
    }

    // 2. Get unique phones from sent recipients
    const { data: recipients } = await supabase
      .from('broadcast_recipients')
      .select('phone')
      .eq('campaign_id', id)
      .eq('status', 'sent');

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // Normalize phones: strip everything except digits for matching
    const normalize = (p: string) => p.replace(/\D/g, '');
    const phonesDigitsOnly = [...new Set(recipients.map(r => normalize(r.phone)))];
    // Also keep original formats for exact match (covers both +prefix and no-prefix)
    const phonesAllFormats = [...new Set(
      phonesDigitsOnly.flatMap(p => [p, `+${p}`])
    )];

    // 3. Get conversations from leads matching those phones, started after campaign
    const { data: conversationsData } = await supabase
      .from('conversations')
      .select(`
        id,
        started_at,
        leads!inner(id, name, phone, stage)
      `)
      .eq('leads.tenant_id', tenantId)
      .in('leads.phone', phonesAllFormats)
      .gte('started_at', campaign.started_at)
      .order('started_at', { ascending: false });

    if (!conversationsData || conversationsData.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // 4. Enrich with message count + last message
    const conversations = await Promise.all(
      conversationsData.map(async (conv) => {
        const lead = conv.leads as unknown as { id: string; name: string; phone: string; stage: string };

        const { data: messages, count } = await supabase
          .from('messages')
          .select('content, role, created_at', { count: 'exact' })
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMessage = messages?.[0];

        return {
          id: conv.id,
          leadName: lead.name || 'Usuario',
          leadPhone: lead.phone,
          leadStage: lead.stage || 'initial',
          messageCount: count || 0,
          lastMessage: lastMessage?.content || '',
          lastMessageRole: lastMessage?.role || 'user',
          startedAt: conv.started_at,
          lastMessageAt: lastMessage?.created_at || conv.started_at,
        };
      })
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error in GET /api/broadcasts/[id]/conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
