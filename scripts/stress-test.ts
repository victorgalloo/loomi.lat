/**
 * Stress Test - Sequential conversations to test features
 * Tests: Calendar scheduling, Stripe payments, Handoff escalation
 *
 * Run: npx ts-node scripts/stress-test.ts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Scenario {
  id: number;
  name: string;
  targetFeature: 'calendar' | 'stripe' | 'handoff' | 'general';
  messages: string[];
}

// 10 different scenarios - prioritized by feature type
const SCENARIOS: Scenario[] = [
  // Calendar scenarios
  {
    id: 1,
    name: 'Juan - Quiere agendar demo',
    targetFeature: 'calendar',
    messages: [
      'Hola, me interesa Loomi para mi negocio',
      'Quiero ver una demo de cómo funciona',
      'Sí, muéstrame los horarios disponibles'
    ]
  },
  // Stripe scenario
  {
    id: 2,
    name: 'Ana - Lista para comprar',
    targetFeature: 'stripe',
    messages: [
      'Hola, ya vi la demo y quiero contratar Loomi',
      'El plan Growth por favor',
      'Mi correo es ana@empresa.com, mándame el link de pago'
    ]
  },
  // Handoff scenario
  {
    id: 3,
    name: 'Roberto - Problema urgente',
    targetFeature: 'handoff',
    messages: [
      'Tengo un problema grave con mi cuenta',
      'El bot no responde a mis clientes y estoy perdiendo ventas',
      'NECESITO HABLAR CON UN HUMANO URGENTE, ESTO ES CRÍTICO!!!'
    ]
  },
  // More scenarios
  {
    id: 4,
    name: 'María - Pregunta y agenda',
    targetFeature: 'calendar',
    messages: [
      'Cuánto cuesta Loomi?',
      'Puedo verlo en acción antes de decidir?',
      'Ok agendemos una demo'
    ]
  },
  {
    id: 5,
    name: 'Pedro - Quiere Starter',
    targetFeature: 'stripe',
    messages: [
      'Quiero el plan más básico',
      'Sí el Starter está bien para empezar',
      'pedro@miempresa.mx es mi correo'
    ]
  },
  {
    id: 6,
    name: 'Sofía - Cliente frustrada',
    targetFeature: 'handoff',
    messages: [
      'El servicio está muy mal últimamente',
      'Llevo 3 días con problemas y nadie me ayuda',
      'Pásenme con alguien de soporte real por favor'
    ]
  },
  {
    id: 7,
    name: 'Carlos - Demo rápida',
    targetFeature: 'calendar',
    messages: [
      'Necesito ver Loomi funcionando hoy si es posible',
      'Tengo disponible en la tarde',
      'Agenda la demo por favor'
    ]
  },
  {
    id: 8,
    name: 'Laura - Plan Business',
    targetFeature: 'stripe',
    messages: [
      'Tenemos alto volumen, como 2000 mensajes al día',
      'Necesito el plan más completo',
      'Mándame el checkout a laura@enterprise.com'
    ]
  },
  {
    id: 9,
    name: 'Diego - Curioso',
    targetFeature: 'general',
    messages: [
      'Qué hace Loomi exactamente?',
      'Y funciona con cualquier tipo de negocio?',
      'Interesante, déjame pensarlo'
    ]
  },
  {
    id: 10,
    name: 'Fernanda - Comparando',
    targetFeature: 'general',
    messages: [
      'Cómo se compara Loomi con otras soluciones?',
      'Usan inteligencia artificial real?',
      'Ok quiero probarlo'
    ]
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const featureColors: Record<string, string> = {
  calendar: colors.cyan,
  stripe: colors.green,
  handoff: colors.red,
  general: colors.yellow,
};

async function sendMessage(
  sessionId: string,
  message: string,
  history: Message[]
): Promise<{ response: string; newHistory: Message[]; features: string[]; raw: Record<string, unknown> }> {
  const response = await fetch(`${BASE_URL}/api/sandbox/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      sessionId,
      history,
      useCustomPrompt: true
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  const data = await response.json();

  // Detect which features were triggered
  const features: string[] = [];
  if (data.showScheduleList) features.push('📅 CALENDAR_TRIGGER');
  if (data.slots?.length > 0) features.push(`📅 SLOTS(${data.slots.length})`);
  if (data.response?.includes('link de pago') || data.response?.includes('checkout') || data.response?.includes('stripe')) features.push('💳 PAYMENT_LINK');
  if (data.escalatedToHuman) features.push('🚨 HANDOFF');
  if (data.response?.includes('hablar con') && data.response?.includes('humano')) features.push('🤝 HANDOFF_MENTION');

  const newHistory: Message[] = [
    ...history,
    { role: 'user', content: message },
    { role: 'assistant', content: data.response }
  ];

  return { response: data.response, newHistory, features, raw: data };
}

async function runScenario(scenario: Scenario): Promise<{
  scenario: Scenario;
  success: boolean;
  messages: number;
  featuresTriggered: string[];
  duration: number;
  responses: string[];
  error?: string;
}> {
  const startTime = Date.now();
  const sessionId = `stress-${scenario.id}-${Date.now()}`;
  let history: Message[] = [];
  const featuresTriggered: string[] = [];
  const responses: string[] = [];
  const color = featureColors[scenario.targetFeature];

  console.log(`\n${color}${colors.bold}━━━ Scenario ${scenario.id}: ${scenario.name} ━━━${colors.reset}`);
  console.log(`${color}Target: ${scenario.targetFeature.toUpperCase()}${colors.reset}\n`);

  try {
    for (let i = 0; i < scenario.messages.length; i++) {
      const msg = scenario.messages[i];
      console.log(`${colors.blue}👤 User: ${msg}${colors.reset}`);

      const result = await sendMessage(sessionId, msg, history);
      history = result.newHistory;
      featuresTriggered.push(...result.features);
      responses.push(result.response);

      console.log(`${colors.magenta}🤖 Bot: ${result.response}${colors.reset}`);

      if (result.features.length > 0) {
        console.log(`${colors.green}⚡ FEATURES DETECTED: ${result.features.join(' | ')}${colors.reset}`);
      }

      // Delay between messages (7 seconds to respect rate limit of 10/min)
      if (i < scenario.messages.length - 1) {
        console.log(`${colors.yellow}   ⏳ Waiting 7s...${colors.reset}`);
        await new Promise(r => setTimeout(r, 7000));
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n${color}✅ Scenario ${scenario.id} completed in ${(duration / 1000).toFixed(1)}s${colors.reset}`);

    return {
      scenario,
      success: true,
      messages: scenario.messages.length,
      featuresTriggered: [...new Set(featuresTriggered)],
      duration,
      responses
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`${colors.red}❌ Scenario ${scenario.id} failed: ${error}${colors.reset}`);

    return {
      scenario,
      success: false,
      messages: 0,
      featuresTriggered,
      duration,
      responses,
      error: String(error)
    };
  }
}

async function runStressTest() {
  console.log('\n' + '═'.repeat(60));
  console.log(`${colors.bold}🔥 FEATURE TEST - Calendar, Stripe, Handoff${colors.reset}`);
  console.log('═'.repeat(60));
  console.log(`\nTarget: ${BASE_URL}`);
  console.log(`Scenarios: ${SCENARIOS.length}`);
  console.log(`Mode: Sequential (respecting rate limits)\n`);

  const startTime = Date.now();
  const results = [];

  // Run scenarios one at a time, but prioritize one of each type first
  const priorityOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // indices

  for (const idx of priorityOrder) {
    const result = await runScenario(SCENARIOS[idx]);
    results.push(result);

    // Pause between scenarios
    if (idx < priorityOrder.length - 1) {
      console.log(`\n${colors.yellow}═══ Pausing 5s before next scenario ═══${colors.reset}\n`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  const totalDuration = Date.now() - startTime;

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log(`${colors.bold}📊 FINAL RESULTS${colors.reset}`);
  console.log('═'.repeat(60) + '\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  console.log(`⏱️  Total duration: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`📨 Total messages: ${results.reduce((sum, r) => sum + r.messages, 0)}`);

  // Features triggered
  const allFeatures = results.flatMap(r => r.featuresTriggered);
  const featureCounts: Record<string, number> = {};
  allFeatures.forEach(f => {
    featureCounts[f] = (featureCounts[f] || 0) + 1;
  });

  console.log('\n📌 Features Triggered:');
  if (Object.keys(featureCounts).length === 0) {
    console.log('   (none detected)');
  } else {
    Object.entries(featureCounts).forEach(([feature, count]) => {
      console.log(`   ${feature}: ${count}x`);
    });
  }

  // Feature coverage check
  console.log('\n🎯 Feature Coverage:');
  const hasCalendar = allFeatures.some(f => f.includes('CALENDAR') || f.includes('SLOTS'));
  const hasStripe = allFeatures.some(f => f.includes('PAYMENT') || f.includes('STRIPE'));
  const hasHandoff = allFeatures.some(f => f.includes('HANDOFF'));

  console.log(`   📅 Calendar: ${hasCalendar ? '✅ TRIGGERED' : '❌ NOT TRIGGERED'}`);
  console.log(`   💳 Stripe:   ${hasStripe ? '✅ TRIGGERED' : '❌ NOT TRIGGERED'}`);
  console.log(`   🚨 Handoff:  ${hasHandoff ? '✅ TRIGGERED' : '❌ NOT TRIGGERED'}`);

  console.log('\n' + '═'.repeat(60) + '\n');

  process.exit(failed.length > 0 ? 1 : 0);
}

// Run only first 3 scenarios for quick test
const args = process.argv.slice(2);
if (args.includes('--quick')) {
  console.log('🚀 Quick mode: Running only 3 scenarios (one per feature)\n');
  const quickScenarios = SCENARIOS.slice(0, 3);
  SCENARIOS.length = 0;
  SCENARIOS.push(...quickScenarios);
}

runStressTest().catch(console.error);
