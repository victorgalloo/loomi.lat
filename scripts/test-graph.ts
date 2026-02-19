/**
 * Test script for simplified graph (v2)
 * Runs 3 scenarios: greeting, business info, objection
 * Mocks: Supabase, WhatsApp, PostHog, Cal.com
 *
 * Usage: npx tsx scripts/test-graph.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ============================================
// Mock external services BEFORE importing graph
// ============================================

// Mock Supabase
const mockSupabase = {
  from: () => ({
    select: () => ({ eq: () => ({ single: () => ({ data: null, error: { code: 'PGRST116' } }) }) }),
    insert: () => ({ error: null }),
    update: () => ({ eq: () => ({ error: null }) }),
    upsert: () => ({ error: null }),
  }),
};

// Intercept Supabase imports
const Module = require('module');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request: string, ...args: unknown[]) {
  return originalResolve.call(this, request, ...args);
};

// Set mock env vars for services we don't need
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-key';

// Now import after env is set
import { ConversationContext } from '@/types';
import { DEFAULT_PERSISTED_STATE, PersistedConversationState } from '@/lib/graph/state';
import { generateNode } from '@/lib/graph/nodes';
import { GraphState } from '@/lib/graph/state';

// ============================================
// Test helpers
// ============================================

function makeContext(overrides?: Partial<ConversationContext>): ConversationContext {
  return {
    lead: {
      id: 'test-lead-1',
      phone: '+521234567890',
      name: 'Carlos',
      stage: 'new',
      createdAt: new Date(),
      lastInteraction: new Date(),
    },
    conversation: {
      id: 'test-conv-1',
      leadId: 'test-lead-1',
      startedAt: new Date(),
    },
    recentMessages: [],
    hasActiveAppointment: false,
    ...overrides,
  };
}

function makeState(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: ConversationContext,
  conversationState?: Partial<PersistedConversationState>
) {
  return {
    message,
    context,
    history: [...history, { role: 'user' as const, content: message }],
    agentConfig: undefined,
    conversationState: {
      ...DEFAULT_PERSISTED_STATE,
      ...conversationState,
    },
    result: null,
    _nodeTimings: [],
  };
}

// ============================================
// Test scenarios
// ============================================

interface TestScenario {
  name: string;
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  state?: Partial<PersistedConversationState>;
  validate: (response: string) => { pass: boolean; reason: string };
}

const scenarios: TestScenario[] = [
  {
    name: '1. Saludo inicial',
    message: 'Hola, buenas tardes',
    history: [],
    validate: (r) => {
      const lower = r.toLowerCase();
      const hasGreeting = /hola|buen|gusto/.test(lower);
      const hasQuestion = /\?/.test(r);
      return {
        pass: hasGreeting && hasQuestion,
        reason: hasGreeting
          ? (hasQuestion ? 'Saluda + hace pregunta' : 'Saluda pero NO hace pregunta')
          : 'No saluda',
      };
    },
  },
  {
    name: '2. Dice su negocio',
    message: 'Tengo una clínica dental y recibo como 50 mensajes al día',
    history: [
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: 'Hola, bienvenido a Anthana. Soy Víctor. Ayudamos a negocios a atender WhatsApp 24/7 con agentes de IA. ¿Qué tipo de negocio tienes?' },
    ],
    state: { turn_count: 1, phase: 'discovery' },
    validate: (r) => {
      const lower = r.toLowerCase();
      const mentionsProduct = /agente|ia|whatsapp|24\/7|bot|automat/.test(lower);
      const proposesDemo = /demo|muestr|llamada|20 min/.test(lower);
      return {
        pass: mentionsProduct || proposesDemo,
        reason: proposesDemo
          ? 'Propone demo (correcto)'
          : mentionsProduct
            ? 'Menciona producto pero no propone demo'
            : 'No menciona producto ni demo',
      };
    },
  },
  {
    name: '3. Objeción de precio',
    message: 'Está muy caro, no creo que lo pueda pagar',
    history: [
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: 'Hola, bienvenido. Soy Víctor de Anthana. ¿Qué tipo de negocio tienes?' },
      { role: 'user', content: 'Tengo un restaurante' },
      { role: 'assistant', content: 'Nuestro agente atiende todos los mensajes al instante. ¿Te muestro cómo funcionaría en 20 min?' },
      { role: 'user', content: '¿Cuánto cuesta?' },
      { role: 'assistant', content: 'Desde $149 USD/mes dependiendo del volumen. Incluye respuestas 24/7 y agenda automática. ¿Quieres ver cómo funcionaría para ti?' },
    ],
    state: { turn_count: 3, phase: 'demo_proposed' },
    validate: (r) => {
      const lower = r.toLowerCase();
      const handlesObjection = /roi|paga solo|cliente|inversión|inversion|vale la pena|gratis/.test(lower);
      const notEscalate = !lower.includes('te paso con');
      return {
        pass: handlesObjection && notEscalate,
        reason: !notEscalate
          ? 'ESCALÓ a humano por objeción (INCORRECTO)'
          : handlesObjection
            ? 'Maneja objeción con ROI/valor'
            : 'No maneja objeción claramente',
      };
    },
  },
];

// ============================================
// Run tests
// ============================================

async function runTests() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║   GRAPH v2 TEST — 3 scenarios        ║');
  console.log('╚══════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  for (const scenario of scenarios) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`▶ ${scenario.name}`);
    console.log(`  Input: "${scenario.message}"`);
    console.log(`${'─'.repeat(50)}`);

    const context = makeContext();
    const state = makeState(scenario.message, scenario.history, context, scenario.state);

    const start = Date.now();
    try {
      const result = await generateNode(state as any);
      const elapsed = Date.now() - start;
      const response = result.result?.response || '(no response)';

      console.log(`\n  Response: "${response}"`);
      console.log(`  Latency: ${elapsed}ms`);
      console.log(`  Tokens: ${result.result?.tokensUsed || '?'}`);

      if (result.conversationState) {
        console.log(`  Phase: ${(result.conversationState as any).phase}`);
      }

      const validation = scenario.validate(response);
      const icon = validation.pass ? '✅' : '❌';
      console.log(`  ${icon} ${validation.reason}`);

      if (validation.pass) passed++;
      else failed++;
    } catch (error: any) {
      const elapsed = Date.now() - start;
      console.log(`  ❌ ERROR (${elapsed}ms): ${error.message}`);
      failed++;
    }
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  Results: ${passed} passed, ${failed} failed (${scenarios.length} total)`);
  console.log(`${'═'.repeat(50)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
