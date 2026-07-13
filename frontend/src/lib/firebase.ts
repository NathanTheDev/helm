import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

// STUB: no real Firebase project exists yet. `initializeApp` doesn't
// validate credentials, so these placeholders let the app boot and render
// without a .env.local. Actual sign-in/sign-up calls fail until real values
// are supplied via NEXT_PUBLIC_FIREBASE_* env vars (see .env.example) - or
// until FIREBASE_AUTH_EMULATOR_HOST points at the local Auth Emulator below.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "stub-api-key",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "stub-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "stub-project",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "stub-app-id",
};

// getApps() guard avoids a duplicate-app error across Next's dev-mode
// module re-evaluation (fast refresh / server+client module instances).
export const firebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

// Local-dev-only escape hatch: with no real Firebase project, this is what
// lets sign up/in/out be exercised end-to-end against the Firebase Auth
// Emulator instead of real Firebase. Never set this outside local dev.
const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
if (process.env.NODE_ENV !== "production" && emulatorHost) {
  connectAuthEmulator(auth, `http://${emulatorHost}`, { disableWarnings: true });
}
