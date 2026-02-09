import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cgiagucxhrokmcomldsu.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

const campaignId = 'aaf4ac36-6b1e-4514-8723-fa4361b6c021';
const tenantId = '25441729-52cf-492b-8c4b-69b77dc81334';

// Keywords for classification
const COLD_KEYWORDS = [
  'no puedo', 'no podré', 'no voy a', 'no estaré', 'no haré',
  'no me interesa', 'ya cursé', 'lamentablemente no', 'incapacitada',
  'no me será posible', 'no me registraré',
];
const WARM_KEYWORDS = [
  'presupuesto', 'precio', 'pagarlo', 'más adelante', 'los buscaré',
  'no tenía en mi flujo', 'terminando', 'esperando bebé',
  'no pudimos', 'no reunirnos',
];
const HOT_KEYWORDS = [
  'agendar', 'llamada', 'me interesa', 'quiero', 'inscribir',
  'cómo vamos', 'crack',
];
const BOT_AUTORESPONSE = [
  'bienvenido a', 'gracias por comunicarte', 'horario de atención',
  'how can we help', '¿cómo podemos ayudarte',
];

function classify(messages) {
  const userText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ');

  // Check for bot auto-responses first
  if (BOT_AUTORESPONSE.some(k => userText.includes(k))) return 'bot_autoresponse';

  // Check for handoff requests (hot)
  const botText = messages
    .filter(m => m.role === 'assistant')
    .map(m => m.content.toLowerCase())
    .join(' ');
  if (botText.includes('handoff') || botText.includes('escalado')) {
    // If handoff + cold objection → warm (they engaged enough to trigger handoff)
    if (COLD_KEYWORDS.some(k => userText.includes(k))) return 'warm';
    return 'hot';
  }

  if (HOT_KEYWORDS.some(k => userText.includes(k))) return 'hot';
  if (COLD_KEYWORDS.some(k => userText.includes(k))) return 'cold';
  if (WARM_KEYWORDS.some(k => userText.includes(k))) return 'warm';

  // If they only said hi or a short greeting → warm (showed interest by responding)
  const userMsgs = messages.filter(m => m.role === 'user');
  if (userMsgs.length <= 2 && userText.length < 100) return 'warm';

  return 'warm'; // default: they responded, so at least warm
}

// Pipeline stage mapping
const STAGE_MAP = {
  hot: { stage: 'Calificado', priority: 'high' },
  warm: { stage: 'Contactado', priority: 'medium' },
  cold: { stage: 'Contactado', priority: 'low' },
  bot_autoresponse: null, // skip
};

