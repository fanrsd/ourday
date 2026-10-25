// Day-of check-in. This is the one module where losing a write is unrecoverable:
// a wedding has no second attempt, and a guest who fails to check in gets no
// souvenir and is missing from the record forever. Everything here is therefore
// idempotent, retry-safe and never rejects a re-scan outright.
import { createHash } from "node:crypto";
import { asAnon, withCtx, type Ctx, type Tx } from "./db.ts";
import { asUser } from "./wedding.ts";
import { guestToken, urlToken } from "./ids.ts";
import type { Guest } from "./guests.ts";

export type CheckInStatus = "ok" | "already";

export type CheckInResult = {
  status: CheckInStatus;
  guest: Guest;
  checkedInAt: string;
};

const GUEST_COLS = `id, wedding_id, name, phone, guest_group, session_label,
  pax_allowed, token, sent_at, first_opened_at,
  checked_in_at, checked_in_pax, checkin_photo_path`;

// The driver hands back Date objects; everything downstream of here is either
// JSON on the wire or a comparison, so timestamps leave this module as ISO.
const iso = (v: unknown): string | null =>
  v == null ? null : new Date(v as string).toISOString();

// ---------------------------------------------------------- scanner links --

// Only the hash is stored: a leaked scanner_links table must not be a set of
// working scanners.
const hashToken = (raw: string) => createHash("sha256").update(raw).digest();

export type ScannerLink = {
  id: string;
  label: string;
  expires_at: string;
  revoked_at: string | null;
};

/**
 * A receptionist is not an account holder, so they get a time-boxed, revocable
 * link instead of the couple's login.
 */
export async function createScannerLink(
  userId: string,
  weddingId: string,
  label: string,
  ttlHours = 24,
): Promise<{ id: string; token: string }> {
  const clean = label.trim().slice(0, 40) || "Meja 1";
  const hours = Math.min(Math.max(Math.trunc(ttlHours) || 24, 1), 24 * 14);
  const token = urlToken(24);

  const [row] = await asUser(userId, (tx) => tx<{ id: string }[]>`
    insert into scanner_links (wedding_id, token_hash, label, expires_at)
    values (${weddingId}, ${hashToken(token)}, ${clean},
            now() + ${hours + " hours"}::interval)
    returning id`);

  // The raw token exists exactly once, here. It is never readable again.
  return { id: row!.id, token };
}

/**
 * Runs before any identity exists, so it cannot be an RLS-filtered select:
 * there is nothing yet for a policy to match on. Expiry and revocation are
 * checked inside the same statement that does the lookup.
 */
export async function resolveScannerLink(
  rawToken: string | null | undefined,
): Promise<{ weddingId: string; label: string } | null> {
  if (!rawToken) return null;
  const [row] = await asAnon((tx) => tx<{ wedding_id: string; label: string }[]>`
    select wedding_id, label from app_resolve_scanner(${hashToken(rawToken)})`);
  return row ? { weddingId: row.wedding_id, label: row.label } : null;
}

export async function revokeScannerLink(userId: string, id: string) {
  await asUser(userId, (tx) => tx`
    update scanner_links set revoked_at = now()
     where id = ${id} and revoked_at is null`);
}

export function listScannerLinks(userId: string, weddingId: string) {
  return asUser(userId, (tx) => tx<ScannerLink[]>`
    select id, label, expires_at, revoked_at from scanner_links
     where wedding_id = ${weddingId} order by created_at desc`);
}

// ---------------------------------------------------------------- check-in --

function cleanPax(pax: number): number {
  const n = Math.trunc(Number(pax));
  if (!Number.isFinite(n) || n < 0 || n > 99) throw new Error("PAX_TIDAK_VALID");
  return n;
}

/**
 * Entitlement lives in `orders`, which a scanner link must never read, so the
 * boolean comes out of a definer function instead of a join.
 */
async function requireGuestbook(tx: Tx, weddingId: string) {
  const [row] = await tx<{ ok: boolean }[]>`
    select app_has_product(${weddingId}, 'guestbook') as ok`;
  if (!row?.ok) throw new Error("BELUM_DIBELI:guestbook");
}

/**
 * Idempotent on (guest, clientEventId): the scanner queue retries, so the same
 * event WILL arrive more than once. A re-scan under a fresh event id corrects
 * the pax count but keeps the original arrival time — the guest arrived when
 * they arrived, not when someone scanned them a second time.
 *
 * A guest who is already checked in is never rejected. Refusing a re-scan in
 * front of a queue leaves the receptionist with nothing to say; "sudah check-in
 * pukul X" plus the guest's details lets them keep the line moving.
 */
