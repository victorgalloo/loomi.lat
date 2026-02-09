import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cgiagucxhrokmcomldsu.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

const campaignId = 'aaf4ac36-6b1e-4514-8723-fa4361b6c021';
const tenantId = '25441729-52cf-492b-8c4b-69b77dc81334';

const { data: campaign } = await supabase
  .from('broadcast_campaigns')
  .select('started_at')
  .eq('id', campaignId)
  .single();

console.log('Campaign started:', campaign.started_at);

const { data: convs } = await supabase
  .from('conversations')
  .select('id, started_at, bot_paused, leads!inner(id, name, phone, stage, priority, is_qualified)')
  .eq('leads.tenant_id', tenantId);

for (const conv of convs || []) {
  const lead = conv.leads;
  const { data: msgs } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conv.id)
    .gte('created_at', campaign.started_at)
    .order('created_at', { ascending: true });

  if (!msgs || msgs.length === 0) continue;
  const userMsgs = msgs.filter(m => m.role === 'user');
  if (userMsgs.length === 0) continue;

  console.log(`\n${'='.repeat(70)}`);
  console.log(`LEAD: ${lead.name} (${lead.phone})`);
  console.log(`Stage: ${lead.stage} | Priority: ${lead.priority || '-'} | Qualified: ${lead.is_qualified || false} | Bot paused: ${conv.bot_paused || false}`);
  console.log('-'.repeat(70));
  for (const m of msgs) {
    const role = m.role === 'user' ? '→ USER' : '← BOT ';
    const preview = m.content.substring(0, 300);
    console.log(`  ${role}: ${preview}`);
  }
}
