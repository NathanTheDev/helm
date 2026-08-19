// Shared between AuthGate (which routes bypass the sign-in requirement) and
// NavBar (which routes get the minimal auth-page header instead of the full
// nav) - both need the exact same set, so it lives in one place.
export const AUTH_PATHS = new Set(["/login", "/signup", "/forgot-password", "/reset-password"]);
