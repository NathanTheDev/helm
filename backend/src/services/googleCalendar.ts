import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import { prisma } from "../db/client";
import { encrypt, decrypt } from "../lib/crypto";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const STATE_TTL_MS = 10 * 60 * 1000;

function newOAuthClient(): OAuth2Client {
  return new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  });
}

// Google's redirect back to /oauth/callback is a plain top-level browser
// navigation - no Authorization header, so it can't carry a Firebase ID
// token. `state` is how the callback learns which user started the flow:
// buildAuthUrl (called from an authenticated request) mints one and stashes
// userId here; the callback consumes it once. In-memory is fine at this
// app's scale (single process) - matches other short-lived-map patterns in
// this codebase's sibling services.
const pendingStates = new Map<string, { userId: string; expiresAt: number }>();

function consumeState(state: string): string | null {
  const entry = pendingStates.get(state);
  pendingStates.delete(state);
  if (!entry || entry.expiresAt < Date.now()) {
    return null;
  }
  return entry.userId;
}

export function buildAuthUrl(userId: string): string {
  const state = crypto.randomBytes(24).toString("hex");
  pendingStates.set(state, { userId, expiresAt: Date.now() + STATE_TTL_MS });

  return newOAuthClient().generateAuthUrl({
    access_type: "offline",
    // Forces Google to return a refresh_token even if this user already
    // granted access before (offline access otherwise only issues one on
    // first consent).
    prompt: "consent",
    scope: [CALENDAR_SCOPE],
    state,
  });
}

export async function handleOAuthCallback(
  code: string,
  state: string,
): Promise<{ userId: string } | { error: string }> {
  const userId = consumeState(state);
  if (!userId) {
    return { error: "invalid or expired state" };
  }

  const client = newOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    return { error: "Google did not return the expected tokens" };
  }

  await prisma.googleCalendarConnection.upsert({
    where: { userId },
    create: {
      userId,
      accessTokenEnc: encrypt(tokens.access_token),
      refreshTokenEnc: encrypt(tokens.refresh_token),
      expiryDate: new Date(tokens.expiry_date),
      scope: tokens.scope ?? CALENDAR_SCOPE,
    },
    update: {
      accessTokenEnc: encrypt(tokens.access_token),
      refreshTokenEnc: encrypt(tokens.refresh_token),
      expiryDate: new Date(tokens.expiry_date),
      scope: tokens.scope ?? CALENDAR_SCOPE,
    },
  });

  return { userId };
}

export async function isConnected(userId: string): Promise<boolean> {
  const row = await prisma.googleCalendarConnection.findUnique({ where: { userId } });
  return row !== null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
}

interface GoogleEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

// Returns null if the user has no connection (caller distinguishes
// "never connected" from "connected but zero upcoming events").
export async function getUpcomingEvents(userId: string): Promise<CalendarEvent[] | null> {
  const row = await prisma.googleCalendarConnection.findUnique({ where: { userId } });
  if (!row) {
    return null;
  }

  const client = newOAuthClient();
  client.setCredentials({
    access_token: decrypt(row.accessTokenEnc),
    refresh_token: decrypt(row.refreshTokenEnc),
    expiry_date: row.expiryDate.getTime(),
  });

  // Refreshes under the hood (via the refresh token) if the access token is
  // expired/near-expiry; credentials reflect whatever was actually used.
  const { token: accessToken } = await client.getAccessToken();
  if (!accessToken) {
    throw new Error("Failed to obtain a valid Google access token");
  }
  if (accessToken !== decrypt(row.accessTokenEnc)) {
    await prisma.googleCalendarConnection.update({
      where: { userId },
      data: {
        accessTokenEnc: encrypt(accessToken),
        expiryDate: new Date(client.credentials.expiry_date ?? Date.now()),
      },
    });
  }

  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "10",
  });
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    throw new Error(`Google Calendar API request failed: ${res.status}`);
  }
  const body = (await res.json()) as { items?: GoogleEvent[] };

  return (body.items ?? []).map((event) => {
    const allDay = !event.start?.dateTime;
    return {
      id: event.id,
      title: event.summary ?? "(untitled)",
      startsAt: event.start?.dateTime ?? event.start?.date ?? "",
      endsAt: event.end?.dateTime ?? event.end?.date ?? "",
      allDay,
    };
  });
}

// Best-effort: revokes the refresh token with Google (so the app no longer
// shows up under the user's "third-party access" list) and always deletes
// the local row regardless of whether the revoke call succeeds.
export async function disconnect(userId: string): Promise<void> {
  const row = await prisma.googleCalendarConnection.findUnique({ where: { userId } });
  if (row) {
    try {
      await newOAuthClient().revokeToken(decrypt(row.refreshTokenEnc));
    } catch (err) {
      console.error(`Failed to revoke Google token for user ${userId}:`, err);
    }
  }
  await prisma.googleCalendarConnection.deleteMany({ where: { userId } });
}
