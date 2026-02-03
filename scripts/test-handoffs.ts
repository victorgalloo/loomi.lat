/**
 * Test script for handoff scenarios
 * Run: npx ts-node scripts/test-handoffs.ts
 */

import {
  detectHandoffTrigger,
  detectRepeatedFailures,
  HANDOFF_TRIGGERS
} from '../lib/handoff/index';

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(msg: string, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function header(title: string) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, colors.bold + colors.blue);
  console.log('='.repeat(60));
}

function testResult(passed: boolean, expected: string, actual: string) {
  if (passed) {
    log(`  ✓ PASS`, colors.green);
  } else {
    log(`  ✗ FAIL`, colors.red);
    log(`    Expected: ${expected}`, colors.yellow);
    log(`    Actual: ${actual}`, colors.yellow);
  }
}

// ===========================================
// ESCENARIO 1: Usuario pide hablar con humano
// ===========================================
function testScenario1() {
  header('ESCENARIO 1: Usuario pide hablar con humano');

  const testCases = [
    { msg: 'Quiero hablar con un humano', expectReason: 'user_requested' },
    { msg: 'Pásame con una persona real', expectReason: 'user_requested' },
    { msg: 'Eres un bot? Quiero un asesor', expectReason: 'user_requested' },
    { msg: 'No quiero hablar con una máquina', expectReason: 'user_requested' },
    { msg: 'Comunícame con alguien del equipo', expectReason: 'user_requested' },
  ];

  let passed = 0;
  for (const tc of testCases) {
    console.log(`\n  Mensaje: "${tc.msg}"`);
    const result = detectHandoffTrigger(tc.msg);
    const isPass = result?.reason === tc.expectReason;
    testResult(isPass, tc.expectReason, result?.reason || 'null');
    if (isPass) passed++;
  }

  log(`\n  Resultado: ${passed}/${testCases.length} pasaron`, passed === testCases.length ? colors.green : colors.red);
  return passed === testCases.length;
}

// ===========================================
// ESCENARIO 2: Usuario frustrado
// ===========================================
function testScenario2() {
  header('ESCENARIO 2: Usuario frustrado');

  const testCases = [
    { msg: 'Esto no sirve para nada', expectReason: 'user_frustrated', expectPriority: 'critical' },
    { msg: 'Ya me cansé de este bot inútil', expectReason: 'user_frustrated', expectPriority: 'critical' },
    { msg: 'Qué pésimo servicio tienen', expectReason: 'user_frustrated', expectPriority: 'critical' },
    { msg: 'No me entiendes nada', expectReason: 'user_frustrated', expectPriority: 'critical' },
    { msg: 'Esto es una estafa', expectReason: 'user_frustrated', expectPriority: 'critical' },
  ];

  let passed = 0;
  for (const tc of testCases) {
    console.log(`\n  Mensaje: "${tc.msg}"`);
    const result = detectHandoffTrigger(tc.msg);
    const isPass = result?.reason === tc.expectReason && result?.priority === tc.expectPriority;
    testResult(
      isPass,
      `${tc.expectReason} (${tc.expectPriority})`,
      result ? `${result.reason} (${result.priority})` : 'null'
    );
    if (isPass) passed++;
  }

  log(`\n  Resultado: ${passed}/${testCases.length} pasaron`, passed === testCases.length ? colors.green : colors.red);
  return passed === testCases.length;
}

// ===========================================
// ESCENARIO 3: Lead Enterprise
// ===========================================
function testScenario3() {
  header('ESCENARIO 3: Lead Enterprise');

  const testCases = [
    { msg: 'Somos una empresa grande, necesitamos plan enterprise', expectReason: 'enterprise_lead' },
    { msg: 'Tenemos miles de mensajes al día', expectReason: 'enterprise_lead' },
    { msg: 'Necesitamos integración con API custom', expectReason: 'enterprise_lead' },
    { msg: 'Queremos self-hosted o on-premise', expectReason: 'enterprise_lead' },
    { msg: 'Somos multinacional con varias sucursales', expectReason: 'enterprise_lead' },
  ];

  let passed = 0;
  for (const tc of testCases) {
    console.log(`\n  Mensaje: "${tc.msg}"`);
    const result = detectHandoffTrigger(tc.msg);
    const isPass = result?.reason === tc.expectReason;
    testResult(isPass, tc.expectReason, result?.reason || 'null');
    if (isPass) passed++;
  }

  log(`\n  Resultado: ${passed}/${testCases.length} pasaron`, passed === testCases.length ? colors.green : colors.red);
  return passed === testCases.length;
}

