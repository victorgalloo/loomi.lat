import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage } from '@langchain/core/messages';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TENANT_ID = '25441729-52cf-492b-8c4b-69b77dc81334';

const ClassificationSchema = z.object({
  classification: z.enum(['hot', 'warm', 'cold', 'already_paid', 'bot_autoresponse']),
  reason: z.string(),
});

// Stage mapping for classification
const CLASSIFICATION_STAGE = {
  hot: 'Calificado',
  warm: 'Contactado',
  cold: 'Contactado',
  already_paid: 'Ganado',
};

const CLASSIFICATION_PRIORITY = {
  hot: 'high',
  warm: 'medium',
  cold: 'low',
  already_paid: 'high',
};

const STAGE_POSITION = {
  nuevo: 0, contactado: 1, calificado: 2,
  propuesta: 3, negociacion: 4, ganado: 5, perdido: 6,
};

async function classifyConversation(messages) {
  const formatted = messages
    .map(m => `[${m.role === 'user' ? 'Contacto' : 'Bot'}]: ${m.content}`)
    .join('\n');

  try {
    const model = new ChatAnthropic({
      model: 'claude-haiku-4-5-20251001',
      temperature: 0.2,
      maxTokens: 150,
    });

    const object = await model.withStructuredOutput(ClassificationSchema).invoke([
      new HumanMessage(`Clasifica esta conversación post-broadcast de WhatsApp para un CURSO de Growth Rockstar ($1,295 USD).

Categorías:
- hot: Quiere comprar, pide link de pago, pregunta cómo pagar, dice "sí quiero", muestra intención clara de inscribirse, pide más info activamente
- warm: Respondió con interés general, saluda, pregunta info básica, tiene dudas pero no rechaza, quiere saber más pero no está listo para comprar
- cold: Rechaza, dice que no le interesa, pide que no le escriban, confundido sin seguir conversando, solo mandó "?" sin más, se despide sin interés
- already_paid: Ya pagó total o parcialmente, ya está inscrito, pide credenciales/acceso, dice "ya hice el pago", "ya reservé", "ya compré"
- bot_autoresponse: Respuesta automática de un sistema empresarial, mensaje de fuera de horario, buzón automático

Mensajes:
${formatted}`)
    ]);

    return object;
  } catch (error) {
    console.error('Classification failed:', error.message);
    return { classification: 'warm', reason: 'AI classification failed' };
  }
}

async function main() {
  console.log('=== CLASIFICANDO LEADS DEL CRM ===\n');

  // Get all leads
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('id, name, phone, stage, priority, broadcast_classification')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false });

  if (leadsError) {
    console.error('Error fetching leads:', leadsError);
    process.exit(1);
  }

  console.log(`Total leads: ${leads.length}\n`);

  // Get all conversations linked via lead_id
  const leadIds = leads.map(l => l.id);
  const { data: convos } = await supabase
    .from('conversations')
    .select('id, lead_id')
    .in('lead_id', leadIds);

  // Get messages from last 48 hours
  const since = new Date(Date.now() - 48 * 3600000).toISOString();
  const { data: allMsgs } = await supabase
    .from('messages')
    .select('id, role, content, conversation_id, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  // Group messages by conversation
  const msgsByConvo = {};
  for (const m of (allMsgs || [])) {
    if (!msgsByConvo[m.conversation_id]) msgsByConvo[m.conversation_id] = [];
    msgsByConvo[m.conversation_id].push(m);
  }

  // Map conversation to lead
  const convoToLead = {};
  for (const c of (convos || [])) {
    convoToLead[c.id] = c.lead_id;
  }

  // Build lead message map
  const leadMessages = {};
  for (const [convoId, msgs] of Object.entries(msgsByConvo)) {
    const leadId = convoToLead[convoId];
    if (leadId) {
      if (!leadMessages[leadId]) leadMessages[leadId] = [];
      leadMessages[leadId].push(...msgs);
    }
  }

  // Classify each lead
  const results = { hot: [], warm: [], cold: [], already_paid: [], bot_autoresponse: [], no_response: [] };
  let updated = 0;

  for (const lead of leads) {
    const msgs = leadMessages[lead.id];

    // No messages = no response to broadcast
    if (!msgs || msgs.length === 0) {
      results.no_response.push(lead.name || lead.phone);
      continue;
    }

    // Only has bot messages, no user response
    const userMsgs = msgs.filter(m => m.role === 'user');
    if (userMsgs.length === 0) {
      results.no_response.push(lead.name || lead.phone);
      continue;
    }

    // Classify with AI
    const { classification, reason } = await classifyConversation(
      msgs.map(m => ({ role: m.role, content: (m.content || '').substring(0, 300) }))
    );

    results[classification].push(`${lead.name || lead.phone} — ${reason}`);

    // Build update — broadcast_classification only accepts: hot, warm, cold, bot_autoresponse
    const dbClassification = classification === 'already_paid' ? 'hot' : classification;
    const update = {
      broadcast_classification: dbClassification,
      last_activity_at: new Date().toISOString(),
    };

    // Update stage (only upgrade, never downgrade)
    if (classification !== 'bot_autoresponse') {
      const proposedStage = CLASSIFICATION_STAGE[classification];
      if (proposedStage) {
        const currentPos = STAGE_POSITION[lead.stage?.toLowerCase()] ?? 0;
        const proposedPos = STAGE_POSITION[proposedStage.toLowerCase()] ?? 0;
        if (proposedPos > currentPos) {
          update.stage = proposedStage;
        }
      }
    }

    // Update priority
    const priority = CLASSIFICATION_PRIORITY[classification];
    if (priority) {
      update.priority = priority;
    }

    // Apply update
    const { error } = await supabase
      .from('leads')
      .update(update)
      .eq('id', lead.id);

    if (error) {
      console.error(`  Error updating ${lead.name}:`, error.message);
    } else {
      updated++;
      const emoji = { hot: '🔥', warm: '🟡', cold: '🥶', already_paid: '✅', bot_autoresponse: '🤖' }[classification];
      console.log(`  ${emoji} ${lead.name || lead.phone} → ${classification}${update.stage ? ` (→ ${update.stage})` : ''} — ${reason}`);
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 150));
  }

  // Summary
  console.log('\n\n=== RESUMEN ===');
  console.log(`🔥 HOT (quieren comprar): ${results.hot.length}`);
  results.hot.forEach(n => console.log(`   ${n}`));
  console.log(`\n✅ YA PAGARON: ${results.already_paid.length}`);
  results.already_paid.forEach(n => console.log(`   ${n}`));
  console.log(`\n🟡 WARM (interesados): ${results.warm.length}`);
  results.warm.forEach(n => console.log(`   ${n}`));
  console.log(`\n🥶 COLD (no interesados): ${results.cold.length}`);
  results.cold.forEach(n => console.log(`   ${n}`));
  console.log(`\n🤖 BOT AUTORESPONSE: ${results.bot_autoresponse.length}`);
  results.bot_autoresponse.forEach(n => console.log(`   ${n}`));
  console.log(`\n⬜ SIN RESPUESTA AL BROADCAST: ${results.no_response.length}`);
  console.log(`\n📊 Total clasificados y actualizados: ${updated} de ${leads.length} leads`);
}

main().catch(console.error);
