import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function main() {
  const phones = ['5215500500001', '5215500500002'];

  for (const phone of phones) {
    const { data: lead } = await supabase
      .from('leads')
      .select('id, name, phone')
      .eq('phone', phone)
      .single();

    if (!lead) {
      console.log('No lead for ' + phone);
      continue;
    }

    // Get conversation for this lead
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('lead_id', lead.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (!conv) {
      console.log('No conversation for ' + lead.name);
      continue;
    }

    const { data: msgs } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })
      .limit(10);

    console.log('\n--- ' + lead.name + ' (' + phone + ') ---');
    for (const m of msgs || []) {
      const prefix = m.role === 'user' ? 'USER:' : 'BOT: ';
      console.log(prefix + ' ' + m.content);
    }
  }
}

main().catch(console.error);
