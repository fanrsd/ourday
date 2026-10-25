import type { ComponentType, CSSProperties, ReactNode } from "react";
import type { TemplateProps } from "../props.ts";
import { Countdown, MusicToggle } from "../atoms.tsx";
import {
  EventActions,
  GiftBlock,
  Ground,
  Photo,
  StreamBlock,
  VideoFrame,
} from "../blocks.tsx";
import {
  DISPLAY,
  countdownTarget,
  coupleTitle,
  displayName,
  fmtDate,
  fmtTimeRange,
  fullName,
  galleryPhotos,
  hasGifts,
  safeUrl,
  usableEvents,
  youtubeEmbed,
} from "../parts.ts";
import { CRESTS, RULES } from "./crests.tsx";
import { GROUND_ALPHA, GROUND_MOTIFS, MOTIFS } from "./motifs.tsx";
import { ADAT_PACKS } from "./packs.ts";
import type { AdatId, AdatPalette, AdatShape, Motif } from "./types.ts";

/**
 * The one Adat template. Eight cultures, one page structure, eight data packs —
 * a ninth adat is a pack, not a component and not a copy of this file.
 *
 * The design is the motif and the words. There is no photograph in most of these
 * because most couples publish before the prewedding shoot exists, and an adat
 * invitation that looks unfinished without a photo has failed the couple who
 * needed it most.
 */

/**
 * Adat colour is cultural identity, not a preference: Balinese poleng is black,
 * white and red because that is what poleng *means*, and Minang songket is gold
 * on deep red. Recolouring one into pastel would erase the thing the couple
 * picked it for, so the pack owns every colour and the theme picker is left with
 * the typeface alone.
 *
 * Written out rather than layered over `themeStyle`, which would still mix the
 * discarded palette's accent into `--tint` and put a colour on the page that
 * belongs to no culture.
 */
function packStyle(theme: TemplateProps["theme"], p: AdatPalette): CSSProperties {
  return {
    "--bg": p.bg,
    "--fg": p.fg,
    "--accent": p.accent,
    "--soft": p.soft,
    "--line": p.line,
    "--deep": p.deep,
    "--display": theme.display === "sans" ? "var(--font-sans)" : "var(--font-display)",
  } as CSSProperties;
}

/**
 * The motif at full strength. No text ever sits on it — it is a woven border,
 * the way the real cloth carries one, which is why it can be loud without
 * costing a single point of text contrast.
 *
 * `scale` is left alone: every motif knows the tile size it was drawn for, and
 * a parang blade shrunk to a quarter of it stops being a parang blade. The band
 * is sized to fit one tile instead.
 */
function Band({ motif: M, id, className = "" }: { motif: Motif; id: string; className?: string }) {
  return (
    <div aria-hidden="true" className={"overflow-hidden bg-[var(--soft)] " + className}>
      <M id={id} color="var(--deep)" opacity={0.55} className="h-full w-full" />
    </div>
  );
}

/**
 * The ground the whole invitation is printed on.
 *
 * Fixed rather than flowing: the weave stays put and the content slides over it,
 * which is what a printed cloth does and what a repeating scroll-along tile
 * conspicuously does not. It also means one paint instead of a tile that
 * re-rasterises down the page.
 *
 * Both knobs come from somewhere real. The thread colour is derived from the
 * cloth (`groundInk`), and the weight is the tile's own ink coverage
 * (`GROUND_ALPHA`) — a hairline parang and a half-filled poleng cannot share a
 * number.
 *
 * Where the thread crosses body text it costs contrast, and on the dark packs
 * it costs it in the direction that matters, because there the thread is the
 * light `fg` and it lifts the background toward the text. Measured on all
 * eight: the drop is 0.7 to 1.9 points and the worst surviving ratio is
 * Tionghoa at 9.0:1, still twice AA. These are 9-to-17:1 pairings, so there is
 * room; a pack introduced closer to the line would not have it.
 */
function Weave({
  motif: M,
  id,
  color,
  opacity,
}: {
  motif: Motif;
  id: string;
  color: string;
  opacity: number;
}) {
  return (
    <Ground>
      <M id={id} color={color} opacity={opacity} className="h-full w-full" />
    </Ground>
  );
}

/**
 * A section, built from the pack's shape rather than one shared layout.
 *
 * The rule under a heading is the culture's own mark, and it repeats the whole
 * way down the page — which is the point. A crest on the cover alone would make
 * eight covers differ and eight pages still read the same.
 */
