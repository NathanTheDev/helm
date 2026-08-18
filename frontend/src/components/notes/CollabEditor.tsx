"use client";

import type { User } from "firebase/auth";
import { useYjsEditor } from "@/hooks/useYjsEditor";
import { PresenceBar } from "./PresenceBar";
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";

export function CollabEditor({
  wsUrl,
  room,
  user,
}: {
  wsUrl: string;
  room: string;
  user: User | null;
}) {
  const { editorContainerRef, status, synced, peers } = useYjsEditor(wsUrl, room, user);

  return (
    <div className="mt-6 flex flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between">
        <PresenceBar users={peers} />
        <div className="flex items-center gap-2">
          {!synced && <span className="font-mono text-xs text-ink-muted">Syncing…</span>}
          <ConnectionStatusBadge status={status} />
        </div>
      </div>

      <div
        ref={editorContainerRef}
        className="min-h-[16rem] flex-1 rounded-card border border-line bg-surface p-4"
      />
    </div>
  );
}
