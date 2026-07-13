"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const links = [
  { href: "/notes", label: "Notes" },
  { href: "/habits", label: "Habits" },
  { href: "/projects", label: "Projects" },
  { href: "/worklog", label: "Worklog" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-line/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 sm:px-10">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg tracking-tight text-ink"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-clay" aria-hidden />
          Helm
        </Link>

        <nav className="flex items-center gap-6">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  active
                    ? "text-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <ThemeSwitcher />
          {!loading &&
            (user ? (
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-clay-soft font-display text-sm text-clay"
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
            ) : (
              <Link
                href="/login"
                className="text-sm text-ink-muted transition-colors hover:text-ink"
              >
                Sign in
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
