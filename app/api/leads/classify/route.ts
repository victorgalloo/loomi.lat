import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import {
  classifyConversationWithAI,
  applyClassificationToLead,
  Classification,
} from '@/lib/broadcasts/classify';

export async function POST() {
  try {
    const supabase = await createClient();

    // Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    // Get leads without classification
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name, phone, stage')
      .eq('tenant_id', tenantId)
      .is('broadcast_classification', null);

    if (leadsError) {
      return NextResponse.json({ error: leadsError.message }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        total: 0,
        classified: 0,
        skipped: 0,
        results: { hot: 0, warm: 0, cold: 0, bot_autoresponse: 0 },
      });
    }

    const results: Record<Classification, number> = {
      hot: 0,
      warm: 0,
      cold: 0,
      bot_autoresponse: 0,
    };
    let classified = 0;
    let skipped = 0;

    for (const lead of leads) {
      // Get conversation for this lead
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!conversation) {
        skipped++;
        continue;
      }

      // Get messages
      const { data: messages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      // Skip if no user messages
      const hasUserMessages = messages?.some(m => m.role === 'user');
      if (!messages || messages.length === 0 || !hasUserMessages) {
        skipped++;
        continue;
      }

      // Classify
      const classification = await classifyConversationWithAI(messages);
      await applyClassificationToLead(supabase, lead.id, classification, lead.stage || 'Nuevo');

      results[classification]++;
      classified++;

      // Rate limit delay between AI calls
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    return NextResponse.json({
      total: leads.length,
      classified,
      skipped,
      results,
    });
  } catch (error) {
    console.error('Error in POST /api/leads/classify:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
