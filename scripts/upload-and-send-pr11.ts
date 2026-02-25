/**
 * Upload PDF to Meta Media API and send pr11 campaign
 * Run with: npx tsx --env-file=.env.local scripts/upload-and-send-pr11.ts
 */
import { createClient } from '@supabase/supabase-js';
import { decryptAccessToken } from '../lib/crypto';
import * as fs from 'fs';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TENANT_ID = '25441729-52cf-492b-8c4b-69b77dc81334';
const CAMPAIGN_ID = '83563b0a-ab09-4534-9cb9-774911cc7a33';
const PDF_PATH = '/Users/victorgallo/Downloads/Product Rockstar.pdf';
const BATCH_SIZE = 50;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  // 1. Get credentials
  const { data: accounts } = await sb
    .from('whatsapp_accounts')
    .select('phone_number_id, access_token_encrypted')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'active')
    .limit(1);

  const account = accounts?.[0];
  if (!account) { console.error('No WhatsApp account'); process.exit(1); }
  const accessToken = decryptAccessToken(account.access_token_encrypted);

  // 2. Upload PDF to Meta Media API
  console.log('Uploading PDF to Meta...');
  const pdfBuffer = fs.readFileSync(PDF_PATH);
  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('type', 'application/pdf');
  formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), 'Product Rockstar.pdf');

  const uploadRes = await fetch(
    `https://graph.facebook.com/v22.0/${account.phone_number_id}/media`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    }
  );
  const uploadData = await uploadRes.json();

  if (!uploadData.id) {
    console.error('Upload failed:', JSON.stringify(uploadData));
    process.exit(1);
  }
  const mediaId = uploadData.id;
  console.log(`✓ PDF uploaded, media_id: ${mediaId}`);

  // 3. Test send first
  console.log('\nSending test message...');
  const sendUrl = `https://graph.facebook.com/v22.0/${account.phone_number_id}/messages`;

  const buildPayload = (phone: string, name: string) => ({
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: 'pr11',
      language: { code: 'es' },
      components: [
        {
          type: 'header',
          parameters: [{ type: 'document', document: { id: mediaId } }],
        },
        {
          type: 'body',
          parameters: [{ type: 'text', text: name }],
        },
      ],
    },
  });

  // Reset all recipients to pending
  await sb.from('broadcast_recipients')
    .update({ status: 'pending', error_message: null, wa_message_id: null, sent_at: null })
    .eq('campaign_id', CAMPAIGN_ID);

  // Get recipients
  const { data: recipients } = await sb
    .from('broadcast_recipients')
    .select('id, phone, name')
    .eq('campaign_id', CAMPAIGN_ID)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (!recipients || recipients.length === 0) {
    console.log('No recipients'); return;
  }

  // Test with first recipient
  const testR = recipients[0];
  const testRes = await fetch(sendUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildPayload(testR.phone, testR.name || 'Cliente')),
  });

  if (!testRes.ok) {
    const err = await testRes.text();
    console.error('Test failed:', err);
    process.exit(1);
  }

  const testData = await testRes.json();
  await sb.from('broadcast_recipients').update({
    status: 'sent', wa_message_id: testData.messages?.[0]?.id, sent_at: new Date().toISOString(),
  }).eq('id', testR.id);
  console.log(`✓ Test sent to ${testR.phone} (${testR.name})`);

  // Wait a moment to confirm no immediate failure
  console.log('Waiting 3s to verify delivery...');
  await delay(3000);

  // Check if test recipient was marked failed by webhook
  const { data: check } = await sb.from('broadcast_recipients')
    .select('status, error_message')
    .eq('id', testR.id)
    .single();

  if (check?.status === 'failed') {
    console.error('Test message failed after delivery:', check.error_message);
    process.exit(1);
  }
  console.log('✓ Test message still OK, proceeding with full send\n');

  // Mark campaign as sending
  await sb.from('broadcast_campaigns')
    .update({ status: 'sending', started_at: new Date().toISOString(), sent_count: 1, failed_count: 0 })
    .eq('id', CAMPAIGN_ID);

  const remaining = recipients.slice(1);
  let sentCount = 1;
  let failedCount = 0;

  // Send in batches
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map(async (r) => {
        try {
          const res = await fetch(sendUrl, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(buildPayload(r.phone, r.name || 'Cliente')),
          });

          if (res.ok) {
            const data = await res.json();
            sentCount++;
            await sb.from('broadcast_recipients').update({
              status: 'sent', wa_message_id: data.messages?.[0]?.id, sent_at: new Date().toISOString(),
            }).eq('id', r.id);
            return { ok: true, phone: r.phone };
          } else {
            const errText = await res.text();
            failedCount++;
            await sb.from('broadcast_recipients').update({
              status: 'failed', error_message: errText.substring(0, 500),
            }).eq('id', r.id);
            return { ok: false, phone: r.phone, error: errText.substring(0, 100) };
          }
        } catch (e) {
          failedCount++;
          const msg = e instanceof Error ? e.message : 'Unknown';
          await sb.from('broadcast_recipients').update({ status: 'failed', error_message: msg }).eq('id', r.id);
          return { ok: false, phone: r.phone, error: msg };
        }
      })
    );

    await sb.from('broadcast_campaigns').update({ sent_count: sentCount, failed_count: failedCount }).eq('id', CAMPAIGN_ID);
    const ok = results.filter(r => r.ok).length;
    const fail = results.filter(r => !r.ok).length;
    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${ok} sent, ${fail} failed (total: ${sentCount}/${recipients.length})`);
    results.filter(r => !r.ok).forEach(r => console.log(`  ✗ ${r.phone}: ${r.error}`));

    if (i + BATCH_SIZE < remaining.length) await delay(1000);
  }

  // Mark completed
  await sb.from('broadcast_campaigns').update({
    status: 'completed', sent_count: sentCount, failed_count: failedCount, completed_at: new Date().toISOString(),
  }).eq('id', CAMPAIGN_ID);

  console.log(`\n✓ Campaña completa: ${sentCount} enviados, ${failedCount} fallidos`);
}

main().catch(console.error);
