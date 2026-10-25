import { withCtx } from "./db.ts";
import { asUser } from "./wedding.ts";
import { requireProduct } from "./products.ts";
import {
  normaliseContent,
  normaliseTheme,
  type InvitationContent,
  type InvitationTheme,
} from "./invitation-content.ts";
import { DEFAULT_TEMPLATE, isTemplateId, type TemplateId } from "./templates/registry.ts";
import { slugify } from "./ids.ts";

/**
 * The invitation is one document, and this file is the only place that reads or
 * writes it. Everything below is deliberately forgiving on the way out and
 * strict on the way in: a half-filled draft must still render on a phone at a
 * reception, but a bad slug must never reach the database and come back as a
 * Postgres error string.
 */

/** Same expression as the check constraint on invitations.slug. Kept here so a
 *  typo is a friendly sentence, not a 23514 from Postgres. */
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

const SLUG_HELP =
  "Alamat undangan hanya boleh berisi huruf kecil, angka, dan tanda hubung, " +
  "panjang 3–50 karakter, dan tidak boleh diawali atau diakhiri tanda hubung.";

export type Invitation = {
  id: string;
  weddingId: string;
  slug: string;
  templateId: TemplateId;
  theme: InvitationTheme;
  content: InvitationContent;
  status: "draft" | "published";
  /** ISO string, not a Date: this crosses the server-action boundary. */
  rsvpDeadline: string | null;
};

type Row = {
  id: string;
  wedding_id: string;
  slug: string;
  template_id: string;
  theme: unknown;
  content: unknown;
  status: string;
  rsvp_deadline: Date | null;
};

function hydrate(r: Row): Invitation {
  return {
    id: r.id,
    weddingId: r.wedding_id,
    // A template can be retired; an invitation that references it must still open.
    templateId: isTemplateId(r.template_id) ? r.template_id : DEFAULT_TEMPLATE,
    slug: r.slug,
    theme: normaliseTheme(r.theme),
    content: normaliseContent(r.content),
    status: r.status === "published" ? "published" : "draft",
    rsvpDeadline: r.rsvp_deadline ? r.rsvp_deadline.toISOString() : null,
  };
}

// ------------------------------------------------------------------ editing --

/** One draft per wedding. The slug is guessed from the couple's names so the
 *  first thing they see is already `/u/dimas-sari`, not a blank field. */
export async function getOrCreateInvitation(
  userId: string,
  weddingId: string,
): Promise<Invitation> {
  return asUser(userId, async (tx) => {
    // ponytail: two simultaneous first-loads could both insert. `order by
    // created_at limit 1` makes the loser invisible rather than an error. A
    // partial unique index on wedding_id is the fix if it ever actually happens.
    const [existing] = await tx<Row[]>`
      select * from invitations where wedding_id = ${weddingId}
       order by created_at limit 1`;
    if (existing) return hydrate(existing);

    // RLS already stops a non-member here; an empty read means "not yours".
    const [w] = await tx<{ groom_name: string; bride_name: string }[]>`
      select groom_name, bride_name from weddings where id = ${weddingId}`;
    if (!w) throw new Error("FORBIDDEN");

    const seed = normaliseContent({
      couple: {
        groom: { fullName: w.groom_name },
        bride: { fullName: w.bride_name },
      },
    });

    for (const slug of slugCandidates(w.groom_name, w.bride_name)) {
      const [row] = await tx<Row[]>`
        insert into invitations (wedding_id, slug, template_id, content)
        values (${weddingId}, ${slug}, ${DEFAULT_TEMPLATE}, ${tx.json(seed)})
        on conflict (slug) do nothing
        returning *`;
      if (row) return hydrate(row);
    }
    throw new Error("Gagal menyiapkan alamat undangan. Coba muat ulang halaman.");
  });
}