function makeSection(shape: AdatShape) {
  const Rule = shape.rule;
  const start = shape.align === "start";

  return function Section({
    label,
    title,
    children,
    className = "",
  }: {
    label?: string;
    title?: string;
    children: ReactNode;
    className?: string;
  }) {
    return (
      <section className={"od-in px-5 py-14 " + className}>
        <div className={"mx-auto max-w-xl " + (start ? "text-left" : "text-center")}>
          {label ? (
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent)]">{label}</p>
          ) : null}
          {title ? (
            <h2 className={`mt-2 text-[2rem] leading-tight ${DISPLAY}`}>{title}</h2>
          ) : null}
          {label || title ? (
            <Rule
              className={
                "mt-5 h-4 w-[104px] text-[var(--accent)] opacity-70 " + (start ? "" : "mx-auto")
              }
            />
          ) : null}
          <div className={"mt-8 " + (start ? "" : "text-center")}>{children}</div>
        </div>
      </section>
    );
  };
}

/**
 * How a card is bounded. Four carpentries, each one something the culture
 * actually builds — a woven end-band is not a box, and a split gate is not a
 * rectangle with a nice border.
 *
 * `split` is drawn as two top segments with a gap rather than a dashed border,
 * because candi bentar is one gate pulled apart and the gap is the meaning.
 */
function Panel({
  card,
  className = "",
  children,
}: {
  card: AdatShape["card"];
  className?: string;
  children: ReactNode;
}) {
  if (card === "band") {
    return (
      <div className={`border-t-[3px] border-[var(--accent)] bg-[var(--soft)] ${className}`}>
        {children}
      </div>
    );
  }
  if (card === "arch") {
    return (
      <div
        className={`rounded-t-[2.75rem] border border-[var(--line)] bg-[var(--soft)] ${className}`}
      >
        {children}
      </div>
    );
  }
  if (card === "split") {
    return (
      <div className={`relative border border-t-0 border-[var(--line)] ${className}`}>
        <span
          aria-hidden="true"
          className="absolute -top-px left-0 h-px w-[calc(50%-0.75rem)] bg-[var(--line)]"
        />
        <span
          aria-hidden="true"
          className="absolute -top-px right-0 h-px w-[calc(50%-0.75rem)] bg-[var(--line)]"
        />
        {children}
      </div>
    );
  }
  return <div className={`border border-[var(--line)] ${className}`}>{children}</div>;
}

/**
 * WCAG relative luminance. Used twice below, both times at bind time rather
 * than per render.
 */
function relLuminance(hex: string): number {
  const chan = (h: string) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * chan(hex.slice(1, 3)) +
    0.7152 * chan(hex.slice(3, 5)) +
    0.0722 * chan(hex.slice(5, 7))
  );
}

/**
 * The RSVP, wish and QR panels belong to the guest modules: they draw themselves
 * on a near-white surface of their own and take their ink from `--accent`. Five
 * accents are dark enough for that. Minang, Tionghoa and Bugis are gold, which
 * on white is about 2:1 and unreadable, so those packs hand the panels their
 * `deep` instead — dark in all eight.
 *
 * WCAG: the ratio against white is 1.05 / (L + 0.05), so L <= 0.1833 is the
 * 4.5:1 line.
 */
function panelInk({ accent, deep }: AdatPalette): string {
  return relLuminance(accent) <= 0.1833 ? accent : deep;
}

/**
 * The thread the ground is woven in.
 *
 * `deep` is the obvious pick and it is wrong for half the catalogue: Minang,
 * Tionghoa and Bugis are dark cloth whose `deep` is darker still, so a ground
 * drawn in it is black thread on a black field and the page goes back to being
 * flat. Dark cloth is woven in light thread — which is what songket and the
 * gold-on-red Tionghoa lattice actually are — so the pack's own `fg`, already
 * proven readable on that background, becomes the thread.
 */
function groundInk(p: AdatPalette): string {
  return relLuminance(p.bg) < 0.2 ? p.fg : p.deep;
}

/**
 * How heavily the crest may be drawn before it takes the names with it.
 *
 * The crest is five times the weight of the ground and its lines run straight
 * through the couple's names, so the sums that were comfortable there are not
 * comfortable here. Tionghoa is the case that proves it: bright gold at 0.22
 * over dark red lifts the background so far toward the cream text that the
 * pair lands at 4.28:1 — under AA, on the one line of the invitation nobody is
 * allowed to have to squint at.
 *
 * Derived rather than tabled: walk the weight down from the ceiling and take
 * the first that clears the target. A palette change re-solves itself, and a
 * ninth adat cannot ship a crest that eats its own names. Targets 5:1 rather
 * than 4.5 so a rounding error is not the thing standing between a guest and
 * the address. Runs once per pack at bind time.
 */
