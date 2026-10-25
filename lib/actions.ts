/**
 * Server actions return this instead of throwing, so a form can show the reason
 * rather than the framework showing an error page.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

const MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: "Kamu perlu masuk dulu.",
  FORBIDDEN: "Kamu tidak punya akses ke pernikahan ini.",
  "BELUM_DIBELI:invitation": "Undangan Website belum dibeli.",
  "BELUM_DIBELI:guestbook": "Buku Tamu Digital belum dibeli.",
};

/** Turns a thrown error into a message a couple can act on. */
export function toResult(err: unknown): { ok: false; error: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (MESSAGES[raw]) return { ok: false, error: MESSAGES[raw] };
  if (raw.includes("row-level security")) return { ok: false, error: MESSAGES.FORBIDDEN! };
  return { ok: false, error: raw };
}
