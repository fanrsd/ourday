/**
 * RSVP and wishes: the two things a guest writes. Both arrive from a public form
 * with no login, so every rule that matters is enforced here on the server —
 * the form is a convenience, not a gate.
 *
 * Publication, deadline and the pax cap are all checked inside the same
 * transaction as the write, so a client posting straight at the action gains
 * nothing over using the form.
 */
import { withCtx, type Tx } from "./db.ts";
import { asUser } from "./wedding.ts";

export type Attending = "yes" | "no";

export type Wish = {
  id: string;
  name: string;
  message: string;
  created_at: string;
  hidden_at: string | null;
};

/** Same reason as in lib/guests.ts: these rows cross into client components. */
const toWish = (w: Wish): Wish => ({
  ...w,
  created_at: new Date(w.created_at).toISOString(),
  hidden_at: w.hidden_at ? new Date(w.hidden_at).toISOString() : null,
});

// A wedding sends 400 invitations and they get opened in bursts, so the
// per-wedding ceiling has to be far above real traffic or the limiter becomes
// the outage. The per-IP ceiling is the one that actually stops a spammer.
const RSVP_PER_IP = 30;
const RSVP_PER_WEDDING = 500;
const WISH_PER_IP = 6;
const WINDOW = "10 minutes";

async function rateLimit(tx: Tx, bucket: string, max: number) {
  const [row] = await tx<[{ rl_hit: boolean }]>`
    select rl_hit(${bucket}, ${WINDOW}::interval, ${max})`;
  if (!row!.rl_hit) throw new Error("Terlalu banyak kiriman. Coba lagi beberapa menit lagi.");
}

/**
 * The invitation must be published and still open. Read under whatever identity
 * the caller has: RLS only exposes published invitations to the public, so an
 * unpublished one is indistinguishable from a wedding that does not exist —
 * which is the correct answer to give a stranger.
 */
async function requireOpenInvitation(tx: Tx, weddingId: string) {
  const [inv] = await tx<[{ closed: boolean }]>`
    select rsvp_deadline is not null and rsvp_deadline < now() as closed
      from invitations
     where wedding_id = ${weddingId} and status = 'published'`;
  if (!inv) throw new Error("Undangan ini belum terbit.");
  if (inv.closed) throw new Error("Batas waktu konfirmasi kehadiran sudah lewat.");
}

// ---------------------------------------------------------------------- rsvp --

export type RsvpInput = {
  weddingId: string;
  guestToken: string | null;
  name: string;
  attending: Attending;
  pax: number;
  /** Only used for rate limiting; never stored. */
  ip?: string | null;
};

export async function submitRsvp(input: RsvpInput): Promise<void> {
  const name = input.name.trim().slice(0, 80);
  if (!name) throw new Error("Nama tidak boleh kosong.");
  if (input.attending !== "yes" && input.attending !== "no") {
    throw new Error("Pilih hadir atau tidak hadir.");
  }
  const wanted = Math.trunc(Number(input.pax));
  if (!Number.isFinite(wanted) || wanted < 0 || wanted > 20) {
    throw new Error("Jumlah orang tidak masuk akal.");
  }
  // Saying no and bringing three people is not a thing.
  const pax = input.attending === "no" ? 0 : Math.max(1, wanted);

  await withCtx({ guestToken: input.guestToken }, async (tx) => {
    if (input.ip) await rateLimit(tx, `rsvp:ip:${input.ip}`, RSVP_PER_IP);
    await rateLimit(tx, `rsvp:w:${input.weddingId}`, RSVP_PER_WEDDING);
    await requireOpenInvitation(tx, input.weddingId);

    let guestId: string | null = null;
    if (input.guestToken) {
      const [guest] = await tx<[{ id: string; pax_allowed: number }]>`
        select id, pax_allowed from guests
         where token = ${input.guestToken} and wedding_id = ${input.weddingId}`;
      // An unknown token is treated as no token rather than as an error: the
      // guest mistyped or the couple deleted the row, and neither should end in
      // a dead end on the invitation.
      if (guest) {
        if (pax > guest.pax_allowed) {
          throw new Error(
            `Undangan ini untuk maksimal ${guest.pax_allowed} orang.`,
          );
        }
        guestId = guest.id;
      }
    }

    // Upsert on guest_id so changing your mind edits one row. Without a token
    // there is nothing to key on, so an open-link answer is always a new row —
    // it is unidentified by construction and cannot be deduplicated.
    if (guestId) {
      await tx`
        insert into rsvps (wedding_id, guest_id, name, attending, pax)
        values (${input.weddingId}, ${guestId}, ${name}, ${input.attending}, ${pax})
        on conflict (guest_id) do update
          set name = excluded.name, attending = excluded.attending,
              pax = excluded.pax, updated_at = now()`;
    } else {
      await tx`
        insert into rsvps (wedding_id, guest_id, name, attending, pax)
        values (${input.weddingId}, null, ${name}, ${input.attending}, ${pax})`;
    }
  });
}

