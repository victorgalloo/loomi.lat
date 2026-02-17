import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { EvalReport, ScenarioResult } from './runner';
import * as fs from 'fs';
import * as path from 'path';

const PROMPT_FILE_PATH = path.join(process.cwd(), 'lib', 'agents', 'defaults.ts');

interface PromptImprovement {
  category: string;
  problem: string;
  currentBehavior: string;
  suggestedFix: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface AutoImproveResult {
  improvements: PromptImprovement[];
  newPrompt: string;
  summary: string;
  appliedChanges: boolean;
}

export async function analyzeFailures(report: EvalReport): Promise<PromptImprovement[]> {
  const failedScenarios = report.results.filter(r => !r.evaluation.passed);

  if (failedScenarios.length === 0) {
    return [];
  }

  // Agrupar fallos por tipo de problema
  const failureAnalysis = failedScenarios.map(r => ({
    scenario: r.scenario.name,
    expectedBehavior: r.scenario.criteria.customCheck,
    actualResponse: r.agentResponse,
    issues: r.evaluation.issues,
    score: r.evaluation.score,
  }));

  const prompt = `Analiza estos fallos de un agente de ventas de WhatsApp y genera mejoras específicas para el prompt.

FALLOS DETECTADOS:
${JSON.stringify(failureAnalysis, null, 2)}

Para cada fallo, identifica:
1. El patrón de error (ej: "repite preguntas", "no sigue instrucciones", "respuestas largas")
2. La causa probable en el prompt actual
3. Una mejora concreta al prompt

Responde en JSON con este formato:
{
  "improvements": [
    {
      "category": "repeticion|objeciones|cierre|formato|contexto",
      "problem": "Descripcion del problema",
      "currentBehavior": "Lo que hace ahora",
      "suggestedFix": "Texto exacto a agregar/modificar en el prompt",
      "priority": "critical|high|medium|low"
    }
  ]
}

IMPORTANTE:
- Solo sugiere cambios que resuelvan problemas REALES encontrados
- Sé específico, no genérico
- Prioriza los problemas que afectan más escenarios`;

  try {
    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      prompt,
    });

    // Extraer JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No se pudo extraer JSON de la respuesta');
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.improvements || [];
  } catch (error) {
    console.error('Error analizando fallos:', error);
    return [];
  }
}

export async function generateImprovedPrompt(
  currentPrompt: string,
  improvements: PromptImprovement[],
  failedResults: ScenarioResult[]
): Promise<string> {
  if (improvements.length === 0) {
    return currentPrompt;
  }

  const prompt = `Eres un experto en ingeniería de prompts para agentes de ventas.

PROMPT ACTUAL:
\`\`\`
${currentPrompt}
\`\`\`

PROBLEMAS DETECTADOS:
${JSON.stringify(improvements, null, 2)}

EJEMPLOS DE FALLOS:
${failedResults.slice(0, 5).map(r => `
Escenario: ${r.scenario.name}
Esperado: ${r.scenario.criteria.customCheck}
Respuesta: ${r.agentResponse}
Problemas: ${r.evaluation.issues.join(', ')}
`).join('\n---\n')}

TAREA:
Genera una versión MEJORADA del prompt que resuelva los problemas detectados.

REGLAS:
1. Mantén la estructura general del prompt
2. Agrega instrucciones ESPECÍFICAS para resolver cada problema
3. Usa ejemplos concretos cuando sea necesario
4. No hagas el prompt más largo de lo necesario
5. Prioriza claridad sobre completitud

Responde SOLO con el nuevo prompt, sin explicaciones ni markdown.`;

  try {
    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      prompt,
    });

    return text.trim();
  } catch (error) {
    console.error('Error generando prompt mejorado:', error);
    return currentPrompt;
  }
}

function extractCurrentPrompt(): string {
  try {
    const fileContent = fs.readFileSync(PROMPT_FILE_PATH, 'utf-8');

    // Extraer el contenido entre los backticks del DEFAULT_SYSTEM_PROMPT
    const match = fileContent.match(/export const DEFAULT_SYSTEM_PROMPT = `([\s\S]*?)`;/);
    if (match) {
      return match[1];
    }
    return '';
  } catch (error) {
    console.error('Error leyendo prompt actual:', error);
    return '';
  }
}

