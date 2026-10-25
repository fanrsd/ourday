import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { after } from "next/server";
import { PALETTES } from "@/lib/invitation-content.ts";
import { getPublicInvitation, invitationTag, isExpired } from "@/lib/invitations.ts";
import { TEMPLATE_COMPONENTS } from "@/lib/templates/index.ts";
import { displayName, fmtDate, safeUrl, usableEvents } from "@/lib/templates/parts.ts";
import { findGuestByToken, markInvitationOpened } from "@/lib/guests.ts";
import { findRsvpByToken } from "@/lib/rsvp.ts";
import { RsvpForm } from "@/components/rsvp/rsvp-form.tsx";
import { WishWall } from "@/components/rsvp/wish-wall.tsx";
import { GuestQr } from "@/components/checkin/guest-qr.tsx";
import { RundownTimeline } from "@/components/invitation/rundown-timeline.tsx";

/**
 * The guest's page, and the one page in this product that has no second chance:
 * four hundred people open it over a few hours on a weekend, many of them on a
 * phone inside a building with bad signal.
 *
 * So the document is read through the data cache and tagged, and publishing or
 * editing busts that tag. The render itself is per-request — it has to be, since
 * `?to=` personalises it and stamps `first_opened_at` — but a request that finds
 * a warm cache never touches Postgres for the invitation at all.
 */
const readInvitation = (slug: string) =>
  unstable_cache(() => getPublicInvitation(slug), ["undangan", slug], {
    tags: [invitationTag(slug)],
    // A backstop, not the mechanism: publish and edit revalidate the tag
    // immediately. This only bounds how long a lapsed order keeps serving.
    revalidate: 300,
  })();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const inv = await readInvitation(slug);
  if (!inv || isExpired(inv)) {
    return { title: { absolute: "Undangan tidak tersedia" }, robots: { index: false } };
  }

  const names = [displayName(inv.content.couple.groom), displayName(inv.content.couple.bride)]
    .filter(Boolean)
    .join(" & ");
  const title = names ? `Undangan Pernikahan ${names}` : "Undangan Pernikahan";
  const ev = usableEvents(inv.content)[0];
  const description = ev
    ? [fmtDate(ev.startsAt), ev.venue?.trim()].filter(Boolean).join(" · ") +
      ". Kami mengharap kehadiran Anda."
    : "Kami mengharap kehadiran Anda.";
  const image = safeUrl(inv.content.couple.coverPhoto);

  return {
    // Absolute: the couple's link should preview as their invitation, not ours.
    title: { absolute: title },
    description,
    // A wedding invitation is personal. Findable by link, not by search.
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: `/u/${slug}`,
      type: "website",
      locale: "id_ID",
      ...(image ? { images: [image] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary" },
  };
}

export default async function PublicInvitation({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string | string[] }>;
}) {
  const { slug } = await params;
  const inv = await readInvitation(slug);
  if (!inv) notFound();
  if (isExpired(inv)) return <Expired />;

  const raw = (await searchParams).to;
  // Tokens are uppercase base32; a link that lost its case still works.
  const token = (Array.isArray(raw) ? raw[0] : raw)?.trim().toUpperCase() ?? "";
  const found = token ? await findGuestByToken(token) : null;
  // Someone else's token is not a greeting: it must belong to this wedding.
  const guest = found && found.wedding_id === inv.weddingId ? found : null;

  if (guest) {
    // Off the critical path. The guest is here to read an address, not to wait
    // for us to record that they arrived.
    after(() => markInvitationOpened(guest.token));
  }

  const initial = guest ? await findRsvpByToken(guest.token) : null;
  const palette = PALETTES[inv.theme.palette] ?? PALETTES.sand;
  const Template = TEMPLATE_COMPONENTS[inv.templateId];

  return (
    <Template
      content={inv.content}
      theme={inv.theme}
      palette={palette}
      guestName={guest?.name ?? null}
      slug={inv.slug}
      rsvpSlot={
        <RsvpForm
          weddingId={inv.weddingId}
          guestToken={guest?.token ?? null}
          paxAllowed={guest?.pax_allowed ?? 2}
          deadlinePassed={inv.deadlinePassed}
          initial={initial}
          guestName={guest?.name ?? ""}
          accent={palette.accent}
        />
      }
      wishSlot={
        <WishWall
          weddingId={inv.weddingId}
          guestToken={guest?.token ?? null}
          guestName={guest?.name ?? ""}
          accent={palette.accent}
        />
      }
      rundownSlot={inv.rundown.length ? <RundownTimeline items={inv.rundown} /> : null}
      qrSlot={
        guest ? (
          <GuestQr token={guest.token} guestName={guest.name} accent={palette.accent} />
        ) : null
      }
    />
  );
}

/**
 * The order lapsed. Not a 404 — the invitation existed and the guest's link was
 * not wrong — and not a crash. Just a quiet full stop.
 */
function Expired() {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-6 py-20 text-center">
      <div className="max-w-sm">
        <p className="text-[10px] uppercase tracking-[0.32em] text-ink-soft">OurDay</p>
        <h1 className="mt-6 font-display text-3xl leading-tight">Undangan sudah berakhir</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          Masa aktif undangan ini telah selesai, jadi halamannya tidak lagi
          ditampilkan. Bila kamu masih membutuhkan informasi acara, silakan
          hubungi mempelai secara langsung.
        </p>
        <p className="mt-10 text-xs text-ink-soft">
          Mempelai:{" "}
          <a href="/tagihan" className="underline underline-offset-4">
            perpanjang masa aktif
          </a>
        </p>
      </div>
    </main>
  );
}
