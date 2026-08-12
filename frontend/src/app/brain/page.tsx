"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { ArrowUpIcon } from "@/components/ui/Icon";
import { MarkdownPreview } from "@/components/notes/MarkdownPreview";
import { sendChatMessage, type ChatMessage } from "@/lib/aiApi";
import { getObsidianConnectionStatus } from "@/lib/obsidianApi";

export default function BrainPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vaultConnected, setVaultConnected] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getObsidianConnectionStatus()
      .then((s) => setVaultConnected(s.connected))
      .catch(() => {});
  }, []);

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
      const { reply, vaultConnected: connected } = await sendChatMessage(next);
      setMessages([...next, { role: "assistant", content: reply }]);
      setVaultConnected(connected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong sending that message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-6 pt-16 sm:px-10 sm:pt-20">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Brain</h1>
        <Link href="/brain/settings" className="text-sm text-ink-muted transition-colors hover:text-ink">
          Vault settings →
        </Link>
      </div>
      <p className="mt-2 max-w-md text-ink-muted">
        Ask about your tasks, habits, or your connected Obsidian vault.
      </p>

      {vaultConnected === false && (
        <p className="mt-4 text-sm text-ink-muted">
          Your Obsidian vault isn&apos;t connected —{" "}
          <Link href="/brain/settings" className="text-clay-text underline">
            connect it in settings
          </Link>{" "}
          for vault-backed answers. helm data (tasks, habits) still works.
        </p>
      )}

      <div ref={scrollRef} className="mt-6 flex-1 space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[200px] items-center justify-center">
            <p className="text-sm text-ink-muted/60">No messages yet — ask something to get started.</p>
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
          placeholder="Ask about your vault, tasks, or habits…"
          className="max-h-40 min-h-11 flex-1 resize-none"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          size="sm"
          aria-label="Send message"
        >
          <ArrowUpIcon />
        </Button>
      </div>
    </main>
  );
}
