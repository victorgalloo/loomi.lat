/**
 * POST /api/conversations/[id]/reply
 * Send a reply from the dashboard to a lead via WhatsApp
 * Auto-pauses the bot for this conversation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { sendWhatsAppMessage } from '@/lib/whatsapp/send';
import { getTenantCredentials } from '@/lib/tenant/context';
import { saveMessage } from '@/lib/memory/supabase';
import { pauseBot } from '@/lib/bot-pause';

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

    // Parse body
    const { message } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get conversation and verify it belongs to this tenant
    const { data: conversation } = await supabase
      .from('conversations')
      .select(`
        id,
        leads!inner(id, phone, tenant_id)
      `)
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const lead = conversation.leads as unknown as { id: string; phone: string; tenant_id: string };

    if (lead.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get tenant credentials for WhatsApp
    const credentials = await getTenantCredentials(tenantId);

    // Send WhatsApp message
    const sent = await sendWhatsAppMessage(
      lead.phone,
      message,
      credentials || undefined
    );

    if (!sent) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Save message to DB and pause bot in parallel
    await Promise.all([
      saveMessage(conversationId, 'assistant', message, lead.id),
      pauseBot(conversationId, user.email)
    ]);

    return NextResponse.json({ status: 'sent' });
  } catch (error) {
    console.error('[Reply API] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
