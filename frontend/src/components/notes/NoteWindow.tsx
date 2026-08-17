"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createNote, updateNote } from "@/lib/notesApi";
import { useNoteWindow, DEFAULT_WINDOW_SIZE, type NoteWindowMode } from "@/lib/note-window-context";
import { MarkdownEditor } from "@/components/notes/MarkdownEditor";
import { IconButton } from "@/components/ui/Button";
import {
  CloseIcon,
  CollapseIcon,
  DockLeftIcon,
  DockRightIcon,
  ExpandIcon,
  GripIcon,
} from "@/components/ui/Icon";

const AUTOSAVE_DELAY_MS = 800;
// Below NavBar's own sticky z-10, dropdown menus at z-20 - this needs to sit
// above both so it's reachable no matter what page/menu is open underneath.
const Z_FLOATING = "z-30";
const Z_FULLSCREEN = "z-40";
// Approximate NavBar height (py-4 + content + border) - docked mode sits
// below it so navigation stays usable while a note is docked.
const NAVBAR_OFFSET = 64;
const VIEWPORT_MARGIN = 12;

type SaveState = "idle" | "saving" | "saved" | "error";

export function NoteWindow() {
  const win = useNoteWindow();
  if (!win.open) return null;
  return <NoteWindowChrome />;
}

