"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ArrowUpIcon } from "@/components/ui/Icon";
import { PENDING_CHAT_MESSAGE_KEY } from "@/lib/aiApi";

// Dashboard's chat box, Claude-homepage-style: no message history here -
// sending a message stashes it and hands off to /brain (which opens as a
// tab, per the tab bar's normal "any navigation is a tab" behavior) to
// actually carry the conversation. No card border/shadow/heading around
// it - just the input field itself, lightly tinted so it still reads as
// a distinct control against the page's paper background.
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
    <div className="flex items-end gap-2 rounded-[28px] bg-surface p-4 sm:p-5">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Ask about your tasks, habits, or notes…"
        className="max-h-40 min-h-14 flex-1 resize-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted/60"
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
  );
}
