"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { ArrowUpIcon } from "@/components/ui/Icon";
import { MarkdownPreview } from "@/components/notes/MarkdownPreview";
import { sendChatMessage, type ChatMessage } from "@/lib/aiApi";

export function ChatInterface({
  placeholder = "Ask about your tasks, habits, or notes…",
  emptyText = "No messages yet — ask something to get started.",
  onVaultConnected,
}: {
  placeholder?: string;
  emptyText?: string;
  onVaultConnected?: (connected: boolean) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const { reply, vaultConnected } = await sendChatMessage(next);
      setMessages([...next, { role: "assistant", content: reply }]);
      onVaultConnected?.(vaultConnected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong sending that message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[200px] items-center justify-center">
            <p className="text-sm text-ink-muted/60">{emptyText}</p>
          </div>
        ) : (
          messages.map((message, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-card border px-4 py-3 ${
                message.role === "user"
                  ? "ml-auto border-clay bg-clay-soft/40"
                  : "border-line bg-surface"
              }`}
            >
              {message.role === "assistant" ? (
                <MarkdownPreview content={message.content} />
              ) : (
                <p className="whitespace-pre-wrap text-sm text-ink">{message.content}</p>
              )}
            </div>
          ))
        )}
        {sending && <p className="text-sm text-ink-muted">Thinking…</p>}
        {error && (
          <p className="max-w-[85%] rounded-card border border-clay/40 bg-clay-soft/20 px-4 py-3 text-sm text-clay">
            {error}
          </p>
        )}
      </div>

      <div className="sticky bottom-0 mt-4 flex items-end gap-2 border-t border-line bg-paper py-4">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholder}
          className="max-h-40 min-h-11 flex-1 resize-none"
          rows={1}
        />
        <Button onClick={handleSend} disabled={sending || !input.trim()} size="sm" aria-label="Send message">
          <ArrowUpIcon />
        </Button>
      </div>
    </div>
  );
}
