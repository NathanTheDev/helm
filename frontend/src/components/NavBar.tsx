"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { MenuIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { DEFAULT_SPACE_NAME, readSpaceName, writeSpaceName } from "@/lib/space-name";

const links = [
  { href: "/notes", label: "Notes" },
  { href: "/habits", label: "Habits" },
  { href: "/projects", label: "Projects" },
  { href: "/tables", label: "Tables" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  // Starts at the SSR-matching default, then swaps to the stored name post-
  // mount - reading localStorage in the lazy initializer would mismatch the
  // server-rendered "Helm" text and trigger a hydration error.
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
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!accountOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) setAccountOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [accountOpen]);

  return (
    <header className="sticky top-0 z-10 border-b border-line/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 sm:px-10">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg tracking-tight text-ink"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-clay" aria-hidden />
          {spaceName}
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  active ? "text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <ThemeSwitcher />
          {!loading &&
            (user ? (
              <div ref={accountMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen((o) => !o)}
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-clay-soft font-display text-sm text-clay transition-colors hover:bg-clay-soft/80"
                  title={user.email ?? undefined}
                >
                  {(user.displayName ?? user.email ?? "?").charAt(0).toUpperCase()}
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-card border border-line bg-surface p-3 shadow-md">
                    {user.email && (
                      <p className="truncate px-1 text-xs text-ink-muted">{user.email}</p>
                    )}
                    <label className="mt-3 block px-1 text-xs text-ink-muted">
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
              <Link
                href="/login"
                className="text-sm text-ink-muted transition-colors hover:text-ink"
              >
                Sign in
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-2 sm:hidden">
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
                        active
                          ? "text-ink"
                          : "text-ink-muted hover:bg-clay-soft/40 hover:text-ink"
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
                      <Link
                        href="/login"
                        className="text-sm text-ink-muted transition-colors hover:text-ink"
                      >
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
