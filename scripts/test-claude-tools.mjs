import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";

const testTool = tool(
  async ({ date }) => JSON.stringify({ available: true, slots: "Lunes 10:00, 11:00" }),
  { name: "check_availability", description: "Check calendar availability", schema: z.object({ date: z.string() }) }
);

const model = new ChatAnthropic({
  model: "claude-sonnet-4-5-20250929",
  maxTokens: 250,
  temperature: 0.7,
}).bindTools([testTool]);

const messages = [
  new SystemMessage("Eres Victor de Anthana. Vendes agentes de IA para WhatsApp. Max 3 oraciones. Siempre termina con pregunta."),
  new HumanMessage("Hola, quiero agendar una demo")
];

console.log("--- Round 1 ---");
const res = await model.invoke(messages);
const hasToolCalls = res.tool_calls && res.tool_calls.length > 0;
console.log("Has tool calls:", hasToolCalls);

if (hasToolCalls) {
  console.log("Tool calls:", JSON.stringify(res.tool_calls, null, 2));

  // Execute tools and send results back
  messages.push(res);
  for (const tc of res.tool_calls) {
    const toolObj = [testTool].find(t => t.name === tc.name);
    const result = toolObj ? await toolObj.invoke(tc.args) : JSON.stringify({ error: "not found" });
    messages.push(new ToolMessage({ content: result, tool_call_id: tc.id }));
  }

  console.log("--- Round 2 ---");
  const res2 = await model.invoke(messages);

  if (typeof res2.content === "string") {
    console.log("Final response:", res2.content);
  } else if (Array.isArray(res2.content)) {
    const texts = res2.content.filter(b => b.type === "text").map(b => b.text).join("");
    console.log("Final response:", texts);
  }
} else {
  if (typeof res.content === "string") {
    console.log("Response:", res.content);
  } else if (Array.isArray(res.content)) {
    const texts = res.content.filter(b => b.type === "text").map(b => b.text).join("");
    console.log("Response:", texts);
  }
}

console.log("\n--- TEST PASSED ---");
