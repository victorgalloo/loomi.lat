/**
 * Industry Templates API
 *
 * GET - List all available industry templates
 * GET /:id - Get a specific template with full details
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getIndustryTemplates,
  getTemplateById,
  type IndustryId,
} from '@/lib/onboarding/templates';

export async function GET(request: NextRequest) {
  const templateId = request.nextUrl.searchParams.get('id');

  if (templateId) {
    // Get specific template
    const template = getTemplateById(templateId as IndustryId);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  }

  // List all templates (summary view)
  const templates = getIndustryTemplates().map((t) => ({
    id: t.id,
    name: t.name,
    nameEs: t.nameEs,
    icon: t.icon,
    description: t.description,
    descriptionEs: t.descriptionEs,
    tone: t.tone,
    // Don't include full prompt in list view
    qualificationQuestionsCount: t.qualificationQuestions.length,
    fewShotExamplesCount: t.fewShotExamples.length,
    suggestedTools: t.suggestedTools,
  }));

  return NextResponse.json({ templates });
}
