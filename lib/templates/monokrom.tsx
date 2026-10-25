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
 * Monokrom — no photograph on the cover, no ornament anywhere, thick rules and a
 * date set as a table. Everything is information. Photographs appear once, in a
 * desaturated grid that comes back to colour when touched, which is the only
 * decorative gesture in the whole design.
 */

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-[var(--line)] py-3 last:border-b-0">
      <span className="w-20 shrink-0 text-[0.68rem] uppercase tracking-[0.16em] opacity-50">
        {k}
      </span>
      <span className="min-w-0 flex-1 text-[0.88rem]">{v}</span>
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="od-in px-6 py-12">
      <div className="mx-auto max-w-xl">
        <h2 className="mb-7 border-b-2 border-[var(--fg)] pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.3em]">
          {label}
        </h2>
        {children}
      </div>
    </section>
  );
}

export default function Monokrom({
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
  const music = safeUrl(content.music);
  const video = youtubeEmbed(content.video);
  const stream = safeUrl(content.stream);
  const target = countdownTarget(content);
  const title = coupleTitle(content);
  const groom = displayName(content.couple.groom);
  const bride = displayName(content.couple.bride);
  const first = events[0] ? dateParts(events[0].startsAt) : null;

  return (
    <div
      style={themeStyle(theme)}
      className="min-h-dvh bg-[var(--bg)] text-[var(--fg)] antialiased"
    >
      {music ? <MusicToggle src={music} /> : null}

      <header className="flex min-h-[92svh] flex-col justify-between px-6 py-10">
        <div className="od-hero flex items-start justify-between border-b-2 border-[var(--fg)] pb-3 text-[0.66rem] uppercase tracking-[0.22em]">
          <span>Undangan Pernikahan</span>
          {first ? <span className="tabular">{`${first.d}.${first.y}`}</span> : null}
        </div>

        <div>
          <h1
            className={`od-hero text-[clamp(3rem,20vw,7.5rem)] uppercase leading-[0.84] tracking-[-0.03em] ${DISPLAY}`}
            style={{ animationDelay: "120ms" }}
          >
            {groom || "Mempelai"}
            <br />
            {bride || "Mempelai"}
          </h1>
          {first ? (
            <p
              className="od-hero tabular mt-8 text-[0.78rem] uppercase tracking-[0.28em]"
              style={{ animationDelay: "240ms" }}
            >
              {first.d} {first.m} {first.y}
            </p>
          ) : null}
        </div>

        <div className="od-hero border-t-2 border-[var(--fg)] pt-3" style={{ animationDelay: "360ms" }}>
          {guestName ? (
            <p className="text-[0.78rem]">
              <span className="uppercase tracking-[0.2em] opacity-50">Kepada </span>
              <span className="font-medium">{guestName}</span>
            </p>
          ) : (
            <p className="text-[0.72rem] uppercase tracking-[0.2em] opacity-50">
              Kepada Bapak / Ibu / Saudara
            </p>
          )}
        </div>
      </header>

      <Section label="Mempelai">
        <div className="grid gap-8 sm:grid-cols-2">
          {[
            { p: content.couple.groom, role: "Putra" },
            { p: content.couple.bride, role: "Putri" },
          ].map(({ p, role }, i) => {
            const ig = p.instagram?.trim().replace(/^@/, "");
            return (
              <div key={i}>
                <h3 className={`text-[1.5rem] uppercase leading-tight ${DISPLAY}`}>
                  {fullName(p)}
                </h3>
                <div className="mt-3">
                  {p.parents?.trim() ? <Row k={role} v={p.parents.trim()} /> : null}
                  {ig ? (
                    <Row
                      k="Instagram"
                      v={
                        <a
                          href={`https://instagram.com/${ig}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="underline underline-offset-4"
                        >
                          @{ig}
                        </a>
                      }
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {events.length ? (
        <Section label="Acara">
          <div className="grid gap-10">
            {events.map((ev, i) => (
              <article key={i}>
                <h3 className={`text-[1.35rem] uppercase leading-tight ${DISPLAY}`}>
                  {ev.name || "Acara"}
                </h3>
                <div className="mt-3">
                  <Row k="Tanggal" v={fmtDate(ev.startsAt)} />
                  {fmtTimeRange(ev.startsAt, ev.endsAt) ? (
                    <Row
                      k="Waktu"
                      v={<span className="tabular">{fmtTimeRange(ev.startsAt, ev.endsAt)}</span>}
                    />
                  ) : null}
                  {ev.venue?.trim() ? <Row k="Tempat" v={ev.venue.trim()} /> : null}
                  {ev.address?.trim() ? <Row k="Alamat" v={ev.address.trim()} /> : null}
                </div>
                <div className="mt-5">
                  <EventActions ev={ev} title={title} />
                </div>
              </article>
            ))}
          </div>
        </Section>
      ) : null}

      <div className="od-in empty:hidden px-6 py-10">{rundownSlot}</div>

      {target ? (
        <Section label="Hitung mundur">
          <Countdown target={target} className="justify-start" />
        </Section>
      ) : null}

      <div className="od-in empty:hidden px-6 py-6">{qrSlot}</div>

      {content.story.length ? (
        <Section label="Cerita">
          <ol>
            {content.story.map((m, i) => (
              <li
                key={i}
                className="grid grid-cols-[3.5rem_1fr] gap-4 border-b border-[var(--line)] py-5 last:border-b-0"
              >
                <span className="tabular text-[0.7rem] uppercase tracking-[0.16em] opacity-50">
                  {m.date ? (fmtDate(m.date, "short") ?? m.date) : String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  {m.title ? (
                    <h3 className={`text-[1.15rem] uppercase leading-tight ${DISPLAY}`}>
                      {m.title}
                    </h3>
                  ) : null}
                  {m.body ? (
                    <p className="mt-1.5 text-[0.86rem] leading-relaxed opacity-75">{m.body}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {photos.length ? (
        <Section label="Galeri">
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((src, i) => (
              <Photo
                key={i}
                src={src}
                alt={`Foto ${i + 1}`}
                className="aspect-square w-full object-cover grayscale transition-[filter] duration-500 hover:grayscale-0 focus-visible:grayscale-0"
              />
            ))}
          </div>
        </Section>
      ) : null}

      {video ? (
        <Section label="Video">
          <VideoFrame embed={video} className="rounded-none" />
        </Section>
      ) : null}

      <div className="od-in empty:hidden px-6 py-8">{rsvpSlot}</div>
      <div className="od-in empty:hidden px-6 py-8">{wishSlot}</div>

      {hasGifts(content) ? (
        <Section label="Hadiah">
          <p className="mb-6 text-[0.85rem] leading-relaxed opacity-70">
            Kehadiran Anda sudah cukup. Bila ingin mengirim tanda kasih:
          </p>
          <GiftBlock gifts={content.gifts} />
        </Section>
      ) : null}

      {stream ? (
        <Section label="Live streaming">
          <StreamBlock href={stream} />
        </Section>
      ) : null}

      <footer className="px-6 pb-14 pt-6">
        <div className="mx-auto max-w-xl border-t-2 border-[var(--fg)] pt-5">
          <p className={`text-[1.6rem] uppercase leading-tight ${DISPLAY}`}>Terima kasih</p>
          <p className="mt-2 text-[0.78rem] uppercase tracking-[0.18em] opacity-60">
            {groom && bride ? `${groom} — ${bride}` : title}
          </p>
          <p className="mt-10 text-[0.62rem] uppercase tracking-[0.28em] opacity-40">
            <a href="/">Dibuat dengan OurDay</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