function applyNewPrompt(newPrompt: string): boolean {
  try {
    const fileContent = fs.readFileSync(PROMPT_FILE_PATH, 'utf-8');

    // Escapar caracteres especiales para el reemplazo
    const escapedPrompt = newPrompt
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');

    const updatedContent = fileContent.replace(
      /export const DEFAULT_SYSTEM_PROMPT = `[\s\S]*?`;/,
      `export const DEFAULT_SYSTEM_PROMPT = \`${escapedPrompt}\`;`
    );

    fs.writeFileSync(PROMPT_FILE_PATH, updatedContent, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error aplicando nuevo prompt:', error);
    return false;
  }
}

export async function autoImprove(
  report: EvalReport,
  applyChanges: boolean = false
): Promise<AutoImproveResult> {
  console.log('\n=== AUTO-MEJORA DEL PROMPT ===\n');

  const failedCount = report.results.filter(r => !r.evaluation.passed).length;

  if (failedCount === 0) {
    return {
      improvements: [],
      newPrompt: '',
      summary: 'Todos los escenarios pasaron. No se necesitan mejoras.',
      appliedChanges: false,
    };
  }

  console.log(`Analizando ${failedCount} escenarios fallidos...`);

  // Paso 1: Analizar fallos
  const improvements = await analyzeFailures(report);
  console.log(`Encontradas ${improvements.length} mejoras sugeridas`);

  if (improvements.length === 0) {
    return {
      improvements: [],
      newPrompt: '',
      summary: 'No se pudieron identificar mejoras específicas.',
      appliedChanges: false,
    };
  }

  // Paso 2: Generar nuevo prompt
  const currentPrompt = extractCurrentPrompt();
  const failedResults = report.results.filter(r => !r.evaluation.passed);
  const newPrompt = await generateImprovedPrompt(currentPrompt, improvements, failedResults);

  // Paso 3: Aplicar cambios si se solicita
  let appliedChanges = false;
  if (applyChanges && newPrompt !== currentPrompt) {
    appliedChanges = applyNewPrompt(newPrompt);
    if (appliedChanges) {
      console.log('Nuevo prompt aplicado exitosamente');
    }
  }

  // Generar resumen
  const criticalCount = improvements.filter(i => i.priority === 'critical').length;
  const highCount = improvements.filter(i => i.priority === 'high').length;

  const summary = `
Análisis completado:
- Escenarios fallidos: ${failedCount}/${report.totalScenarios}
- Mejoras identificadas: ${improvements.length}
  - Críticas: ${criticalCount}
  - Altas: ${highCount}
- Cambios aplicados: ${appliedChanges ? 'SÍ' : 'NO'}

Categorías de problemas:
${Array.from(new Set(improvements.map(i => i.category))).map(cat => `- ${cat}`).join('\n')}
`;

  return {
    improvements,
    newPrompt,
    summary,
    appliedChanges,
  };
}

// Ciclo completo de entrenamiento
export async function trainBot(
  iterations: number = 3,
  targetPassRate: number = 90
): Promise<{
  initialScore: number;
  finalScore: number;
  iterations: number;
  improvements: PromptImprovement[];
}> {
  const { runAllScenarios } = await import('./runner');

  let allImprovements: PromptImprovement[] = [];
  let currentIteration = 0;
  let initialScore = 0;
  let currentScore = 0;

  console.log('\n========================================');
  console.log('   ENTRENAMIENTO AUTOMÁTICO DEL BOT');
  console.log('========================================\n');

  while (currentIteration < iterations) {
    currentIteration++;
    console.log(`\n--- Iteración ${currentIteration}/${iterations} ---\n`);

    // Ejecutar escenarios
    const report = await runAllScenarios();
    currentScore = (report.passed / report.totalScenarios) * 100;

    if (currentIteration === 1) {
      initialScore = currentScore;
    }

    console.log(`\nScore actual: ${currentScore.toFixed(1)}%`);

    // Si ya alcanzamos el objetivo, terminar
    if (currentScore >= targetPassRate) {
      console.log(`\nObjetivo alcanzado (${targetPassRate}%). Terminando.`);
      break;
    }

    // Auto-mejorar
    const result = await autoImprove(report, true);
    allImprovements.push(...result.improvements);

    if (!result.appliedChanges) {
      console.log('No se pudieron aplicar mejoras. Terminando.');
      break;
    }

    // Esperar un poco antes de la siguiente iteración
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n========================================');
  console.log('   ENTRENAMIENTO COMPLETADO');
  console.log('========================================');
  console.log(`Score inicial: ${initialScore.toFixed(1)}%`);
  console.log(`Score final: ${currentScore.toFixed(1)}%`);
  console.log(`Mejora: +${(currentScore - initialScore).toFixed(1)}%`);
  console.log(`Iteraciones: ${currentIteration}`);
  console.log(`Mejoras aplicadas: ${allImprovements.length}`);
  console.log('========================================\n');

  return {
    initialScore,
    finalScore: currentScore,
    iterations: currentIteration,
    improvements: allImprovements,
  };
}
