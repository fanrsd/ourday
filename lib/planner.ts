/**
 * The whole planner. Seven features — budget, todo, rundown, seserahan,
 * seragam, tabungan, vendor — are one table with a `kind` discriminator and one
 * CRUD surface, because they are the same shape: titled rows with an order,
 * some with money, some with a date, some with a done flag.
 *
 * The database only checks the `kind` enum, so `kind` and the per-kind `meta`
 * shape are validated here. That is the deal `db/schema.sql` names explicitly.
 */
import { asAnon, type Tx } from "./db.ts";
import { asUser } from "./wedding.ts";
import { urlToken } from "./ids.ts";

// ------------------------------------------------------------------- kinds --

export const KINDS = [
  "budget",
  "todo",
  "rundown",
  "seserahan",
  "seragam",
  "tabungan",
  "vendor",
] as const;

export type Kind = (typeof KINDS)[number];

export const isKind = (v: unknown): v is Kind =>
  typeof v === "string" && (KINDS as readonly string[]).includes(v);

function requireKind(v: unknown): Kind {
  if (!isKind(v)) throw new Error("Jenis daftar tidak dikenal.");
  return v;
}

function requireTitle(raw: unknown): string {
  const t = String(raw ?? "").trim();
  if (!t) throw new Error("Judul tidak boleh kosong.");
  return t.slice(0, 200);
}

/**
 * The only meta keys a user may set, per kind. Keys written by this module
 * alone — `chosen`, `copiedBudgetId`, `shareToken` — are deliberately absent:
 * updates merge into the stored object, so they survive an edit without being
 * forgeable from a form post.
 */
const META: Record<Kind, Record<string, "text" | "flag">> = {
  budget: { paid: "flag" },
  todo: { assignee: "text" },
  rundown: { pic: "text", guest: "flag" },
  seserahan: { source: "text" },
  seragam: { role: "text", size: "text" },
  tabungan: {},
  vendor: { category: "text", contact: "text" },
};

/** What callers may hand in: untrusted, any shape. */
export type MetaPatch = Record<string, unknown>;

/**
 * What is actually stored. cleanMeta is the only writer and it emits nothing but
 * strings and booleans, so the row type says so — otherwise every write site has
 * to cast to satisfy the driver's JSON type.
 */
export type Meta = Record<string, string | boolean>;

function cleanMeta(kind: Kind, meta: unknown): Meta {
  const out: Meta = {};
  if (!meta || typeof meta !== "object") return out;
  const given = meta as Record<string, unknown>;
  for (const [key, type] of Object.entries(META[kind])) {
    if (!(key in given)) continue; // absent = leave alone; present-and-empty = clear
    const v = given[key];
    out[key] =
      type === "flag"
        ? v === true || v === "true" || v === "on" || v === "1"
        : String(v ?? "").trim().slice(0, 300);
  }
  return out;
}

// --------------------------------------------------------------- time in id --

// Indonesia-only product, and a rundown typed as "09:00" must read back as
// "09:00" whatever the server's clock is set to, so WIB is the storage
// reference rather than the process timezone.
// ponytail: one fixed offset, not a timezone database. Revisit only if the
// product ever sells outside Indonesia.
const WIB = "+07:00";

/** A date-only deadline is due at the end of that day in WIB. */
export const dueFromDate = (ymd: string) => `${ymd}T23:59:59${WIB}`;

/** A `datetime-local` value ("2026-08-24T09:00") anchored to WIB. */
export const dueFromDateTime = (local: string) =>
  `${local.length === 16 ? local + ":00" : local}${WIB}`;

/**
 * A `date` column arrives as a Date pinned to UTC midnight, not as a string, so
 * every read of `weddings.event_date` funnels through here before anything
 * counts days off it.
 */
export const asYmd = (v: Date | string | null | undefined): string | null =>
  v == null ? null : typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);

function minusDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

// -------------------------------------------------------------------- rows --

type Row = {
  id: string;
  wedding_id: string;
  kind: Kind;
  parent_id: string | null;
  title: string;
  note: string;
  amount_planned: string | null;
  amount_actual: string | null;
  due_at: Date | null;
  done_at: Date | null;
  position: number;
  meta: Meta | null;
};

export type PlannerItem = {
  id: string;
  wedding_id: string;
  kind: Kind;
  parent_id: string | null;
  title: string;
  note: string;
  amount_planned: number | null;
  amount_actual: number | null;
  due_at: string | null;
  done_at: string | null;
  position: number;
  meta: Meta;
};

export type PlannerNode = PlannerItem & { children: PlannerItem[] };

