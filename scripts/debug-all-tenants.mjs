import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Get all tenants
const { data: tenants } = await sb.from('tenants').select('id, name, email, company_name');

for (const t of tenants) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TENANT: ${t.name} (${t.company_name || '-'})`);
  console.log(`Email: ${t.email} | ID: ${t.id}`);

  // WhatsApp accounts
  const { data: accounts } = await sb
    .from('whatsapp_accounts')
    .select('phone_number_id, display_phone_number, status')
    .eq('tenant_id', t.id);

  if (!accounts?.length) {
    console.log('  WA: NINGUNA CUENTA VINCULADA');
  } else {
    accounts.forEach(a => console.log(`  WA: ${a.display_phone_number} | status: ${a.status} | pid: ${a.phone_number_id}`));
  }

  // Recent leads + conversations
  const { data: leads, count: leadCount } = await sb
    .from('leads')
    .select('id, name, phone', { count: 'exact' })
    .eq('tenant_id', t.id)
    .order('created_at', { ascending: false })
    .limit(3);

  console.log(`  Leads: ${leadCount} total`);
  for (const lead of (leads || [])) {
    const { data: conv } = await sb
      .from('conversations')
      .select('id')
      .eq('lead_id', lead.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (conv) {
      const { count: msgCount } = await sb
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id);
      console.log(`    ${lead.name} (${lead.phone}) - ${msgCount} msgs`);
    } else {
      console.log(`    ${lead.name} (${lead.phone}) - sin conv`);
    }
  }
}

// Also check leads with NULL tenant_id
const { data: orphanLeads, count: orphanCount } = await sb
  .from('leads')
  .select('id, name, phone, created_at', { count: 'exact' })
  .is('tenant_id', null)
  .order('created_at', { ascending: false })
  .limit(5);

console.log(`\n${'='.repeat(60)}`);
console.log(`LEADS SIN TENANT: ${orphanCount} total`);
orphanLeads?.forEach(l => console.log(`  ${l.name} (${l.phone}) - ${l.created_at}`));
