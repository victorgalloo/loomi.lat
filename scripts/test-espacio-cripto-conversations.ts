/**
 * Test: Send 10 simulated conversations to Espacio Cripto WhatsApp webhook
 * Each simulates a different user messaging the bot for the first time.
 *
 * Run with: npx tsx --env-file=.env.local scripts/test-espacio-cripto-conversations.ts
 */

const WEBHOOK_URL = 'https://loomi.lat/api/webhook/whatsapp';

const PHONE_NUMBER_ID = '893050193902052'; // Espacio Cripto WABA

// 10 realistic first messages from interested prospects
const CONVERSATIONS = [
  // Gabriel step 3: quiere entrar + da email
  { phone: '5215500500002', name: 'Gabriel Test5', message: 'Va, mi email es gabriel.test@gmail.com' },
];

function buildWebhookPayload(phone: string, name: string, text: string) {
  const messageId = `wamid.test_${phone}_${Date.now()}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();

  return {
    object: 'whatsapp_business_account',
    entry: [{
      id: '0',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '+44 7414 104480',
            phone_number_id: PHONE_NUMBER_ID,
          },
          contacts: [{
            profile: { name },
            wa_id: phone,
          }],
          messages: [{
            from: phone,
            id: messageId,
            timestamp,
            type: 'text',
            text: { body: text },
          }],
        },
        field: 'messages',
      }],
    }],
  };
}

async function sendConversation(conv: typeof CONVERSATIONS[0], index: number) {
  const payload = buildWebhookPayload(conv.phone, conv.name, conv.message);

  console.log(`\n[${index + 1}/${CONVERSATIONS.length}] ${conv.name} (${conv.phone})`);
  console.log(`  → "${conv.message}"`);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      console.log(`  ← ${response.status} | ${JSON.stringify(data)}`);
    } catch {
      console.log(`  ← ${response.status} | ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.error(`  ✗ Error: ${error instanceof Error ? error.message : error}`);
  }
}

async function main() {
  console.log('=== Test: 10 conversaciones Espacio Cripto ===');
  console.log(`Webhook: ${WEBHOOK_URL}`);
  console.log(`Phone Number ID: ${PHONE_NUMBER_ID}`);
  console.log('');

  // Send conversations sequentially with 3s delay between each
  // (to avoid rate limiting and give the agent time to process)
  for (let i = 0; i < CONVERSATIONS.length; i++) {
    await sendConversation(CONVERSATIONS[i], i);
    if (i < CONVERSATIONS.length - 1) {
      console.log('  ⏳ Waiting 3s...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log('\n=== Done! Check Vercel logs for agent responses ===');
  console.log('Also check Supabase leads table for the 10 test leads.');
}

main().catch(console.error);
