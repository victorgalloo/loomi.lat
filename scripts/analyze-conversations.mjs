import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TENANT_ID = '25441729-52cf-492b-8c4b-69b77dc81334';

async function analyze() {
  // Get all leads
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, phone, stage, created_at')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false });

  // Get all conversations (linked via lead_id, not tenant_id)
  const leadIds = (leads || []).map(l => l.id);
  const { data: convos } = await supabase
    .from('conversations')
    .select('id, lead_id, bot_paused, started_at')
    .in('lead_id', leadIds);

  // Get ALL messages from last 24 hours
  const threeHoursAgo = new Date(Date.now() - 24 * 3600000).toISOString();
  const { data: allMsgs } = await supabase
    .from('messages')
    .select('id, role, content, conversation_id, created_at')
    .gte('created_at', threeHoursAgo)
    .order('created_at', { ascending: true });

  // Group messages by conversation
  const msgsByConvo = {};
  for (const m of (allMsgs || [])) {
    if (!msgsByConvo[m.conversation_id]) msgsByConvo[m.conversation_id] = [];
    msgsByConvo[m.conversation_id].push(m);
  }

  // Map conversations to leads
  const convoToLead = {};
  const convoToPaused = {};
  for (const c of (convos || [])) {
    convoToLead[c.id] = c.lead_id;
    convoToPaused[c.id] = c.bot_paused;
  }

  const leadMap = {};
  for (const l of (leads || [])) {
    leadMap[l.id] = l;
  }

  // Classify conversations
  const categories = {
    hot: [],        // Want to pay / sent link
    warm: [],       // Asking questions, interested
    cold: [],       // Not interested / confused
    escalated: [],  // Handed off to human
    greeting: [],   // Just said hi
  };

  let convoCount = 0;
  const allConvos = [];

  for (const [convoId, msgs] of Object.entries(msgsByConvo)) {
    const leadId = convoToLead[convoId];
    const lead = leadMap[leadId];
    if (!lead) continue;
    convoCount++;

    const convoData = {
      name: lead.name,
      phone: lead.phone,
      stage: lead.stage,
      paused: convoToPaused[convoId] || false,
      msgCount: msgs.length,
      messages: msgs.map(m => ({
        role: m.role,
        content: (m.content || '').substring(0, 300)
      }))
    };

    // Classify
    const allText = msgs.map(m => (m.content || '').toLowerCase()).join(' ');
    const botText = msgs.filter(m => m.role === 'assistant').map(m => (m.content || '').toLowerCase()).join(' ');
    const userText = msgs.filter(m => m.role === 'user').map(m => (m.content || '').toLowerCase()).join(' ');

    if (allText.includes('reserva.growthrockstar') || userText.includes('pagar') || userText.includes('pago') || userText.includes('reservar') || userText.includes('link')) {
      categories.hot.push(convoData);
    } else if (botText.includes('te comunico con alguien') || botText.includes('te paso con')) {
      categories.escalated.push(convoData);
    } else if (userText.includes('precio') || userText.includes('cuánto') || userText.includes('cuanto') || userText.includes('incluye') || userText.includes('interesa')) {
      categories.warm.push(convoData);
    } else if (msgs.filter(m => m.role === 'user').length <= 1) {
      categories.greeting.push(convoData);
    } else {
      categories.warm.push(convoData);
    }

    allConvos.push(convoData);
  }

  // Print analysis
  console.log('=== ANÁLISIS DE CONVERSACIONES ===\n');
  console.log(`Total conversaciones: ${convoCount}`);
  console.log(`Total mensajes: ${allMsgs ? allMsgs.length : 0}`);

  // Stages
  const stages = {};
  for (const l of (leads || [])) {
    stages[l.stage] = (stages[l.stage] || 0) + 1;
  }
  console.log(`\nStages: ${JSON.stringify(stages)}`);

  // Print each category
  console.log(`\n🔥 HOT (quieren pagar/link enviado): ${categories.hot.length}`);
  console.log('='.repeat(60));
  for (const c of categories.hot) {
    console.log(`\n📱 ${c.name} | ${c.phone} | ${c.stage} | ${c.msgCount} msgs${c.paused ? ' | ⏸️ PAUSADO' : ''}`);
    for (const m of c.messages) {
      console.log(`  ${m.role === 'user' ? '👤' : '🤖'} ${m.content}`);
    }
  }

  console.log(`\n\n⬆️ ESCALATED (pasados a humano): ${categories.escalated.length}`);
  console.log('='.repeat(60));
  for (const c of categories.escalated) {
    console.log(`\n📱 ${c.name} | ${c.phone} | ${c.stage} | ${c.msgCount} msgs${c.paused ? ' | ⏸️ PAUSADO' : ''}`);
    for (const m of c.messages) {
      console.log(`  ${m.role === 'user' ? '👤' : '🤖'} ${m.content}`);
    }
  }

  console.log(`\n\n🟡 WARM (interesados/preguntas): ${categories.warm.length}`);
  console.log('='.repeat(60));
  for (const c of categories.warm) {
    console.log(`\n📱 ${c.name} | ${c.phone} | ${c.stage} | ${c.msgCount} msgs${c.paused ? ' | ⏸️ PAUSADO' : ''}`);
    for (const m of c.messages) {
      console.log(`  ${m.role === 'user' ? '👤' : '🤖'} ${m.content}`);
    }
  }

  console.log(`\n\n👋 GREETING (solo saludaron): ${categories.greeting.length}`);
  console.log('='.repeat(60));
  for (const c of categories.greeting) {
    console.log(`\n📱 ${c.name} | ${c.phone} | ${c.stage} | ${c.msgCount} msgs`);
    for (const m of c.messages) {
      console.log(`  ${m.role === 'user' ? '👤' : '🤖'} ${m.content}`);
    }
  }

  // Summary
  console.log('\n\n=== RESUMEN ===');
  console.log(`🔥 Hot (link enviado/quieren pagar): ${categories.hot.length}`);
  console.log(`⬆️ Escalados a humano: ${categories.escalated.length}`);
  console.log(`🟡 Warm (interesados): ${categories.warm.length}`);
  console.log(`👋 Solo saludaron: ${categories.greeting.length}`);
  console.log(`📊 Total: ${convoCount} conversaciones de ${leads?.length || 0} leads`);
}

analyze().catch(console.error);
