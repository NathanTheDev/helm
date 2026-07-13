"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { mapSignUpError } from "@/lib/auth-errors";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
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
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 pb-24">
      <h1 className="font-display text-3xl italic text-ink">Create account</h1>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
        {error && <p className="text-sm text-clay">{error}</p>}
        <Input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          size="md"
          tone="surface"
        />
        <Input
          type="password"
          placeholder="Password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          size="md"
          tone="surface"
        />
        <Button type="submit" size="lg" className="mt-1" disabled={submitting}>
          {submitting ? "Creating account…" : "Sign up"}
        </Button>
        <SocialSignInButtons onError={setError} />
        <p className="mt-2 text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-ink hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