/** Prefills the form so a guest editing their answer starts from what they said. */
export async function findRsvpByToken(
  guestToken: string,
): Promise<{ name: string; attending: Attending; pax: number } | null> {
  if (!guestToken) return null;
  return withCtx({ guestToken }, async (tx) => {
    const [row] = await tx<[{ name: string; attending: Attending; pax: number }]>`
      select r.name, r.attending, r.pax
        from rsvps r join guests g on g.id = r.guest_id
       where g.token = ${guestToken}`;
    return row ?? null;
  });
}

// -------------------------------------------------------------------- wishes --

export type WishInput = {
  weddingId: string;
  guestToken: string | null;
  name: string;
  message: string;
  ip?: string | null;
};

export async function submitWish(input: WishInput): Promise<void> {
  const name = input.name.trim().slice(0, 80);
  const message = input.message.trim();
  if (!name) throw new Error("Nama tidak boleh kosong.");
  if (!message) throw new Error("Ucapan tidak boleh kosong.");
  if (message.length > 1000) throw new Error("Ucapan maksimal 1000 karakter.");

  await withCtx({ guestToken: input.guestToken }, async (tx) => {
    if (input.ip) await rateLimit(tx, `wish:ip:${input.ip}`, WISH_PER_IP);
    await requireOpenInvitation(tx, input.weddingId);

    const [guest] = input.guestToken
      ? await tx<[{ id: string }]>`
          select id from guests
           where token = ${input.guestToken} and wedding_id = ${input.weddingId}`
      : [];

    await tx`
      insert into wishes (wedding_id, guest_id, name, message)
      values (${input.weddingId}, ${guest?.id ?? null}, ${name}, ${message})`;
  });
}

/** Public read: RLS hides moderated wishes, so this needs no filter of its own. */
export async function listWishes(weddingId: string, limit = 100): Promise<Wish[]> {
  return withCtx({}, async (tx) => {
    const rows = await tx<Wish[]>`
      select id, name, message, created_at, hidden_at
        from wishes
       where wedding_id = ${weddingId} and hidden_at is null
       order by created_at desc
       limit ${limit}`;
    return rows.map(toWish);
  });
}

/** The moderation view: members see hidden wishes too, or they cannot unhide. */
export async function listWishesForMember(
  userId: string,
  weddingId: string,
): Promise<Wish[]> {
  return asUser(userId, async (tx) => {
    const rows = await tx<Wish[]>`
      select id, name, message, created_at, hidden_at
        from wishes where wedding_id = ${weddingId}
       order by created_at desc`;
    return rows.map(toWish);
  });
}

// Hiding, not deleting: a wish removed by mistake on the wedding day is not
// recoverable, and the couple may want it back after the argument ends.
export async function hideWish(userId: string, wishId: string): Promise<void> {
  await asUser(userId, (tx) => tx`
    update wishes set hidden_at = now() where id = ${wishId}`);
}

export async function unhideWish(userId: string, wishId: string): Promise<void> {
  await asUser(userId, (tx) => tx`
    update wishes set hidden_at = null where id = ${wishId}`);
}
