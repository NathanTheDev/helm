import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type { Awareness } from "y-protocols/awareness";
import type { User } from "firebase/auth";
import { EditorView, basicSetup } from "codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { syntaxHighlighting } from "@codemirror/language";
import { yCollab } from "y-codemirror.next";
import { resolveDisplayName, randomColor } from "@/lib/presence";
import { markdownHighlightStyle } from "@/components/notes/markdownHighlightStyle";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "offline";

export type PresenceUser = {
  clientId: number;
  name: string;
  color: string;
  photoURL: string | null;
  isLocal: boolean;
};

function readPeers(awareness: Awareness): PresenceUser[] {
  const localClientId = awareness.doc.clientID;
  return Array.from(awareness.getStates().entries())
    .filter(([, state]) => state.user)
    .map(([clientId, state]) => ({
      clientId,
      name: state.user.name,
      color: state.user.color,
      photoURL: state.user.photoURL ?? null,
      isLocal: clientId === localClientId,
    }));
}

// Collaborative markdown editor - CodeMirror6 bound to a Yjs doc synced via
// ysocket (LiveCode's y-websocket relay). Only mounted once a note is
// published (see app/notes/[id]/page.tsx) - `room` is the note's
// externalDocId in LiveCode, not helm's own note id. Text key
// ("codemirror") must match backend/src/services/notesCollab.ts's seed.
export function useYjsEditor(wsUrl: string, room: string, user: User | null) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [synced, setSynced] = useState(false);
  const [peers, setPeers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    // Sign-in is required app-wide (see AuthGate) so `user` should always be
    // non-null by the time this hook mounts - but the check stays defensive
    // since this hook has no way to enforce that itself.
    if (!user) return;

    (async () => {
      const token = await user.getIdToken();
      if (cancelled) return;

      const ydoc = new Y.Doc();
      const provider = new WebsocketProvider(wsUrl, room, ydoc, {
        params: { token },
      });
      const ytext = ydoc.getText("codemirror");
      const { awareness } = provider;

      let hasConnectedOnce = false;

      // 'sync' fires on every (re)sync, not just the first - the loading
      // state needs to clear again after a reconnect, not just once.
      provider.on("sync", (isSynced: boolean) => setSynced(isSynced));

      awareness.setLocalStateField("user", {
        name: resolveDisplayName(user),
        color: randomColor(),
        photoURL: user.photoURL,
      });

      const applyWsStatus = (wsStatus: string) => {
        if (!navigator.onLine) return;
        if (wsStatus === "connected") {
          hasConnectedOnce = true;
          setStatus("connected");
        } else if (wsStatus === "connecting") {
          setStatus(hasConnectedOnce ? "reconnecting" : "connecting");
        } else {
          setSynced(false);
          setStatus(hasConnectedOnce ? "reconnecting" : "connecting");
        }
      };

      provider.on("status", ({ status }: { status: string }) => applyWsStatus(status));

      const goOffline = () => {
        setSynced(false);
        setStatus("offline");
      };
      const goOnline = () => applyWsStatus(provider.wsconnected ? "connected" : "connecting");
      window.addEventListener("offline", goOffline);
      window.addEventListener("online", goOnline);
      if (!navigator.onLine) queueMicrotask(goOffline);

      const observer = () => setContent(ytext.toString());
      ytext.observe(observer);
      queueMicrotask(observer);

      const awarenessListener = () => setPeers(readPeers(awareness));
      awareness.on("change", awarenessListener);
      queueMicrotask(awarenessListener);

      const view = new EditorView({
        doc: ytext.toString(),
        extensions: [
          basicSetup,
          markdown(),
          syntaxHighlighting(markdownHighlightStyle),
          EditorView.lineWrapping,
          yCollab(ytext, awareness),
          EditorView.theme({
            "&": { height: "100%", backgroundColor: "transparent" },
            "&.cm-focused": { outline: "none" },
            ".cm-scroller": {
              overflow: "auto",
              fontFamily: "var(--font-plex-mono), monospace",
              fontSize: "0.9rem",
            },
            ".cm-content": { padding: "0", caretColor: "var(--clay)" },
            ".cm-gutters": { display: "none" },
          }),
        ],
        parent: editorContainerRef.current!,
      });

      cleanup = () => {
        window.removeEventListener("offline", goOffline);
        window.removeEventListener("online", goOnline);
        ytext.unobserve(observer);
        awareness.off("change", awarenessListener);
        view.destroy();
        provider.destroy();
        ydoc.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [wsUrl, room, user]);

  return { editorContainerRef, content, status, synced, peers };
}