export function crestAlpha({ bg, fg, accent }: AdatPalette): number {
  const l = (c: number[]) => 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
  const ch = (h: string) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const rgb = (h: string) => [1, 3, 5].map((i) => ch(h.slice(i, i + 2)));
  const lf = relLuminance(fg);

  for (let a = 22; a >= 4; a--) {
    const mixed = rgb(bg).map((c, i) => c * (1 - a / 100) + rgb(accent)[i]! * (a / 100));
    const lm = l(mixed);
    if ((Math.max(lf, lm) + 0.05) / (Math.min(lf, lm) + 0.05) >= 5) return a / 100;
  }
  return 0.04;
}

/**
 * The carpentry and the reading axis of each culture, joined with its drawings
 * in `makeAdat` to make one `AdatShape`.
 *
 * `align` is off-centre for exactly two. Most Indonesian adat stationery is
 * centred and setting some of it left purely for variety would be inventing a
 * tradition to solve a design problem — the same mistake as recolouring poleng.
 * Batak gorga is a banded carving that reads along its length, and Bugis
 * sulapa' eppa is corner-oriented geometry; those two earn it.
 */
const STRUCTURE: Record<AdatId, Pick<AdatShape, "card" | "align">> = {
  jawa: { card: "arch", align: "center" }, // gunungan crowns what it covers
  sunda: { card: "band", align: "center" }, // mega mendung stacks in layers
  minang: { card: "arch", align: "center" }, // gonjong sweeps the roofline up
  batak: { card: "band", align: "start" }, // ulos is a woven end-band
  bali: { card: "split", align: "center" }, // candi bentar is a gate pulled apart
  tionghoa: { card: "frame", align: "center" }, // formal rectilinear enclosure
  bugis: { card: "frame", align: "start" }, // sulapa' eppa, four square sides
  melayu: { card: "arch", align: "center" }, // the ogee arch
};

/**
 * Binds one culture to the shared layout. `TemplateProps` deliberately does not
 * carry the template id — no other template needs it — so the id is closed over
 * here and `index.ts` binds the eight.
 */
