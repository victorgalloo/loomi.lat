/**
 * LangGraph State Schema
 * Defines the Annotation combining ephemeral inputs with persisted conversation state
 */

import { Annotation } from '@langchain/langgraph';
import { ConversationContext } from '@/types';
import { SimpleAgentResult } from '@/lib/agents/simple-agent';
import { ReasoningResult } from '@/lib/agents/reasoning';
import { AgentConfig } from '@/lib/tenant/context';
import { NodeTiming } from './timing-middleware';

// Extended type matching what the webhook attaches (knowledgeContext + customTools)
export type GraphAgentConfig = AgentConfig & {
  knowledgeContext?: string;
  customTools?: Array<{ name: string; description: string; displayName: string; mockResponse?: unknown }>;
  whatsappCredentials?: { phoneNumberId: string; accessToken: string; tenantId?: string };
};

// The 11 sales phases matching simple-agent.ts state machine
export type SalesPhase =
  | 'discovery'
  | 'preguntando_volumen'
  | 'proponer_demo_urgente'
  | 'listo_para_demo'
  | 'dar_horarios'
  | 'esperando_aceptacion'
  | 'esperando_confirmacion'
  | 'pedir_email'
  | 'confirmar_y_despedir'
  | 'pedir_clarificacion_ya'
  | 'preguntar_que_tiene';

export interface LeadInfo {
  business_type: string | null;
  volume: string | null;
  pain_points: string[];
  current_solution: string | null;
  referral_source: string | null;
}

export interface ObjectionEntry {
  category: string;
  text: string;
  addressed: boolean;
}

// State persisted in Supabase conversation_states table
export interface PersistedConversationState {
  phase: SalesPhase;
  turn_count: number;
  lead_info: LeadInfo;
  topics_covered: string[];
  products_offered: string[];
  objections: ObjectionEntry[];
  summary: string | null;
  last_summary_turn: number;
  previous_topic: string | null;
  proposed_datetime: { date?: string; time?: string } | null;
  awaiting_email: boolean;
  ask_counts: Record<string, number>;
  stalled_turns: number;
}

export const DEFAULT_PERSISTED_STATE: PersistedConversationState = {
  phase: 'discovery',
  turn_count: 0,
  lead_info: {
    business_type: null,
    volume: null,
    pain_points: [],
    current_solution: null,
    referral_source: null,
  },
  topics_covered: [],
  products_offered: [],
  objections: [],
  summary: null,
  last_summary_turn: 0,
  previous_topic: null,
  proposed_datetime: null,
  awaiting_email: false,
  ask_counts: {},
  stalled_turns: 0,
};

// Topic categories for detection
export type TopicCategory =
  | 'precio'
  | 'funcionalidad'
  | 'integraciones'
  | 'competencia'
  | 'demo'
  | 'implementacion'
  | 'caso_de_uso'
  | 'objecion'
  | 'general';

// Full graph state (Annotation)
export const GraphState = Annotation.Root({
  // Inputs (set once at invocation)
  message: Annotation<string>,
  context: Annotation<ConversationContext>,
  history: Annotation<Array<{ role: 'user' | 'assistant'; content: string }>>,
  agentConfig: Annotation<GraphAgentConfig | undefined>,

  // Persisted state (loaded from / saved to Supabase)
  conversationState: Annotation<PersistedConversationState>,

  // Analysis (set by analyzeNode)
  reasoning: Annotation<ReasoningResult | null>,
  sentiment: Annotation<string | null>,
  industry: Annotation<string | null>,
  topicChanged: Annotation<boolean>,
  currentTopic: Annotation<TopicCategory>,

  // Routing (set by routeNode)
  resolvedPhase: Annotation<SalesPhase>,
  needsSummary: Annotation<boolean>,
  saidLater: Annotation<boolean>,
  progressInstruction: Annotation<string>,

  // Output (set by generateNode)
  result: Annotation<SimpleAgentResult | null>,

  // Timing (set by withTiming middleware)
  _nodeTimings: Annotation<NodeTiming[]>,
});

export type GraphStateType = typeof GraphState.State;
