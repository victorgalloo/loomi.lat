/**
 * Reset test phone number data
 * Usage: set -a && source .env.local && set +a && npx tsx scripts/reset-phone.ts
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const PHONE = '5214779083304';

async function reset() {
  const { data: leads, error: leadErr } = await supabase
    .from('leads')
    .select('id, name, phone, tenant_id, stage')
    .ilike('phone', `%${PHONE}%`);

  if (leadErr) { console.error('Error:', leadErr); return; }
  if (!leads || leads.length === 0) { console.log('No lead found for', PHONE); return; }

  console.log(`Found ${leads.length} lead(s):`);

  for (const lead of leads) {
    console.log(`  → ${lead.name} (${lead.phone}) tenant:${lead.tenant_id}`);
    const id = lead.id;

    const { data: convs } = await supabase.from('conversations').select('id').eq('lead_id', id);
    const convIds = (convs || []).map((c: { id: string }) => c.id);

    if (convIds.length > 0) {
      await supabase.from('messages').delete().in('conversation_id', convIds);
      await supabase.from('handoffs').delete().in('conversation_id', convIds);
    }

    await Promise.all([
      supabase.from('conversations').delete().eq('lead_id', id),
      supabase.from('appointments').delete().eq('lead_id', id),
      supabase.from('lead_memory').delete().eq('lead_id', id),
      supabase.from('conversion_events_queue').delete().eq('lead_id', id),
    ]);

    await supabase.from('leads').delete().eq('id', id);
  }

  await supabase.from('broadcast_recipients').delete().ilike('phone', `%${PHONE}%`);

  console.log('Done! Phone reset.');
}

reset();
