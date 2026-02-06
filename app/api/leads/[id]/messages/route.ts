import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify lead belongs to this tenant
    const { data: lead } = await supabase
      .from('leads')
      .select('id, tenant_id')
      .eq('id', leadId)
      .single();

    if (!lead || lead.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Get most recent conversation for this lead
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('lead_id', leadId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (!conversation) {
      return NextResponse.json({ messages: [], conversationId: null });
    }

    const { data: messages } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      messages: messages || [],
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error('[Lead Messages API] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
