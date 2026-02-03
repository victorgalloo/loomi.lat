/**
 * Test Agent API for Onboarding
 *
 * POST - Test the configured agent prompt with a message
 *
 * Uses the REAL production agent (simpleAgent) with all tools:
 * - Multi-agent analysis (o3-mini reasoning)
 * - Sentiment detection
 * - Industry detection
 * - Few-shot learning
 * - Tools: send_payment_link, escalate_to_human
 *
 * Validates tenant from session for security.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { simpleAgent } from '@/lib/agents/simple-agent';
import type { ConversationContext, Lead, Conversation, Message } from '@/types';
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

    // Build conversation context for the real agent
    const testLead: Lead = {
      id: `test-${tenantId}`,
      phone: '+52000000000', // Test phone
      name: 'Usuario de Prueba',
      email: user.email || undefined,
      company: businessName || undefined,
      industry: industry || undefined,
      stage: 'demo',
      createdAt: new Date(),
      lastInteraction: new Date(),
    };

    const testConversation: Conversation = {
      id: `test-conv-${Date.now()}`,
      leadId: testLead.id,
      startedAt: new Date(),
    };

    // Convert conversation history to Message format
    const recentMessages: Message[] = conversationHistory.map(
      (msg: { role: string; content: string }, index: number) => ({
        id: `test-msg-${index}`,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(),
      })
    );

    const context: ConversationContext = {
      lead: testLead,
      conversation: testConversation,
      recentMessages,
      memory: null,
      hasActiveAppointment: false,
      isFirstConversation: conversationHistory.length === 0,
      totalConversations: 1,
      firstInteractionDate: new Date(),
    };

    // Call the REAL agent with the custom prompt
    const result = await simpleAgent(message, context, {
      systemPrompt: customSystemPrompt || null,
      businessName: businessName || null,
      businessDescription: businessDescription || null,
      productsServices: productsServices || null,
      tone: (tone as 'professional' | 'friendly' | 'casual' | 'formal') || 'professional',
      customInstructions: customInstructions || null,
    });

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
      response: result.response,
      tokensUsed: result.tokensUsed || 0,
      conversationHistory: [
        ...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: result.response },
      ],
      // Include additional agent info for debugging/visibility
      agentInfo: {
        escalatedToHuman: result.escalatedToHuman,
        paymentLinkSent: result.paymentLinkSent,
        detectedIndustry: result.detectedIndustry,
        saidLater: result.saidLater,
      },
    });
  } catch (error) {
    console.error('Test agent error:', error);
    return NextResponse.json({ error: 'Failed to test agent' }, { status: 500 });
  }
}
