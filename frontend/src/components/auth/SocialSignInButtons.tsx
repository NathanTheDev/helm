"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isDismissedPopupError, mapSocialSignInError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/Button";

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
      <Button
        variant="outline"
        size="lg"
        disabled={pending !== null}
        onClick={() => handleSignIn(new GoogleAuthProvider(), "google")}
      >
        {pending === "google" ? "Continuing…" : "Continue with Google"}
      </Button>
      <Button
        variant="outline"
        size="lg"
        disabled={pending !== null}
        onClick={() => handleSignIn(new GithubAuthProvider(), "github")}
      >
        {pending === "github" ? "Continuing…" : "Continue with GitHub"}
      </Button>
    </div>
  );
}
