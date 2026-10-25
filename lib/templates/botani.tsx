import type { ReactNode } from "react";
import type { TemplateProps } from "./props.ts";
import { Countdown, MusicToggle } from "./atoms.tsx";
import { EventActions, GiftBlock,
  Ground, Photo, StreamBlock, VideoFrame } from "./blocks.tsx";
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
  themeStyle,
  usableEvents,
  youtubeEmbed,
} from "./parts.ts";

/**
 * Botani — soft edges, big photographs, and one leaf drawn in SVG rather than
 * imported as a decorative font. Built for an outdoor reception, so the
 * photograph is the loudest thing on every screen and the type gets out of its way.
 */

const Leaf = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={"h-4 w-4 " + className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
  >
    <path d="M12 21c0-7 3.5-12 9-15-1 8-4.5 12-9 15Z" />
    <path d="M12 21c0-7-3.5-12-9-15 1 8 4.5 12 9 15Z" />
    <path d="M12 21v-6" />
  </svg>
);

/**
 * A running vine, tiled as the page's ground.
 *
 * The stem enters at 0 and leaves at 100 on the same line, so the horizontal
 * seam disappears; there is nothing across the top and bottom edges, so the
 * vertical repeat is open air between rows rather than a visible join.
 *
 * Drawn in `--accent` at 8%: the leaves are outlines with a little fill, so a
 * tile lays down far less ink than a solid pattern and can carry a higher
 * number than a dense one could.
 */
const Vine = () => (
  <svg aria-hidden="true" className="h-full w-full" width="100%" height="100%">
    <defs>
      <pattern
        id="botani-vine"
        patternUnits="userSpaceOnUse"
        width={132}
        height={132}
        viewBox="0 0 100 100"
      >
        <g stroke="var(--accent)" strokeWidth={1.5} strokeLinecap="round" fill="none">
          <path d="M 0 62 C 14 62 20 40 36 40 C 52 40 58 62 74 62 C 87 62 93 53 100 62" />
          <path d="M 36 40 C 29 30 31 21 40 17 C 43 26 42 34 36 40" fill="var(--accent)" fillOpacity={0.35} />
          <path d="M 74 62 C 81 71 80 80 71 84 C 68 75 69 68 74 62" fill="var(--accent)" fillOpacity={0.35} />
          <path d="M 55 51 C 62 47 69 48 72 54" />
          <path d="M 18 51 C 12 47 6 48 2 54" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#botani-vine)" opacity={0.08} />
  </svg>
);

