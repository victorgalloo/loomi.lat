import { NextRequest, NextResponse } from 'next/server';
import { trainBot, autoImprove } from '@/lib/eval/auto-improve';
import { runAllScenarios } from '@/lib/eval/runner';

export const maxDuration = 300; // 5 minutos max

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('mode') || 'evaluate';
  const iterations = parseInt(searchParams.get('iterations') || '3');
  const apply = searchParams.get('apply') === 'true';

  try {
    if (mode === 'train') {
      // Entrenamiento completo con múltiples iteraciones
      const result = await trainBot(iterations);

      return NextResponse.json({
        success: true,
        mode: 'train',
        result: {
          initialScore: result.initialScore,
          finalScore: result.finalScore,
          improvement: result.finalScore - result.initialScore,
          iterations: result.iterations,
          improvementsApplied: result.improvements.length,
        },
      });
    } else if (mode === 'improve') {
      // Una sola iteración de evaluación + mejora
      const report = await runAllScenarios();
      const improveResult = await autoImprove(report, apply);

      return NextResponse.json({
        success: true,
        mode: 'improve',
        evaluation: {
          total: report.totalScenarios,
          passed: report.passed,
          failed: report.failed,
          score: report.averageScore,
        },
        improvements: improveResult.improvements,
        summary: improveResult.summary,
        appliedChanges: improveResult.appliedChanges,
        newPrompt: apply ? improveResult.newPrompt : undefined,
      });
    } else {
      // Solo evaluación sin mejoras
      const report = await runAllScenarios();

      return NextResponse.json({
        success: true,
        mode: 'evaluate',
        evaluation: {
          total: report.totalScenarios,
          passed: report.passed,
          failed: report.failed,
          score: report.averageScore,
          passRate: ((report.passed / report.totalScenarios) * 100).toFixed(1) + '%',
        },
        failedScenarios: report.results
          .filter(r => !r.evaluation.passed)
          .map(r => ({
            name: r.scenario.name,
            expected: r.scenario.criteria.customCheck,
            got: r.agentResponse,
            issues: r.evaluation.issues,
            score: r.evaluation.score,
          })),
        suggestions: report.overallSuggestions,
      });
    }
  } catch (error) {
    console.error('Training error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // POST permite enviar un prompt personalizado para probar
  try {
    const body = await request.json();
    const { testPrompt, scenario } = body;

    if (!testPrompt) {
      return NextResponse.json(
        { error: 'testPrompt is required' },
        { status: 400 }
      );
    }

    // TODO: Implementar prueba con prompt personalizado

    return NextResponse.json({
      success: true,
      message: 'Custom prompt testing not yet implemented',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
