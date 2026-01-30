/**
 * Script para ejecutar tests del bot
 *
 * Uso:
 *   npm run test:bot               # Ejecutar todos los escenarios
 *   npm run test:bot -- --verbose  # Con detalles
 */

import * as dotenv from 'dotenv';
// Load .env.local first
dotenv.config({ path: '.env.local' });

import { runAllScenarios } from '../lib/eval/runner';

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');

  console.log('\n===========================================');
  console.log('   BOT TEST RUNNER');
  console.log('===========================================\n');

  const report = await runAllScenarios();

  console.log('\n-------------------------------------------');
  console.log('RESUMEN');
  console.log('-------------------------------------------');
  console.log(`Total:    ${report.totalScenarios}`);
  console.log(`Pasaron:  ${report.passed}`);
  console.log(`Fallaron: ${report.failed}`);
  console.log(`Score:    ${report.averageScore}/100`);
  console.log(`Rate:     ${((report.passed / report.totalScenarios) * 100).toFixed(1)}%`);

  if (verbose && report.failed > 0) {
    console.log('\n--- DETALLE DE FALLOS ---');
    report.results
      .filter(r => !r.evaluation.passed)
      .forEach(r => {
        console.log(`\n[${r.scenario.id}] ${r.scenario.name}`);
        console.log(`  Input: "${r.scenario.nextUserMessage}"`);
        console.log(`  Output: "${r.agentResponse}"`);
        console.log(`  Expected: ${r.scenario.criteria.customCheck}`);
        console.log(`  Issues: ${r.evaluation.issues.join(', ')}`);
      });
  }

  // Exit with error code if tests failed
  if (report.failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