function NoteWindowChrome() {
  const router = useRouter();
  const { title, content, mode, position, size, minSize, noteId, close, setMode, setPosition, setSize, setTitle, setContent, setNoteId } =
    useNoteWindow();

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const rootRef = useRef<HTMLDivElement>(null);

  const noteIdRef = useRef<string | null>(null);
  const latestRef = useRef({ title, content });
  useEffect(() => {
    latestRef.current = { title, content };
  }, [title, content]);

  // Keeps a floating window on-screen when the viewport shrinks (resize,
  // rotation) - otherwise geometry sized/positioned for a wider viewport can
  // leave it stranded off-screen with no way to reach it. Also runs once on
  // mount to clamp stale geometry left over from a previous, wider session.
  useEffect(() => {
    if (mode !== "floating") return;
    function clamp() {
      const maxW = window.innerWidth - VIEWPORT_MARGIN * 2;
      const maxH = window.innerHeight - NAVBAR_OFFSET - VIEWPORT_MARGIN;
      const nextSize = {
        width: Math.min(size.width, Math.max(maxW, minSize.width)),
        height: Math.min(size.height, Math.max(maxH, minSize.height)),
      };
      if (nextSize.width !== size.width || nextSize.height !== size.height) setSize(nextSize);
      if (position) {
        const maxX = window.innerWidth - nextSize.width - VIEWPORT_MARGIN;
        const maxY = window.innerHeight - nextSize.height - VIEWPORT_MARGIN;
        const nextPos = {
          x: Math.min(Math.max(position.x, VIEWPORT_MARGIN), Math.max(maxX, VIEWPORT_MARGIN)),
          y: Math.min(Math.max(position.y, NAVBAR_OFFSET), Math.max(maxY, NAVBAR_OFFSET)),
        };
        if (nextPos.x !== position.x || nextPos.y !== position.y) setPosition(nextPos);
      }
    }
    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [mode, position, size, minSize, setPosition, setSize]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creatingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  function scheduleSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveState("saving");
    saveTimerRef.current = setTimeout(async () => {
      const next = latestRef.current;
      if (!next.title.trim() && !next.content.trim()) {
        setSaveState("idle");
        return;
      }
      try {
        if (!noteIdRef.current) {
          if (creatingRef.current) return;
          creatingRef.current = true;
          const note = await createNote({ title: next.title.trim() || undefined, content: next.content });
          noteIdRef.current = note.id;
          setNoteId(note.id);
          creatingRef.current = false;
        } else {
          await updateNote(noteIdRef.current, next);
        }
        setSaveState("saved");
      } catch {
        creatingRef.current = false;
        setSaveState("error");
      }
    }, AUTOSAVE_DELAY_MS);
  }

  function handleOpenFullPage() {
    if (noteId) router.push(`/notes/${noteId}`);
    close();
  }

  // Dragging the title bar always lands in floating mode, seeded from
  // wherever the window currently sits on screen (docked or anchored to a
  // corner) so it doesn't jump before following the pointer.
  function handleDragStart(e: React.PointerEvent) {
    if (mode === "fullscreen") return;
    // Don't hijack clicks on the toolbar buttons - capturing the pointer
    // here retargets their subsequent click event away from the button.
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    if (mode !== "floating") setMode("floating");
    setPosition({ x: rect.left, y: Math.max(rect.top, NAVBAR_OFFSET) });

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    function onMove(ev: PointerEvent) {
      const maxX = window.innerWidth - (rootRef.current?.offsetWidth ?? size.width) - VIEWPORT_MARGIN;
      const maxY = window.innerHeight - (rootRef.current?.offsetHeight ?? size.height) - VIEWPORT_MARGIN;
      setPosition({
        x: Math.min(Math.max(ev.clientX - offsetX, VIEWPORT_MARGIN), Math.max(maxX, VIEWPORT_MARGIN)),
        // Keep the title bar below NavBar so it's never fully covered and
        // stranded - the window can still cover nav horizontally, just not
        // slide up over it.
        y: Math.min(Math.max(ev.clientY - offsetY, NAVBAR_OFFSET), Math.max(maxY, NAVBAR_OFFSET)),
      });
    }
    function onUp() {
      target.releasePointerCapture(e.pointerId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function handleResizeStart(e: React.PointerEvent) {
    if (mode !== "floating") return;
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = { ...size };
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    function onMove(ev: PointerEvent) {
      const rect = rootRef.current?.getBoundingClientRect();
      const originX = rect?.left ?? 0;
      const originY = rect?.top ?? 0;
      setSize({
        width: Math.min(
          Math.max(startSize.width + (ev.clientX - startX), minSize.width),
          window.innerWidth - originX - VIEWPORT_MARGIN,
        ),
        height: Math.min(
          Math.max(startSize.height + (ev.clientY - startY), minSize.height),
          window.innerHeight - originY - VIEWPORT_MARGIN,
        ),
      });
    }
    function onUp() {
      target.releasePointerCapture(e.pointerId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function toggleMode(next: NoteWindowMode) {
    setMode(mode === next ? "floating" : next);
  }

  const style = geometryStyle(mode, position, size);
  const saveLabel =
    saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Couldn't save" : "";

  return (
    <div
      ref={rootRef}
      style={style}
      className={`fixed flex flex-col overflow-hidden border border-line bg-surface shadow-lg ${
        mode === "fullscreen" ? `${Z_FULLSCREEN} rounded-none` : `${Z_FLOATING} rounded-card`
      }`}
    >
      <div
        onPointerDown={handleDragStart}
        className={`flex shrink-0 select-none items-center gap-2 border-b border-line bg-paper/70 px-3 py-2 ${
          mode === "floating" ? "cursor-move" : ""
        }`}
      >
        {mode === "floating" && <GripIcon className="h-3.5 w-3.5 shrink-0 text-ink-muted/60" />}
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink-muted">
          {title.trim() || "New note"}
        </span>
        <span className="shrink-0 font-mono text-[11px] text-ink-muted">{saveLabel}</span>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton
            aria-label="Dock left"
            title="Dock left"
            className="p-1"
            tone={mode === "docked-left" ? "active" : "muted"}
            onClick={() => toggleMode("docked-left")}
          >
            <DockLeftIcon />
          </IconButton>
          <IconButton
            aria-label="Dock right"
            title="Dock right"
            className="p-1"
            tone={mode === "docked-right" ? "active" : "muted"}
            onClick={() => toggleMode("docked-right")}
          >
            <DockRightIcon />
          </IconButton>
          <IconButton
            aria-label={mode === "fullscreen" ? "Exit full screen" : "Full screen"}
            title={mode === "fullscreen" ? "Exit full screen" : "Full screen"}
            className="p-1"
            tone={mode === "fullscreen" ? "active" : "muted"}
            onClick={() => toggleMode("fullscreen")}
          >
            {mode === "fullscreen" ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
          <IconButton aria-label="Close" title="Close" className="p-1" onClick={close}>
            <CloseIcon />
          </IconButton>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <input
          type="text"
          placeholder="Untitled note"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            scheduleSave();
          }}
          className="w-full shrink-0 bg-transparent font-display text-xl italic text-ink placeholder:text-ink-muted/60 focus:outline-none"
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-auto">
          <MarkdownEditor
            initialContent=""
            onChange={(next) => {
              setContent(next);
              scheduleSave();
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleOpenFullPage}
          disabled={!noteId}
          className="shrink-0 self-start text-xs text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
        >
          Open full page →
        </button>
      </div>

      {mode === "floating" && (
        <div
          onPointerDown={handleResizeStart}
          aria-hidden
          className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
        >
          <svg viewBox="0 0 16 16" className="h-full w-full text-ink-muted/40">
            <path d="M14 2 2 14M14 8 8 14M14 14v0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

function geometryStyle(
  mode: NoteWindowMode,
  position: { x: number; y: number } | null,
  size: { width: number; height: number },
): React.CSSProperties {
  if (mode === "fullscreen") {
    return { top: 0, left: 0, right: 0, bottom: 0 };
  }
  if (mode === "docked-left") {
    return { top: NAVBAR_OFFSET, left: 0, bottom: 0, width: "min(32rem, 42vw)" };
  }
  if (mode === "docked-right") {
    return { top: NAVBAR_OFFSET, right: 0, bottom: 0, width: "min(32rem, 42vw)" };
  }
  if (position) {
    return { left: position.x, top: position.y, width: size.width, height: size.height };
  }
  // No drag yet this session - anchor to the bottom-right corner like a
  // compose widget, sized from context defaults.
  return {
    right: VIEWPORT_MARGIN * 2,
    bottom: VIEWPORT_MARGIN * 2,
    width: size.width || DEFAULT_WINDOW_SIZE.width,
    height: size.height || DEFAULT_WINDOW_SIZE.height,
  };
}
