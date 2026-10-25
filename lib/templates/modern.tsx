import type { ReactNode } from "react";
import type { TemplateProps } from "./props.ts";
import { Countdown, MusicToggle } from "./atoms.tsx";
import { EventActions, GiftBlock, Photo, StreamBlock, VideoFrame } from "./blocks.tsx";
import {
  DISPLAY,
  countdownTarget,
  coupleTitle,
  dateParts,
  displayName,
  fmtDate,
  fmtTimeRange,
  fullName,
  galleryPhotos,
  hasGifts,
  safeUrl,
  themeStyle,
  usableEvents,
  youtubeEmbed,
} from "./parts.ts";

/**
 * Modern — nothing is centred, the type is enormous, and the grid is visible.
 * Numbered sections and left rules give it the rhythm of a printed programme,
 * which is what keeps it legible at a glance on a small screen.
 */

function Section({ n, label, children }: { n: string; label: string; children: ReactNode }) {
  return (
    <section className="od-in border-t border-[var(--line)] px-6 py-14 sm:px-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-9 flex items-baseline gap-3">
          <span className="tabular text-[0.7rem] font-medium text-[var(--accent)]">{n}</span>
          <span className="h-px flex-1 bg-[var(--line)]" />
          <h2 className="text-[0.7rem] font-medium uppercase tracking-[0.28em] opacity-70">
            {label}
          </h2>
        </div>
        {children}
      </div>
    </section>
  );
}

