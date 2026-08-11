import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { prisma } from "../db/client";
import { encrypt, decrypt } from "../lib/crypto";

// helm's backend is the MCP client for the user's own Obsidian vault (via the
// "Local REST API" community plugin's built-in MCP server), reached over a
// private tunnel (e.g. Tailscale) the user sets up themselves - the vault is
// never exposed to the public internet, only to helm's backend. Deliberately
// not using Anthropic's native remote-MCP connector, which requires the MCP
// server be reachable over public HTTPS by Anthropic's own infrastructure.

const MCP_PATH = "/mcp/";

export interface ObsidianConnectionStatus {
  connected: boolean;
  baseUrl: string | null;
  status: string;
  lastError: string | null;
  lastCheckedAt: string | null;
}

async function withClient<T>(
  baseUrl: string,
  apiKey: string,
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  const transport = new StreamableHTTPClientTransport(new URL(MCP_PATH, baseUrl), {
    requestInit: { headers: { Authorization: `Bearer ${apiKey}` } },
  });
  const client = new Client({ name: "helm", version: "1.0.0" });
  await client.connect(transport);
  try {
    return await fn(client);
  } finally {
    await client.close().catch(() => {});
  }
}

// Connects, lists tools (cheap round-trip that proves both auth and the MCP
// handshake work), and persists the resulting status - used both right after
// saving a connection and for an explicit "test connection" re-check.
async function verifyAndRecordStatus(userId: string, baseUrl: string, apiKey: string): Promise<void> {
  try {
    await withClient(baseUrl, apiKey, (client) => client.listTools());
    await prisma.obsidianConnection.update({
      where: { userId },
      data: { status: "CONNECTED", lastError: null, lastCheckedAt: new Date() },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.obsidianConnection.update({
      where: { userId },
      data: { status: "ERROR", lastError: message, lastCheckedAt: new Date() },
    });
  }
}

export async function saveConnection(
  userId: string,
  input: { baseUrl: string; apiKey: string },
): Promise<ObsidianConnectionStatus> {
  await prisma.obsidianConnection.upsert({
    where: { userId },
    create: {
      userId,
      baseUrl: input.baseUrl,
      apiKeyEnc: encrypt(input.apiKey),
      status: "UNVERIFIED",
    },
    update: {
      baseUrl: input.baseUrl,
      apiKeyEnc: encrypt(input.apiKey),
      status: "UNVERIFIED",
      lastError: null,
    },
  });

  await verifyAndRecordStatus(userId, input.baseUrl, input.apiKey);
  return getStatus(userId);
}

export async function testConnection(userId: string): Promise<ObsidianConnectionStatus> {
  const row = await prisma.obsidianConnection.findUnique({ where: { userId } });
  if (!row) {
    return { connected: false, baseUrl: null, status: "UNVERIFIED", lastError: null, lastCheckedAt: null };
  }

  await verifyAndRecordStatus(userId, row.baseUrl, decrypt(row.apiKeyEnc));
  return getStatus(userId);
}

export async function getStatus(userId: string): Promise<ObsidianConnectionStatus> {
  const row = await prisma.obsidianConnection.findUnique({ where: { userId } });
  if (!row) {
    return { connected: false, baseUrl: null, status: "UNVERIFIED", lastError: null, lastCheckedAt: null };
  }

  return {
    connected: row.status === "CONNECTED",
    baseUrl: row.baseUrl,
    status: row.status,
    lastError: row.lastError,
    lastCheckedAt: row.lastCheckedAt?.toISOString() ?? null,
  };
}

export async function disconnect(userId: string): Promise<void> {
  await prisma.obsidianConnection.deleteMany({ where: { userId } });
}

// Used by the AI chat service (Phase 2) to expose the vault's MCP tools to
// Claude's tool-use loop. Throws if there's no connected vault - callers
// should check getStatus()/connected first and surface a clear error.
export async function listVaultTools(userId: string) {
  const row = await prisma.obsidianConnection.findUnique({ where: { userId } });
  if (!row) {
    throw new Error("No Obsidian connection configured");
  }
  return withClient(row.baseUrl, decrypt(row.apiKeyEnc), (client) => client.listTools());
}

export async function callVaultTool(userId: string, name: string, args: Record<string, unknown>) {
  const row = await prisma.obsidianConnection.findUnique({ where: { userId } });
  if (!row) {
    throw new Error("No Obsidian connection configured");
  }
  return withClient(row.baseUrl, decrypt(row.apiKeyEnc), (client) =>
    client.callTool({ name, arguments: args }),
  );
}
