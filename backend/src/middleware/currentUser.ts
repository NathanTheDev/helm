import type { NextFunction, Request, Response } from "express";
import { initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
if (!FIREBASE_PROJECT_ID) {
  console.warn(
    "WARNING: FIREBASE_PROJECT_ID not set - using dev stub. Every request " +
      "will be rejected until a real (or emulated, via FIREBASE_AUTH_EMULATOR_HOST) " +
      "Firebase project is configured.",
  );
}
const app = initializeApp({ projectId: FIREBASE_PROJECT_ID || "helm-dev-stub" });

// Mirrors ysocket's verifyToken in LiveCode: never throws, so missing/
// malformed/expired/wrong-project tokens are all rejected identically below.
async function verifyToken(token: string): Promise<DecodedIdToken | null> {
  try {
    return await getAuth(app).verifyIdToken(token);
  } catch {
    return null;
  }
}

export async function currentUser(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) {
    return res.status(401).json({ error: "missing bearer token" });
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "invalid token" });
  }

  req.userId = decoded.uid;
  next();
}
