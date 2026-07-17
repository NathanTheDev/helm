import crypto from "crypto";

// Encrypts secrets we have to persist at rest (currently: Google Calendar
// OAuth tokens) - AES-256-GCM, key from GOOGLE_TOKEN_ENCRYPTION_KEY (32-byte
// hex). Output packs iv + authTag + ciphertext together so a single string
// column can hold everything decrypt() needs.
const KEY_HEX = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
if (!KEY_HEX) {
  console.warn(
    "WARNING: GOOGLE_TOKEN_ENCRYPTION_KEY not set - encrypt()/decrypt() will " +
      "throw. Generate one with: " +
      `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
  );
}

function getKey(): Buffer {
  if (!KEY_HEX) {
    throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY is not set");
  }
  const key = Buffer.from(KEY_HEX, "hex");
  if (key.length !== 32) {
    throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
  }
  return key;
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decrypt(packed: string): string {
  const buf = Buffer.from(packed, "base64");
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
