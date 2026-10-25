import type { ReactNode } from "react";
import type { InvitationContent, WeddingEvent } from "../invitation-content.ts";
import { CopyNumber } from "./atoms.tsx";
import { icsDataUrl, mapsHref } from "./parts.ts";

/**
 * Server-rendered pieces whose *look* is the same in every template even though
 * their placement is not: a calendar link is a calendar link. Anything that
 * differs between designs stays in the design.
 */

/**
 * The layer a design is printed on, behind everything and out of the way.
 *
 * Fixed rather than flowing, so the ground stays put and the invitation slides
 * over it — a printed surface does not scroll with the ink, and it costs one
 * paint instead of a tile that re-rasterises down a long page.
 *
 * The negative z is the whole trick, and it only works inside a root that
 * carries `isolate`: in paint order a negative-z child lands above the root's
 * own background colour and below every in-flow section. A plain fixed layer is
 * a positioned element and would paint over the text instead of under it.
 *
 * What goes inside is the caller's business — a motif tile, a wash, a gradient.
 */
export function Ground({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      {children}
    </div>
  );
}

/** Uploaded photos are never critical path: none of them block first paint. */
export function Photo({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={className}
    />
  );
}

export function Pill({ href, children }: { href: string; children: ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--tint)] px-4 py-2 text-[0.8rem] transition-colors hover:bg-[var(--soft)]"
    >
      {children}
    </a>
  );
}

/** The two things a guest actually does with an event: put it in their calendar
 *  and open it in their maps app. */
export function EventActions({ ev, title }: { ev: WeddingEvent; title: string }) {
  const maps = mapsHref(ev);
  const ics = icsDataUrl(ev, title);
  if (!maps && !ics) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {maps ? <Pill href={maps}>Lihat lokasi</Pill> : null}
      {ics ? (
        // download so the browser hands the .ics to the calendar app rather
        // than trying to render text/calendar itself.
        <a
          href={ics}
          download={`${(ev.name || "acara").replace(/[^\w-]+/g, "-").toLowerCase()}.ics`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--tint)] px-4 py-2 text-[0.8rem] transition-colors hover:bg-[var(--soft)]"
        >
          Simpan ke kalender
        </a>
      ) : null}
    </div>
  );
}

/** Takes the resolved embed url, not the raw field: the template has to know
 *  whether there is a video *before* it decides to draw a heading over it. */
export function VideoFrame({ embed, className = "" }: { embed: string; className?: string }) {
  return (
    <div
      className={
        "aspect-video w-full overflow-hidden rounded-2xl border border-[var(--line)] " + className
      }
    >
      <iframe
        src={embed}
        title="Video prewedding"
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}

/** Digital envelopes. Every number is a copy button, because the guest is doing
 *  this one-handed inside a banking app. */
export function GiftBlock({ gifts }: { gifts: InvitationContent["gifts"] }) {
  const banks = gifts.banks.filter((b) => b && (b.number ?? "").trim());
  const wallets = gifts.ewallets.filter((b) => b && (b.number ?? "").trim());
  const shipping = gifts.shippingAddress?.trim();

  return (
    <div className="mx-auto grid max-w-sm gap-2.5">
      {[...banks, ...wallets].map((b, i) => (
        <div key={i} className="grid gap-1">
          <CopyNumber value={b.number.trim()} label={b.bank || "Rekening"} />
          {b.holder?.trim() ? (
            <span className="px-1 text-[0.72rem] opacity-60">a.n. {b.holder.trim()}</span>
          ) : null}
        </div>
      ))}
      {shipping ? (
        <div className="rounded-xl border border-[var(--line)] px-3.5 py-3">
          <span className="block text-[11px] uppercase tracking-[0.16em] opacity-55">
            Kirim hadiah ke
          </span>
          <span className="mt-0.5 block whitespace-pre-line text-[0.9rem]">{shipping}</span>
        </div>
      ) : null}
    </div>
  );
}

export function StreamBlock({ href }: { href: string }) {
  return <Pill href={href}>Tonton live streaming</Pill>;
}
