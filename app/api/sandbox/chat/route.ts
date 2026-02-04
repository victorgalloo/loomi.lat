/**
 * POST /api/sandbox/chat
 * Sandbox chat endpoint - calls simpleAgent with mock context
 * Public endpoint with rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { simpleAgent } from '@/lib/agents/simple-agent';
import { getAgentConfig } from '@/lib/tenant/context';
import { getSupabase } from '@/lib/memory/supabase';
import { ConversationContext, Message } from '@/types';

// In-memory rate limiting (per IP)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // max messages
const RATE_WINDOW_MS = 60 * 1000; // per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);

  if (!entry || entry.resetAt < now) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimiter.entries()) {
    if (entry.resetAt < now) {
      rateLimiter.delete(ip);
    }
  }
}, 60 * 1000);

export interface SandboxChatRequest {
  message: string;
  tenantId?: string;
  sessionId: string;
  leadName?: string;
  useCustomPrompt?: boolean;
  history?: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
}

export interface SandboxChatResponse {
  response: string;
  sessionId: string;
  tokensUsed?: number;
  escalatedToHuman?: {
    reason: string;
    summary: string;
  };
  showScheduleList?: boolean;
  paymentLinkSent?: {
    plan: string;
    email: string;
    checkoutUrl: string;
  };
  toolCalled?: {
    name: string;
    result: unknown;
  };
}

// Fetch tenant documents for context
async function getTenantDocuments(tenantId: string): Promise<string | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tenant_documents')
      .select('name, content')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5); // Limit to prevent context overflow

    if (error || !data || data.length === 0) return null;

    // Format documents as context
    const docsContext = data.map(d =>
      `### ${d.name}\n${d.content}`
    ).join('\n\n');

    return `# KNOWLEDGE BASE\nUsa esta información para responder preguntas:\n\n${docsContext}`;
  } catch (err) {
    console.error('[Sandbox] Error fetching documents:', err);
    return null;
  }
}

// Fetch tenant tools definitions
async function getTenantTools(tenantId: string) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tenant_tools')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error || !data) return [];

    return data.map(t => ({
      name: t.name,
      displayName: t.display_name,
      description: t.description,
      parameters: t.parameters,
      executionType: t.execution_type,
      mockResponse: t.mock_response
    }));
  } catch (err) {
    console.error('[Sandbox] Error fetching tools:', err);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment before sending more messages.' },
        { status: 429 }
      );
    }

    const body = await request.json() as SandboxChatRequest;
    const { message, tenantId, sessionId, leadName, useCustomPrompt = false, history } = body;

    // Validate request
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    // Load agent config for tenant (or use default)
    let agentConfig = null;
    let knowledgeContext: string | null = null;
    let tenantTools: Awaited<ReturnType<typeof getTenantTools>> = [];

    if (tenantId && tenantId !== 'demo') {
      // Fetch agent config
      agentConfig = await getAgentConfig(tenantId);

      // Fetch knowledge documents
      knowledgeContext = await getTenantDocuments(tenantId);

      // Fetch custom tools
      tenantTools = await getTenantTools(tenantId);

      // If not using custom prompt, clear it so simpleAgent uses default
      if (agentConfig && !useCustomPrompt) {
        agentConfig = {
          ...agentConfig,
          systemPrompt: null,
          fewShotExamples: [],
          productsCatalog: {}
        };
      }

      // Add knowledge context to agent config
      if (agentConfig && knowledgeContext) {
        agentConfig = {
          ...agentConfig,
          knowledgeContext
        };
      } else if (knowledgeContext) {
        agentConfig = { knowledgeContext };
      }

      // Add custom tools to agent config
      if (tenantTools.length > 0) {
        agentConfig = {
          ...agentConfig,
          customTools: tenantTools
        };
      }
    }

    // Convert history to Message format
    const recentMessages: Message[] = (history || []).map((m, index) => ({
      id: `sandbox-${sessionId}-${index}`,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp)
    }));

    // Build mock conversation context
    const context: ConversationContext = {
      lead: {
        id: `sandbox-${sessionId}`,
        phone: '+1234567890',
        name: leadName || 'Usuario Demo',
        stage: 'demo',
        createdAt: new Date(),
        lastInteraction: new Date()
      },
      conversation: {
        id: `sandbox-conv-${sessionId}`,
        leadId: `sandbox-${sessionId}`,
        startedAt: new Date()
      },
      recentMessages,
      hasActiveAppointment: false,
      isFirstConversation: recentMessages.length === 0,
      totalConversations: 1
    };

    console.log(`[Sandbox] Processing message for session ${sessionId}, tenant: ${tenantId || 'demo'}, customPrompt: ${useCustomPrompt}, tools: ${tenantTools.length}, hasKnowledge: ${!!knowledgeContext}`);

    // Call the real agent
    const result = await simpleAgent(
      message,
      context,
      agentConfig || undefined
    );

    console.log(`[Sandbox] Response generated, tokens: ${result.tokensUsed || 'N/A'}`);

    const response: SandboxChatResponse = {
      response: result.response,
      sessionId,
      tokensUsed: result.tokensUsed,
      escalatedToHuman: result.escalatedToHuman,
      showScheduleList: result.showScheduleList,
      paymentLinkSent: result.paymentLinkSent
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Sandbox] Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message. Please try again.' },
      { status: 500 }
    );
  }
}
