import { createClient } from '@supabase/supabase-js';
import { decryptAccessToken } from '../lib/crypto';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: accounts } = await sb
    .from('whatsapp_accounts')
    .select('phone_number_id, access_token_encrypted')
    .eq('tenant_id', '25441729-52cf-492b-8c4b-69b77dc81334')
    .eq('status', 'active')
    .limit(1);

  const account = accounts![0];
  const accessToken = decryptAccessToken(account.access_token_encrypted);

  const payload = {
    messaging_product: 'whatsapp',
    to: '+5214779083304',
    type: 'template',
    template: {
      name: 'pr11',
      language: { code: 'es' },
      components: [
        {
          type: 'header',
          parameters: [{ type: 'document', document: { id: '933251592376676' } }],
        },
        {
          type: 'body',
          parameters: [{ type: 'text', text: 'Amigo' }],
        },
      ],
    },
  };

  const res = await fetch(
    `https://graph.facebook.com/v22.0/${account.phone_number_id}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();
  console.log('Status:', res.status);
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
