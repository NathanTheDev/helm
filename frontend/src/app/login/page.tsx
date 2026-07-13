"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { mapSignInError } from "@/lib/auth-errors";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch {
      setError(mapSignInError());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 pb-24">
      <h1 className="font-display text-3xl italic text-ink">Sign in</h1>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
        {error && <p className="text-sm text-clay">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-clay"
        />
        <input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-clay"
        />
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-full bg-clay px-4 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-clay/90 disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        <SocialSignInButtons onError={setError} />
        <p className="mt-2 text-sm text-ink-muted">
          Don&rsquo;t have an account?{" "}
          <Link href="/signup" className="text-ink hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
