/**
 * LangGraph Timing Middleware for Loomi
 * ======================================
 * Wraps each node to measure execution time and identify bottlenecks.
 *
 * Usage:
 *   import { withTiming, printTimingSummary, type NodeTiming } from './timing-middleware';
 *
 *   // Wrap each node function
 *   graph.addNode("analyze",   withTiming("analyze",   analyzeNode));
 *   graph.addNode("route",     withTiming("route",     routeNode));
 *   graph.addNode("summarize", withTiming("summarize", summarizeNode));
 *   graph.addNode("generate",  withTiming("generate",  generateNode));
 *   graph.addNode("persist",   withTiming("persist",   persistNode));
 *
 *   // After invoking:
 *   const result = await graph.invoke(state);
 *   printTimingSummary(result._nodeTimings);
 */

import type { RunnableConfig } from '@langchain/core/runnables';

export interface NodeTiming {
  node: string;
  durationMs: number;
  timestamp: number;
}

// Add this to your ConversationState type:
// _nodeTimings?: NodeTiming[];

type NodeFn<S> = (state: S, config?: RunnableConfig) => Promise<Partial<S>> | Partial<S>;

/**
 * Wraps a LangGraph node function with timing instrumentation.
 */
export function withTiming<S extends { _nodeTimings?: NodeTiming[] }>(
  nodeName: string,
  fn: NodeFn<S>
): NodeFn<S> {
  return async (state: S, config?: RunnableConfig): Promise<Partial<S>> => {
    const timings = state._nodeTimings ?? [];
    const start = performance.now();

    const result = await fn(state, config);

    const durationMs = Math.round((performance.now() - start) * 10) / 10;

    const emoji = durationMs > 3000 ? "🔴" : durationMs > 1000 ? "🟡" : "🟢";
    console.log(`${emoji} [${nodeName}] ${durationMs.toFixed(0)}ms`);

    timings.push({
      node: nodeName,
      durationMs,
      timestamp: Date.now(),
    });

    return {
      ...result,
      _nodeTimings: timings,
    };
  };
}

/**
 * Prints a clear summary of where time was spent.
 * Call after graph.invoke().
 */
export function printTimingSummary(timings?: NodeTiming[]): string {
  if (!timings?.length) return "No timing data found.";

  const totalMs = timings.reduce((sum, t) => sum + t.durationMs, 0);

  const lines: string[] = [
    "",
    "=".repeat(55),
    `⏱️  LOOMI PIPELINE — Total: ${totalMs.toFixed(0)}ms (${(totalMs / 1000).toFixed(1)}s)`,
    "=".repeat(55),
  ];

  for (const t of timings) {
    const pct = totalMs > 0 ? (t.durationMs / totalMs) * 100 : 0;
    const barLen = Math.round(pct / 2);
    const bar = "█".repeat(barLen) + "░".repeat(Math.max(0, 50 - barLen));
    const emoji = t.durationMs > 3000 ? "🔴" : t.durationMs > 1000 ? "🟡" : "🟢";

    lines.push(
      `  ${emoji} ${t.node.padEnd(12)} ${t.durationMs.toFixed(0).padStart(7)}ms  (${pct.toFixed(1).padStart(5)}%)  ${bar}`
    );
  }

  lines.push("=".repeat(55));

  // Flag bottleneck
  const slowest = timings.reduce((a, b) => (a.durationMs > b.durationMs ? a : b));
  lines.push(`  🎯 Bottleneck: ${slowest.node} (${slowest.durationMs.toFixed(0)}ms)`);

  // LLM-specific warnings
  const llmNodes = timings.filter((t) =>
    ["analyze", "summarize", "generate"].includes(t.node)
  );
  const llmTotal = llmNodes.reduce((sum, t) => sum + t.durationMs, 0);
  if (llmTotal > 8000) {
    lines.push(
      `  ⚠️  LLM calls total: ${llmTotal.toFixed(0)}ms — consider parallelizing or dropping a call`
    );
  }

  const persist = timings.find((t) => t.node === "persist");
  if (persist && persist.durationMs > 500) {
    lines.push(`  ⚠️  persist is slow — consider fire-and-forget`);
  }

  lines.push("");

  const summary = lines.join("\n");
  console.log(summary);
  return summary;
}

/**
 * Optional: build a record to store in Supabase for tracking over time.
 */
export function toTimingRecord(
  conversationId: string,
  timings: NodeTiming[]
) {
  return {
    conversation_id: conversationId,
    total_ms: timings.reduce((sum, t) => sum + t.durationMs, 0),
    timings: JSON.stringify(timings),
    bottleneck: timings.reduce((a, b) =>
      a.durationMs > b.durationMs ? a : b
    ).node,
    created_at: new Date().toISOString(),
  };
}