function* slugCandidates(groom: string, bride: string): Generator<string> {
  let base = slugify([groom, bride].filter(Boolean).join(" "))
    .slice(0, 40)
    .replace(/-+$/, "");
  if (!SLUG_RE.test(base)) base = "undangan";
  yield base;
  // Not a secret, so Math.random is the right tool: it only has to not collide.
  for (let i = 0; i < 6; i++) yield `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

export type InvitationPatch = {
  content?: InvitationContent;
  theme?: InvitationTheme;
  templateId?: string;
  slug?: string;
  /** Present-but-null clears the deadline; absent leaves it alone. */
  rsvpDeadline?: string | null;
};

export async function updateInvitation(
  userId: string,
  id: string,
  patch: InvitationPatch,
): Promise<Invitation> {
  let templateId: string | null = null;
  if (patch.templateId !== undefined) {
    if (!isTemplateId(patch.templateId)) throw new Error("Template itu tidak dikenal.");
    templateId = patch.templateId;
  }

  let slug: string | null = null;
  if (patch.slug !== undefined) {
    slug = patch.slug.trim().toLowerCase();
    if (!SLUG_RE.test(slug)) throw new Error(SLUG_HELP);
  }

  const touchDeadline = "rsvpDeadline" in patch;
  let deadline: string | null = null;
  if (touchDeadline && patch.rsvpDeadline) {
    const at = Date.parse(patch.rsvpDeadline);
    if (Number.isNaN(at)) throw new Error("Batas RSVP itu bukan tanggal yang valid.");
    deadline = new Date(at).toISOString();
  }

  const { inv, prevSlug } = await asUser(userId, async (tx) => {
    const [before] = await tx<Row[]>`select * from invitations where id = ${id}`;
    if (!before) throw new Error("FORBIDDEN");

    // The document is merged here rather than in SQL. An invitation is always
    // read whole and written whole, so there is nothing for coalesce to do, and
    // a jsonb column must be handed an object via tx.json(): a pre-stringified
    // string lands as a jsonb *string* scalar and every ->> on it returns null.
    const [row] = await tx<Row[]>`
      update invitations set
        content       = ${tx.json(patch.content ? normaliseContent(patch.content) : normaliseContent(before.content))},
        theme         = ${tx.json(patch.theme ? normaliseTheme(patch.theme) : normaliseTheme(before.theme))},
        template_id   = ${templateId ?? before.template_id},
        slug          = ${slug ?? before.slug},
        rsvp_deadline = ${touchDeadline ? deadline : before.rsvp_deadline},
        updated_at    = now()
       where id = ${id}
      returning *`.catch((err: { code?: string; constraint_name?: string }) => {
      // Two couples racing for the same address is ordinary, not exceptional, so
      // the message is shaped here rather than sniffed out of a driver string by
      // whoever happens to catch it.
      if (err.code === "23505" && err.constraint_name === "invitations_slug_key") {
        throw new Error("Alamat undangan itu sudah dipakai. Coba yang lain.");
      }
      throw err;
    });
    return { inv: hydrate(row!), prevSlug: before.slug };
  });

  if (inv.status === "published") {
    await revalidateInvitation(inv.slug);
    if (prevSlug !== inv.slug) await revalidateInvitation(prevSlug);
  }
  return inv;
}

/** Everything standing between this draft and a link the couple can send.
 *  Exported so the editor can show the reason before the button is pressed. */
export function publishBlockers(content: InvitationContent): string[] {
  const out: string[] = [];
  const { groom, bride } = content.couple;
  if (!(groom.fullName || groom.nickName || "").trim() ||
      !(bride.fullName || bride.nickName || "").trim()) {
    out.push("Nama kedua mempelai belum diisi.");
  }
  // A date good enough to print and a place good enough to drive to. Events
  // come out of jsonb, so an entry can be anything at all.
  const usable = content.events.some(
    (e) =>
      e &&
      typeof e.startsAt === "string" &&
      /^\d{4}-\d{2}-\d{2}/.test(e.startsAt) &&
      !Number.isNaN(Date.parse(e.startsAt.slice(0, 10))) &&
      (e.venue ?? "").trim() !== "",
  );
  if (!usable) out.push("Butuh minimal satu acara dengan tanggal dan nama tempat.");
  return out;
}

export async function publishInvitation(userId: string, id: string): Promise<Invitation> {
  const inv = await asUser(userId, async (tx) => {
    const [row] = await tx<Row[]>`select * from invitations where id = ${id}`;
    if (!row) throw new Error("FORBIDDEN");

    // Paid first: publishing is the moment the product is actually delivered.
    await requireProduct(tx, row.wedding_id, "invitation");

    const blockers = publishBlockers(normaliseContent(row.content));
    if (blockers.length) throw new Error(blockers.join(" "));

    const [done] = await tx<Row[]>`
      update invitations set status = 'published', updated_at = now()
       where id = ${id} returning *`;
    return hydrate(done!);
  });

  await revalidateInvitation(inv.slug);
  return inv;
}

export const invitationTag = (slug: string) => `undangan:${slug}`;

/**
 * Next's caches only exist inside a request or a build. Tests and scripts call
 * the same functions, so the miss is expected rather than exceptional.
 *
 * The import must stay dynamic: `next/cache` is a bundler-only specifier that
 * plain Node cannot resolve, so a static import would break every test that
 * touches this module.
 */
export async function revalidateInvitation(slug: string) {
  try {
    const { revalidatePath, revalidateTag } = await import("next/cache");
    revalidateTag(invitationTag(slug));
    revalidatePath(`/u/${slug}`);
  } catch {
    // No cache context: there is nothing cached to bust.
  }
}

/**
 * A planner edit can change what a guest sees, because the invitation renders
 * the rundown rows the couple ticked. Publishing and editing the invitation bust
 * this tag already; this is the third writer, and it lives here so the planner
 * never has to know how the guest's page is cached.
 *
 * Silent when the couple has no published invitation — most weddings building a
 * rundown do not have one yet.
 */
export async function revalidateWeddingInvitation(userId: string, weddingId: string) {
  const [row] = await asUser(userId, (tx) => tx<{ slug: string }[]>`
    select slug from invitations
     where wedding_id = ${weddingId} and status = 'published' limit 1`);
  if (row) await revalidateInvitation(row.slug);
}

// ------------------------------------------------------------------- public --

/**
 * One guest-visible rundown row. `at` is the raw timestamptz — the caller
 * formats it, so this stays a data type and not a presentation one.
 */
export type PublicRundownItem = { title: string; note: string; at: string | null };

export type PublicInvitation = {
  weddingId: string;
  slug: string;
  templateId: TemplateId;
  theme: InvitationTheme;
  content: InvitationContent;
  rsvpDeadline: string | null;
  deadlinePassed: boolean;
  /**
   * The sessions the couple ticked in the planner. Empty for every wedding that
   * has not ticked any, which is the default — this section simply does not
   * appear rather than rendering an empty heading.
   */
  rundown: PublicRundownItem[];
};

/** Three outcomes, because the guest sees three different pages. */
export type PublicRead = PublicInvitation | { expired: true } | null;

export const isExpired = (r: PublicRead): r is { expired: true } =>
  r !== null && "expired" in r;

/**
 * The guest's read. No identity at all: `inv_read` lets the world see published
 * rows, and nothing else about the wedding is touched.
 *
 * Entitlement cannot be read this way — `orders` is members-only — so it comes
 * from the definer function, which answers one boolean about a wedding that is
 * already public and reveals no amounts or order ids.
 */
export async function getPublicInvitation(slug: string): Promise<PublicRead> {
  return withCtx({}, async (tx) => {
    const [row] = await tx<Row[]>`
      select * from invitations where slug = ${slug} and status = 'published'`;
    if (!row) return null;

    // Entitlement, one boolean at a time.
    const [paid] = await tx<{ ok: boolean }[]>`
      select app_has_product(${row.wedding_id}, 'invitation') as ok`;
    if (!paid?.ok) return { expired: true };

    // The schedule the couple chose to publish. Read after the entitlement
    // check, so a lapsed invitation never leaks a rundown it stopped paying to
    // show, and inside the same cached read — one round trip, one cache entry.
    const rundown = await tx<{ title: string; note: string; due_at: Date | null }[]>`
      select title, note, due_at from public_rundown(${row.wedding_id})`;

    const inv = hydrate(row);
    return {
      weddingId: inv.weddingId,
      slug: inv.slug,
      templateId: inv.templateId,
      theme: inv.theme,
      content: inv.content,
      rsvpDeadline: inv.rsvpDeadline,
      deadlinePassed: inv.rsvpDeadline ? Date.parse(inv.rsvpDeadline) < Date.now() : false,
      rundown: rundown.map((r) => ({
        title: r.title,
        note: r.note ?? "",
        at: r.due_at ? r.due_at.toISOString() : null,
      })),
    };
  });
}
