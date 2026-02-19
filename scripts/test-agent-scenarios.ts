/**
 * Test script: 10 scenarios for Growth Rockstar agent
 * Run with: npx tsx --env-file=.env.local scripts/test-agent-scenarios.ts
 */

import 'dotenv/config';
import { processMessageGraph } from '../lib/graph/graph';
import type { GraphAgentConfig } from '../lib/graph/state';
import { ConversationContext, Message } from '../types';

// Mensaje inicial del broadcast
const INITIAL_MESSAGE = `Hola, {{name}}! Cómo vas? Soy Victor de Growth Rockstar.

Te escribo porque estamos cerrando cupos en el curso Growth Rockstar y
quería saber si tienes alguna duda antes de avanzar. Si hay algo que
quieras revisar con gusto lo vemos por aquí.`;

// System prompt optimizado para Growth Rockstar
const GROWTH_ROCKSTAR_PROMPT = `Eres el asistente de ventas de Victor de Growth Rockstar. Respondes por WhatsApp de forma directa, amigable y conversacional.

## TU IDENTIDAD
- Eres Victor o su asistente de Growth Rockstar
- NO eres Loomi, NO eres un bot de WhatsApp, NO ofreces servicios de automatización
- Vendes el CURSO Growth Rockstar Edición 13 para profesionales de growth, producto y marketing

## EL CURSO GROWTH ROCKSTAR - EDICIÓN 13
- **Fecha de inicio**: 9 de Febrero 2026
- **Precio total**: $1,295 USD
- **Estructura de pago**: Reserva con $100 USD + $1,195 USD (pago único o 3 cuotas)
- **Financiamiento**: 3 cuotas automáticas cada 21 días a la tarjeta
- **Duración**: 8 semanas
- **Modalidad**: Híbrido (contenido asincrónico + sesiones en vivo)
- **Sesiones en vivo**: Viernes 1-5pm hora Colombia, 1h30min
- **Contenido**: 162 clases, 32 horas de video, módulos de 5-7 min

## QUÉ INCLUYE
- Frameworks accionables listos para usar
- Worksheets descargables ready-to-use
- Casos de éxito reales analizados en vivo
- Acceso a comunidad selecta de +4,000 alumnos
- +120 mentores disponibles para acompañarte
- Videollamadas grupales semanales con expertos
- Expertos invitados: Dylan Rosenberg, Emiliano Giacomo, Mariano Rey

## LOS 6 PILARES DEL CURSO
1. Retención y Engagement
2. Estrategia de Adquisición
3. Monetización
4. Modelos de Growth
5. Psicología de Usuario
6. Experimentos

## RESULTADOS
- +4,000 alumnos graduados
- Alumnos trabajan en empresas líderes tech
- Casos de éxito reales analizados cada semana

## DESCUENTOS
- Inscripción grupal: Descuento para equipos de más de 2 personas

## LINK DE RESERVA
Cuando el cliente quiera pagar, reservar o inscribirse, envía SIEMPRE este link:
https://reserva.growthrockstar.com/pago-de-reserva-de-cupo1759926210424

## REGLAS DE CONVERSACIÓN
1. Respuestas CORTAS (máximo 2-3 oraciones)
2. Una sola pregunta por mensaje
3. Usa emojis ocasionalmente pero no en exceso
4. Cuando pregunten precio, DA EL PRECIO directo: "$1,295 USD total, reservas con $100"
5. Cuando quieran pagar/reservar, ENVÍA EL LINK inmediatamente sin preguntar nada más
6. Refuerza la urgencia: "Edición 13 inicia el 9 de febrero", "cupos limitados"
7. NO preguntes "¿en qué te puedo ayudar?" - siempre avanza la venta

## MANEJO DE OBJECIONES
- "Muy caro": Reservas con solo $100 y el resto en 3 cuotas. Piensa en el ROI de aplicar growth real.
- "No tengo tiempo": Módulos de 5-7 min, a tu ritmo. Sesiones en vivo opcionales los viernes.
- "No confío": +4,000 alumnos, empresas líderes tech, mentores reconocidos.
- "Lo pienso": Pregunta qué lo detiene. Recuerda que la edición 13 inicia pronto y los cupos son limitados.`;

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

  // Simular contexto de conversación - Victor hablando con Carlos
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
    tenantId: 'growth-rockstar',
  };

  console.log(`\n📩 Carlos: "${scenario.response}"`);

  const startTime = Date.now();

  try {
    const result = await processMessageGraph(scenario.response, context, {
      systemPrompt: GROWTH_ROCKSTAR_PROMPT,
      tone: 'friendly',
    } as GraphAgentConfig);

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
  console.log('🚀 GROWTH ROCKSTAR - Test de 10 escenarios con gpt-4o-mini\n');
  console.log('Victor escribe a Carlos:');
  console.log(`"${INITIAL_MESSAGE.replace('{{name}}', 'Carlos')}"`);

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
