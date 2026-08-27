import { apiUrl, authHeaders } from "./api";

// Set by the dashboard's chat box right before navigating to /brain, read
// once (and cleared) by BrainPage on mount so the message sent from home
// actually opens as the first turn of the /brain chat tab instead of being
// dropped on navigation.
export const PENDING_CHAT_MESSAGE_KEY = "helm-pending-chat-message";

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
