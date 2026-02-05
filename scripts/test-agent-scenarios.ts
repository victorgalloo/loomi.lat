/**
 * Test script: 10 scenarios for Growth Rockstar agent
 * Run with: npx tsx scripts/test-agent-scenarios.ts
 */

import 'dotenv/config';
import { simpleAgent } from '../lib/agents/simple-agent';
import { ConversationContext, Message } from '../types';

// Mensaje inicial del broadcast
const INITIAL_MESSAGE = `Hola, {{name}}! Cómo vas? Soy Victor de Growth Rockstar.

Te escribo porque estamos cerrando cupos en el curso Growth Rockstar y
quería saber si tienes alguna duda antes de avanzar. Si hay algo que
quieras revisar con gusto lo vemos por aquí.`;

// 10 escenarios de respuesta típicos
const scenarios = [
  {
    name: 'Interesado directo',
    response: 'Hola! Sí me interesa, cuánto cuesta?',
  },
  {
    name: 'Pide más información',
    response: 'Hola Victor, qué incluye el curso exactamente?',
  },
  {
    name: 'Objeción de precio',
    response: 'Está muy caro para mí ahorita',
  },
  {
    name: 'Objeción de tiempo',
    response: 'No tengo tiempo para tomar un curso ahora',
  },
  {
    name: 'Escéptico',
    response: 'Y esto sí funciona? He tomado otros cursos y no me han servido',
  },
  {
    name: 'Pregunta por resultados',
    response: 'Qué resultados han tenido otros alumnos?',
  },
  {
    name: 'Quiere pensarlo',
    response: 'Déjame pensarlo y te aviso',
  },
  {
    name: 'Pregunta por modalidad',
    response: 'Es en línea o presencial? Cuánto dura?',
  },
  {
    name: 'Ya no interesado',
    response: 'Gracias pero ya no me interesa',
  },
  {
    name: 'Listo para comprar',
    response: 'Ok me convenciste, cómo pago?',
  },
];

async function runScenario(scenario: { name: string; response: string }, index: number) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`ESCENARIO ${index + 1}: ${scenario.name}`);
  console.log('='.repeat(60));

  // Simular contexto de conversación
  const context: ConversationContext = {
    lead: {
      id: `test-lead-${index}`,
      phone: '+521234567890',
      name: 'Carlos',
      email: null,
      company: null,
      industry: null,
      source: 'broadcast',
      stage: 'new',
      score: 0,
      createdAt: new Date().toISOString(),
      notes: null,
    },
    recentMessages: [
      {
        role: 'assistant',
        content: INITIAL_MESSAGE.replace('{{name}}', 'Carlos'),
        timestamp: new Date(Date.now() - 60000).toISOString(),
      },
    ] as Message[],
    conversationStage: 'initial',
    tenantId: 'test-tenant',
  };

  console.log(`\n📩 Usuario: "${scenario.response}"`);

  const startTime = Date.now();

  try {
    const result = await simpleAgent(scenario.response, context, {
      systemPrompt: `Eres Lu, asistente de ventas de Growth Rockstar, un curso de marketing y growth para emprendedores.

INFORMACIÓN DEL CURSO:
- Precio: $4,997 MXN (pago único) o 3 pagos de $1,897 MXN
- Duración: 8 semanas
- Modalidad: 100% en línea, a tu ritmo
- Incluye: 40+ lecciones en video, plantillas, comunidad privada, sesiones de Q&A en vivo
- Garantía: 14 días de garantía de satisfacción

RESULTADOS DE ALUMNOS:
- Promedio de 3x en ventas en los primeros 90 días
- +500 emprendedores graduados
- Casos de éxito en e-commerce, servicios, SaaS

Tu objetivo es resolver dudas, manejar objeciones y guiar hacia la compra.
Sé amigable, directo y usa emojis ocasionalmente.`,
      tone: 'friendly',
    });

    const elapsed = Date.now() - startTime;

    console.log(`\n🤖 Agente (${elapsed}ms):`);
    console.log(`"${result.response}"`);

    if (result.escalatedToHuman) {
      console.log(`\n⚠️ ESCALADO A HUMANO: ${result.escalatedToHuman.reason}`);
    }
    if (result.paymentLinkSent) {
      console.log(`\n💳 LINK DE PAGO ENVIADO`);
    }

    return { success: true, elapsed, scenario: scenario.name };
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`\n❌ ERROR (${elapsed}ms):`, error);
    return { success: false, elapsed, scenario: scenario.name, error };
  }
}

async function main() {
  console.log('🚀 Iniciando prueba de 10 escenarios con gpt-5-mini\n');
  console.log('Mensaje inicial del broadcast:');
  console.log(`"${INITIAL_MESSAGE.replace('{{name}}', '[Nombre]')}"`);

  const results: { success: boolean; elapsed: number; scenario: string }[] = [];

  for (let i = 0; i < scenarios.length; i++) {
    const result = await runScenario(scenarios[i], i);
    results.push(result);

    // Pequeña pausa entre escenarios para no saturar
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Resumen
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 RESUMEN');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const avgTime = successful.reduce((sum, r) => sum + r.elapsed, 0) / successful.length;

  console.log(`✅ Exitosos: ${successful.length}/${results.length}`);
  console.log(`⏱️ Tiempo promedio: ${Math.round(avgTime)}ms`);
  console.log(`🏃 Más rápido: ${Math.min(...successful.map(r => r.elapsed))}ms`);
  console.log(`🐢 Más lento: ${Math.max(...successful.map(r => r.elapsed))}ms`);

  console.log('\nDetalle por escenario:');
  results.forEach((r, i) => {
    const status = r.success ? '✅' : '❌';
    console.log(`${status} ${i + 1}. ${r.scenario}: ${r.elapsed}ms`);
  });
}

main().catch(console.error);
