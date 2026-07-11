"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/habits", label: "Habits" },
  { href: "/projects", label: "Projects" },
];

export default function NavBar() {
  const pathname = usePathname();

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
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-clay-soft font-display text-sm text-clay"
            title="Nathan"
          >
            N
          </div>
        </nav>
      </div>
    </header>
  );
}
