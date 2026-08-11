import { apiUrl, authHeaders } from "./api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  vaultConnected: boolean;
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<ChatResponse> {
  const res = await fetch(apiUrl("/api/ai/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    if (res.status === 503) {
      throw new Error("The AI assistant isn't configured on the server yet.");
    }
    throw new Error(`Failed to send message: ${res.status}`);
  }
  return res.json();
}
