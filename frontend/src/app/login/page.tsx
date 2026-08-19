"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { mapSignInError } from "@/lib/auth-errors";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
    <AuthShell>
      <h1 className="font-display text-2xl italic text-ink">Sign in</h1>
      <p className="mt-1.5 text-sm text-ink-muted">Welcome back.</p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        {error && <p className="text-sm text-clay-text">{error}</p>}
        <Input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          size="md"
          tone="paper"
        />
        <PasswordField value={password} onChange={setPassword} autoComplete="current-password" />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-ink-muted hover:text-ink">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="mt-1" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
        <SocialSignInButtons onError={setError} />
      </form>
      <p className="mt-6 border-t border-line pt-5 text-center text-sm text-ink-muted">
        Don&rsquo;t have an account?{" "}
        <Link href="/signup" className="text-ink hover:underline">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
