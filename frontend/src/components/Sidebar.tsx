"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { PencilIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { IconButton } from "@/components/ui/Button";
import { DEFAULT_SPACE_NAME, readSpaceName, writeSpaceName } from "@/lib/space-name";
import { useNoteWindow } from "@/lib/note-window-context";

const links = [
  { href: "/notes", label: "Notes" },
  { href: "/habits", label: "Habits" },
  { href: "/projects", label: "Projects" },
  { href: "/tables", label: "Tables" },
  { href: "/brain", label: "Brain" },
];

// Desktop-only vertical nav, rendered inside AppShell's resizable sidebar
// Panel. Mobile has its own top-bar equivalent - see MobileNavBar.tsx.
export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { openNewNote } = useNoteWindow();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [spaceName, setSpaceName] = useState(DEFAULT_SPACE_NAME);

  function commitSpaceName(next: string) {
    const trimmed = next.trim() || DEFAULT_SPACE_NAME;
    writeSpaceName(trimmed);
    setSpaceName(trimmed);
  }

  useEffect(() => {
    setSpaceName(readSpaceName());
  }, []);

  useEffect(() => {
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) setAccountOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [accountOpen]);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-paper px-4 py-5">
      <div className="flex items-center justify-between gap-2">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-display text-lg tracking-tight text-ink">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-clay" aria-hidden />
          <span className="truncate">{spaceName}</span>
        </Link>
        {user && (
          <IconButton
            aria-label="New note"
            title="New note"
            onClick={openNewNote}
            className="shrink-0 rounded-control border border-line p-1.5 hover:border-clay"
          >
            <PencilIcon />
          </IconButton>
        )}
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`truncate rounded-control px-3 py-2 text-sm transition-colors ${
                active ? "bg-clay-soft/40 text-ink" : "text-ink-muted hover:bg-clay-soft/20 hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-line/70 pt-4">
        <ThemeSwitcher />
        {!loading &&
          (user ? (
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((o) => !o)}
                aria-label="Account menu"
                aria-expanded={accountOpen}
                className="flex w-full min-w-0 items-center gap-2 rounded-control px-1 py-1 text-left transition-colors hover:bg-clay-soft/20"
                title={user.email ?? undefined}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clay-soft font-display text-sm text-clay">
                  {(user.displayName ?? user.email ?? "?").charAt(0).toUpperCase()}
                </span>
                <span className="truncate text-sm text-ink-muted">{user.email}</span>
              </button>

              {accountOpen && (
                <div className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded-card border border-line bg-surface p-3 shadow-md">
                  <label className="block px-1 text-xs text-ink-muted">
                    Space name
                    <Input
                      defaultValue={spaceName}
                      onBlur={(e) => commitSpaceName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                      className="mt-1 w-full"
                      size="sm"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => signOut(auth)}
                    className="mt-3 w-full rounded-control px-1 py-1.5 text-left text-sm text-ink-muted transition-colors hover:bg-clay-soft/40 hover:text-ink"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-sm text-ink-muted transition-colors hover:text-ink">
              Sign in
            </Link>
          ))}
      </div>
    </div>
  );
}
