/**
 * POST /api/demo/chat
 * Full-featured demo chat for landing page
 * Uses the REAL production agent (simpleAgent) with all capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { simpleAgent } from '@/lib/agents/simple-agent';
import type { ConversationContext, Lead, Conversation, Message } from '@/types';

// Simple rate limiting
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 15; // Slightly lower for public demo
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);

  if (!entry || entry.resetAt < now) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export interface DemoChatRequest {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface DemoChatResponse {
  response: string;
  tokensUsed?: number;
  agentInfo?: {
    escalatedToHuman?: { reason: string; summary: string } | null;
    paymentLinkSent?: { plan: string; email: string } | null;
    detectedIndustry?: string | null;
    saidLater?: boolean;
  };
}

// Demo system prompt - showcases Loomi's capabilities
const DEMO_SYSTEM_PROMPT = `Eres Loomi, un agente de IA para ventas por WhatsApp. Estás en modo DEMO mostrando tus capacidades.

# SOBRE LOOMI (TU PRODUCTO)
- Automatiza ventas por WhatsApp 24/7
- Califica leads automáticamente
- Agenda demos sin intervención humana
- Respuesta en <1 segundo
- Análisis de sentimiento en tiempo real
- Memoria contextual entre conversaciones
- Escalación inteligente a humanos

# PLANES
- Starter: $199/mes (500 mensajes)
- Growth: $349/mes (2,000 mensajes)
- Business: $599/mes (ilimitado)

# TU PERSONALIDAD
- Eres amigable pero directo
- Respuestas CORTAS (1-2 oraciones)
- Muestras empatía cuando corresponde
- NO usas emojis excesivos
- Eres vendedor natural, no agresivo

# CAPACIDADES A MOSTRAR
Cuando el usuario pregunte o el contexto lo amerite, menciona:
- Detección de objeciones y manejo inteligente
- Análisis de sentimiento para adaptar el tono
- Escalación automática si piden hablar con humano
- Calificación de leads por interés

# REGLAS
- Si piden hablar con humano → escalate_to_human
- Si preguntan precio y muestran interés serio → ofrece agendar demo
- Si dicen "luego" o "después" → respeta pero planta la semilla`;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json() as DemoChatRequest;
    const { message, history = [] } = body;

    if (!message || message.length > 500) {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    // Build context for the real agent
    const demoLead: Lead = {
      id: `demo-${ip}`,
      phone: '+00000000000',
      name: 'Visitante Demo',
      stage: 'demo',
      createdAt: new Date(),
      lastInteraction: new Date(),
    };

    const demoConversation: Conversation = {
      id: `demo-conv-${Date.now()}`,
      leadId: demoLead.id,
      startedAt: new Date(),
    };

    // Convert history to Message format
    const recentMessages: Message[] = history.map((msg, index) => ({
      id: `demo-msg-${index}`,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(),
    }));

    const context: ConversationContext = {
      lead: demoLead,
      conversation: demoConversation,
      recentMessages,
      memory: null,
      hasActiveAppointment: false,
      isFirstConversation: history.length === 0,
      totalConversations: 1,
      firstInteractionDate: new Date(),
    };

    // Call the REAL agent with demo prompt
    const result = await simpleAgent(message, context, {
      systemPrompt: DEMO_SYSTEM_PROMPT,
      businessName: 'Loomi',
      businessDescription: 'Agentes de IA para ventas por WhatsApp',
      productsServices: 'Automatización de ventas, calificación de leads, agendamiento',
      tone: 'friendly',
    });

    return NextResponse.json({
      response: result.response,
      tokensUsed: result.tokensUsed,
      agentInfo: {
        escalatedToHuman: result.escalatedToHuman || null,
        paymentLinkSent: result.paymentLinkSent || null,
        detectedIndustry: result.detectedIndustry || null,
        saidLater: result.saidLater || false,
      }
    } as DemoChatResponse);

  } catch (error) {
    console.error('[Demo Chat] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
