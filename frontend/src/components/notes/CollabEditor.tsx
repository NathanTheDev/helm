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
  mode: "edit" | "preview" | "split";
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

      <div className={mode === "split" ? "grid flex-1 grid-cols-1 gap-6 md:grid-cols-2" : "flex flex-1 flex-col"}>
        {mode !== "preview" && <div ref={editorContainerRef} className="min-h-[16rem] flex-1" />}
        {mode !== "edit" && <MarkdownPreview content={content} />}
      </div>
    </div>
  );
}
