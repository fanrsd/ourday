import { createHmac, timingSafeEqual } from "node:crypto";
import { loadEnv } from "./env.ts";

loadEnv();

export const SESSION_COOKIE = "ourday_session";
export const SESSION_TTL_DAYS = 30;

type Payload = { uid: string; exp: number };

/**
 * The single place the session MAC is derived. signSession and verifySession
 * must agree byte for byte, so they share this rather than each building it.
 */
function sessionMac(body: string): Buffer {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be at least 32 chars");
  return createHmac("sha256", s).update(body).digest();
}

export function signSession(uid: string, ttlDays = SESSION_TTL_DAYS): string {
  const payload: Payload = { uid, exp: Date.now() + ttlDays * 864e5 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sessionMac(body).toString("base64url")}`;
}

export function verifySession(token: string | undefined | null): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;

  const body = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1), "base64url");
  const want = sessionMac(body);
  // Length check first: timingSafeEqual throws on mismatched lengths.
  if (given.length !== want.length || !timingSafeEqual(given, want)) return null;

  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    return p.exp > Date.now() ? p.uid : null;
  } catch {
    return null;
  }
}
