"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ArrowUpIcon } from "@/components/ui/Icon";
import { PENDING_CHAT_MESSAGE_KEY } from "@/lib/aiApi";

// Dashboard's chat box, Claude-homepage-style: no message history here -
// sending a message stashes it and hands off to /brain (which opens as a
// tab, per the tab bar's normal "any navigation is a tab" behavior) to
// actually carry the conversation.
export function AiChatWidget() {
  const router = useRouter();
  const [input, setInput] = useState("");

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    sessionStorage.setItem(PENDING_CHAT_MESSAGE_KEY, text);
    router.push("/brain");
  }

  return (
    <section className="rounded-[28px] border border-line bg-surface p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-xl text-ink">Ask anything</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Your habits, notes, and projects — all in one place to ask about.
      </p>
      <div className="mt-5 flex items-end gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask about your tasks, habits, or notes…"
          className="max-h-40 min-h-14 flex-1 resize-none"
          rows={2}
        />
        <Button
          size="lg"
          onClick={handleSend}
          disabled={!input.trim()}
          aria-label="Send message"
          className="shrink-0"
        >
          <ArrowUpIcon />
        </Button>
      </div>
    </section>
  );
}