// IDR has no cents and tops out far below 2^53, so a number is exact here.
const money = (v: string | null) => (v === null ? null : Number(v));
const iso = (v: Date | null) => (v === null ? null : v.toISOString());

function toItem(r: Row): PlannerItem {
  return {
    ...r,
    amount_planned: money(r.amount_planned),
    amount_actual: money(r.amount_actual),
    due_at: iso(r.due_at),
    done_at: iso(r.done_at),
    meta: r.meta ?? {},
  };
}

export async function listItems(
  userId: string,
  weddingId: string,
  kind: Kind,
): Promise<PlannerNode[]> {
  const k = requireKind(kind);

  // Rundown is read in clock order — a session added late still lands in its
  // right slot. Every other kind keeps the couple's own arrangement.
  const raw = await asUser(userId, (tx) => tx<Row[]>`
    select id, wedding_id, kind, parent_id, title, note, amount_planned,
           amount_actual, due_at, done_at, position, meta
      from planner_items
     where wedding_id = ${weddingId} and kind = ${k}
     order by (case when ${k} = 'rundown' then due_at end) nulls last,
              position, created_at`);
  const items = raw.map(toItem);

  const byParent = new Map<string, PlannerItem[]>();
  for (const it of items) {
    if (!it.parent_id) continue;
    const bucket = byParent.get(it.parent_id);
    if (bucket) bucket.push(it);
    else byParent.set(it.parent_id, [it]);
  }
  return items
    .filter((i) => !i.parent_id)
    .map((i) => ({ ...i, children: byParent.get(i.id) ?? [] }));
}

// ------------------------------------------------------------------- write --

export type ItemInput = {
  title: string;
  note?: string;
  amountPlanned?: number | null;
  amountActual?: number | null;
  dueAt?: string | null;
  parentId?: string | null;
  meta?: MetaPatch;
};

export async function createItem(
  userId: string,
  weddingId: string,
  kind: Kind,
  input: ItemInput,
): Promise<string> {
  const k = requireKind(kind);
  const title = requireTitle(input.title);
  const meta = cleanMeta(k, input.meta);
  const parentId = input.parentId ?? null;

  return asUser(userId, async (tx) => {
    if (parentId) {
      // Exactly one level deep: a sub-item of a sub-item means nothing in any of
      // the seven views, and it would make the budget totals ambiguous.
      const [parent] = await tx`
        select 1 from planner_items
         where id = ${parentId} and wedding_id = ${weddingId}
           and kind = ${k} and parent_id is null`;
      if (!parent) throw new Error("Baris induk tidak ditemukan.");
    }

    const [row] = await tx<{ id: string }[]>`
      insert into planner_items
        (wedding_id, kind, parent_id, title, note, amount_planned, amount_actual,
         due_at, position, meta)
      values
        (${weddingId}, ${k}, ${parentId}, ${title}, ${input.note?.slice(0, 2000) ?? ""},
         ${input.amountPlanned ?? null}, ${input.amountActual ?? null},
         ${input.dueAt ?? null},
         coalesce((select max(p.position) + 1 from planner_items p
                    where p.wedding_id = ${weddingId} and p.kind = ${k}
                      and p.parent_id is not distinct from ${parentId}), 0),
         ${tx.json(meta)})
      returning id`;
    if (!row) throw new Error("Baris gagal disimpan.");
    return row.id;
  });
}

export type ItemPatch = {
  title?: string;
  note?: string;
  amountPlanned?: number | null;
  amountActual?: number | null;
  dueAt?: string | null;
  meta?: MetaPatch;
};

/**
 * Read, merge in JS, write every column back. `for update` makes that safe, and
 * it keeps "absent means leave alone, null means clear" readable — which a pile
 * of conditional SQL fragments would not.
 */
export async function updateItem(
  userId: string,
  itemId: string,
  patch: ItemPatch,
): Promise<void> {
  await asUser(userId, async (tx) => {
    const [cur] = await tx<Row[]>`
      select id, wedding_id, kind, parent_id, title, note, amount_planned,
             amount_actual, due_at, done_at, position, meta
        from planner_items where id = ${itemId} for update`;
    if (!cur) throw new Error("Baris tidak ditemukan.");

    const next = {
      title: patch.title !== undefined ? requireTitle(patch.title) : cur.title,
      note: patch.note !== undefined ? patch.note.slice(0, 2000) : cur.note,
      planned:
        "amountPlanned" in patch ? (patch.amountPlanned ?? null) : cur.amount_planned,
      actual: "amountActual" in patch ? (patch.amountActual ?? null) : cur.amount_actual,
      dueAt: "dueAt" in patch ? (patch.dueAt ?? null) : iso(cur.due_at),
      meta:
        patch.meta !== undefined
          ? { ...(cur.meta ?? {}), ...cleanMeta(cur.kind, patch.meta) }
          : (cur.meta ?? {}),
    };

    await tx`
      update planner_items set
        title = ${next.title}, note = ${next.note},
        amount_planned = ${next.planned}, amount_actual = ${next.actual},
        due_at = ${next.dueAt}, meta = ${tx.json(next.meta)}
       where id = ${itemId}`;
  });
}

