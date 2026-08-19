"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { mapSignUpError } from "@/lib/auth-errors";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password should be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err) {
      setError(mapSignUpError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="font-display text-2xl italic text-ink">Create account</h1>
      <p className="mt-1.5 text-sm text-ink-muted">Get your space set up.</p>
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
        <PasswordField value={password} onChange={setPassword} autoComplete="new-password" />
        <Button type="submit" size="lg" className="mt-1" disabled={submitting}>
          {submitting ? "Creating account…" : "Sign up"}
        </Button>
        <SocialSignInButtons onError={setError} />
      </form>
      <p className="mt-6 border-t border-line pt-5 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-ink hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
