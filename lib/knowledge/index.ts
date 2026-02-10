/**
 * Knowledge context utilities for LangGraph agent.
 * Stub module — tenant knowledge is loaded via agentConfig in the legacy path.
 * These functions are used by lib/graph/ nodes and prompts.
 */

/**
 * Returns knowledge context string for the system prompt, or null if none available.
 */
export function getKnowledgeContextForSystemPrompt(_message: string): string | null {
  // TODO: Load tenant-specific knowledge documents here
  return null;
}

/**
 * Returns additional tools derived from tenant knowledge documents.
 */
export function createKnowledgeTools(): Record<string, never> {
  // TODO: Generate dynamic tools from tenant documents
  return {};
}
