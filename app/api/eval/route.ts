import { NextRequest, NextResponse } from 'next/server';
import { runAllScenarios, generatePromptImprovements } from '@/lib/eval/runner';

export const maxDuration = 120; // 2 minutos máximo
export const dynamic = 'force-dynamic'; // No generar como estático

export async function GET(request: NextRequest) {
  try {
    const report = await runAllScenarios();
    const improvements = generatePromptImprovements(report);

    return NextResponse.json({
      success: true,
      report: {
        timestamp: report.timestamp,
        totalScenarios: report.totalScenarios,
        passed: report.passed,
        failed: report.failed,
        averageScore: report.averageScore,
        overallSuggestions: report.overallSuggestions,
        results: report.results.map(r => ({
          scenarioId: r.scenario.id,
          scenarioName: r.scenario.name,
          agentResponse: r.agentResponse,
          score: r.evaluation.score,
          passed: r.evaluation.passed,
          issues: r.evaluation.issues,
          suggestions: r.evaluation.suggestions,
        })),
      },
      improvements,
    });
  } catch (error) {
    console.error('Eval error:', error);
    return NextResponse.json(
      { success: false, error: 'Error running evaluation' },
      { status: 500 }
    );
  }
}
