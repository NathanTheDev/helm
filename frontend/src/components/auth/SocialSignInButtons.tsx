"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isDismissedPopupError, mapSocialSignInError } from "@/lib/auth-errors";
import { GithubIcon, GoogleIcon } from "@/components/ui/Icon";

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
        className="flex items-center justify-center gap-3 rounded-pill border border-[#747775] bg-white px-4 py-2.5 text-sm font-medium text-[#1f1f1f] transition-shadow hover:shadow-[0_1px_2px_0_rgba(60,64,67,0.30),0_1px_3px_1px_rgba(60,64,67,0.15)] active:bg-[#f7f8f8] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GoogleIcon className="h-[18px] w-[18px] shrink-0" />
        {pending === "google" ? "Continuing…" : "Continue with Google"}
      </button>
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => handleSignIn(new GithubAuthProvider(), "github")}
        className="flex items-center justify-center gap-3 rounded-pill bg-[#24292f] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#32383f] active:bg-[#1b1f23] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GithubIcon className="h-[18px] w-[18px] shrink-0" />
        {pending === "github" ? "Continuing…" : "Continue with GitHub"}
      </button>
    </div>
  );
}