export default function Modern({
  content,
  theme,
  guestName,
  rsvpSlot,
  wishSlot,
  qrSlot,
  rundownSlot,
}: TemplateProps) {
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
  const first = events[0] ? dateParts(events[0].startsAt) : null;

  // Numbering is derived, so an invitation with no story and no gallery still
  // reads 01, 02, 03 instead of skipping numbers.
  let step = 0;
  const n = () => String(++step).padStart(2, "0");

  return (
    <div
      style={themeStyle(theme)}
      className="min-h-dvh bg-[var(--bg)] text-[var(--fg)] antialiased"
    >
      {music ? <MusicToggle src={music} /> : null}

      {/* Full bleed only when there is something to bleed. Without a cover photo
          a 95svh header pinned to flex-end is half a screen of blank paper, and
          nothing forces a couple to upload one before publishing. */}
      <header
        className={
          "relative flex flex-col justify-end overflow-hidden px-6 pb-12 sm:px-10 " +
          (cover ? "min-h-[95svh] pt-20" : "pt-28")
        }
      >
        {cover ? (
          <>
            <Photo
              priority
              src={cover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* A scrim, not a blanket: the photograph still reads through it. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/75 to-[var(--bg)]/25"
            />
          </>
        ) : null}

        <div className="relative">
          {guestName ? (
            <p className="od-hero mb-8 text-[0.72rem] uppercase tracking-[0.24em] opacity-70">
              Untuk <span className="text-[var(--accent)]">{guestName}</span>
            </p>
          ) : null}

          <p className="od-hero text-[0.7rem] font-medium uppercase tracking-[0.3em] opacity-65">
            Kami menikah
          </p>
          <h1
            className={`od-hero mt-5 text-[clamp(3.2rem,18vw,7rem)] leading-[0.86] tracking-[-0.02em] ${DISPLAY}`}
            style={{ animationDelay: "120ms" }}
          >
            {groom || "Mempelai"}
            <br />
            <span className="text-[var(--accent)]">{bride || "Mempelai"}</span>
          </h1>

          {first ? (
            <div
              className="od-hero mt-10 flex items-end gap-4 border-t border-[var(--line)] pt-5"
              style={{ animationDelay: "260ms" }}
            >
              <span className="tabular text-[3.4rem] font-light leading-none">{first.d}</span>
              <span className="pb-1.5 text-[0.85rem] leading-tight">
                {first.m}
                <br />
                <span className="tabular opacity-65">{first.y}</span>
              </span>
            </div>
          ) : null}
        </div>
      </header>

      <Section n={n()} label="Mempelai">
        <div className="grid gap-10 sm:grid-cols-2">
          {[
            { p: content.couple.groom, role: "Putra" },
            { p: content.couple.bride, role: "Putri" },
          ].map(({ p, role }, i) => {
            const photo = safeUrl(p.photo);
            const ig = p.instagram?.trim().replace(/^@/, "");
            return (
              <div key={i}>
                {photo ? (
                  <Photo
                    src={photo}
                    alt={fullName(p)}
                    className="mb-5 aspect-square w-full object-cover"
                  />
                ) : null}
                <h3 className={`text-[1.7rem] leading-tight ${DISPLAY}`}>{fullName(p)}</h3>
                {p.parents?.trim() ? (
                  <p className="mt-3 text-[0.82rem] leading-relaxed opacity-70">
                    {role} dari {p.parents.trim()}
                  </p>
                ) : null}
                {ig ? (
                  <a
                    href={`https://instagram.com/${ig}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-3 inline-block text-[0.78rem] text-[var(--accent)]"
                  >
                    @{ig}
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      </Section>

      {events.length ? (
        <Section n={n()} label="Acara">
          <div className="grid gap-px bg-[var(--line)]">
            {events.map((ev, i) => (
              <article key={i} className="bg-[var(--bg)] py-7 first:pt-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className={`text-[1.55rem] leading-tight ${DISPLAY}`}>
                    {ev.name || "Acara"}
                  </h3>
                  {fmtTimeRange(ev.startsAt, ev.endsAt) ? (
                    <span className="tabular text-[0.82rem] opacity-70">
                      {fmtTimeRange(ev.startsAt, ev.endsAt)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-[0.85rem] opacity-70">{fmtDate(ev.startsAt)}</p>
                {ev.venue?.trim() ? (
                  <p className="mt-5 border-l-2 border-[var(--accent)] pl-3.5 text-[1rem] font-medium">
                    {ev.venue.trim()}
                    {ev.address?.trim() ? (
                      <span className="mt-1 block text-[0.8rem] font-normal leading-relaxed opacity-65">
                        {ev.address.trim()}
                      </span>
                    ) : null}
                  </p>
                ) : null}
                <div className="mt-6">
                  <EventActions ev={ev} title={title} />
                </div>
              </article>
            ))}
          </div>
        </Section>
      ) : null}

      <div className="od-in empty:hidden px-6 py-10">{rundownSlot}</div>

      {target ? (
        <Section n={n()} label="Hitung mundur">
          <Countdown target={target} className="justify-start" />
        </Section>
      ) : null}

      <div className="od-in empty:hidden px-6 py-6 sm:px-10">{qrSlot}</div>

      {content.story.length ? (
        <Section n={n()} label="Cerita">
          <ol className="grid gap-9">
            {content.story.map((m, i) => (
              <li key={i} className="grid grid-cols-[2.5rem_1fr] gap-4">
                <span className="tabular pt-1 text-[0.72rem] text-[var(--accent)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  {m.date ? (
                    <p className="text-[0.72rem] uppercase tracking-[0.2em] opacity-55">
                      {fmtDate(m.date, "short") ?? m.date}
                    </p>
                  ) : null}
                  {m.title ? (
                    <h3 className={`mt-1 text-[1.35rem] leading-tight ${DISPLAY}`}>{m.title}</h3>
                  ) : null}
                  {m.body ? (
                    <p className="mt-2 text-[0.88rem] leading-relaxed opacity-75">{m.body}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {photos.length ? (
        <Section n={n()} label="Galeri">
          {/* The first photograph takes the full width; the rest fall into grid. */}
          <div className="grid grid-cols-2 gap-2">
            {photos.map((src, i) => (
              <Photo
                key={i}
                src={src}
                alt={`Foto ${i + 1}`}
                className={
                  "w-full object-cover " +
                  (i === 0 ? "col-span-2 aspect-[16/10]" : "aspect-square")
                }
              />
            ))}
          </div>
        </Section>
      ) : null}

      {video ? (
        <Section n={n()} label="Video">
          <VideoFrame embed={video} />
        </Section>
      ) : null}

      <div className="od-in empty:hidden border-t border-[var(--line)] px-6 py-10 sm:px-10">
        {rsvpSlot}
      </div>
      <div className="od-in empty:hidden px-6 py-10 sm:px-10">{wishSlot}</div>

      {hasGifts(content) ? (
        <Section n={n()} label="Hadiah">
          <p className="mb-7 max-w-md text-[0.86rem] leading-relaxed opacity-70">
            Kehadiran Anda sudah lebih dari cukup. Bila ingin mengirim tanda
            kasih, nomor di bawah bisa disalin satu ketukan.
          </p>
          <GiftBlock gifts={content.gifts} />
        </Section>
      ) : null}

      {stream ? (
        <Section n={n()} label="Live streaming">
          <StreamBlock href={stream} />
        </Section>
      ) : null}

      <footer className="border-t border-[var(--line)] px-6 py-14 sm:px-10">
        <div className="mx-auto max-w-2xl">
          <p className={`text-[clamp(1.8rem,8vw,2.8rem)] leading-tight ${DISPLAY}`}>
            Terima kasih.
          </p>
          <p className="mt-3 text-[0.82rem] opacity-65">
            {groom && bride ? `${groom} & ${bride}` : title}
          </p>
          <p className="mt-12 text-[0.65rem] uppercase tracking-[0.28em] opacity-40">
            <a href="/">Dibuat dengan OurDay</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