export async function deleteItem(userId: string, itemId: string): Promise<void> {
  await asUser(userId, async (tx) => {
    // Sub-items go with their parent via the foreign key's on delete cascade.
    const [gone] = await tx`delete from planner_items where id = ${itemId} returning id`;
    if (!gone) throw new Error("Baris tidak ditemukan.");
  });
}

export async function toggleDone(userId: string, itemId: string): Promise<void> {
  await asUser(userId, async (tx) => {
    const [row] = await tx`
      update planner_items
         set done_at = case when done_at is null then now() else null end
       where id = ${itemId} returning id`;
    if (!row) throw new Error("Baris tidak ditemukan.");
  });
}

/**
 * Positions become the given order. The UI moves a row with up/down buttons,
 * which is just a new list order, so one primitive covers both directions.
 */
export async function reorderItems(
  userId: string,
  weddingId: string,
  kind: Kind,
  ids: string[],
): Promise<void> {
  const k = requireKind(kind);
  if (!ids.length) return;
  await asUser(userId, (tx) => tx`
    update planner_items p
       set position = o.ord
      from unnest(${ids}::uuid[]) with ordinality as o(id, ord)
     where p.id = o.id and p.wedding_id = ${weddingId} and p.kind = ${k}`);
}

// ------------------------------------------------------------------ budget --

export type Totals = { planned: number; actual: number };

/**
 * A pos with sub-items is worth the sum of its sub-items; a leaf is worth its
 * own amount. Anything else counts the sub-items twice — once on their own and
 * once inside the parent the couple also filled in.
 */
async function totals(tx: Tx, weddingId: string): Promise<Totals> {
  const [row] = await tx<{ planned: string; actual: string }[]>`
    with kids as (
      select parent_id,
             sum(coalesce(amount_planned, 0)) as planned,
             sum(coalesce(amount_actual, 0))  as actual
        from planner_items
       where wedding_id = ${weddingId} and kind = 'budget' and parent_id is not null
       group by parent_id
    )
    select
      coalesce(sum(coalesce(k.planned, p.amount_planned, 0)), 0)::text as planned,
      coalesce(sum(coalesce(k.actual,  p.amount_actual,  0)), 0)::text as actual
      from planner_items p
      left join kids k on k.parent_id = p.id
     where p.wedding_id = ${weddingId} and p.kind = 'budget' and p.parent_id is null`;
  return { planned: Number(row!.planned), actual: Number(row!.actual) };
}

export const budgetTotals = (userId: string, weddingId: string) =>
  asUser(userId, (tx) => totals(tx, weddingId));

// ---------------------------------------------------------------- tabungan --

export type SavingsTarget = {
  id: string;
  title: string;
  target: number;
  saved: number;
  remaining: number;
  deadline: string | null;
  /** Months left, floored at 0 when the deadline is today, past, or unset. */
  monthsLeft: number;
  /** What to set aside each month. Equals `remaining` once time has run out. */
  perMonth: number;
};

const DAYS_PER_MONTH = 30;

async function savings(tx: Tx, weddingId: string): Promise<SavingsTarget[]> {
  const rows = await tx<
    {
      id: string;
      title: string;
      target: string | null;
      saved: string;
      due_at: Date | null;
    }[]
  >`
    select p.id, p.title, p.amount_planned as target, p.due_at,
           coalesce((select sum(coalesce(c.amount_actual, 0))
                       from planner_items c where c.parent_id = p.id), 0)::text as saved
      from planner_items p
     where p.wedding_id = ${weddingId} and p.kind = 'tabungan' and p.parent_id is null
     order by p.position, p.created_at`;

  const now = Date.now();
  return rows.map((r) => {
    const target = Number(r.target ?? 0);
    const saved = Number(r.saved);
    const remaining = Math.max(0, target - saved);
    const days = r.due_at ? (r.due_at.getTime() - now) / 86_400_000 : 0;
    const monthsLeft = days > 0 ? Math.ceil(days / DAYS_PER_MONTH) : 0;
    return {
      id: r.id,
      title: r.title,
      target,
      saved,
      remaining,
      deadline: iso(r.due_at),
      monthsLeft,
      // No months left is not a division by zero, it is "all of it, now".
      perMonth: monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : remaining,
    };
  });
}

