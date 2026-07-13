"use client";

import type { User } from "firebase/auth";
import { useYjsEditor } from "@/hooks/useYjsEditor";
import { PresenceBar } from "./PresenceBar";
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";
import { MarkdownPreview } from "./MarkdownPreview";

export function CollabEditor({
  wsUrl,
  room,
  user,
  mode,
}: {
  wsUrl: string;
  room: string;
  user: User | null;
  mode: "edit" | "preview";
}) {
  const { editorContainerRef, content, status, synced, peers } = useYjsEditor(wsUrl, room, user);

  return (
    <div className="mt-6 flex flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between">
        <PresenceBar users={peers} />
        <div className="flex items-center gap-2">
          {!synced && <span className="font-mono text-xs text-ink-muted">Syncing…</span>}
          <ConnectionStatusBadge status={status} />
        </div>
      </div>

      {mode === "edit" ? (
        <div ref={editorContainerRef} className="min-h-[16rem] flex-1" />
      ) : (
        <MarkdownPreview content={content} />
      )}
    </div>
  );
}
