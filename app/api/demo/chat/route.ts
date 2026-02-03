/**
 * POST /api/demo/chat
 * Demo chat using the REAL Loomi agent with all tools
 */

import { NextRequest, NextResponse } from 'next/server';
import { simpleAgent } from '@/lib/agents/simple-agent';
import { ConversationContext, Lead, Conversation, Message } from '@/types';
import { checkAvailability } from '@/lib/tools/calendar';

// Helper to get next business days
function getNextBusinessDays(count: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  let currentDate = new Date(today);

  while (dates.length < count) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(currentDate.toISOString().split('T')[0]);
    }
  }

  return dates;
}

// Format time for display
function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

// Day names in Spanish
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

// Rate limiting
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

    // Create demo context
    const demoLead: Lead = {
      id: `demo-${ip}`,
      phone: '+521234567890',
      name: '', // Empty to avoid "Visitante"
      stage: 'new',
      createdAt: new Date(),
      lastInteraction: new Date(),
    };

    const demoConversation: Conversation = {
      id: `demo-conv-${Date.now()}`,
      leadId: demoLead.id,
      startedAt: new Date(),
    };

    // Convert history to Message format
    const recentMessages: Message[] = history.slice(-10).map((m: { role: string; content: string }, i: number) => ({
      id: `msg-${i}`,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: new Date(),
    }));

    const context: ConversationContext = {
      lead: demoLead,
      conversation: demoConversation,
      recentMessages,
      hasActiveAppointment: false,
      isFirstConversation: history.length === 0,
    };

    // Call the REAL agent
    const result = await simpleAgent(message, context);

    // If agent triggered schedule list, fetch and return slots
    if (result.showScheduleList) {
      try {
        const dates = getNextBusinessDays(2);
        const allSlots = await checkAvailability(dates.join(','));

        // Format slots for frontend
        const formattedSlots = allSlots.slice(0, 6).map(slot => {
          const date = new Date(slot.date + 'T12:00:00');
          const dayName = DIAS[date.getDay()];
          const dayNum = date.getDate();
          return {
            id: `${slot.date}_${slot.time}`,
            date: slot.date,
            time: slot.time,
            label: `${dayName} ${dayNum} - ${formatTime12h(slot.time)}`
          };
        });

        return NextResponse.json({
          response: result.response,
          showScheduleList: true,
          slots: formattedSlots,
          agentInfo: {
            escalatedToHuman: result.escalatedToHuman,
            paymentLinkSent: result.paymentLinkSent,
            detectedIndustry: null,
            saidLater: false,
          }
        });
      } catch (error) {
        console.error('[Demo Chat] Error fetching slots:', error);
        // Fallback to Cal.com link
        return NextResponse.json({
          response: result.response + '\n\nAgenda directo aquí: https://cal.com/loomi/demo',
          agentInfo: {
            escalatedToHuman: result.escalatedToHuman,
            paymentLinkSent: result.paymentLinkSent,
            detectedIndustry: null,
            saidLater: false,
          }
        });
      }
    }

    return NextResponse.json({
      response: result.response,
      agentInfo: {
        escalatedToHuman: result.escalatedToHuman,
        paymentLinkSent: result.paymentLinkSent,
        detectedIndustry: null,
        saidLater: message.toLowerCase().includes('luego') || message.toLowerCase().includes('después'),
      }
    });

  } catch (error) {
    console.error('[Demo Chat] Error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
