/**
 * Test script: send a single template message to diagnose #132012
 * Run with: npx tsx --env-file=.env.local scripts/test-broadcast-send.ts
 */
import { createClient } from '@supabase/supabase-js';
import { decryptAccessToken } from '../lib/crypto';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TENANT_ID = '25441729-52cf-492b-8c4b-69b77dc81334';
const CAMPAIGN_ID = '83563b0a-ab09-4534-9cb9-774911cc7a33';

async function main() {
  // 1. Get campaign
  const { data: campaign } = await sb
    .from('broadcast_campaigns')
    .select('template_name, template_language, template_components')
    .eq('id', CAMPAIGN_ID)
    .single();

  console.log('Campaign:', JSON.stringify(campaign, null, 2));

  // 2. Get first recipient
  const { data: recipients } = await sb
    .from('broadcast_recipients')
    .select('phone, name')
    .eq('campaign_id', CAMPAIGN_ID)
    .eq('status', 'pending')
    .limit(1);

  const recipient = recipients?.[0];
  console.log('Test recipient:', recipient);

  // 3. Get credentials
  const { data: accounts } = await sb
    .from('whatsapp_accounts')
    .select('phone_number_id, access_token_encrypted, waba_id')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'active')
    .limit(1);

  const account = accounts?.[0];
  const accessToken = decryptAccessToken(account.access_token_encrypted);

  // 4. Fetch template from Meta to see its actual structure
  console.log('\n--- Fetching template from Meta ---');
  const tmplUrl = `https://graph.facebook.com/v22.0/${account.waba_id}/message_templates?fields=name,status,language,components&limit=100`;
  const tmplRes = await fetch(tmplUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  const tmplData = await tmplRes.json();
  const pr11Templates = tmplData.data?.filter((t: { name: string }) => t.name === campaign!.template_name);
  console.log('Template from Meta:', JSON.stringify(pr11Templates, null, 2));

  // 5. Build the CORRECT payload with document header
  // The template has: HEADER (DOCUMENT) + BODY ({{1}}) + BUTTONS
  // We need to get the document URL from the template's example header_handle
  const metaTemplate = pr11Templates?.[0];
  const headerComp = metaTemplate?.components?.find((c: { type: string }) => c.type === 'HEADER');
  const headerHandle = headerComp?.example?.header_handle?.[0];
  console.log('\nHeader format:', headerComp?.format);
  console.log('Header handle URL:', headerHandle ? headerHandle.substring(0, 80) + '...' : 'none');

  const components = [
    // Document header
    {
      type: 'header',
      parameters: [{
        type: 'document',
        document: { link: headerHandle },
      }],
    },
    // Body with name
    {
      type: 'body',
      parameters: [{
        type: 'text',
        text: recipient!.name || 'Cliente',
      }],
    },
  ];

  const payload = {
    messaging_product: 'whatsapp',
    to: recipient!.phone,
    type: 'template',
    template: {
      name: campaign!.template_name,
      language: { code: campaign!.template_language },
      components,
    }
  };

  console.log('\n--- Payload to send ---');
  console.log(JSON.stringify(payload, null, 2));

  // 6. Send it
  console.log('\n--- Sending... ---');
  const sendUrl = `https://graph.facebook.com/v22.0/${account.phone_number_id}/messages`;
  const sendRes = await fetch(sendUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await sendRes.text();
  console.log(`Status: ${sendRes.status}`);
  console.log('Response:', responseText);

  // 7. If failed, try WITHOUT components
  if (!sendRes.ok) {
    console.log('\n--- Retrying WITHOUT components ---');
    const payloadNoComponents = {
      messaging_product: 'whatsapp',
      to: recipient!.phone,
      type: 'template',
      template: {
        name: campaign!.template_name,
        language: { code: campaign!.template_language },
      }
    };
    console.log(JSON.stringify(payloadNoComponents, null, 2));

    const retryRes = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadNoComponents),
    });
    const retryText = await retryRes.text();
    console.log(`Status: ${retryRes.status}`);
    console.log('Response:', retryText);
  }
}

main().catch(console.error);
