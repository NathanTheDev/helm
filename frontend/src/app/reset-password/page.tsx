"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { mapResetPasswordError } from "@/lib/auth-errors";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button, LinkButton } from "@/components/ui/Button";

const MIN_PASSWORD_LENGTH = 6;

type CodeState =
  | { status: "checking" }
  | { status: "valid"; email: string }
  | { status: "invalid"; message: string }
  | { status: "done" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const [state, setState] = useState<CodeState>({ status: "checking" });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setState({ status: "invalid", message: "This reset link is missing its code." });
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => setState({ status: "valid", email }))
      .catch((err) => setState({ status: "invalid", message: mapResetPasswordError(err) }));
  }, [oobCode]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!oobCode) return;
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password should be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setState({ status: "done" });
    } catch (err) {
      setError(mapResetPasswordError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (state.status === "checking") return null;

  if (state.status === "invalid") {
    return (
      <AuthShell>
        <h1 className="font-display text-2xl italic text-ink">Link expired</h1>
        <p className="mt-3 text-sm text-ink-muted">{state.message}</p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm text-ink-muted hover:text-ink"
        >
          ← Request a new link
        </Link>
      </AuthShell>
    );
  }

  if (state.status === "done") {
    return (
      <AuthShell>
        <h1 className="font-display text-2xl italic text-ink">Password reset</h1>
        <p className="mt-3 text-sm text-ink-muted">
          Your password has been updated. You can now sign in with your new password.
        </p>
        <LinkButton href="/login" variant="primary" size="lg" className="mt-6 block w-full text-center">
          Sign in
        </LinkButton>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="font-display text-2xl italic text-ink">Set a new password</h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        Resetting the password for <span className="text-ink">{state.email}</span>.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        {error && <p className="text-sm text-clay-text">{error}</p>}
        <PasswordField
          value={password}
          onChange={setPassword}
          placeholder="New password"
          autoComplete="new-password"
        />
        <PasswordField
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Confirm new password"
          autoComplete="new-password"
        />
        <Button type="submit" size="lg" className="mt-1" disabled={submitting}>
          {submitting ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </AuthShell>
  );
}
