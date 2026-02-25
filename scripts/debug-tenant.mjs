import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const { data: tenant } = await sb.from('tenants').select('id, name, email, company_name').eq('email', 'victorgallo.financiero@gmail.com').single();
console.log('Tenant:', JSON.stringify(tenant, null, 2));

if (!tenant) { console.log('NO TENANT FOUND'); process.exit(1); }

// Conversations with inner join
const { data: convs, error, count } = await sb
  .from('conversations')
  .select('id, started_at, leads!inner(name, phone, tenant_id)', { count: 'exact' })
  .eq('leads.tenant_id', tenant.id)
  .order('started_at', { ascending: false })
  .limit(5);

console.log('\nQuery error:', error);
console.log('Conversations:', count);
convs?.forEach(c => console.log(' -', c.leads?.name, c.leads?.phone, c.started_at));

// Messages in latest conversation
if (convs?.length > 0) {
  const { data: msgs, count: msgCount } = await sb
    .from('messages')
    .select('role, content, created_at', { count: 'exact' })
    .eq('conversation_id', convs[0].id)
    .order('created_at', { ascending: false })
    .limit(3);
  console.log('\nLatest conv messages:', msgCount);
  msgs?.forEach(m => console.log(`  [${m.role}]`, m.content?.substring(0, 80)));
}