export const savingsProgress = (userId: string, weddingId: string) =>
  asUser(userId, (tx) => savings(tx, weddingId));

// ------------------------------------------------------------------ vendor --

/**
 * Marks a vendor chosen and copies its quote into a new budget row. A one-time
 * copy on purpose: a live link means maintaining two-way sync for a benefit
 * nobody asked for. `for update` makes the second click a no-op.
 */
export async function chooseVendor(
  userId: string,
  itemId: string,
): Promise<{ budgetItemId: string; alreadyChosen: boolean }> {
  return asUser(userId, async (tx) => {
    const [v] = await tx<
      {
        wedding_id: string;
        title: string;
        amount_planned: string | null;
        meta: Meta | null;
      }[]
    >`
      select wedding_id, title, amount_planned, meta
        from planner_items where id = ${itemId} and kind = 'vendor' for update`;
    if (!v) throw new Error("Vendor tidak ditemukan.");

    const copied = v.meta?.copiedBudgetId;
    if (typeof copied === "string") return { budgetItemId: copied, alreadyChosen: true };

    const category = typeof v.meta?.category === "string" ? v.meta.category.trim() : "";
    const title = (category ? `${category}: ${v.title}` : v.title).slice(0, 200);

    const [budget] = await tx<{ id: string }[]>`
      insert into planner_items (wedding_id, kind, title, amount_planned, position)
      values (${v.wedding_id}, 'budget', ${title}, ${v.amount_planned},
              coalesce((select max(p.position) + 1 from planner_items p
                         where p.wedding_id = ${v.wedding_id} and p.kind = 'budget'
                           and p.parent_id is null), 0))
      returning id`;

    await tx`
      update planner_items
         set meta = meta || ${tx.json({ chosen: true, copiedBudgetId: budget!.id })}
       where id = ${itemId}`;

    return { budgetItemId: budget!.id, alreadyChosen: false };
  });
}

// -------------------------------------------------------------------- todo --

/**
 * The starter checklist, so nobody's first visit is an empty page. Offsets are
 * days before `weddings.event_date` — which is why story 2 asks for the date up
 * front: every deadline in the planner counts back from it.
 */
const DEFAULT_TODOS: Array<{ title: string; daysBefore: number }> = [
  { title: "Survei dan booking gedung atau tempat acara", daysBefore: 240 },
  { title: "Booking katering dan jadwal tes makanan", daysBefore: 210 },
  { title: "Booking dokumentasi foto dan video", daysBefore: 200 },
  { title: "Jahit atau sewa busana pengantin", daysBefore: 180 },
  { title: "Booking perias dan jadwal tes rias", daysBefore: 150 },
  { title: "Susun daftar tamu lalu kirim undangan", daysBefore: 120 },
  { title: "Pesan souvenir untuk tamu", daysBefore: 100 },
  { title: "Siapkan seserahan", daysBefore: 90 },
  { title: "Daftar ke KUA atau catatan sipil", daysBefore: 60 },
  { title: "Booking hiburan, band atau organ tunggal", daysBefore: 60 },
  { title: "Tentukan MC dan kirim rundown ke semua vendor", daysBefore: 30 },
];

/** Seeds only when the couple has no todos at all, so re-running is a no-op. */
export async function seedDefaultTodos(
  userId: string,
  weddingId: string,
): Promise<number> {
  return asUser(userId, async (tx) => {
    // Locking the wedding row makes two clicks in flight at once seed once.
    const [w] = await tx<{ event_date: Date | null }[]>`
      select event_date from weddings where id = ${weddingId} for update`;
    if (!w) throw new Error("Pernikahan tidak ditemukan.");

    const [count] = await tx<{ n: number }[]>`
      select count(*)::int as n from planner_items
       where wedding_id = ${weddingId} and kind = 'todo'`;
    if (count!.n > 0) return 0;

    const eventDate = asYmd(w.event_date);
    const seeds = DEFAULT_TODOS.map((t, i) => ({
      wedding_id: weddingId,
      kind: "todo",
      title: t.title,
      position: i,
      due_at: eventDate ? dueFromDate(minusDays(eventDate, t.daysBefore)) : null,
    }));
    await tx`insert into planner_items ${tx(seeds)}`;
    return seeds.length;
  });
}

// ----------------------------------------------------------------- summary --

export type Summary = {
  eventDate: string | null;
  daysLeft: number | null;
  budget: Totals;
  overdueTodos: number;
  dueThisWeek: number;
  openTodos: number;
  savings: SavingsTarget[];
};

