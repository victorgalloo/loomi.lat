/**
 * LangGraph Graph Compilation + Entry Point
 *
 * Graph topology:
 * START → [analyze] → [route] → {needsSummary?} → [summarize] → [generate] → [persist] → END
 *                                      ↓ no
 *                                [generate] → [persist] → END
 */

import { StateGraph, END } from '@langchain/langgraph';
import { ConversationContext } from '@/types';
import { SimpleAgentResult } from '@/lib/agents/simple-agent';
import { GraphAgentConfig } from './state';
import { GraphState, DEFAULT_PERSISTED_STATE } from './state';
import { loadConversationState } from './memory';
import { analyzeNode, routeNode, summarizeNode, generateNode, persistNode } from './nodes';

// Compiled graph singleton
let compiledGraph: ReturnType<ReturnType<typeof buildGraph>['compile']> | null = null;

function buildGraph() {
  const graph = new StateGraph(GraphState)
    .addNode('analyze', analyzeNode)
    .addNode('route', routeNode)
    .addNode('summarize', summarizeNode)
    .addNode('generate', generateNode)
    .addNode('persist', persistNode)
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
 */
export async function processMessageGraph(
  message: string,
  context: ConversationContext,
  agentConfig?: GraphAgentConfig
): Promise<SimpleAgentResult> {
  // Load persisted state from Supabase
  const conversationState = await loadConversationState(
    context.conversation.id,
    context.lead.id
  );

  // Build history from context (same as simple-agent.ts)
  const history = context.recentMessages
    .slice(-20)
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
  history.push({ role: 'user', content: message });

  console.log('=== GRAPH INVOCATION ===');
  console.log(`Turn: ${conversationState.turn_count + 1}, Phase: ${conversationState.phase}`);
  console.log(`[Graph] agentConfig present: ${!!agentConfig}, systemPrompt: ${!!agentConfig?.systemPrompt}, model: ${agentConfig?.model || 'default'}`);

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
  });

  if (!finalState.result) {
    return { response: 'Perdón, tuve un problema. ¿Me repites?' };
  }

  return finalState.result;
}
