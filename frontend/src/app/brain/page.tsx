"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { getObsidianConnectionStatus } from "@/lib/obsidianApi";
import { PENDING_CHAT_MESSAGE_KEY } from "@/lib/aiApi";

function readPendingMessage(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const value = sessionStorage.getItem(PENDING_CHAT_MESSAGE_KEY);
  if (value) sessionStorage.removeItem(PENDING_CHAT_MESSAGE_KEY);
  return value ?? undefined;
}

export default function BrainPage() {
  const [vaultConnected, setVaultConnected] = useState<boolean | null>(null);
  const [initialMessage] = useState(readPendingMessage);

  useEffect(() => {
    getObsidianConnectionStatus()
      .then((s) => setVaultConnected(s.connected))
      .catch(() => {});
  }, []);

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

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        <ChatInterface
          placeholder="Ask about your vault, tasks, or habits…"
          initialMessage={initialMessage}
          onVaultConnected={setVaultConnected}
        />
      </div>
    </main>
  );
}
