/**
 * Fix pr11 campaign components and send it
 * Run with: npx tsx --env-file=.env.local scripts/send-pr11-campaign.ts
 */
import { createClient } from '@supabase/supabase-js';
import { decryptAccessToken } from '../lib/crypto';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TENANT_ID = '25441729-52cf-492b-8c4b-69b77dc81334';
const CAMPAIGN_ID = '83563b0a-ab09-4534-9cb9-774911cc7a33';
const BATCH_SIZE = 50;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  // 1. Get credentials
  const { data: accounts } = await sb
    .from('whatsapp_accounts')
    .select('phone_number_id, access_token_encrypted, waba_id')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'active')
    .limit(1);

  const account = accounts?.[0];
  if (!account) { console.error('No WhatsApp account found'); process.exit(1); }
  const accessToken = decryptAccessToken(account.access_token_encrypted);

  // 2. Get the document header URL from Meta template
  const tmplUrl = `https://graph.facebook.com/v22.0/${account.waba_id}/message_templates?fields=name,components&limit=100`;
  const tmplRes = await fetch(tmplUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  const tmplData = await tmplRes.json();
  const pr11 = tmplData.data?.find((t: { name: string }) => t.name === 'pr11');
  const headerHandle = pr11?.components?.find((c: { type: string }) => c.type === 'HEADER')?.example?.header_handle?.[0];

  if (!headerHandle) { console.error('No header handle found for pr11 template'); process.exit(1); }
  console.log('Document header URL found ✓');

  // 3. Update campaign template_components with document header
  const fixedComponents = [
    {
      type: 'header',
      parameters: [{
        type: 'document',
        document: { link: headerHandle },
      }],
    },
    {
      type: 'body',
      parameters: [{
        type: 'text',
        text: '{{csv_name}}',
      }],
    },
  ];

  await sb
    .from('broadcast_campaigns')
    .update({ template_components: fixedComponents })
    .eq('id', CAMPAIGN_ID);

  console.log('Campaign components updated ✓');

  // 4. Get all pending recipients
  const { data: recipients } = await sb
    .from('broadcast_recipients')
    .select('id, phone, name')
    .eq('campaign_id', CAMPAIGN_ID)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (!recipients || recipients.length === 0) {
    console.log('No pending recipients');
    return;
  }

  console.log(`Sending to ${recipients.length} recipients...`);

  // 5. Mark as sending
  await sb
    .from('broadcast_campaigns')
    .update({ status: 'sending', started_at: new Date().toISOString() })
    .eq('id', CAMPAIGN_ID);

  const sendUrl = `https://graph.facebook.com/v22.0/${account.phone_number_id}/messages`;
  let sentCount = 0;
  let failedCount = 0;

  // 6. Send test message first
  const testRecipient = recipients[0];
  const testPayload = {
    messaging_product: 'whatsapp',
    to: testRecipient.phone,
    type: 'template',
    template: {
      name: 'pr11',
      language: { code: 'es' },
      components: [
        {
          type: 'header',
          parameters: [{ type: 'document', document: { link: headerHandle } }],
        },
        {
          type: 'body',
          parameters: [{ type: 'text', text: testRecipient.name || 'Cliente' }],
        },
      ],
    },
  };

  const testRes = await fetch(sendUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload),
  });

  if (!testRes.ok) {
    const err = await testRes.text();
    console.error('Test message failed:', err);
    await sb.from('broadcast_campaigns').update({ status: 'failed' }).eq('id', CAMPAIGN_ID);
    process.exit(1);
  }

  const testData = await testRes.json();
  sentCount++;
  await sb.from('broadcast_recipients').update({
    status: 'sent',
    wa_message_id: testData.messages?.[0]?.id,
    sent_at: new Date().toISOString(),
  }).eq('id', testRecipient.id);

  console.log(`✓ Test message sent to ${testRecipient.phone} (${testRecipient.name})`);
  const remaining = recipients.slice(1);

  // 7. Send in batches
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map(async (r) => {
        const payload = {
          messaging_product: 'whatsapp',
          to: r.phone,
          type: 'template',
          template: {
            name: 'pr11',
            language: { code: 'es' },
            components: [
              {
                type: 'header',
                parameters: [{ type: 'document', document: { link: headerHandle } }],
              },
              {
                type: 'body',
                parameters: [{ type: 'text', text: r.name || 'Cliente' }],
              },
            ],
          },
        };

        try {
          const res = await fetch(sendUrl, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            const data = await res.json();
            sentCount++;
            await sb.from('broadcast_recipients').update({
              status: 'sent',
              wa_message_id: data.messages?.[0]?.id,
              sent_at: new Date().toISOString(),
            }).eq('id', r.id);
            return { ok: true, phone: r.phone };
          } else {
            const errText = await res.text();
            failedCount++;
            await sb.from('broadcast_recipients').update({
              status: 'failed',
              error_message: errText.substring(0, 500),
            }).eq('id', r.id);
            return { ok: false, phone: r.phone, error: errText.substring(0, 100) };
          }
        } catch (e) {
          failedCount++;
          const msg = e instanceof Error ? e.message : 'Unknown';
          await sb.from('broadcast_recipients').update({
            status: 'failed',
            error_message: msg,
          }).eq('id', r.id);
          return { ok: false, phone: r.phone, error: msg };
        }
      })
    );

    // Update counts
    await sb.from('broadcast_campaigns').update({ sent_count: sentCount, failed_count: failedCount }).eq('id', CAMPAIGN_ID);

    const batchSent = results.filter(r => r.ok).length;
    const batchFailed = results.filter(r => !r.ok).length;
    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchSent} sent, ${batchFailed} failed (total: ${sentCount}/${recipients.length})`);

    // Log failures
    results.filter(r => !r.ok).forEach(r => console.log(`  ✗ ${r.phone}: ${r.error}`));

    if (i + BATCH_SIZE < remaining.length) await delay(1000);
  }

  // 8. Mark completed
  await sb.from('broadcast_campaigns').update({
    status: 'completed',
    sent_count: sentCount,
    failed_count: failedCount,
    completed_at: new Date().toISOString(),
  }).eq('id', CAMPAIGN_ID);

  console.log(`\n✓ Campaign complete: ${sentCount} sent, ${failedCount} failed`);
}

main().catch(console.error);
