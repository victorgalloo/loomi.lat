/**
 * Test Agent API for Onboarding
 *
 * POST - Test the configured agent prompt with a message
 *
 * Uses gpt-4o-mini for fast, cheap testing during onboarding.
 * Validates tenant from session for security.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import {
  getTemplateById,
  applyTemplateVariables,
  type IndustryId,
} from '@/lib/onboarding/templates';
import { updateOnboardingStatus, getOnboardingStatus } from '@/lib/onboarding/progress';

// Rate limit: max 20 test messages per hour per tenant
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(tenantId: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(tenantId);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(tenantId, { count: 1, resetAt: now + 3600000 }); // 1 hour
    return true;
  }

  if (limit.count >= 20) {
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant ID from session (secure - not from client)
    const tenantId = await getTenantIdForUser(user.email);

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
    }

    const body = await request.json();
    const {
      message,
      // Configuration to test with
      industry,
      businessName,
      businessDescription,
      productsServices,
      customInstructions,
      tone,
      customSystemPrompt, // If user has fully customized the prompt
      conversationHistory = [], // Previous messages in this test session
    } = body;

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    // Rate limit check
    if (!checkRateLimit(tenantId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 20 test messages per hour.' },
        { status: 429 }
      );
    }

    // Build the system prompt
    let systemPrompt: string;

    if (customSystemPrompt) {
      // Use fully customized prompt
      systemPrompt = customSystemPrompt;
    } else if (industry) {
      // Use industry template with variables applied
      const template = getTemplateById(industry as IndustryId);
      if (!template) {
        return NextResponse.json({ error: 'Invalid industry template' }, { status: 400 });
      }

      systemPrompt = applyTemplateVariables(template.systemPrompt, {
        businessName: businessName || 'Mi Negocio',
        businessDescription: businessDescription || '',
        productsServices: productsServices || '',
        customInstructions: customInstructions || '',
      });
    } else {
      // Fallback to basic prompt
      systemPrompt = `Eres el asistente virtual de ${businessName || 'una empresa'}.
${businessDescription || ''}

${customInstructions || ''}

Responde de manera ${tone || 'profesional'} y ayuda al cliente con sus preguntas.`;
    }

    // Build messages array for AI SDK format
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      // Add conversation history
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      // Add current message
      { role: 'user' as const, content: message },
    ];

    // Call OpenAI via AI SDK
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages,
      maxOutputTokens: 500,
    });

    const response = result.text || 'No response';

    // Update test results in onboarding status
    const currentStatus = await getOnboardingStatus(tenantId);
    if (currentStatus) {
      const testResults = {
        messagesExchanged: (currentStatus.testResults?.messagesExchanged || 0) + 1,
        lastTestedAt: new Date().toISOString(),
      };
      await updateOnboardingStatus(tenantId, { testResults });
    }

    return NextResponse.json({
      response,
      tokensUsed: result.usage?.totalTokens || 0,
      conversationHistory: [
        ...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: response },
      ],
    });
  } catch (error) {
    console.error('Test agent error:', error);
    return NextResponse.json({ error: 'Failed to test agent' }, { status: 500 });
  }
}
