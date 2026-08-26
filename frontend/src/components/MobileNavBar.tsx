"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { MenuIcon, PencilIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { DEFAULT_SPACE_NAME, readSpaceName, writeSpaceName } from "@/lib/space-name";

const links = [
  { href: "/notes", label: "Notes" },
  { href: "/habits", label: "Habits" },
  { href: "/projects", label: "Projects" },
  { href: "/tables", label: "Tables" },
  { href: "/brain", label: "Brain" },
];

// Sub-`sm` screens keep a plain sticky top bar with a hamburger dropdown -
// the resizable left sidebar (Sidebar.tsx) only renders sm+, a drag-to-resize
// panel isn't a useful interaction at phone width.
export function MobileNavBar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
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
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-10 border-b border-line/70 bg-paper/85 backdrop-blur sm:hidden">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg tracking-tight text-ink">
          <span className="inline-block h-2 w-2 rounded-full bg-clay" aria-hidden />
          {spaceName}
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <Link
              href="/notes/new"
              aria-label="New note"
              title="New note"
              className="flex items-center justify-center rounded-control border border-line p-1.5 text-ink-muted transition-colors hover:border-clay hover:text-ink"
            >
              <PencilIcon />
            </Link>
          )}
          <ThemeSwitcher />
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-label="Open menu"
              aria-expanded={open}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line transition-colors hover:border-clay"
            >
              <MenuIcon />
            </button>

            {open && (
              <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-card border border-line bg-surface p-1.5 shadow-md">
                {links.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block rounded-control px-2 py-1.5 text-sm transition-colors ${
                        active ? "text-ink" : "text-ink-muted hover:bg-clay-soft/40 hover:text-ink"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <div className="mt-1 border-t border-line/70 px-2 pt-2">
                  {!loading &&
                    (user ? (
                      <>
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-clay-soft font-display text-xs text-clay"
                            title={user.email ?? undefined}
                          >
                            {(user.displayName ?? user.email ?? "?").charAt(0).toUpperCase()}
                          </div>
                          <button
                            type="button"
                            onClick={() => signOut(auth)}
                            className="text-sm text-ink-muted transition-colors hover:text-ink"
                          >
                            Sign out
                          </button>
                        </div>
                        <label className="mt-2 block text-xs text-ink-muted">
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
                      </>
                    ) : (
                      <Link href="/login" className="text-sm text-ink-muted transition-colors hover:text-ink">
                        Sign in
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
