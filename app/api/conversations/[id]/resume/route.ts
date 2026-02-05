/**
 * POST /api/conversations/[id]/resume
 * Resume the bot for a conversation (operator releases control)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { resumeBot } from '@/lib/bot-pause';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;

  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify conversation belongs to tenant
    const { data: conversation } = await supabase
      .from('conversations')
      .select(`
        id,
        leads!inner(tenant_id)
      `)
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const lead = conversation.leads as unknown as { tenant_id: string };

    if (lead.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await resumeBot(conversationId);

    return NextResponse.json({ status: 'resumed' });
  } catch (error) {
    console.error('[Resume API] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