/** Story 4: the state of the whole wedding without opening seven pages. */
export async function plannerSummary(
  userId: string,
  weddingId: string,
): Promise<Summary> {
  return asUser(userId, async (tx) => {
    const [w] = await tx<{ event_date: Date | null }[]>`
      select event_date from weddings where id = ${weddingId}`;
    const [t] = await tx<{ overdue: number; week: number; open: number }[]>`
      select
        count(*) filter (where due_at < now())::int                     as overdue,
        count(*) filter (where due_at < now() + interval '7 days')::int as week,
        count(*)::int                                                  as open
        from planner_items
       where wedding_id = ${weddingId} and kind = 'todo' and done_at is null`;

    const eventDate = asYmd(w?.event_date);
    return {
      eventDate,
      daysLeft: eventDate ? daysUntil(eventDate) : null,
      budget: await totals(tx, weddingId),
      overdueTodos: t!.overdue,
      dueThisWeek: t!.week,
      openTodos: t!.open,
      savings: await savings(tx, weddingId),
    };
  });
}

/** Whole days from today in WIB to the wedding. Negative once it has passed. */
export function daysUntil(ymd: string, now = new Date()): number {
  const todayWib = now.toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).slice(0, 10);
  const diff = Date.parse(`${ymd}T00:00:00Z`) - Date.parse(`${todayWib}T00:00:00Z`);
  return Math.round(diff / 86_400_000);
}

export async function saveBasics(
  userId: string,
  weddingId: string,
  basics: { groomName: string; brideName: string; eventDate: string | null },
): Promise<void> {
  const eventDate = basics.eventDate?.trim() || null;
  if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    throw new Error("Tanggal pernikahan tidak valid.");
  }
  await asUser(userId, async (tx) => {
    const [row] = await tx`
      update weddings
         set groom_name = ${basics.groomName.trim().slice(0, 120)},
             bride_name = ${basics.brideName.trim().slice(0, 120)},
             event_date = ${eventDate}
       where id = ${weddingId} returning id`;
    if (!row) throw new Error("Pernikahan tidak ditemukan.");
  });
}

// -------------------------------------------------- rundown share (story 14) --

/**
 * The MC and the vendors need the current rundown without an account. The token
 * lives in `meta.shareToken` on one of the couple's own rundown rows; clearing
 * the key revokes the link. Reading it back has no session, so it goes through
 * the `rundown_by_share_token` security definer function — a select policy on
 * `planner_items` cannot express this without recursing on the same table.
 *
 * ponytail: the token rides on a rundown row instead of a column of its own, so
 * deleting that row revokes the link. Give it a column if links ever need to
 * outlive the rows they describe.
 */
async function shareTokenOf(tx: Tx, weddingId: string): Promise<string | null> {
  const [row] = await tx<{ token: string }[]>`
    select meta->>'shareToken' as token from planner_items
     where wedding_id = ${weddingId} and kind = 'rundown'
       and meta->>'shareToken' is not null
     limit 1`;
  return row?.token ?? null;
}

export const rundownShareToken = (userId: string, weddingId: string) =>
  asUser(userId, (tx) => shareTokenOf(tx, weddingId));

/** Returns null when there is no rundown yet — there is nothing to share. */
export async function ensureRundownShare(
  userId: string,
  weddingId: string,
): Promise<string | null> {
  return asUser(userId, async (tx) => {
    const existing = await shareTokenOf(tx, weddingId);
    if (existing) return existing;

    const [first] = await tx<{ id: string }[]>`
      select id from planner_items
       where wedding_id = ${weddingId} and kind = 'rundown' and parent_id is null
       order by position, created_at limit 1 for update`;
    if (!first) return null;

    const token = urlToken(12);
    await tx`
      update planner_items set meta = meta || ${tx.json({ shareToken: token })}
       where id = ${first.id}`;
    return token;
  });
}

export async function revokeRundownShare(
  userId: string,
  weddingId: string,
): Promise<void> {
  await asUser(userId, (tx) => tx`
    update planner_items set meta = meta - 'shareToken'
     where wedding_id = ${weddingId} and kind = 'rundown'`);
}

export type SharedRundown = {
  groom_name: string;
  bride_name: string;
  event_date: string | null;
  items: Array<{
    id: string;
    title: string;
    note: string;
    due_at: string | null;
    meta: Meta;
  }>;
};

export async function rundownByShareToken(token: string): Promise<SharedRundown | null> {
  if (!token) return null;
  return asAnon(async (tx) => {
    const [row] = await tx<{ d: SharedRundown | null }[]>`
      select rundown_by_share_token(${token}) as d`;
    return row?.d ?? null;
  });
}
