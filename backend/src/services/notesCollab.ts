import * as Y from "yjs";

const NOTES_BACKEND_URL = process.env.NOTES_BACKEND_URL ?? "http://localhost:3000";
const NOTES_INTERNAL_API_KEY =
  process.env.NOTES_INTERNAL_API_KEY ?? "livecode-dev-stub-internal-key";

// Builds the initial Yjs state a fresh LiveCode note is seeded with. Text
// key ("codemirror") must match the one the collaborative editor binds to
// (frontend/src/hooks/useYjsEditor.ts) - LiveCode's ydoc has no notion of
// "plain content", only this CRDT text.
export function buildYjsSeed(content: string): Buffer {
  const ydoc = new Y.Doc();
  ydoc.getText("codemirror").insert(0, content);
  return Buffer.from(Y.encodeStateAsUpdate(ydoc));
}

// Decodes a raw Yjs update (as returned by LiveCode's GET /notes/:id) back
// into the plain text content helm stores - used when closing a published
// note's link (see the close-link phase).
export function decodeYjsContent(update: Buffer): string {
  const ydoc = new Y.Doc();
  if (update.length > 0) Y.applyUpdate(ydoc, update);
  return ydoc.getText("codemirror").toString();
}

interface ExternalNote {
  id: string;
  is_active: boolean;
}

// Creates the collaborative session document in LiveCode, seeded with the
// note's current content. Called once, when publishing.
export async function createExternalNote(content: string): Promise<ExternalNote> {
  const res = await fetch(`${NOTES_BACKEND_URL}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-Internal-Key": NOTES_INTERNAL_API_KEY,
    },
    body: buildYjsSeed(content),
  });
  if (!res.ok) {
    throw new Error(`Failed to create collaborative note: ${res.status}`);
  }
  return (await res.json()) as ExternalNote;
}
