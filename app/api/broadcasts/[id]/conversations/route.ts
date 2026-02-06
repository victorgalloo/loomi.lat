import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';

// Generate all plausible phone formats for matching.
// Handles: with/without +, Mexican numbers with/without the "1" after "52".
function phoneVariants(digits: string): string[] {
  const variants = new Set<string>();
  variants.add(digits);
  variants.add(`+${digits}`);

  if (digits.startsWith('521') && digits.length === 13) {
    const without1 = '52' + digits.slice(3);
    variants.add(without1);
    variants.add(`+${without1}`);
  } else if (digits.startsWith('52') && digits.length === 12) {
    const with1 = '521' + digits.slice(2);
    variants.add(with1);
    variants.add(`+${with1}`);
  }

  return [...variants];
}

const HOT_STAGES = new Set([
  'calificado', 'qualified',
  'propuesta', 'proposal',
  'negociacion', 'negotiation',
  'ganado', 'won',
  'demo_scheduled',
]);

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

    // 1. Get campaign
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
      return NextResponse.json({ conversations: [], noResponse: [] });
    }

    // 2. Get all sent recipients
    const { data: recipients } = await supabase
      .from('broadcast_recipients')
      .select('phone, name')
      .eq('campaign_id', id)
      .eq('status', 'sent');

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ conversations: [], noResponse: [] });
    }

    // Build phone variants
    const phonesAllFormats = [...new Set(
      recipients.flatMap(r => phoneVariants(r.phone.replace(/\D/g, '')))
    )];

    // 3. Get conversations matching recipient phones
    const { data: conversationsData } = await supabase
      .from('conversations')
      .select(`
        id,
        started_at,
        bot_paused,
        leads!inner(id, name, phone, stage, priority, is_qualified)
      `)
      .eq('leads.tenant_id', tenantId)
      .in('leads.phone', phonesAllFormats);

    // 4. Get handoffs
    const convIds = (conversationsData || []).map(c => c.id);
    const { data: handoffs } = convIds.length > 0
      ? await supabase
          .from('handoffs')
          .select('conversation_id, reason, priority')
          .in('conversation_id', convIds)
          .is('resolved_at', null)
      : { data: [] };

    const handoffMap = new Map(
      (handoffs || []).map(h => [h.conversation_id, h])
    );

    // 5. Check post-broadcast messages + categorize
    const respondedDigits = new Set<string>();

    const conversations = (await Promise.all(
      (conversationsData || []).map(async (conv) => {
        const lead = conv.leads as unknown as {
          id: string; name: string; phone: string;
          stage: string; priority: string | null; is_qualified: boolean | null;
        };

        const { count: postBroadcastCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('role', 'user')
          .gte('created_at', campaign.started_at);

        if (!postBroadcastCount || postBroadcastCount === 0) return null;

        // Mark this phone as responded
        respondedDigits.add(lead.phone.replace(/\D/g, ''));

        const { data: messages, count } = await supabase
          .from('messages')
          .select('content, role, created_at', { count: 'exact' })
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMessage = messages?.[0];
        const handoff = handoffMap.get(conv.id);

        let category: 'handoff' | 'hot' | 'normal' = 'normal';
        let handoffReason: string | null = null;
        let handoffPriority: string | null = null;

        if (handoff || conv.bot_paused) {
          category = 'handoff';
          handoffReason = handoff?.reason || null;
          handoffPriority = handoff?.priority || null;
        } else if (
          lead.priority === 'high' ||
          lead.is_qualified ||
          HOT_STAGES.has((lead.stage || '').toLowerCase())
        ) {
          category = 'hot';
        }

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
          category,
          handoffReason,
          handoffPriority,
        };
      })
    )).filter(Boolean);

    // 6. Build no-response list
    const noResponse = recipients.filter(r => {
      const digits = r.phone.replace(/\D/g, '');
      const variants = phoneVariants(digits);
      return !variants.some(v => respondedDigits.has(v.replace(/\D/g, '')));
    }).map(r => ({
      phone: r.phone,
      name: r.name || null,
    }));

    return NextResponse.json({ conversations, noResponse });
  } catch (error) {
    console.error('Error in GET /api/broadcasts/[id]/conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
