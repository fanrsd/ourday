/**
 * The one guest list. Invitation, RSVP and check-in all hang off these rows, so
 * this module is the only place that creates or edits them — the whole point of
 * the platform is that the couple never types the list a second time.
 */
import { withCtx, type Tx } from "./db.ts";
import { asUser, requireMember } from "./wedding.ts";
import { guestToken } from "./ids.ts";
import { normalisePhone } from "./phone.ts";

export type Guest = {
  id: string;
  wedding_id: string;
  name: string;
  phone: string | null;
  guest_group: string;
  session_label: string;
  pax_allowed: number;
  token: string;
  sent_at: string | null;
  first_opened_at: string | null;
  checked_in_at: string | null;
  checked_in_pax: number | null;
  checkin_photo_path: string | null;
};

/** A guest plus the answer they gave, which is what the dashboard table shows. */
export type GuestRow = Guest & {
  attending: "yes" | "no" | null;
  rsvp_pax: number | null;
};

export type GuestInput = {
  name: string;
  phone?: string | null;
  guest_group?: string;
  session_label?: string;
  pax_allowed?: number;
};

/**
 * postgres.js hands back `Date` for timestamptz, but the shared contract these
 * rows travel under declares them as strings — and they cross into client
 * components, where a Date is a serialisation trap. Normalise once, here, so
 * every consumer gets what the type promised.
 */
function toGuest<T extends Guest>(row: T): T {
  for (const k of ["sent_at", "first_opened_at", "checked_in_at"] as const) {
    const v: unknown = row[k];
    if (v instanceof Date) (row as Guest)[k] = v.toISOString();
  }
  return row;
}

// -------------------------------------------------------------- guest lookup --

/**
 * Resolves the token in a personal invitation link. It runs under the guest's
 * own identity, so RLS — not this query — is what limits the answer to one row:
 * a wrong token returns nothing rather than somebody else's guest.
 */
export async function findGuestByToken(token: string): Promise<Guest | null> {
  if (!token) return null;
  return withCtx({ guestToken: token }, async (tx) => {
    const [row] = await tx<Guest[]>`
      select id, wedding_id, name, phone, guest_group, session_label, pax_allowed,
             token, sent_at, first_opened_at, checked_in_at, checked_in_pax,
             checkin_photo_path
        from guests where token = ${token}`;
    return row ? toGuest(row) : null;
  });
}

/**
 * First open of a personal link. A guest token deliberately has no UPDATE policy
 * on `guests` — a policy wide enough to stamp this column is also wide enough to
 * let the link holder raise their own pax_allowed — so this goes through a
 * definer function scoped to exactly one column.
 */
export async function markInvitationOpened(token: string): Promise<void> {
  if (!token) return;
  await withCtx({ guestToken: token }, (tx) => tx`select guest_mark_opened(${token})`);
}

// ------------------------------------------------------------------- listing --

export type GuestFilter = { q?: string; group?: string };

/**
 * Search and group filter run in Postgres rather than in the browser: a list of
 * 400 names is normal and the couple opens this page on a phone.
 */
export async function listGuests(
  userId: string,
  weddingId: string,
  filter: GuestFilter = {},
): Promise<GuestRow[]> {
  const q = filter.q?.trim() ?? "";
  const group = filter.group?.trim() ?? "";
  return asUser(userId, async (tx) => {
    await requireMember(tx, weddingId, userId);
    const rows = await tx<GuestRow[]>`
      select g.id, g.wedding_id, g.name, g.phone, g.guest_group, g.session_label,
             g.pax_allowed, g.token, g.sent_at, g.first_opened_at,
             g.checked_in_at, g.checked_in_pax, g.checkin_photo_path,
             r.attending, r.pax as rsvp_pax
        from guests g
        left join rsvps r on r.guest_id = g.id
       where g.wedding_id = ${weddingId}
         and (${q} = '' or g.name ilike ${"%" + q + "%"})
         and (${group} = '' or g.guest_group = ${group})
       order by g.guest_group, lower(g.name)`;
    return rows.map(toGuest);
  });
}

/** Distinct groups, for the filter control. */
export async function listGroups(userId: string, weddingId: string): Promise<string[]> {
  return asUser(userId, async (tx) => {
    const rows = await tx<{ guest_group: string }[]>`
      select distinct guest_group from guests
       where wedding_id = ${weddingId} and guest_group <> ''
       order by guest_group`;
    return rows.map((r) => r.guest_group);
  });
}

// ------------------------------------------------------------------ mutation --

// `Number(v) || 2` would be wrong here: a form that posts 0 means "one seat",
// not "use the default". Only a genuinely absent value falls back to 2.
function clampPax(v: number | undefined): number {
  const n = Math.trunc(Number(v));
  if (!Number.isFinite(n)) return 2;
  return Math.min(20, Math.max(1, n));
}

