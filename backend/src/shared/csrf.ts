import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const CSRF_DOMAIN_KEY = "task-management-system-csrf-v1";

if (process.env.NODE_ENV === "production" && !process.env.CSRF_SECRET?.trim()) {
  throw new Error("Set CSRF_SECRET in the production environment.");
}

export function generateRawToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function deriveCsrfToken(sessionTokenHash: string): string {
  const secret = process.env.CSRF_SECRET ?? CSRF_DOMAIN_KEY;
  return createHmac("sha256", secret).update(sessionTokenHash).digest("base64url");
}

export function verifyCsrfToken(candidate: string | undefined, expected: string): boolean {
  if (!candidate || !expected) {
    return false;
  }

  const candidateBuffer = Buffer.from(candidate, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (candidateBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateBuffer, expectedBuffer);
}