function Section({ label, title, children }: { label?: string; title?: string; children: ReactNode }) {
  return (
    <section className="od-in px-5 py-14">
      <div className="mx-auto max-w-xl">
        {label ? (
          <div className="mb-2 flex items-center justify-center gap-2 text-[var(--accent)]">
            <Leaf />
            <span className="text-[10px] uppercase tracking-[0.28em]">{label}</span>
            <Leaf className="scale-x-[-1]" />
          </div>
        ) : null}
        {title ? (
          <h2 className={`text-center text-[2rem] leading-tight ${DISPLAY}`}>{title}</h2>
        ) : null}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

export default function Botani({
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

  return (
    <div
      style={themeStyle(theme)}
      className="relative isolate min-h-dvh bg-[var(--bg)] text-[var(--fg)] antialiased"
    >
      {/* The design is named for the planting and had none of it below the
          cover photograph — and most couples publish before the photograph
          exists, so for them it was a green word on blank paper. */}
      <Ground>
        <Vine />
      </Ground>

      {music ? <MusicToggle src={music} /> : null}

      {/* The cover photograph is the page; the names sit on a card that laps
          over its bottom edge so the two never fight for the same pixels. */}
      <header className="relative">
        {/* Without a photograph this panel is a tall tinted rectangle holding
            nothing, so it shrinks to a band the card can still lap over. */}
        <div
          className={
            "relative overflow-hidden rounded-b-[2.5rem] bg-[var(--soft)] " +
            (cover ? "h-[68svh]" : "h-40")
          }
        >
          {cover ? (
            <Photo
              priority
              src={cover}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--bg)]/55 to-transparent"
          />
        </div>

        <div className="od-hero relative z-10 mx-auto -mt-16 max-w-sm rounded-3xl border border-[var(--line)] bg-[var(--bg)] px-6 py-8 text-center shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-center gap-2 text-[var(--accent)]">
            <Leaf />
            <span className="text-[10px] uppercase tracking-[0.28em]">Undangan Pernikahan</span>
            <Leaf className="scale-x-[-1]" />
          </div>
          <h1 className={`mt-5 text-[2.6rem] leading-[1.05] ${DISPLAY}`}>
            {groom || "Mempelai"}
            <span className="my-0.5 block text-[0.45em] italic text-[var(--accent)]">&amp;</span>
            {bride || "Mempelai"}
          </h1>
          {events[0] ? (
            <p className="mt-5 border-t border-[var(--line)] pt-4 text-[0.84rem] opacity-75">
              {fmtDate(events[0].startsAt)}
            </p>
          ) : null}
          {guestName ? (
            <p className="mt-4 text-[0.82rem]">
              <span className="opacity-60">Kepada </span>
              <span className="font-medium">{guestName}</span>
            </p>
          ) : null}
        </div>
      </header>

      <Section label="Mempelai">
        <div className="grid gap-8">
          {[
            { p: content.couple.groom, role: "Putra" },
            { p: content.couple.bride, role: "Putri" },
          ].map(({ p, role }, i) => {
            const photo = safeUrl(p.photo);
            const ig = p.instagram?.trim().replace(/^@/, "");
            return (
              <div
                key={i}
                className="flex items-center gap-5 rounded-3xl border border-[var(--line)] bg-[var(--tint)] p-5"
              >
                {photo ? (
                  <Photo
                    src={photo}
                    alt={fullName(p)}
                    className="h-24 w-24 shrink-0 rounded-2xl object-cover"
                  />
                ) : null}
                <div className="min-w-0">
                  <h3 className={`text-[1.4rem] leading-tight ${DISPLAY}`}>{fullName(p)}</h3>
                  {p.parents?.trim() ? (
                    <p className="mt-2 text-[0.8rem] leading-relaxed opacity-70">
                      {role} dari {p.parents.trim()}
                    </p>
                  ) : null}
                  {ig ? (
                    <a
                      href={`https://instagram.com/${ig}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-2 inline-block text-[0.76rem] text-[var(--accent)]"
                    >
                      @{ig}
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {events.length ? (
        <Section label="Waktu & tempat" title="Rangkaian Acara">
          <div className="grid gap-5">
            {events.map((ev, i) => (
              <article
                key={i}
                className="rounded-3xl border border-[var(--line)] bg-[var(--tint)] p-6"
              >
                <h3 className={`text-[1.5rem] leading-tight ${DISPLAY}`}>{ev.name || "Acara"}</h3>
                <div className="mt-4 grid gap-1.5 text-[0.88rem]">
                  <p className="flex gap-2.5">
                    <span className="w-16 shrink-0 opacity-55">Tanggal</span>
                    <span>{fmtDate(ev.startsAt)}</span>
                  </p>
                  {fmtTimeRange(ev.startsAt, ev.endsAt) ? (
                    <p className="flex gap-2.5">
                      <span className="w-16 shrink-0 opacity-55">Waktu</span>
                      <span className="tabular">{fmtTimeRange(ev.startsAt, ev.endsAt)}</span>
                    </p>
                  ) : null}
                  {ev.venue?.trim() ? (
                    <p className="flex gap-2.5">
                      <span className="w-16 shrink-0 opacity-55">Tempat</span>
                      <span>
                        <span className="font-medium">{ev.venue.trim()}</span>
                        {ev.address?.trim() ? (
                          <span className="mt-0.5 block text-[0.8rem] leading-relaxed opacity-65">
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
              </article>
            ))}
          </div>
        </Section>
      ) : null}

      <div className="od-in empty:hidden px-5 py-10">{rundownSlot}</div>

      {target ? (
        <Section label="Hitung mundur">
          <Countdown target={target} />
        </Section>
      ) : null}

      <div className="od-in empty:hidden px-5 py-6">{qrSlot}</div>

      {content.story.length ? (
        <Section label="Perjalanan" title="Cerita Kami">
          <ol className="grid gap-6">
            {content.story.map((m, i) => (
              <li
                key={i}
                className={
                  "rounded-3xl border border-[var(--line)] p-5 " +
                  (i % 2 === 0 ? "mr-4 bg-[var(--tint)]" : "ml-4 bg-[var(--soft)]")
                }
              >
                {m.date ? (
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
                    {fmtDate(m.date, "short") ?? m.date}
                  </p>
                ) : null}
                {m.title ? (
                  <h3 className={`mt-1.5 text-[1.3rem] leading-tight ${DISPLAY}`}>{m.title}</h3>
                ) : null}
                {m.body ? (
                  <p className="mt-2 text-[0.86rem] leading-relaxed opacity-75">{m.body}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {photos.length ? (
        <Section label="Galeri" title="Momen Kami">
          {/* CSS columns, so portrait and landscape photographs can sit together
              without being cropped into the same square. */}
          <div className="columns-2 gap-3 [&>img]:mb-3">
            {photos.map((src, i) => (
              <Photo
                key={i}
                src={src}
                alt={`Foto ${i + 1}`}
                className="w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        </Section>
      ) : null}

      {video ? (
        <Section label="Video">
          <VideoFrame embed={video} className="rounded-3xl" />
        </Section>
      ) : null}

      <div className="od-in empty:hidden px-5 py-8">{rsvpSlot}</div>
      <div className="od-in empty:hidden px-5 py-8">{wishSlot}</div>

      {hasGifts(content) ? (
        <Section label="Tanda kasih" title="Kirim Hadiah">
          <p className="mb-7 text-center text-[0.86rem] leading-relaxed opacity-70">
            Doa dan kehadiran Anda adalah hadiah terbaik. Bila ingin mengirim
            tanda kasih, silakan gunakan kanal berikut.
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

      <footer className="px-5 pb-16 pt-8 text-center">
        <div className="mx-auto flex max-w-xs flex-col items-center gap-4 rounded-3xl border border-[var(--line)] bg-[var(--tint)] px-6 py-9">
          <Leaf className="h-5 w-5 text-[var(--accent)]" />
          <p className={`text-[1.5rem] leading-tight ${DISPLAY}`}>Terima kasih</p>
          <p className="text-[0.82rem] opacity-70">
            {groom && bride ? `${groom} & ${bride}` : title}
          </p>
        </div>
        <p className="mt-10 text-[10px] uppercase tracking-[0.26em] opacity-40">
          <a href="/">Dibuat dengan OurDay</a>
        </p>
      </footer>
    </div>
  );
}