export async function checkIn(input: {
  scannerWeddingId: string;
  token: string;
  /** null = the desk has not corrected it yet, so fall back to the allowance. */
  pax: number | null;
  clientEventId: string;
  photoPath?: string | null;
}): Promise<CheckInResult> {
  const pax = input.pax == null ? null : cleanPax(input.pax);
  const eventId = String(input.clientEventId || "").slice(0, 64);
  if (!eventId) throw new Error("EVENT_ID_KOSONG");

  return withCtx({ scannerWeddingId: input.scannerWeddingId }, async (tx) => {
    await requireGuestbook(tx, input.scannerWeddingId);

    // for update: several desks scan at once and must not clobber each other.
    const [guest] = await tx<(Guest & { checkin_client_event_id: string | null })[]>`
      select ${tx.unsafe(GUEST_COLS)}, checkin_client_event_id from guests
       where wedding_id = ${input.scannerWeddingId} and token = ${input.token}
       for update`;
    if (!guest) throw new Error("TAMU_TIDAK_DITEMUKAN");

    // Exact replay of an event already applied: change nothing at all.
    if (guest.checkin_client_event_id === eventId) {
      return { status: "already" as const, guest, checkedInAt: iso(guest.checked_in_at)! };
    }

    const wasIn = guest.checked_in_at !== null;
    const [updated] = await tx<Guest[]>`
      update guests set
        checked_in_at           = coalesce(checked_in_at, now()),
        -- An uncorrected re-scan must not undo a correction the desk already
        -- made, so the allowance is only a fallback for a first arrival.
        checked_in_pax          = coalesce(${pax}::int, checked_in_pax, pax_allowed),
        checkin_photo_path      = coalesce(${input.photoPath ?? null}, checkin_photo_path),
        checkin_client_event_id = ${eventId}
       where id = ${guest.id}
      returning ${tx.unsafe(GUEST_COLS)}`;

    return {
      status: wasIn ? ("already" as const) : ("ok" as const),
      guest: updated!,
      checkedInAt: iso(updated!.checked_in_at)!,
    };
  });
}

/** Mis-scans happen in front of a queue; undo must be one tap, not a support ticket. */
export async function undoCheckIn(input: {
  scannerWeddingId: string;
  guestId: string;
}): Promise<void> {
  await withCtx({ scannerWeddingId: input.scannerWeddingId }, (tx) => tx`
    update guests set checked_in_at = null, checked_in_pax = null,
           checkin_photo_path = null, checkin_client_event_id = null
     where id = ${input.guestId} and wedding_id = ${input.scannerWeddingId}`);
}

/** For the guest whose phone died on the way. */
export function findByName(scannerWeddingId: string, query: string): Promise<Guest[]> {
  const q = query.trim();
  if (q.length < 2) return Promise.resolve([]);
  return withCtx({ scannerWeddingId }, (tx) => tx<Guest[]>`
    select ${tx.unsafe(GUEST_COLS)} from guests
     where wedding_id = ${scannerWeddingId} and name ilike ${"%" + q + "%"}
     order by checked_in_at nulls first, lower(name) limit 20`);
}

/** A guest on nobody's list still has to be recorded, and recorded once. */
export async function walkIn(
  scannerWeddingId: string,
  name: string,
  pax: number,
): Promise<Guest> {
  const clean = name.trim().slice(0, 80);
  if (!clean) throw new Error("NAMA_KOSONG");
  const n = cleanPax(pax);

  return withCtx({ scannerWeddingId }, async (tx) => {
    await requireGuestbook(tx, scannerWeddingId);
    // Token space is 30^8; three tries is already more than the odds deserve.
    for (let i = 0; ; i++) {
      try {
        const [row] = await tx<Guest[]>`
          insert into guests (wedding_id, name, guest_group, pax_allowed, token,
                              checked_in_at, checked_in_pax)
          values (${scannerWeddingId}, ${clean}, 'Tamu dadakan',
                  ${Math.min(Math.max(n, 1), 20)}, ${guestToken()}, now(), ${n})
          returning ${tx.unsafe(GUEST_COLS)}`;
        return row!;
      } catch (err) {
        if (i >= 2 || !String(err).includes("guests_token_key")) throw err;
      }
    }
  });
}

// ------------------------------------------------------------------ stats --

export type LiveArrival = {
  id: string;
  name: string;
  guest_group: string;
  checked_in_at: string;
  checked_in_pax: number | null;
  checkin_photo_path: string | null;
};

export type LiveStats = {
  invited: number;
  arrived: number;
  pax: number;
  recent: LiveArrival[];
};

/**
 * Defaults to the scanner's own wedding because the projector screen is
 * authenticated by a scanner link and has no user at all. The couple's
 * dashboard passes `{ userId }` so that read stays inside their membership.
 */
export function liveStats(
  weddingId: string,
  ctx: Ctx = { scannerWeddingId: weddingId },
): Promise<LiveStats> {
  return withCtx(ctx, async (tx) => {
    const [totals] = await tx<{ invited: number; arrived: number; pax: number }[]>`
      select count(*)::int as invited,
             count(checked_in_at)::int as arrived,
             coalesce(sum(checked_in_pax), 0)::int as pax
        from guests where wedding_id = ${weddingId}`;
    const recent = await tx<LiveArrival[]>`
      select id, name, guest_group, checked_in_at, checked_in_pax, checkin_photo_path
        from guests
       where wedding_id = ${weddingId} and checked_in_at is not null
       order by checked_in_at desc limit 12`;
    return {
      ...totals!,
      recent: recent.map((r) => ({ ...r, checked_in_at: iso(r.checked_in_at)! })),
    };
  });
}

/** The couple's switch: photographing guests stays off until they turn it on. */
export async function setCheckinPhoto(userId: string, weddingId: string, on: boolean) {
  await asUser(userId, (tx) => tx`
    update weddings set checkin_photo_enabled = ${on} where id = ${weddingId}`);
}
