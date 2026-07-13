"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isDismissedPopupError, mapSocialSignInError } from "@/lib/auth-errors";

export function SocialSignInButtons({ onError }: { onError: (message: string) => void }) {
  const router = useRouter();
  const [pending, setPending] = useState<"google" | "github" | null>(null);

  async function handleSignIn(
    provider: GoogleAuthProvider | GithubAuthProvider,
    kind: "google" | "github",
  ) {
    onError("");
    setPending(kind);
    try {
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (err) {
      if (!isDismissedPopupError(err)) {
        onError(await mapSocialSignInError(auth, err));
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <div className="h-px flex-1 bg-line" />
        or
        <div className="h-px flex-1 bg-line" />
      </div>
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => handleSignIn(new GoogleAuthProvider(), "google")}
        className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-clay-soft/40 disabled:opacity-50"
      >
        {pending === "google" ? "Continuing…" : "Continue with Google"}
      </button>
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => handleSignIn(new GithubAuthProvider(), "github")}
        className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-clay-soft/40 disabled:opacity-50"
      >
        {pending === "github" ? "Continuing…" : "Continue with GitHub"}
      </button>
    </div>
  );
}
