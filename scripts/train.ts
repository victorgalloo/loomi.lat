/**
 * Script de entrenamiento automático del bot
 *
 * Uso:
 *   npm run train              # Evaluar sin aplicar cambios
 *   npm run train -- --apply   # Evaluar y aplicar mejoras
 *   npm run train -- --full    # Entrenamiento completo (3 iteraciones)
 */

import * as dotenv from 'dotenv';
// Load .env.local first
dotenv.config({ path: '.env.local' });

import { trainBot, autoImprove } from '../lib/eval/auto-improve';
import { runAllScenarios } from '../lib/eval/runner';

async function main() {
  const args = process.argv.slice(2);
  const applyChanges = args.includes('--apply');
  const fullTraining = args.includes('--full');
  const iterations = parseInt(args.find(a => a.startsWith('--iterations='))?.split('=')[1] || '3');

  console.log('\n===========================================');
  console.log('   BOT TRAINING SYSTEM');
  console.log('===========================================\n');

  if (fullTraining) {
    console.log(`Modo: Entrenamiento completo (${iterations} iteraciones)`);
    console.log('-------------------------------------------\n');

    const result = await trainBot(iterations);

    console.log('\nRESULTADO FINAL:');
    console.log(`  Score inicial: ${result.initialScore.toFixed(1)}%`);
    console.log(`  Score final:   ${result.finalScore.toFixed(1)}%`);
    console.log(`  Mejora:        +${(result.finalScore - result.initialScore).toFixed(1)}%`);
    console.log(`  Iteraciones:   ${result.iterations}`);
    console.log(`  Mejoras:       ${result.improvements.length}`);
  } else {
    console.log(`Modo: Evaluación ${applyChanges ? '+ aplicar mejoras' : 'solo'}`);
    console.log('-------------------------------------------\n');

    // Ejecutar evaluación
    const report = await runAllScenarios();

    console.log('\n-------------------------------------------');
    console.log('RESUMEN DE EVALUACIÓN');
    console.log('-------------------------------------------');
    console.log(`Total escenarios: ${report.totalScenarios}`);
    console.log(`Pasaron:          ${report.passed} (${((report.passed / report.totalScenarios) * 100).toFixed(1)}%)`);
    console.log(`Fallaron:         ${report.failed}`);
    console.log(`Score promedio:   ${report.averageScore}/100`);

    if (report.failed > 0) {
      console.log('\n--- ESCENARIOS FALLIDOS ---');
      report.results
        .filter(r => !r.evaluation.passed)
        .forEach(r => {
          console.log(`\n[${r.scenario.id}] ${r.scenario.name}`);
          console.log(`  Esperado: ${r.scenario.criteria.customCheck}`);
          console.log(`  Respuesta: "${r.agentResponse}"`);
          console.log(`  Score: ${r.evaluation.score}/100`);
          console.log(`  Issues: ${r.evaluation.issues.join(', ')}`);
        });

      // Auto-mejorar si se solicita
      if (applyChanges) {
        console.log('\n-------------------------------------------');
        console.log('GENERANDO MEJORAS...');
        console.log('-------------------------------------------');

        const result = await autoImprove(report, true);
        console.log(result.summary);

        if (result.appliedChanges) {
          console.log('\n*** CAMBIOS APLICADOS ***');
          console.log('Ejecuta "npm run train" de nuevo para verificar mejoras.');
        }
      } else {
        console.log('\n-------------------------------------------');
        console.log('Para aplicar mejoras automáticas, ejecuta:');
        console.log('  npm run train -- --apply');
        console.log('-------------------------------------------');
      }
    }
  }

  console.log('\n===========================================\n');
}

main().catch(console.error);