export function makeAdat(id: AdatId): ComponentType<TemplateProps> {
  const pack = ADAT_PACKS[id];
  const Mo = MOTIFS[id];
  const { vocab } = pack;
  // Both resolved once per pack at bind time, not per render.
  const slotStyle = { "--accent": panelInk(pack.palette) } as CSSProperties;
  // Bands always use the pack's own motif; the ground may differ where that
  // motif is a banner rather than a wall. See GROUND_MOTIFS.
  const GroundMo = GROUND_MOTIFS[id] ?? Mo;
  const thread = groundInk(pack.palette);
  const weave = GROUND_ALPHA[id];

  // Drawings from crests.tsx, carpentry from STRUCTURE: one shape per culture,
  // resolved once. Section is built here for the same reason — its rule and its
  // alignment belong to the pack, not to a prop threaded through every call.
  const shape: AdatShape = { crest: CRESTS[id], rule: RULES[id], ...STRUCTURE[id] };
  const Section = makeSection(shape);
  const Crest = shape.crest;
  const crestInk = crestAlpha(pack.palette);

  function Adat({ content, theme, guestName, rsvpSlot, wishSlot, qrSlot, rundownSlot }: TemplateProps) {
    const events = usableEvents(content);
    const photos = galleryPhotos(content);
    const cover = safeUrl(content.couple.coverPhoto);
    const music = safeUrl(content.music);
    const video = youtubeEmbed(content.video);
    const stream = safeUrl(content.stream);
    const target = countdownTarget(content);
    const title = coupleTitle(content);
    const groom = displayName(content.couple.groom);
    const bride = displayName(content.couple.bride);

    return (
      <div
        style={packStyle(theme, pack.palette)}
        className="relative isolate min-h-dvh bg-[var(--bg)] text-[var(--fg)] antialiased"
      >
        <Weave motif={GroundMo} id={`${id}-ground`} color={thread} opacity={weave} />
        {music ? <MusicToggle src={music} /> : null}

        {/* The cover is a cloth, not a page: bands at both ends the way a real
            songket or ulos carries them, and a hairline inset standing in for
            the stitched edge between the border and the field. Two ends rather
            than four sides because these are woven rules — a 45-degree parang
            sliced into a 12px vertical rail stops being a parang, which is the
            same reason `Band` never rescales the tile. */}
        <header className="relative px-3 pt-3 sm:px-5 sm:pt-5">
          <div className="relative overflow-hidden border border-[var(--line)]">
            <Band motif={Mo} id={`${id}-band-a`} className="h-20 sm:h-24" />

            <div className="od-hero relative isolate px-5 py-16 text-center sm:py-20">
              {/* The culture's own enclosure, behind the names and inset from
                  the bands so the two do not argue. This is the line that makes
                  eight covers eight covers: a gunungan and a candi bentar are
                  not the same page in different colours. Drawn in `currentColor`
                  so the ink is set here and the drawing stays reusable. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 inset-y-8 -z-10 text-[var(--accent)]"
                style={{ opacity: crestInk }}
              >
                <Crest className="h-full w-full" />
              </div>
              <p className={`text-[1.1rem] text-[var(--accent)] ${DISPLAY}`}>{vocab.greeting}</p>
              <p className="mt-6 text-[10px] uppercase tracking-[0.32em] opacity-70">
                {vocab.invitationLabel}
              </p>
              <h1 className={`mt-4 text-[2.7rem] leading-[1.05] sm:text-[3.4rem] ${DISPLAY}`}>
                {groom || "Mempelai"}
                <span className="my-1 block text-[0.4em] text-[var(--accent)]">&amp;</span>
                {bride || "Mempelai"}
              </h1>
              {events[0] ? (
                <p className="mx-auto mt-7 max-w-[16rem] border-y border-[var(--line)] py-3 text-[0.86rem]">
                  {fmtDate(events[0].startsAt)}
                </p>
              ) : null}
              {guestName ? (
                <p className="mt-7 text-[0.85rem]">
                  <span className="opacity-65">Kepada </span>
                  <span className="font-medium">{guestName}</span>
                </p>
              ) : null}
            </div>

            <Band motif={Mo} id={`${id}-band-b`} className="h-20 sm:h-24" />
          </div>

          {/* Still no empty viewport-height rectangle when there is no photo:
              the cloth finishes the cover on its own. */}
          {cover ? (
            <div className="relative mt-3 h-[58svh] overflow-hidden border border-[var(--line)] sm:mt-5">
              <Photo priority src={cover} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}
        </header>

        {/* No eyebrow here: the pack's own coupleTitle is the heading, and the
            invitation label already appears once, on the cover. */}
        <Section title={vocab.coupleTitle}>
          <div className="grid gap-8">
            {[
              { p: content.couple.groom, line: vocab.groomLine },
              { p: content.couple.bride, line: vocab.brideLine },
            ].map(({ p, line }, i) => {
              const photo = safeUrl(p.photo);
              const ig = p.instagram?.trim().replace(/^@/, "");
              return (
                <Panel key={i} card={shape.card} className="p-6 text-center">
                  {photo ? (
                    <Photo
                      src={photo}
                      alt={fullName(p)}
                      className="mx-auto mb-5 h-28 w-28 rounded-full object-cover"
                    />
                  ) : null}
                  <h3 className={`text-[1.5rem] leading-tight ${DISPLAY}`}>{fullName(p)}</h3>
                  {p.parents?.trim() ? (
                    <p className="mt-3 text-[0.82rem] leading-relaxed opacity-80">
                      {line} {p.parents.trim()}
                    </p>
                  ) : null}
                  {ig ? (
                    <a
                      href={`https://instagram.com/${ig}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-3 inline-block text-[0.76rem] text-[var(--accent)]"
                    >
                      @{ig}
                    </a>
                  ) : null}
                </Panel>
              );
            })}
          </div>
        </Section>

        {events.length ? (
          <Section label="Waktu & tempat" title={vocab.eventsTitle}>
            <div className="grid gap-5">
              {events.map((ev, i) => (
                <Panel key={i} card={shape.card} className="p-6">
                  <h3 className={`text-[1.45rem] leading-tight ${DISPLAY}`}>
                    {ev.name || "Acara"}
                  </h3>
                  <div
                    aria-hidden="true"
                    className="mt-3 h-px w-10 bg-[var(--accent)] opacity-60"
                  />
                  <div className="mt-4 grid gap-1.5 text-[0.88rem]">
                    <p className="flex gap-2.5">
                      <span className="w-16 shrink-0 opacity-60">Tanggal</span>
                      <span>{fmtDate(ev.startsAt)}</span>
                    </p>
                    {fmtTimeRange(ev.startsAt, ev.endsAt) ? (
                      <p className="flex gap-2.5">
                        <span className="w-16 shrink-0 opacity-60">Waktu</span>
                        <span className="tabular">{fmtTimeRange(ev.startsAt, ev.endsAt)}</span>
                      </p>
                    ) : null}
                    {ev.venue?.trim() ? (
                      <p className="flex gap-2.5">
                        <span className="w-16 shrink-0 opacity-60">Tempat</span>
                        <span>
                          <span className="font-medium">{ev.venue.trim()}</span>
                          {ev.address?.trim() ? (
                            <span className="mt-0.5 block text-[0.8rem] leading-relaxed opacity-75">
                              {ev.address.trim()}
                            </span>
                          ) : null}
                        </span>
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-5">
                    <EventActions ev={ev} title={title} />
                  </div>
                </Panel>
              ))}
            </div>
          </Section>
        ) : null}

        {/* On the page, not in a white card: this is a schedule the design owns,
            so it keeps the pack's palette rather than the slot override. */}
        <div className="od-in empty:hidden px-5 py-10">{rundownSlot}</div>

        {target ? (
          <Section label="Menuju hari itu">
            <Countdown target={target} />
          </Section>
        ) : null}

        {content.story.length ? (
          <Section label="Perjalanan" title="Cerita Kami">
            <ol className="grid gap-6">
              {content.story.map((m, i) => (
                <li key={i} className="border-l-2 border-[var(--accent)] pl-5">
                  {m.date ? (
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
                      {fmtDate(m.date, "short") ?? m.date}
                    </p>
                  ) : null}
                  {m.title ? (
                    <h3 className={`mt-1.5 text-[1.3rem] leading-tight ${DISPLAY}`}>{m.title}</h3>
                  ) : null}
                  {m.body ? (
                    <p className="mt-2 text-[0.86rem] leading-relaxed opacity-80">{m.body}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </Section>
        ) : null}

        {photos.length ? (
          <Section label="Galeri" title="Momen Kami">
            <div className="columns-2 gap-3 [&>img]:mb-3">
              {photos.map((src, i) => (
                <Photo key={i} src={src} alt={`Foto ${i + 1}`} className="w-full object-cover" />
              ))}
            </div>
          </Section>
        ) : null}

        {video ? (
          <Section label="Video">
            <VideoFrame embed={video} />
          </Section>
        ) : null}

        {hasGifts(content) ? (
          <Section label="Tanda kasih" title="Kirim Hadiah">
            <p className="mb-7 text-center text-[0.86rem] leading-relaxed opacity-80">
              Doa dan kehadiran Anda adalah hadiah terbaik. Bila ingin mengirim tanda kasih,
              silakan gunakan kanal berikut.
            </p>
            <GiftBlock gifts={content.gifts} />
          </Section>
        ) : null}

        {stream ? (
          <Section label="Live streaming">
            <div className="flex justify-center">
              <StreamBlock href={stream} />
            </div>
          </Section>
        ) : null}

        {/* Two overrides, both because these panels are white cards on a page
            that may be dark: the body text they inherit becomes `--deep`, and
            `--accent`, which they use for their heading and submit button,
            becomes an ink that passes on white. */}
        <div style={slotStyle} className="od-in empty:hidden px-5 py-8 text-[var(--deep)]">
          {rsvpSlot}
        </div>
        <div style={slotStyle} className="od-in empty:hidden px-5 py-8 text-[var(--deep)]">
          {wishSlot}
        </div>
        <div style={slotStyle} className="od-in empty:hidden px-5 py-6 text-[var(--deep)]">
          {qrSlot}
        </div>

        {/* The weave already runs behind this from `Ground`, so the old
            accent wash here would only stack a second layer on the one part of
            the page that had it twice. The cloth closes the way it opened. */}
        <footer className="relative px-5 pb-14 pt-10 text-center">
          <div className="mx-auto max-w-sm">
            <p className={`text-[1.35rem] leading-relaxed ${DISPLAY}`}>{vocab.closing}</p>
            <div
              aria-hidden="true"
              className="mx-auto my-6 h-px w-20 bg-[var(--accent)] opacity-60"
            />
            <p className="text-[0.84rem] opacity-80">
              {groom && bride ? `${groom} & ${bride}` : title}
            </p>
          </div>
          <p className="mt-12 text-[10px] uppercase tracking-[0.26em] opacity-50">
            <a href="/">Dibuat dengan OurDay</a>
          </p>
        </footer>

        <Band motif={Mo} id={`${id}-band-end`} className="h-16 sm:h-20" />
      </div>
    );
  }

  Adat.displayName = `Adat(${id})`;
  return Adat;
}
