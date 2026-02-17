import { SCENARIOS, Scenario } from './scenarios';
import { evaluateResponse, EvaluationResult } from './evaluator';
import { processMessageGraph } from '../graph/graph';
import { ConversationContext, Message } from '@/types';

export interface ScenarioResult {
  scenario: Scenario;
  agentResponse: string;
  evaluation: EvaluationResult;
}

export interface EvalReport {
  timestamp: Date;
  totalScenarios: number;
  passed: number;
  failed: number;
  averageScore: number;
  results: ScenarioResult[];
  overallSuggestions: string[];
}

async function runScenario(scenario: Scenario): Promise<ScenarioResult> {
  const now = new Date();

  // Construir mensajes previos (sin el mensaje actual)
  const recentMessages: Message[] = scenario.conversation.map((m, i) => ({
    id: `msg-${i}`,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    timestamp: new Date(now.getTime() - (scenario.conversation.length - i) * 60000)
  }));

  // Construir contexto simulado
  const context: ConversationContext = {
    lead: {
      id: 'eval-test',
      phone: '+1234567890',
      name: 'Usuario Test',
      stage: 'new',
      createdAt: now,
      lastInteraction: now,
    },
    conversation: {
      id: 'conv-test',
      leadId: 'eval-test',
      startedAt: now,
    },
    recentMessages,
    hasActiveAppointment: false,
  };

  // Ejecutar el agente real (LangGraph)
  const result = await processMessageGraph(scenario.nextUserMessage, context);
  const agentResponse = result.response;

  // Evaluar la respuesta
  const evaluation = await evaluateResponse(scenario, agentResponse);

  return {
    scenario,
    agentResponse,
    evaluation,
  };
}

export async function runAllScenarios(): Promise<EvalReport> {
  console.log('🧪 Iniciando evaluación de escenarios...\n');

  const results: ScenarioResult[] = [];

  for (const scenario of SCENARIOS) {
    console.log(`  Testing: ${scenario.name}...`);
    try {
      const result = await runScenario(scenario);
      results.push(result);
      const status = result.evaluation.passed ? '✅' : '❌';
      console.log(`  ${status} Score: ${result.evaluation.score}/100`);
    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
      results.push({
        scenario,
        agentResponse: 'ERROR',
        evaluation: {
          score: 0,
          passed: false,
          issues: ['Error ejecutando escenario'],
          suggestions: [],
          reasoning: 'Error',
        },
      });
    }
  }

  const passed = results.filter(r => r.evaluation.passed).length;
  const failed = results.length - passed;
  const avgScore = results.reduce((sum, r) => sum + r.evaluation.score, 0) / results.length;

  // Recopilar sugerencias de los escenarios fallidos
  const overallSuggestions = results
    .filter(r => !r.evaluation.passed)
    .flatMap(r => r.evaluation.suggestions)
    .filter((s, i, arr) => arr.indexOf(s) === i); // unique

  const report: EvalReport = {
    timestamp: new Date(),
    totalScenarios: results.length,
    passed,
    failed,
    averageScore: Math.round(avgScore),
    results,
    overallSuggestions,
  };

  console.log('\n📊 RESULTADOS:');
  console.log(`   Total: ${report.totalScenarios}`);
  console.log(`   Pasaron: ${report.passed}`);
  console.log(`   Fallaron: ${report.failed}`);
  console.log(`   Score promedio: ${report.averageScore}/100`);

  if (report.overallSuggestions.length > 0) {
    console.log('\n💡 SUGERENCIAS DE MEJORA:');
    report.overallSuggestions.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s}`);
    });
  }

  return report;
}

export function generatePromptImprovements(report: EvalReport): string {
  const failedScenarios = report.results.filter(r => !r.evaluation.passed);

  if (failedScenarios.length === 0) {
    return 'El prompt está funcionando bien. No se necesitan cambios.';
  }

  let improvements = '## Mejoras sugeridas para el prompt\n\n';

  for (const result of failedScenarios) {
    improvements += `### Escenario: ${result.scenario.name}\n`;
    improvements += `- Score: ${result.evaluation.score}/100\n`;
    improvements += `- Issues: ${result.evaluation.issues.join(', ')}\n`;
    improvements += `- Respuesta del agente: "${result.agentResponse}"\n`;
    improvements += `- Sugerencias: ${result.evaluation.suggestions.join('; ')}\n\n`;
  }

  return improvements;
}
