/**
 * Progress Tracker - Anti-loop & forward-progress enforcement
 *
 * Scans conversation history for repeated questions (email, volume, demo, business type)
 * and generates pivot instructions when thresholds are exceeded.
 *
 * Used by both simple-agent.ts and LangGraph graph/nodes.ts.
 */

export interface ProgressContext {
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentMessage: string;
  turnCount: number;
  /** Pre-computed ask counts from persisted state (LangGraph) */
  existingAskCounts?: Record<string, number>;
}

export interface ProgressResult {
  askCounts: Record<string, number>;
  shouldPivot: boolean;
  pivotInstruction: string | null;
  progressInstruction: string;
  stalledTurns: number;
}

// Question patterns the agent tends to repeat
const ASK_PATTERNS: Record<string, RegExp> = {
  email: /correo|email|e-mail|mail|@/i,
  volume: /cu[aá]ntos mensajes|volumen|cu[aá]ntos clientes|mensajes al d[ií]a|mensajes diarios/i,
  business_type: /qu[eé] tipo de negocio|a qu[eé] te dedicas|qu[eé] vendes|qu[eé] negocio|tipo de empresa/i,
  demo: /demo|reuni[oó]n|te muestro|quieres ver|agendamos|llamada/i,
};

// Patterns that indicate the user answered the question
const ANSWER_PATTERNS: Record<string, RegExp> = {
  email: /@.*\./,
  volume: /\d+/,
  business_type: /tienda|negocio|vendo|empresa|servicios|consultorio|restaurante|cl[ií]nica|agencia/i,
  demo: /s[ií]|dale|claro|ok|va|sale|perfecto|me interesa|quiero/i,
};

// Pivot strategies per ask type
const PIVOT_STRATEGIES: Record<string, Record<number, string>> = {
  email: {
    2: 'Ya preguntaste el correo. Reformula o avanza sin esa info.',
    3: 'NO pidas email de nuevo. Ofrece enviar link por WhatsApp directo.',
  },
  volume: {
    2: 'Ya preguntaste volumen. Si no responde con cifra, asume volumen medio y avanza.',
    3: 'NO preguntes volumen de nuevo. Propón demo basándote en lo que ya sabes.',
  },
  business_type: {
    2: 'Ya preguntaste tipo de negocio. Si no responde claro, asume servicio/producto genérico y avanza.',
    3: 'NO preguntes tipo de negocio de nuevo. Da info general y propón demo.',
  },
  demo: {
    2: 'Ya propusiste demo. Si no acepta, ofrece info/brochure como alternativa.',
    3: 'El usuario no quiere demo aún. Envía brochure o info y ofrece retomar después.',
  },
};

export function analyzeProgress(ctx: ProgressContext): ProgressResult {
  const { history, turnCount } = ctx;
  const askCounts: Record<string, number> = ctx.existingAskCounts
    ? { ...ctx.existingAskCounts }
    : {};

  // Count assistant asks and check if user answered
  for (let i = 0; i < history.length; i++) {
    const msg = history[i];
    if (msg.role !== 'assistant') continue;

    for (const [askType, pattern] of Object.entries(ASK_PATTERNS)) {
      if (pattern.test(msg.content)) {
        // Check if the next user message answered this question
        const nextUser = history[i + 1];
        const answerPattern = ANSWER_PATTERNS[askType];
        const wasAnswered = nextUser?.role === 'user' && answerPattern.test(nextUser.content);

        if (!wasAnswered) {
          askCounts[askType] = (askCounts[askType] || 0) + 1;
        } else {
          // Reset count if answered
          askCounts[askType] = 0;
        }
      }
    }
  }

  // Check for stalled progress (same phase for too many turns)
  let stalledTurns = 0;
  const recentAssistant = history.filter(m => m.role === 'assistant').slice(-4);
  if (recentAssistant.length >= 3) {
    // Check if recent messages are very similar (looping)
    const lastContents = recentAssistant.map(m => m.content.toLowerCase().substring(0, 80));
    const uniqueContents = new Set(lastContents);
    if (uniqueContents.size <= Math.ceil(lastContents.length / 2)) {
      stalledTurns = recentAssistant.length;
    }
  }

  // Build pivot instruction
  let pivotInstruction: string | null = null;
  let shouldPivot = false;

  for (const [askType, count] of Object.entries(askCounts)) {
    if (count >= 2) {
      const strategies = PIVOT_STRATEGIES[askType];
      if (strategies) {
        const threshold = count >= 3 ? 3 : 2;
        const instruction = strategies[threshold];
        if (instruction) {
          pivotInstruction = pivotInstruction
            ? `${pivotInstruction}\n${instruction}`
            : instruction;
          shouldPivot = true;
        }
      }
    }
  }

  // General stall detection
  if (stalledTurns >= 4 || turnCount >= 8) {
    const stallInstruction = 'DEBES avanzar a la siguiente fase AHORA con una propuesta concreta. No repitas lo que ya dijiste.';
    pivotInstruction = pivotInstruction
      ? `${pivotInstruction}\n${stallInstruction}`
      : stallInstruction;
    shouldPivot = true;
  }

  // Build progress instruction (always present, even if no pivot needed)
  let progressInstruction = '';
  if (turnCount >= 4) {
    progressInstruction = `Llevas ${turnCount} turnos. `;
    if (shouldPivot) {
      progressInstruction += 'La conversación NO avanza. Cambia de enfoque.';
    } else {
      progressInstruction += 'Asegúrate de avanzar hacia una propuesta concreta.';
    }
  }

  return {
    askCounts,
    shouldPivot,
    pivotInstruction,
    progressInstruction,
    stalledTurns,
  };
}
