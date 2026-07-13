import { FirebaseError } from "firebase/app";
import { fetchSignInMethodsForEmail, type Auth } from "firebase/auth";

// Maps Firebase Auth error codes to user-facing copy. Sign-in errors are
// intentionally collapsed to one generic message so a failed attempt can't
// be used to enumerate which emails have accounts.
//
// Signup's "email already in use" is a partial exception: Firebase's client
// SDK has no built-in way to create an account without confirming a
// collision, so full enumeration-resistance isn't achievable here without a
// different flow (e.g. email-link / OTP). Accepted tradeoff, not solved.
export function mapSignInError(): string {
  return "Invalid email or password.";
}

export function mapSignUpError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/email-already-in-use":
        return "An account with this email already exists. Try signing in instead.";
    }
  }
  return "Something went wrong. Please try again.";
}

const SOCIAL_PROVIDER_LABELS: Record<string, string> = {
  password: "email and password",
  "google.com": "Google",
  "github.com": "GitHub",
};

// The popup was dismissed (closed by the user, or a second click fired a
// duplicate request) - not a real failure, so callers should just reset
// their loading state without showing an error.
export function isDismissedPopupError(error: unknown): boolean {
  return (
    error instanceof FirebaseError &&
    (error.code === "auth/popup-closed-by-user" ||
      error.code === "auth/cancelled-popup-request")
  );
}

// Signing up with email/password, then signing in with Google/GitHub using
// the same email, should "behave intentionally" rather than silently create
// a duplicate account. Firebase's default "one account per email address"
// project setting is what actually enforces this - it rejects the second
// provider with `auth/account-exists-with-different-credential`. This just
// turns that rejection into an actionable message instead of a raw error dump.
export async function mapSocialSignInError(auth: Auth, error: unknown): Promise<string> {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/account-exists-with-different-credential") {
      const email = (error.customData?.email as string | undefined) ?? undefined;
      if (email) {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        const label = methods.map((m) => SOCIAL_PROVIDER_LABELS[m] ?? m).join(" or ");
        if (label) {
          return `An account with this email already exists. Sign in with ${label} instead.`;
        }
      }
      return "An account with this email already exists using a different sign-in method.";
    }
    if (error.code === "auth/popup-blocked") {
      return "Your browser blocked the sign-in popup. Allow popups for this site and try again.";
    }
  }
  return "Something went wrong signing in. Please try again.";
}
