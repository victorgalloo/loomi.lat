import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { sendTemplateMessage, type TemplateComponent } from '@/lib/whatsapp/send';
import { getTenantCredentials } from '@/lib/tenant/context';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(
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

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('broadcast_campaigns')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status === 'sending') {
      return NextResponse.json({ error: 'Campaign is already sending' }, { status: 409 });
    }

    if (campaign.status === 'completed') {
      return NextResponse.json({ error: 'Campaign already completed' }, { status: 409 });
    }

    // Get tenant credentials
    const credentials = await getTenantCredentials(tenantId);
    if (!credentials) {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 });
    }

    // Mark as sending
    await supabase
      .from('broadcast_campaigns')
      .update({ status: 'sending', started_at: new Date().toISOString() })
      .eq('id', id);

    // Get pending recipients
    const { data: recipients } = await supabase
      .from('broadcast_recipients')
      .select('*')
      .eq('campaign_id', id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (!recipients || recipients.length === 0) {
      await supabase
        .from('broadcast_campaigns')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', id);
      return NextResponse.json({ message: 'No pending recipients' });
    }

    const baseComponents = campaign.template_components as TemplateComponent[] | null;

    // Helper to replace {{csv_name}} with recipient's name
    const buildRecipientComponents = (recipient: { name: string | null }): TemplateComponent[] | undefined => {
      if (!baseComponents) return undefined;

      return baseComponents.map(comp => ({
        ...comp,
        parameters: comp.parameters.map(param => ({
          ...param,
          text: param.text === '{{csv_name}}'
            ? (recipient.name || 'Cliente')
            : param.text,
        })),
      }));
    };

    // Process in batches
    const BATCH_SIZE = 50;
    let sentCount = campaign.sent_count || 0;
    let failedCount = campaign.failed_count || 0;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);

      const results = await Promise.all(
        batch.map(async (recipient) => {
          // Build components with recipient-specific data
          const recipientComponents = buildRecipientComponents(recipient);

          const result = await sendTemplateMessage(
            recipient.phone,
            campaign.template_name,
            campaign.template_language || 'es',
            recipientComponents,
            credentials
          );

          if (result.success) {
            sentCount++;
            await supabase
              .from('broadcast_recipients')
              .update({
                status: 'sent',
                wa_message_id: result.messageId,
                sent_at: new Date().toISOString(),
              })
              .eq('id', recipient.id);
          } else {
            failedCount++;
            await supabase
              .from('broadcast_recipients')
              .update({
                status: 'failed',
                error_message: result.error,
              })
              .eq('id', recipient.id);
          }

          return result;
        })
      );

      // Update campaign counts after each batch
      await supabase
        .from('broadcast_campaigns')
        .update({ sent_count: sentCount, failed_count: failedCount })
        .eq('id', id);

      // Rate limiting: 1 second between batches
      if (i + BATCH_SIZE < recipients.length) {
        await delay(1000);
      }
    }

    // Mark completed
    await supabase
      .from('broadcast_campaigns')
      .update({
        status: 'completed',
        sent_count: sentCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);

    return NextResponse.json({
      message: 'Broadcast completed',
      sent: sentCount,
      failed: failedCount,
    });
  } catch (error) {
    console.error('Error in POST /api/broadcasts/[id]/send:', error);

    // Try to mark campaign as failed
    try {
      const { id } = await params;
      const supabase = await createClient();
      await supabase
        .from('broadcast_campaigns')
        .update({ status: 'failed' })
        .eq('id', id);
    } catch {
      // ignore cleanup error
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
