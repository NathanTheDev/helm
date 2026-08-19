"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { mapForgotPasswordError } from "@/lib/auth-errors";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      });
    } catch (err) {
      setError(mapForgotPasswordError(err));
      setSubmitting(false);
      return;
    }
    // Always land on the same confirmation regardless of whether the
    // address has an account - mapForgotPasswordError already collapses
    // the error case the same way for enumeration resistance.
    setSent(true);
    setSubmitting(false);
  }

  if (sent) {
    return (
      <AuthShell>
        <h1 className="font-display text-2xl italic text-ink">Check your email</h1>
        <p className="mt-3 text-sm text-ink-muted">
          If an account exists for <span className="text-ink">{email}</span>, we&rsquo;ve sent a
          link to reset your password.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-ink-muted hover:text-ink"
        >
          ← Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="font-display text-2xl italic text-ink">Reset password</h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        Enter your email and we&rsquo;ll send you a link to get back in.
      </p>
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
        <Button type="submit" size="lg" className="mt-1" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 border-t border-line pt-5 text-center text-sm text-ink-muted">
        <Link href="/login" className="text-ink hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
