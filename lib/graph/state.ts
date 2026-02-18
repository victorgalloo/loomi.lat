/**
 * LangGraph State Schema — Simplified (v2)
 *
 * Removed: analyzeNode outputs, routeNode keyword matching, redundant phase tracking.
 * The LLM now decides phase + response in a single invocation.
 */

import { Annotation } from '@langchain/langgraph';
import { ConversationContext } from '@/types';
import { AgentConfig } from '@/lib/tenant/context';
import { NodeTiming } from './timing-middleware';

export interface SimpleAgentResult {
  response: string;
  tokensUsed?: number;
  appointmentBooked?: {
    eventId: string;
    date: string;
    time: string;
    email: string;
    meetingUrl?: string;
  };
  brochureSent?: boolean;
  escalatedToHuman?: {
    reason: string;
    summary: string;
  };
  paymentLinkSent?: {
    plan: string;
    email: string;
    checkoutUrl: string;
  };
  detectedIndustry?: string;
  saidLater?: boolean;
  showScheduleList?: boolean;
}

export type GraphAgentConfig = AgentConfig & {
  knowledgeContext?: string;
  customTools?: Array<{ name: string; description: string; displayName: string; mockResponse?: unknown }>;
  whatsappCredentials?: { phoneNumberId: string; accessToken: string; tenantId?: string };
};

// Simplified phase — used for persistence/analytics, NOT for routing decisions
export type SalesPhase =
  | 'discovery'
  | 'qualification'
  | 'demo_proposed'
  | 'scheduling'
  | 'closing'
  | 'closed';

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

// Full graph state — simplified to 2 nodes: generate → persist
export const GraphState = Annotation.Root({
  // Inputs (set once at invocation)
  message: Annotation<string>,
  context: Annotation<ConversationContext>,
  history: Annotation<Array<{ role: 'user' | 'assistant'; content: string }>>,
  agentConfig: Annotation<GraphAgentConfig | undefined>,

  // Persisted state (loaded from / saved to Supabase)
  conversationState: Annotation<PersistedConversationState>,

  // Output (set by generateNode)
  result: Annotation<SimpleAgentResult | null>,

  // Timing (set by withTiming middleware)
  _nodeTimings: Annotation<NodeTiming[]>,
});

export type GraphStateType = typeof GraphState.State;
