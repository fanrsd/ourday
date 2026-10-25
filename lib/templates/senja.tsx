import type { ReactNode } from "react";
import type { TemplateProps } from "./props.ts";
import { Countdown, MusicToggle } from "./atoms.tsx";
import { EventActions, GiftBlock,
  Ground, Photo, StreamBlock, VideoFrame } from "./blocks.tsx";
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
 * Senja — late afternoon. A warm wash from the accent colour up into the
 * background, a round portrait, italic serif asides, and a gallery you swipe
 * instead of scroll. The narrowest measure of the five: it is meant to feel like
 * a letter rather than a page.
 */

function Section({ label, title, children }: { label?: string; title?: string; children: ReactNode }) {
  return (
    <section className="od-in px-6 py-14">
      <div className="mx-auto max-w-md text-center">
        {label ? (
          <p className={`text-[0.95rem] italic text-[var(--accent)] ${DISPLAY}`}>{label}</p>
        ) : null}
        {title ? <h2 className={`mt-1.5 text-[1.85rem] leading-tight ${DISPLAY}`}>{title}</h2> : null}
        <div className="mt-7">{children}</div>
      </div>
    </section>
  );
}

export default function Senja({
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

  return (
    <div
      style={themeStyle(theme)}
      className="relative isolate min-h-dvh bg-[var(--bg)] text-[var(--fg)] antialiased"
    >
      {/* The dusk was already here and it stopped at the fold, which is why
          everything below the cover read as flat paper. Fixed to the viewport
          rather than the header: the light stays low on the horizon and the
          invitation scrolls through it, which is what dusk actually does. */}
      <Ground>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--soft)] via-transparent to-transparent" />
        <div className="absolute -bottom-40 left-1/2 h-80 w-[130%] -translate-x-1/2 rounded-[50%] bg-[var(--accent)] opacity-[0.13] blur-3xl" />
      </Ground>

      {music ? <MusicToggle src={music} /> : null}

      <header className="relative flex min-h-[94svh] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">

        <div className="relative">
          <p className="od-hero text-[10px] uppercase tracking-[0.34em] opacity-60">
            Kami akan menikah
          </p>

          {cover ? (
            <div
              className="od-hero mx-auto mt-8 h-52 w-52 overflow-hidden rounded-full ring-1 ring-[var(--line)]"
              style={{ animationDelay: "100ms" }}
            >
              <Photo priority src={cover} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}

          <h1
            className={`od-hero mt-9 text-[clamp(2.6rem,14vw,4.4rem)] leading-[1.02] ${DISPLAY}`}
            style={{ animationDelay: "200ms" }}
          >
            {groom || "Mempelai"}
            <span className="my-1 block text-[0.36em] italic text-[var(--accent)]">dan</span>
            {bride || "Mempelai"}
          </h1>

          {first ? (
            <p
              className="od-hero tabular mt-8 text-[0.86rem] tracking-[0.14em] opacity-75"
              style={{ animationDelay: "320ms" }}
            >
              {first.d} · {first.m} · {first.y}
            </p>
          ) : null}

          {guestName ? (
            <p
              className={`od-hero mt-10 text-[1.05rem] italic ${DISPLAY}`}
              style={{ animationDelay: "440ms" }}
            >
              Untuk {guestName},
              <span className="mt-1 block text-[0.78rem] not-italic opacity-65">
                dengan segala kehormatan, kami menantikan kehadiran Anda.
              </span>
            </p>
          ) : null}
        </div>
      </header>

      <Section label="Dengan bahagia kami memperkenalkan">
        <div className="grid gap-9">
          {[
            { p: content.couple.groom, role: "Putra" },
            { p: content.couple.bride, role: "Putri" },
          ].map(({ p, role }, i) => {
            const photo = safeUrl(p.photo);
            const ig = p.instagram?.trim().replace(/^@/, "");
            return (
              <div key={i} className="flex flex-col items-center">
                {photo ? (
                  <Photo
                    src={photo}
                    alt={fullName(p)}
                    className="mb-5 h-28 w-28 rounded-full object-cover ring-1 ring-[var(--line)]"
                  />
                ) : null}
                <h3 className={`text-[1.5rem] leading-tight ${DISPLAY}`}>{fullName(p)}</h3>
                {p.parents?.trim() ? (
                  <p className="mt-2.5 max-w-[16rem] text-[0.8rem] leading-relaxed opacity-70">
                    {role} dari {p.parents.trim()}
                  </p>
                ) : null}
                {ig ? (
                  <a
                    href={`https://instagram.com/${ig}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2.5 text-[0.76rem] text-[var(--accent)]"
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
        <Section label="Waktu dan tempat" title="Rangkaian Acara">
          <div className="grid gap-6">
            {events.map((ev, i) => (
              <article
                key={i}
                className="rounded-2xl border border-[var(--line)] bg-[var(--tint)] px-6 py-8"
              >
                <h3 className={`text-[1.4rem] italic ${DISPLAY}`}>{ev.name || "Acara"}</h3>
                <div
                  aria-hidden="true"
                  className="mx-auto my-4 h-px w-12 bg-[var(--accent)] opacity-40"
                />
                <p className="text-[0.9rem]">{fmtDate(ev.startsAt)}</p>
                {fmtTimeRange(ev.startsAt, ev.endsAt) ? (
                  <p className="tabular mt-1 text-[0.88rem] opacity-75">
                    {fmtTimeRange(ev.startsAt, ev.endsAt)}
                  </p>
                ) : null}
                {ev.venue?.trim() ? (
                  <p className="mt-4 text-[1rem] font-medium">{ev.venue.trim()}</p>
                ) : null}
                {ev.address?.trim() ? (
                  <p className="mt-1 text-[0.8rem] leading-relaxed opacity-65">
                    {ev.address.trim()}
                  </p>
                ) : null}
                <div className="mt-6 flex justify-center">
                  <EventActions ev={ev} title={title} />
                </div>
              </article>
            ))}
          </div>
        </Section>
      ) : null}

      <div className="od-in empty:hidden px-6 py-10">{rundownSlot}</div>

      {target ? (
        <Section label="Menghitung hari">
          <Countdown target={target} />
        </Section>
      ) : null}

      <div className="od-in empty:hidden px-6 py-6">{qrSlot}</div>

      {content.story.length ? (
        <Section label="Sedikit tentang kami" title="Cerita Kami">
          <ol className="grid gap-8 text-left">
            {content.story.map((m, i) => (
              <li key={i} className="relative pl-7">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full border border-[var(--accent)]"
                />
                {i < content.story.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-[0.53rem] top-5 h-[calc(100%+1.25rem)] w-px bg-[var(--line)]"
                  />
                ) : null}
                {m.date ? (
                  <p className="text-[0.74rem] italic text-[var(--accent)]">
                    {fmtDate(m.date, "short") ?? m.date}
                  </p>
                ) : null}
                {m.title ? (
                  <h3 className={`mt-1 text-[1.25rem] leading-tight ${DISPLAY}`}>{m.title}</h3>
                ) : null}
                {m.body ? (
                  <p className="mt-1.5 text-[0.86rem] leading-relaxed opacity-75">{m.body}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {photos.length ? (
        <section className="od-in py-14">
          <p
            className={`px-6 text-center text-[0.95rem] italic text-[var(--accent)] ${DISPLAY}`}
          >
            Galeri
          </p>
          <h2 className={`mt-1.5 px-6 text-center text-[1.85rem] leading-tight ${DISPLAY}`}>
            Momen Kami
          </h2>
          {/* Swiped, not scrolled: a strip suits a phone held in one hand. */}
          <div className="mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-3">
            {photos.map((src, i) => (
              <Photo
                key={i}
                src={src}
                alt={`Foto ${i + 1}`}
                className="h-72 w-56 shrink-0 snap-center rounded-2xl object-cover"
              />
            ))}
          </div>
        </section>
      ) : null}

      {video ? (
        <Section label="Video">
          <VideoFrame embed={video} />
        </Section>
      ) : null}

      <div className="od-in empty:hidden px-6 py-8">{rsvpSlot}</div>
      <div className="od-in empty:hidden px-6 py-8">{wishSlot}</div>

      {hasGifts(content) ? (
        <Section label="Tanda kasih" title="Kirim Hadiah">
          <p className="mb-7 text-[0.86rem] leading-relaxed opacity-70">
            Restu Anda sudah lebih dari cukup. Bila berkenan mengirim tanda
            kasih, kanal berikut kami sediakan.
          </p>
          <GiftBlock gifts={content.gifts} />
        </Section>
      ) : null}

      {stream ? (
        <Section label="Untuk yang berhalangan hadir">
          <div className="flex justify-center">
            <StreamBlock href={stream} />
          </div>
        </Section>
      ) : null}

      <footer className="relative overflow-hidden px-6 pb-20 pt-10 text-center">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[var(--soft)] to-transparent"
        />
        <div className="relative">
          <p className={`text-[1.6rem] italic ${DISPLAY}`}>Terima kasih</p>
          <p className="mt-3 text-[0.84rem] opacity-70">
            {groom && bride ? `${groom} & ${bride}` : title}
          </p>
          <p className="mt-12 text-[10px] uppercase tracking-[0.26em] opacity-40">
            <a href="/">Dibuat dengan OurDay</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