// ===========================================
// ESCENARIO 4: Errores repetidos
// ===========================================
function testScenario4() {
  header('ESCENARIO 4: Errores repetidos del agente');

  // Simular historial con múltiples errores
  const messagesWithErrors = [
    { role: 'user', content: 'Quiero agendar una demo' },
    { role: 'assistant', content: 'Perdón, tuve un problema técnico.' },
    { role: 'user', content: 'Ok, intento de nuevo' },
    { role: 'assistant', content: 'Disculpa, no pude procesar tu solicitud.' },
    { role: 'user', content: 'Ya van dos veces que falla' },
    { role: 'assistant', content: 'Lo siento, hubo un error. Intenta de nuevo.' },
  ];

  const messagesNormal = [
    { role: 'user', content: 'Hola, quiero información' },
    { role: 'assistant', content: '¡Hola! Claro, te cuento sobre Loomi.' },
    { role: 'user', content: 'Cuánto cuesta?' },
    { role: 'assistant', content: 'Tenemos planes desde $199/mes.' },
  ];

  console.log('\n  Historial con errores repetidos:');
  const hasErrors = detectRepeatedFailures(messagesWithErrors);
  testResult(hasErrors === true, 'true (detectar errores)', String(hasErrors));

  console.log('\n  Historial normal sin errores:');
  const noErrors = detectRepeatedFailures(messagesNormal);
  testResult(noErrors === false, 'false (no errores)', String(noErrors));

  const passed = hasErrors && !noErrors;
  log(`\n  Resultado: ${passed ? '2/2' : 'FALLÓ'} pasaron`, passed ? colors.green : colors.red);
  return passed;
}

// ===========================================
// ESCENARIO 5: Mención de competidor
// ===========================================
function testScenario5() {
  header('ESCENARIO 5: Mención de competidor');

  const testCases = [
    { msg: 'Ya uso Wati, qué diferencia hay?', expectReason: 'competitor_mention', expectPriority: 'normal' },
    { msg: 'Actualmente estoy con ManyChat', expectReason: 'competitor_mention', expectPriority: 'normal' },
    { msg: 'Cómo se comparan con Leadsales?', expectReason: 'competitor_mention', expectPriority: 'normal' },
    { msg: 'Tengo Respond.io pero no me convence', expectReason: 'competitor_mention', expectPriority: 'normal' },
    { msg: 'Estoy evaluando Twilio también', expectReason: 'competitor_mention', expectPriority: 'normal' },
  ];

  let passed = 0;
  for (const tc of testCases) {
    console.log(`\n  Mensaje: "${tc.msg}"`);
    const result = detectHandoffTrigger(tc.msg);
    const isPass = result?.reason === tc.expectReason && result?.priority === tc.expectPriority;
    testResult(
      isPass,
      `${tc.expectReason} (${tc.expectPriority})`,
      result ? `${result.reason} (${result.priority})` : 'null'
    );
    if (isPass) passed++;
  }

  log(`\n  Resultado: ${passed}/${testCases.length} pasaron`, passed === testCases.length ? colors.green : colors.red);
  return passed === testCases.length;
}

// ===========================================
// ESCENARIO BONUS: Mensajes normales (no handoff)
// ===========================================
function testScenarioBonus() {
  header('BONUS: Mensajes normales (NO deben triggear handoff)');

  const normalMessages = [
    'Hola, quiero información',
    'Cuánto cuesta el plan starter?',
    'Me interesa agendar una demo',
    'Tienen prueba gratis?',
    'Cómo funciona el agente de IA?',
  ];

  let passed = 0;
  for (const msg of normalMessages) {
    console.log(`\n  Mensaje: "${msg}"`);
    const result = detectHandoffTrigger(msg);
    const isPass = result === null;
    testResult(isPass, 'null (no handoff)', result ? `${result.reason}` : 'null');
    if (isPass) passed++;
  }

  log(`\n  Resultado: ${passed}/${normalMessages.length} pasaron`, passed === normalMessages.length ? colors.green : colors.red);
  return passed === normalMessages.length;
}

// ===========================================
// MAIN
// ===========================================
async function main() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', colors.bold);
  log('║           TEST DE ESCENARIOS DE HANDOFF                    ║', colors.bold);
  log('╚════════════════════════════════════════════════════════════╝', colors.bold);

  const results = [
    testScenario1(),
    testScenario2(),
    testScenario3(),
    testScenario4(),
    testScenario5(),
    testScenarioBonus(),
  ];

  const totalPassed = results.filter(r => r).length;

  console.log('\n');
  log('═'.repeat(60), colors.bold);
  log(`  RESUMEN FINAL: ${totalPassed}/${results.length} escenarios pasaron`,
    totalPassed === results.length ? colors.green + colors.bold : colors.red + colors.bold);
  log('═'.repeat(60), colors.bold);
  console.log('\n');

  process.exit(totalPassed === results.length ? 0 : 1);
}

main().catch(console.error);
