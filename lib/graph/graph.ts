/**
 * LangGraph Graph — Simplified (v2)
 *
 * Graph topology: START → [generate] → [persist] → END
 *
 * Previous: START → analyze → route → summarize? → generate → persist → END (3 LLM calls)
 * Now: START → generate → persist → END (1 LLM call)
 *
 * The LLM handles analysis, routing, and response generation in a single invocation
 * via a well-structured system prompt + native tool use.
 */

import { StateGraph, END } from '@langchain/langgraph';
import { LangChainCallbackHandler } from '@posthog/ai/langchain';
import { getPostHogServer, flushPostHog } from '@/lib/analytics/posthog';
import { ConversationContext } from '@/types';
import { GraphAgentConfig, SimpleAgentResult } from './state';
import { GraphState, DEFAULT_PERSISTED_STATE, PersistedConversationState } from './state';
import { loadConversationState } from './memory';
import { generateNode, persistNode } from './nodes';
import { withTiming, printTimingSummary } from './timing-middleware';

// Compiled graph singleton
let compiledGraph: ReturnType<ReturnType<typeof buildGraph>['compile']> | null = null;

function buildGraph() {
  const graph = new StateGraph(GraphState)
    .addNode('generate', withTiming('generate', generateNode))
    .addNode('persist', withTiming('persist', persistNode))
    .addEdge('__start__', 'generate')
    .addEdge('generate', 'persist')
    .addEdge('persist', END);

  return graph;
}

function getCompiledGraph() {
  if (!compiledGraph) {
    compiledGraph = buildGraph().compile();
  }
  return compiledGraph;
}

/**
 * Entry point — same signature as before for backwards compatibility.
 */
export async function processMessageGraph(
  message: string,
  context: ConversationContext,
  agentConfig?: GraphAgentConfig,
  preloadedState?: PersistedConversationState
): Promise<SimpleAgentResult> {
  const conversationState = preloadedState ?? await loadConversationState(
    context.conversation.id,
    context.lead.id
  );

  // Build history with time gap awareness
  const recentSlice = context.recentMessages.slice(-20);
  const history: { role: 'user' | 'assistant'; content: string }[] = [];

  for (let i = 0; i < recentSlice.length; i++) {
    const m = recentSlice[i];
    if (i > 0 && m.timestamp) {
      const prev = recentSlice[i - 1];
      if (prev.timestamp) {
        const gapMs = m.timestamp.getTime() - prev.timestamp.getTime();
        const gapHours = gapMs / (1000 * 60 * 60);
        if (gapHours >= 2) {
          const gapText = gapHours >= 24
            ? `${Math.round(gapHours / 24)} día(s)`
            : `${Math.round(gapHours)} hora(s)`;
          history.push({
            role: 'assistant',
            content: `[Han pasado ${gapText} desde el último mensaje. Si el usuario saluda o cambia de tema, trátalo como una conversación nueva.]`
          });
        }
      }
    }
    history.push({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    });
  }

  history.push({ role: 'user', content: message });

  // Increment turn count
  const updatedState = { ...conversationState, turn_count: conversationState.turn_count + 1 };

  console.log(`=== GRAPH v2 | Turn: ${updatedState.turn_count} | Phase: ${updatedState.phase} ===`);

  // PostHog tracing
  const posthogCallback = new LangChainCallbackHandler({
    client: getPostHogServer(),
    distinctId: agentConfig?.tenantId || 'unknown',
    traceId: context.conversation.id,
    properties: { source: 'graph-v2' },
  });

  const graph = getCompiledGraph();
  const finalState = await graph.invoke({
    message,
    context,
    history,
    agentConfig,
    conversationState: updatedState,
    result: null,
    _nodeTimings: [],
  }, { callbacks: [posthogCallback] });

  printTimingSummary(finalState._nodeTimings);
  await flushPostHog();

  if (!finalState.result) {
    return { response: 'Perdón, tuve un problema. ¿Me repites?' };
  }

  return finalState.result;
}
