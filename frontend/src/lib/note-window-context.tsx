"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type NoteWindowMode = "floating" | "docked-left" | "docked-right" | "fullscreen";

export const DEFAULT_WINDOW_SIZE = { width: 480, height: 560 };
const MIN_WINDOW_SIZE = { width: 340, height: 320 };

export type NoteWindowState = {
  open: boolean;
  noteId: string | null;
  title: string;
  content: string;
  mode: NoteWindowMode;
  // Floating-mode geometry only - docked/fullscreen compute their own via CSS.
  // null until the user drags/resizes for the first time, so the window can
  // start anchored to a screen corner instead of a hardcoded pixel spot.
  position: { x: number; y: number } | null;
  size: { width: number; height: number };
};

type NoteWindowContextValue = NoteWindowState & {
  openNewNote: () => void;
  close: () => void;
  setMode: (mode: NoteWindowMode) => void;
  setPosition: (position: { x: number; y: number }) => void;
  setSize: (size: { width: number; height: number }) => void;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setNoteId: (id: string) => void;
  minSize: typeof MIN_WINDOW_SIZE;
};

const initialState: NoteWindowState = {
  open: false,
  noteId: null,
  title: "",
  content: "",
  mode: "floating",
  position: null,
  size: DEFAULT_WINDOW_SIZE,
};

const NoteWindowContext = createContext<NoteWindowContextValue | null>(null);

export function NoteWindowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NoteWindowState>(initialState);

  const openNewNote = useCallback(() => {
    // Always starts a blank draft - reopening after a close is a fresh note,
    // not a resume of whatever was last open. Keeps the last floating
    // position/size/mode so the window doesn't jump around between uses.
    setState((s) => ({
      ...s,
      open: true,
      noteId: null,
      title: "",
      content: "",
    }));
  }, []);

  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  const setMode = useCallback((mode: NoteWindowMode) => setState((s) => ({ ...s, mode })), []);
  const setPosition = useCallback(
    (position: { x: number; y: number }) => setState((s) => ({ ...s, position })),
    [],
  );
  const setSize = useCallback(
    (size: { width: number; height: number }) => setState((s) => ({ ...s, size })),
    [],
  );
  const setTitle = useCallback((title: string) => setState((s) => ({ ...s, title })), []);
  const setContent = useCallback((content: string) => setState((s) => ({ ...s, content })), []);
  const setNoteId = useCallback((noteId: string) => setState((s) => ({ ...s, noteId })), []);

  const value = useMemo<NoteWindowContextValue>(
    () => ({
      ...state,
      openNewNote,
      close,
      setMode,
      setPosition,
      setSize,
      setTitle,
      setContent,
      setNoteId,
      minSize: MIN_WINDOW_SIZE,
    }),
    [state, openNewNote, close, setMode, setPosition, setSize, setTitle, setContent, setNoteId],
  );

  return <NoteWindowContext.Provider value={value}>{children}</NoteWindowContext.Provider>;
}

export function useNoteWindow(): NoteWindowContextValue {
  const ctx = useContext(NoteWindowContext);
  if (!ctx) throw new Error("useNoteWindow must be used within a NoteWindowProvider");
  return ctx;
}
