"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ArrowUpIcon } from "@/components/ui/Icon";

// Dashboard-level chat box - visual only for now. Wired to the real
// assistant (see app/brain/page.tsx's sendChatMessage) at a later date.
export function AiChatWidget() {
  const [input, setInput] = useState("");

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
          placeholder="Ask about your tasks, habits, or notes…"
          className="max-h-40 min-h-14 flex-1 resize-none"
          rows={2}
        />
        <Button size="lg" disabled aria-label="Send message" className="shrink-0">
          <ArrowUpIcon />
        </Button>
      </div>
    </section>
  );
}