/**
 * `on conflict (token) do nothing` rather than catching the unique violation: an
 * error would abort the surrounding transaction and force savepoint machinery,
 * and a collision at 30^8 does not deserve it. Retrying a no-op insert is
 * cheaper and reads plainly.
 */
async function insertGuest(tx: Tx, weddingId: string, g: GuestInput): Promise<Guest> {
  const name = g.name.trim();
  if (!name) throw new Error("Nama tamu tidak boleh kosong.");

  for (let attempt = 0; attempt < 5; attempt++) {
    const [row] = await tx<Guest[]>`
      insert into guests (wedding_id, name, phone, guest_group, session_label,
                          pax_allowed, token)
      values (${weddingId}, ${name}, ${normalisePhone(g.phone)},
              ${g.guest_group?.trim() ?? ""}, ${g.session_label?.trim() ?? ""},
              ${clampPax(g.pax_allowed)}, ${guestToken()})
      on conflict (token) do nothing
      returning id, wedding_id, name, phone, guest_group, session_label,
                pax_allowed, token, sent_at, first_opened_at, checked_in_at,
                checked_in_pax, checkin_photo_path`;
    if (row) return toGuest(row);
  }
  throw new Error("Gagal membuat token tamu. Coba lagi.");
}

export async function addGuest(
  userId: string,
  weddingId: string,
  input: GuestInput,
): Promise<Guest> {
  return asUser(userId, async (tx) => {
    await requireMember(tx, weddingId, userId);
    return insertGuest(tx, weddingId, input);
  });
}

/**
 * Phone is normalised here, on the way in, and nowhere else. Normalising on read
 * instead would mean the same guest can hold two different wa.me links.
 */
export async function updateGuest(
  userId: string,
  guestId: string,
  input: GuestInput,
): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error("Nama tamu tidak boleh kosong.");
  await asUser(userId, (tx) => tx`
    update guests set name          = ${name},
                      phone         = ${normalisePhone(input.phone)},
                      guest_group   = ${input.guest_group?.trim() ?? ""},
                      session_label = ${input.session_label?.trim() ?? ""},
                      pax_allowed   = ${clampPax(input.pax_allowed)}
     where id = ${guestId}`);
}

export async function removeGuest(userId: string, guestId: string): Promise<void> {
  await asUser(userId, (tx) => tx`delete from guests where id = ${guestId}`);
}

// --------------------------------------------------------------- bulk paste --

/**
 * The couple's list already exists, in a notes app or a chat thread. Pasting it
 * is the entire import story — no file upload, no CSV parser, no encoding
 * arguments. Accepted per line: "Nama", "Nama, 0812...", "Nama, 0812..., Grup",
 * and the same shapes separated by tabs, which is what a spreadsheet copy gives.
 */
export function parseGuestPaste(pasted: string): GuestInput[] {
  const out: GuestInput[] = [];
  for (const line of pasted.split(/\r?\n/)) {
    const parts = line.split(/[\t,;]/).map((p) => p.trim());
    const name = parts[0] ?? "";
    if (!name) continue;
    out.push({ name, phone: parts[1] || null, guest_group: parts[2] || "" });
  }
  return out;
}

export async function bulkAddGuests(
  userId: string,
  weddingId: string,
  pasted: string,
): Promise<{ added: number; skipped: number }> {
  const parsed = parseGuestPaste(pasted);
  if (parsed.length === 0) return { added: 0, skipped: 0 };

  return asUser(userId, async (tx) => {
    await requireMember(tx, weddingId, userId);
    const existing = await tx<{ name: string }[]>`
      select name from guests where wedding_id = ${weddingId}`;
    // A paste is almost always a re-paste of a list that grew by five names.
    // Silently dropping the repeats is the difference between usable and not.
    const seen = new Set(existing.map((r) => r.name.trim().toLowerCase()));

    let added = 0;
    let skipped = 0;
    for (const g of parsed) {
      const key = g.name.trim().toLowerCase();
      if (seen.has(key)) {
        skipped++;
        continue;
      }
      seen.add(key);
      await insertGuest(tx, weddingId, g);
      added++;
    }
    return { added, skipped };
  });
}

// ------------------------------------------------------------------ dispatch --

/**
 * We send through a wa.me deep link, so we never learn whether the message
 * arrived. This records that the couple pressed the button — intent, not
 * delivery — which is why it is reversible and why the UI says "sudah dikirim"
 * and never "diterima".
 */
export async function markSent(userId: string, guestIds: string[]): Promise<void> {
  if (guestIds.length === 0) return;
  await asUser(userId, (tx) => tx`
    update guests set sent_at = now() where id in ${tx(guestIds)}`);
}

export async function unmarkSent(userId: string, guestId: string): Promise<void> {
  await asUser(userId, (tx) => tx`
    update guests set sent_at = null where id = ${guestId}`);
}