async function run() {
  const { data: campaign } = await supabase
    .from('broadcast_campaigns')
    .select('started_at')
    .eq('id', campaignId)
    .single();

  // Get all recipients
  const { data: recipients } = await supabase
    .from('broadcast_recipients')
    .select('phone, name, status')
    .eq('campaign_id', campaignId);

  console.log(`\nTotal recipients: ${recipients.length}`);
  console.log(`Sent: ${recipients.filter(r => r.status === 'sent').length}`);

  // Phone normalization (same as the API)
  function phoneVariants(digits) {
    const variants = new Set([digits, `+${digits}`]);
    if (digits.startsWith('521') && digits.length === 13) {
      const w = '52' + digits.slice(3);
      variants.add(w); variants.add(`+${w}`);
    } else if (digits.startsWith('52') && digits.length === 12) {
      const w = '521' + digits.slice(2);
      variants.add(w); variants.add(`+${w}`);
    }
    return [...variants];
  }

  const sentRecipients = recipients.filter(r => r.status === 'sent');
  const phonesAllFormats = [...new Set(
    sentRecipients.flatMap(r => phoneVariants(r.phone.replace(/\D/g, '')))
  )];

  // Get all leads for tenant
  const { data: allLeads } = await supabase
    .from('leads')
    .select('id, phone, name, stage, priority')
    .eq('tenant_id', tenantId);

  // Build phone→lead map with normalized digits
  const leadByDigits = new Map();
  for (const l of allLeads || []) {
    leadByDigits.set(l.phone.replace(/\D/g, ''), l);
  }

  // Get conversations
  const { data: convs } = await supabase
    .from('conversations')
    .select('id, started_at, bot_paused, leads!inner(id, name, phone, stage, priority)')
    .eq('leads.tenant_id', tenantId)
    .in('leads.phone', phonesAllFormats);

  // Classify each conversation
  const classified = { hot: [], warm: [], cold: [], bot_autoresponse: [], no_response: [] };
  const respondedDigits = new Set();

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

    const cat = classify(msgs);
    respondedDigits.add(lead.phone.replace(/\D/g, ''));

    classified[cat].push({
      leadId: lead.id,
      name: lead.name,
      phone: lead.phone,
      currentStage: lead.stage,
      preview: userMsgs[0].content.substring(0, 100),
    });
  }

  // Find non-responders
  for (const r of sentRecipients) {
    const digits = r.phone.replace(/\D/g, '');
    // Check all variants
    const variants = phoneVariants(digits);
    const anyMatched = variants.some(v => respondedDigits.has(v.replace(/\D/g, '')));
    if (!anyMatched) {
      // Find or note the lead
      const lead = leadByDigits.get(digits) ||
        leadByDigits.get('1' + digits) ||  // try with country code variations
        variants.map(v => leadByDigits.get(v.replace(/\D/g, ''))).find(Boolean);

      classified.no_response.push({
        phone: r.phone,
        name: r.name || lead?.name || '-',
        leadId: lead?.id || null,
        currentStage: lead?.stage || null,
      });
    }
  }

  // Print results
  console.log('\n' + '='.repeat(70));
  console.log(`🔥 HOT (${classified.hot.length}) → Stage: Calificado, Priority: high`);
  console.log('='.repeat(70));
  for (const c of classified.hot) {
    console.log(`  ${c.name} (${c.phone}) [current: ${c.currentStage}]`);
    console.log(`    "${c.preview}"`);
  }

  console.log('\n' + '='.repeat(70));
  console.log(`🟡 WARM (${classified.warm.length}) → Stage: Contactado, Priority: medium`);
  console.log('='.repeat(70));
  for (const c of classified.warm) {
    console.log(`  ${c.name} (${c.phone}) [current: ${c.currentStage}]`);
    console.log(`    "${c.preview}"`);
  }

  console.log('\n' + '='.repeat(70));
  console.log(`🔵 COLD (${classified.cold.length}) → Stage: Contactado, Priority: low`);
  console.log('='.repeat(70));
  for (const c of classified.cold) {
    console.log(`  ${c.name} (${c.phone}) [current: ${c.currentStage}]`);
    console.log(`    "${c.preview}"`);
  }

  console.log('\n' + '='.repeat(70));
  console.log(`🤖 BOT AUTO-RESPONSE (${classified.bot_autoresponse.length}) → Skipped`);
  console.log('='.repeat(70));
  for (const c of classified.bot_autoresponse) {
    console.log(`  ${c.name} (${c.phone})`);
  }

  console.log('\n' + '='.repeat(70));
  console.log(`📭 NO RESPONSE (${classified.no_response.length}) → Re-contact candidates`);
  console.log('='.repeat(70));
  for (const c of classified.no_response) {
    console.log(`  ${c.name} (${c.phone}) ${c.leadId ? '[has lead]' : '[no lead yet]'}`);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`  🔥 Hot:           ${classified.hot.length}`);
  console.log(`  🟡 Warm:          ${classified.warm.length}`);
  console.log(`  🔵 Cold:          ${classified.cold.length}`);
  console.log(`  🤖 Bot response:  ${classified.bot_autoresponse.length}`);
  console.log(`  📭 No response:   ${classified.no_response.length}`);
  console.log(`  Total:            ${recipients.length}`);

  // Ask before updating
  console.log('\n--- DRY RUN: Updates that would be applied ---');

  const updates = [];
  for (const cat of ['hot', 'warm', 'cold']) {
    const mapping = STAGE_MAP[cat];
    if (!mapping) continue;
    for (const c of classified[cat]) {
      updates.push({
        leadId: c.leadId,
        name: c.name,
        phone: c.phone,
        from: `${c.currentStage}`,
        to: `${mapping.stage} (${mapping.priority})`,
        stage: mapping.stage,
        priority: mapping.priority,
      });
    }
  }

  for (const u of updates) {
    console.log(`  ${u.name}: ${u.from} → ${u.to}`);
  }

  // Apply updates if --apply flag
  if (process.argv.includes('--apply')) {
    console.log('\n--- APPLYING UPDATES ---');
    for (const u of updates) {
      const { error } = await supabase
        .from('leads')
        .update({ stage: u.stage, priority: u.priority, last_activity_at: new Date().toISOString() })
        .eq('id', u.leadId);
      if (error) {
        console.log(`  ❌ ${u.name}: ${error.message}`);
      } else {
        console.log(`  ✅ ${u.name}: ${u.from} → ${u.to}`);
      }
    }
    console.log('\nDone! Pipeline updated.');
  } else {
    console.log('\nRun with --apply to update the pipeline.');
  }
}

run().catch(console.error);
