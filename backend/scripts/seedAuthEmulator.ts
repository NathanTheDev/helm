import "dotenv/config";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { DEFAULT_USER_ID } from "../src/constants";

// Fixed uid so this account's Firebase UID matches DEFAULT_USER_ID, the
// placeholder userId prisma/seed.ts writes demo rows under - signing in as
// this account is the only way to see that seeded data in the app.
export const DEMO_EMAIL = "demo@helm.dev";
export const DEMO_PASSWORD = "helm-demo-1234";

async function main() {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.error(
      "FIREBASE_AUTH_EMULATOR_HOST is not set - refusing to run against a " +
        "real Firebase project. Start the emulator and set it (see " +
        "backend/.env.example) first.",
    );
    process.exit(1);
  }

  const app = initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || "helm-dev-stub",
  });
  const auth = getAuth(app);

  try {
    await auth.createUser({
      uid: DEFAULT_USER_ID,
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      emailVerified: true,
    });
    console.log(`Created emulator account ${DEMO_EMAIL} (uid: ${DEFAULT_USER_ID}).`);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "auth/uid-already-exists" || code === "auth/email-already-exists") {
      console.log(`Emulator account ${DEMO_EMAIL} (uid: ${DEFAULT_USER_ID}) already exists.`);
    } else {
      throw e;
    }
  }

  console.log(
    `Sign in at /login with ${DEMO_EMAIL} / ${DEMO_PASSWORD} to see seeded demo data (npm run db:seed).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
