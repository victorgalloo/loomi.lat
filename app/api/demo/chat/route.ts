/**
 * POST /api/demo/chat
 * Lightweight demo chat for landing page
 * Uses fast gpt-4o-mini, no complex analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { demoAgent } from '@/lib/agents/demo-agent';

// Simple rate limiting
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
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
}

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

    const result = await demoAgent(message, history);

    return NextResponse.json({
      response: result.response,
      tokensUsed: result.tokensUsed
    } as DemoChatResponse);

  } catch (error) {
    console.error('[Demo Chat] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
