import { createHash, randomBytes } from "node:crypto";
import { sql } from "./db.ts";

const LOGIN_TTL_MINUTES = 15;

/**
 * Issues a login link. Only the hash is persisted, so a stolen table is not a
 * pile of working login links. Returns the URL so callers can surface it in dev.
 */
export async function requestLogin(email: string): Promise<string> {
  const normalised = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalised)) throw new Error("Email tidak valid");

  const [{ rl_hit: allowed }] = await sql<[{ rl_hit: boolean }]>`
    select rl_hit(${"login:" + normalised}, interval '15 minutes', 5)`;
  if (!allowed) throw new Error("Terlalu banyak permintaan masuk. Coba lagi nanti.");

  const raw = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(raw).digest();
  await sql`select auth_issue_login(${normalised}, ${hash},
                                    ${LOGIN_TTL_MINUTES + " minutes"}::interval)`;

  const url = `${process.env.APP_URL}/masuk/verifikasi?token=${raw}`;
  await sql`select send_email(${normalised}, ${"Link masuk OurDay"},
    ${`Klik untuk masuk (berlaku ${LOGIN_TTL_MINUTES} menit):\n\n${url}`})`;
  return url;
}

/** Consumes a login link exactly once. Creates the user on first login. */
export async function consumeLogin(rawToken: string): Promise<string | null> {
  if (!rawToken) return null;
  const hash = createHash("sha256").update(rawToken).digest();
  const [row] = await sql<[{ auth_consume_login: string | null }]>`
    select auth_consume_login(${hash})`;
  return row?.auth_consume_login ?? null;
}
