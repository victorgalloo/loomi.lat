/**
 * LangGraph Graph Compilation + Entry Point
 *
 * Graph topology:
 * START → [analyze] → [route] → {needsSummary?} → [summarize] → [generate] → [persist] → END
 *                                      ↓ no
 *                                [generate] → [persist] → END
 */

import { StateGraph, END } from '@langchain/langgraph';
import { LangChainCallbackHandler } from '@posthog/ai/langchain';
import { getPostHogServer } from '@/lib/analytics/posthog';
import { ConversationContext } from '@/types';
import { SimpleAgentResult } from '@/lib/agents/simple-agent';
import { GraphAgentConfig } from './state';
import { GraphState, DEFAULT_PERSISTED_STATE, PersistedConversationState } from './state';
import { loadConversationState } from './memory';
import { analyzeNode, routeNode, summarizeNode, generateNode, persistNode } from './nodes';
import { withTiming, printTimingSummary } from './timing-middleware';

// Compiled graph singleton
let compiledGraph: ReturnType<ReturnType<typeof buildGraph>['compile']> | null = null;

function buildGraph() {
  const graph = new StateGraph(GraphState)
    .addNode('analyze', withTiming('analyze', analyzeNode))
    .addNode('route', withTiming('route', routeNode))
    .addNode('summarize', withTiming('summarize', summarizeNode))
    .addNode('generate', withTiming('generate', generateNode))
    .addNode('persist', withTiming('persist', persistNode))
    .addEdge('__start__', 'analyze')
    .addEdge('analyze', 'route')
    .addConditionalEdges('route', (state) => {
      return state.needsSummary ? 'summarize' : 'generate';
    }, {
      summarize: 'summarize',
      generate: 'generate',
    })
    .addEdge('summarize', 'generate')
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
 * Entry point that replaces simpleAgent().
 * Same signature: (message, context) → SimpleAgentResult
 *
 * @param preloadedState - Optional state preloaded from the RPC call.
 *   When provided, skips the separate loadConversationState() query (~50-200ms savings).
 */
export async function processMessageGraph(
  message: string,
  context: ConversationContext,
  agentConfig?: GraphAgentConfig,
  preloadedState?: PersistedConversationState
): Promise<SimpleAgentResult> {
  // Use preloaded state if available, otherwise load from Supabase
  const conversationState = preloadedState ?? await loadConversationState(
    context.conversation.id,
    context.lead.id
  );

  // Build history with time gap awareness
  const recentSlice = context.recentMessages.slice(-20);
  const history: { role: 'user' | 'assistant'; content: string }[] = [];

  for (let i = 0; i < recentSlice.length; i++) {
    const m = recentSlice[i];
    // Detect large time gaps (>2 hours) between messages and inject a system note
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

  console.log('=== GRAPH INVOCATION ===');
  console.log(`Turn: ${conversationState.turn_count + 1}, Phase: ${conversationState.phase}`);
  console.log(`[Graph] agentConfig present: ${!!agentConfig}, systemPrompt: ${!!agentConfig?.systemPrompt}, model: ${agentConfig?.model || 'default'}`);

  // Build PostHog callback handler for graph-level tracing
  const posthogCallback = new LangChainCallbackHandler({
    client: getPostHogServer(),
    distinctId: agentConfig?.tenantId || 'unknown',
    traceId: context.conversation.id,
    properties: { source: 'graph' },
  });

  // Invoke the graph
  const graph = getCompiledGraph();
  const finalState = await graph.invoke({
    message,
    context,
    history,
    agentConfig,
    conversationState,
    reasoning: null,
    sentiment: null,
    industry: null,
    topicChanged: false,
    currentTopic: 'general' as const,
    resolvedPhase: conversationState.phase,
    needsSummary: false,
    saidLater: false,
    result: null,
    _nodeTimings: [],
  }, { callbacks: [posthogCallback] });

  // Print timing summary
  printTimingSummary(finalState._nodeTimings);

  if (!finalState.result) {
    return { response: 'Perdón, tuve un problema. ¿Me repites?' };
  }

  return finalState.result;
}
