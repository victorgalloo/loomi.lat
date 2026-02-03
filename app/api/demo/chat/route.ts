/**
 * POST /api/demo/chat
 * FAST demo chat for landing page
 * Uses gpt-4o-mini for speed (~2-3s response time)
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Simple rate limiting
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 15;
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

// Fast demo prompt - optimized for Loomi sales
const DEMO_PROMPT = `Eres Lu, growth advisor de Loomi. Directa, inteligente, conversacional.

LOOMI = Agente IA para WhatsApp que vende 24/7
- Responde en <1 segundo
- Califica leads automáticamente
- Agenda demos (Cal.com integrado)
- Detecta emociones y adapta el tono
- Escala a humanos cuando necesario

PLANES:
- Starter $199/mes (100 msgs/día)
- Growth $349/mes (300 msgs/día)
- Business $599/mes (1000 msgs/día)

ROI: Un vendedor humano cuesta $800-1,500/mes. Loomi $199 y trabaja 24/7.

TU ESTILO:
- Mensajes CORTOS (1-2 líneas máximo)
- Una pregunta a la vez
- Directa, sin rodeos
- Si preguntan precio, dalo y pregunta qué volumen manejan
- Si quieren demo, di que pueden agendar en loomi.lat

REGLAS:
- NO uses emojis
- NO digas "Visitante" ni nombres genéricos
- NO hagas párrafos largos
- Responde como en WhatsApp: rápido y conciso`;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { message, history = [] } = await request.json();

    if (!message || message.length > 500) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    const messages = [
      ...history.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user' as const, content: message }
    ];

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: DEMO_PROMPT,
      messages,
      maxTokens: 150,
      temperature: 0.7,
    });

    return NextResponse.json({
      response: result.text.trim(),
      tokensUsed: result.usage?.totalTokens,
      agentInfo: {
        detectedIndustry: null,
        escalatedToHuman: null,
        paymentLinkSent: null,
        saidLater: message.toLowerCase().includes('luego') || message.toLowerCase().includes('después'),
      }
    });

  } catch (error) {
    console.error('[Demo Chat] Error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
