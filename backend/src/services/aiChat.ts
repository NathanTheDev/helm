import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../db/client";
import { computeHabitStats } from "./streak";
import { listVaultTools, callVaultTool } from "./obsidianMcp";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const MAX_TOOL_ITERATIONS = 6;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  return new Anthropic({ apiKey });
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Tools implemented directly against helm's own data (as opposed to the
// vault tools below, which are proxied live to the user's Obsidian MCP
// server). Kept intentionally small and read-only for Path A.
const LOCAL_TOOLS: Anthropic.Tool[] = [
  {
    name: "list_overdue_tasks",
    description: "List the user's overdue, not-done tasks across all projects in helm.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "habit_summary",
    description:
      "Summarize the user's habits in helm: name, frequency, current streak, and whether each is due today.",
    input_schema: { type: "object", properties: {} },
  },
];

async function runLocalTool(userId: string, name: string): Promise<unknown> {
  if (name === "list_overdue_tasks") {
    const tasks = await prisma.task.findMany({
      where: { userId, status: { not: "DONE" }, dueDate: { lt: new Date() } },
      orderBy: { dueDate: "asc" },
      include: { project: { select: { name: true } } },
    });
    return tasks.map((task) => ({
      title: task.title,
      status: task.status,
      dueDate: task.dueDate,
      project: task.project.name,
    }));
  }

  if (name === "habit_summary") {
    const habits = await prisma.habit.findMany({
      where: { userId },
      include: { completions: true },
    });
    return habits.map((habit) => {
      const { completions, ...rest } = habit;
      return {
        name: rest.name,
        frequency: rest.frequency,
        ...computeHabitStats(rest, completions),
      };
    });
  }

  throw new Error(`Unknown local tool: ${name}`);
}

// Pulls the live tool list from the user's vault MCP server (if connected)
// and maps it to Anthropic's tool schema shape - deliberately no hardcoded
// vault tool names, since those belong to the Local REST API plugin, not
// to helm. Returns `available: false` (not a throw) if the vault isn't
// connected or currently unreachable, so chat() can degrade gracefully.
async function buildVaultTools(userId: string): Promise<{ tools: Anthropic.Tool[]; available: boolean }> {
  try {
    const { tools } = await listVaultTools(userId);
    return {
      available: true,
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description ?? "",
        input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
      })),
    };
  } catch {
    return { available: false, tools: [] };
  }
}

const SYSTEM_PROMPT =
  "You are helm's assistant. You can call tools to look up the user's " +
  "Obsidian vault (if connected) and their tasks/habits inside helm. Only " +
  "state facts you actually retrieved via a tool call; say so plainly if " +
  "the vault isn't connected or a lookup fails, rather than guessing.";

export async function chat(userId: string, history: ChatMessage[]): Promise<string> {
  const client = getClient();
  const { tools: vaultTools, available } = await buildVaultTools(userId);
  const localToolNames = new Set(LOCAL_TOOLS.map((tool) => tool.name));
  const tools = [...LOCAL_TOOLS, ...vaultTools];

  const system = available
    ? SYSTEM_PROMPT
    : `${SYSTEM_PROMPT}\n\nNote: the user's Obsidian vault is not currently connected or reachable - if asked about vault content, say so rather than guessing.`;

  const messages: Anthropic.MessageParam[] = history.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages,
      tools,
    });

    if (response.stop_reason !== "tool_use") {
      return response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      try {
        const result = localToolNames.has(block.name)
          ? await runLocalTool(userId, block.name)
          : await callVaultTool(userId, block.name, block.input as Record<string, unknown>);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      } catch (err) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: err instanceof Error ? err.message : "Tool call failed",
          is_error: true,
        });
      }
    }
    messages.push({ role: "user", content: toolResults });
  }

  return "I wasn't able to finish that within the allowed number of tool calls - try narrowing the question.";
}
