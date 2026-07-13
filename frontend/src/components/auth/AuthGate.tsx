"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useRequireAuth } from "@/lib/auth-context";

const PUBLIC_PATHS = new Set(["/login", "/signup"]);

// Sign-in is required app-wide except for the auth pages themselves (which
// would otherwise redirect-loop against themselves).
export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (PUBLIC_PATHS.has(pathname)) return <>{children}</>;
  return <Gated>{children}</Gated>;
}

function Gated({ children }: { children: ReactNode }) {
  const { user, loading } = useRequireAuth();
  if (loading || !user) return null;
  return <>{children}</>;
}