// ---------------------------------------------------------------- csv export --

/**
 * Quotes what needs quoting, and defuses the characters a spreadsheet reads as
 * the start of a formula. A guest called "-Ari", or a group pasted from a chat
 * beginning with "=", must not become executable in somebody's Excel.
 */
function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /["\n\r,;]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

const CSV_HEADER = [
  "Nama", "Telepon", "Kelompok", "Sesi", "Jatah pax", "Token",
  "Dikirim", "Dibuka", "RSVP", "Pax RSVP", "Check-in", "Pax hadir",
];

const iso = (v: string | Date | null) => (v ? new Date(v).toISOString() : "");

export const RSVP_LABEL = {
  yes: "Hadir",
  no: "Tidak hadir",
  null: "Belum menjawab",
} as const;

export async function exportCsv(userId: string, weddingId: string): Promise<string> {
  const rows = await listGuests(userId, weddingId);
  const lines = [CSV_HEADER.map(csvCell).join(",")];
  for (const g of rows) {
    lines.push([
      g.name, g.phone, g.guest_group, g.session_label, g.pax_allowed, g.token,
      iso(g.sent_at), iso(g.first_opened_at),
      RSVP_LABEL[String(g.attending) as keyof typeof RSVP_LABEL] ?? RSVP_LABEL.null,
      g.rsvp_pax, iso(g.checked_in_at), g.checked_in_pax,
    ].map(csvCell).join(","));
  }
  // CRLF, because Excel on Windows is where this file gets opened.
  return lines.join("\r\n");
}

// --------------------------------------------------------------------- recap --

export type Recap = {
  invited: number;
  respondedYes: number;
  respondedNo: number;
  notResponded: number;
  paxConfirmed: number;
  checkedIn: number;
  paxPresent: number;
  /** The number nobody else can produce: who said yes and never arrived. */
  confirmedAbsent: { id: string; name: string; guest_group: string; rsvp_pax: number }[];
  /**
   * Answers from the no-token link the couple pastes in a group chat. They are
   * unidentified by construction, so they cannot join the guest list — but they
   * are still mouths to feed, and leaving them out of the only screen that
   * reports numbers would hand the caterer a figure that is quietly too low.
   */
  openLinkYes: number;
  openLinkPax: number;
};

/**
 * One query over the guest row, because invitation, RSVP and check-in are all
 * columns of the same row. That is the reason this comparison is possible at all.
 */
export async function recap(
  userId: string,
  weddingId: string,
  group = "",
): Promise<Recap> {
  return asUser(userId, async (tx) => {
    await requireMember(tx, weddingId, userId);
    const [counts] = await tx<[{
      invited: string; yes: string; no: string; not_responded: string;
      pax_confirmed: string; checked_in: string; pax_present: string;
    }]>`
      select count(*)                                            as invited,
             count(*) filter (where r.attending = 'yes')          as yes,
             count(*) filter (where r.attending = 'no')           as no,
             count(*) filter (where r.id is null)                 as not_responded,
             coalesce(sum(r.pax) filter (where r.attending = 'yes'), 0)
                                                                 as pax_confirmed,
             count(*) filter (where g.checked_in_at is not null)  as checked_in,
             coalesce(sum(g.checked_in_pax), 0)                   as pax_present
        from guests g
        left join rsvps r on r.guest_id = g.id
       where g.wedding_id = ${weddingId}
         and (${group} = '' or g.guest_group = ${group})`;

    const confirmedAbsent = await tx<Recap["confirmedAbsent"]>`
      select g.id, g.name, g.guest_group, r.pax as rsvp_pax
        from guests g
        join rsvps r on r.guest_id = g.id
       where g.wedding_id = ${weddingId}
         and r.attending = 'yes'
         and g.checked_in_at is null
         and (${group} = '' or g.guest_group = ${group})
       order by g.guest_group, lower(g.name)`;

    // A group-chat answer has no group, so it cannot honestly appear under one.
    const [open] = group
      ? [{ yes: "0", pax: "0" }]
      : await tx<[{ yes: string; pax: string }]>`
          select count(*) filter (where attending = 'yes')                  as yes,
                 coalesce(sum(pax) filter (where attending = 'yes'), 0)     as pax
            from rsvps where wedding_id = ${weddingId} and guest_id is null`;

    return {
      invited: Number(counts!.invited),
      respondedYes: Number(counts!.yes),
      respondedNo: Number(counts!.no),
      notResponded: Number(counts!.not_responded),
      paxConfirmed: Number(counts!.pax_confirmed),
      checkedIn: Number(counts!.checked_in),
      paxPresent: Number(counts!.pax_present),
      confirmedAbsent: [...confirmedAbsent],
      openLinkYes: Number(open!.yes),
      openLinkPax: Number(open!.pax),
    };
  });
}
