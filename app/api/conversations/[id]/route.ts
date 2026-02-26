/**
 * GET /api/conversations/[id]
 * Returns conversation detail + lead + messages for client-side fetching
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get conversation with lead info
    const { data: conversation } = await supabase
      .from('conversations')
      .select(`
        id,
        started_at,
        ended_at,
        summary,
        bot_paused,
        leads!inner(id, name, phone, email, company, stage, industry, tenant_id)
      `)
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const lead = conversation.leads as unknown as {
      id: string;
      name: string;
      phone: string;
      email: string | null;
      company: string | null;
      stage: string;
      industry: string | null;
      tenant_id: string;
    };

    if (lead.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get messages
    const { data: messages } = await supabase
      .from('messages')
      .select('id, role, content, created_at, media_url, media_type, media_filename')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        started_at: conversation.started_at,
        ended_at: conversation.ended_at,
        summary: conversation.summary,
        bot_paused: conversation.bot_paused ?? false,
      },
      lead: {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        company: lead.company,
        stage: lead.stage,
        industry: lead.industry,
      },
      messages: messages || [],
    });
  } catch (error) {
    console.error('[Conversation API] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
