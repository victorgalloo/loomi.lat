/**
 * POST /api/conversations/[id]/attachment
 * Upload file attachment, send via WhatsApp, save message with media fields
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { uploadToStorage } from '@/lib/storage/media';
import { sendWhatsAppImage, sendWhatsAppDocument, sendWhatsAppVideo } from '@/lib/whatsapp/send';
import { getTenantCredentials, getAgentConfig } from '@/lib/tenant/context';
import { saveMessage } from '@/lib/memory/supabase';
import { pauseBot } from '@/lib/bot-pause';

const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB WhatsApp limit

const MIME_TO_MEDIA_TYPE: Record<string, string> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'application/pdf': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'video/mp4': 'video',
};

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

    // Get conversation and verify it belongs to this tenant
    const { data: conversation } = await supabase
      .from('conversations')
      .select(`id, leads!inner(id, phone, tenant_id)`)
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const lead = conversation.leads as unknown as { id: string; phone: string; tenant_id: string };

    if (lead.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const caption = (formData.get('caption') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 16MB)' }, { status: 400 });
    }

    const mediaType = MIME_TO_MEDIA_TYPE[file.type];
    if (!mediaType) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `conversations/${conversationId}/${Date.now()}-${file.name}`;
    const publicUrl = await uploadToStorage(storagePath, buffer, file.type);

    if (!publicUrl) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Send via WhatsApp
    const credentials = await getTenantCredentials(tenantId);
    let sent = false;

    if (mediaType === 'image') {
      sent = await sendWhatsAppImage(lead.phone, publicUrl, caption || undefined, credentials || undefined);
    } else if (mediaType === 'document') {
      sent = await sendWhatsAppDocument(lead.phone, publicUrl, caption || file.name, credentials || undefined);
    } else if (mediaType === 'video') {
      sent = await sendWhatsAppVideo(lead.phone, publicUrl, caption || undefined, credentials || undefined);
    }

    if (!sent) {
      return NextResponse.json({ error: 'Failed to send via WhatsApp' }, { status: 500 });
    }

    // Save message to DB with media fields
    const messageContent = caption || (mediaType === 'image' ? '📷 Imagen' : mediaType === 'video' ? '🎥 Video' : `📄 ${file.name}`);

    const agentCfg = await getAgentConfig(tenantId);
    const shouldPause = agentCfg?.autoReplyEnabled === false;

    await Promise.all([
      saveMessage(conversationId, 'assistant', messageContent, lead.id, undefined, {
        url: publicUrl,
        type: mediaType,
        filename: file.name,
      }),
      shouldPause ? pauseBot(conversationId, user.email) : Promise.resolve(),
    ]);

    return NextResponse.json({
      status: 'sent',
      media_url: publicUrl,
      media_type: mediaType,
      media_filename: file.name,
    });
  } catch (error) {
    console.error('[Attachment API] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
