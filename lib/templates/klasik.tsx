import type { ReactNode } from "react";
import type { Person } from "../invitation-content.ts";
import type { TemplateProps } from "./props.ts";
import { Countdown, MusicToggle } from "./atoms.tsx";
import { EventActions, GiftBlock, Photo, StreamBlock, VideoFrame } from "./blocks.tsx";
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
 * Klasik — tall serif, a great deal of empty paper, and one hairline ornament
 * doing all the decorating. Everything is centred and nothing competes: this is
 * the one you choose for an akad, where the type is supposed to behave.
 */

const Rule = () => (
  <div className="my-7 flex items-center justify-center gap-3" aria-hidden="true">
    <span className="h-px w-16 bg-[var(--line)]" />
    <span className="h-1.5 w-1.5 rotate-45 border border-[var(--accent)]" />
    <span className="h-px w-16 bg-[var(--line)]" />
  </div>
);

function Section({
  label,
  title,
  children,
}: {
  label?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="od-in px-6 py-14">
      <div className="mx-auto max-w-2xl text-center">
        {label ? (
          <p className="text-[10px] uppercase tracking-[0.34em] opacity-55">{label}</p>
        ) : null}
        {title ? <h2 className={`mt-3 text-[1.9rem] leading-tight ${DISPLAY}`}>{title}</h2> : null}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

function Half({ person, role }: { person: Person; role: string }) {
  const photo = safeUrl(person.photo);
  const ig = person.instagram?.trim().replace(/^@/, "");
  return (
    <div className="flex flex-col items-center">
      {photo ? (
        <Photo
          src={photo}
          alt={fullName(person)}
          className="mb-6 h-36 w-36 rounded-full object-cover ring-1 ring-[var(--line)]"
        />
      ) : null}
      <p className={`text-[1.6rem] leading-snug ${DISPLAY}`}>{fullName(person)}</p>
      {person.parents?.trim() ? (
        <p className="mt-3 max-w-xs text-[0.82rem] leading-relaxed opacity-70">
          {role} dari
          <br />
          {person.parents.trim()}
        </p>
      ) : null}
      {ig ? (
        <a
          href={`https://instagram.com/${ig}`}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 text-[0.78rem] text-[var(--accent)] underline decoration-[var(--line)] underline-offset-4"
        >
          @{ig}
        </a>
      ) : null}
    </div>
  );
}

export default function Klasik({
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
      className="min-h-dvh bg-[var(--bg)] text-[var(--fg)] antialiased"
    >
      {music ? <MusicToggle src={music} /> : null}

      <header className="relative flex min-h-[93svh] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
        {cover ? (
          <>
            <Photo
              priority
              src={cover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="absolute inset-0 bg-[var(--bg)]/82"
              aria-hidden="true"
            />
          </>
        ) : null}

        <div className="relative">
          <p className="od-hero text-[10px] uppercase tracking-[0.42em] opacity-60">
            Undangan Pernikahan
          </p>
          <h1
            className={`od-hero mt-8 text-[clamp(2.9rem,16vw,5.5rem)] leading-[0.98] ${DISPLAY}`}
            style={{ animationDelay: "140ms" }}
          >
            {groom || "Mempelai"}
            <span className="my-1.5 block text-[0.4em] italic opacity-65">&amp;</span>
            {bride || "Mempelai"}
          </h1>
          <Rule />
          {events[0] ? (
            <p
              className="od-hero text-[0.86rem] tracking-wide opacity-75"
              style={{ animationDelay: "280ms" }}
            >
              {fmtDate(events[0].startsAt)}
            </p>
          ) : null}

          {guestName ? (
            <div
              className="od-hero mx-auto mt-12 max-w-xs border-t border-[var(--line)] pt-6"
              style={{ animationDelay: "420ms" }}
            >
              <p className="text-[10px] uppercase tracking-[0.3em] opacity-55">Kepada</p>
              <p className={`mt-2 text-xl ${DISPLAY}`}>{guestName}</p>
            </div>
          ) : null}
        </div>
      </header>

      <Section label="Bismillahirrahmanirrahim">
        <p className="text-[0.92rem] leading-loose opacity-80">
          Dengan memohon rahmat dan ridha Allah, kami bermaksud menyelenggarakan
          pernikahan kami. Merupakan suatu kebahagiaan apabila Bapak, Ibu, dan
          Saudara berkenan hadir untuk memberikan doa restu.
        </p>
      </Section>

      <Section label="Mempelai">
        <div className="grid gap-14">
          <Half person={content.couple.groom} role="Putra" />
          <div aria-hidden="true" className="mx-auto h-px w-24 bg-[var(--line)]" />
          <Half person={content.couple.bride} role="Putri" />
        </div>
      </Section>

      {events.length ? (
        <Section label="Waktu & Tempat" title="Rangkaian Acara">
          <div className="grid gap-10">
            {events.map((ev, i) => (
              <article
                key={i}
                className="border border-[var(--line)] bg-[var(--tint)] px-6 py-9"
              >
                <h3 className={`text-[1.45rem] ${DISPLAY}`}>{ev.name || "Acara"}</h3>
                <Rule />
                <p className="text-[0.92rem]">{fmtDate(ev.startsAt)}</p>
                {fmtTimeRange(ev.startsAt, ev.endsAt) ? (
                  <p className="tabular mt-1 text-[0.92rem] opacity-80">
                    {fmtTimeRange(ev.startsAt, ev.endsAt)}
                  </p>
                ) : null}
                {ev.venue?.trim() ? (
                  <p className="mt-5 text-[1.05rem] font-medium">{ev.venue.trim()}</p>
                ) : null}
                {ev.address?.trim() ? (
                  <p className="mx-auto mt-1.5 max-w-sm text-[0.82rem] leading-relaxed opacity-70">
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
        <Section label="Menuju hari bahagia">
          <Countdown target={target} />
        </Section>
      ) : null}

      <div className="od-in empty:hidden px-6 py-6">{qrSlot}</div>

      {content.story.length ? (
        <Section label="Perjalanan" title="Cerita Kami">
          <ol className="relative grid gap-10 border-l border-[var(--line)] pl-8 text-left">
            {content.story.map((m, i) => (
              <li key={i} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[2.15rem] top-2 h-1.5 w-1.5 rotate-45 border border-[var(--accent)] bg-[var(--bg)]"
                />
                {m.date ? (
                  <p className="text-[10px] uppercase tracking-[0.28em] opacity-55">
                    {fmtDate(m.date, "short") ?? m.date}
                  </p>
                ) : null}
                {m.title ? <h3 className={`mt-1.5 text-xl ${DISPLAY}`}>{m.title}</h3> : null}
                {m.body ? (
                  <p className="mt-2 text-[0.88rem] leading-relaxed opacity-75">{m.body}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {photos.length ? (
        <Section label="Galeri" title="Momen Kami">
          <div className="grid grid-cols-2 gap-2.5">
            {photos.map((src, i) => (
              <Photo
                key={i}
                src={src}
                alt={`Foto ${i + 1}`}
                className="aspect-[3/4] w-full object-cover"
              />
            ))}
          </div>
        </Section>
      ) : null}

      {video ? (
        <Section label="Video">
          <VideoFrame embed={video} />
        </Section>
      ) : null}

      <div className="od-in empty:hidden px-6 py-8">{rsvpSlot}</div>
      <div className="od-in empty:hidden px-6 py-8">{wishSlot}</div>

      {hasGifts(content) ? (
        <Section label="Tanda Kasih" title="Kirim Hadiah">
          <p className="mb-7 text-[0.86rem] leading-relaxed opacity-70">
            Kehadiran dan doa Anda adalah hadiah terindah. Namun bila ingin
            mengirim tanda kasih, kami sediakan kanal berikut.
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

      <footer className="px-6 pb-16 pt-6 text-center">
        <Rule />
        <p className={`text-[1.35rem] ${DISPLAY}`}>Terima kasih</p>
        <p className="mt-2 text-[0.82rem] opacity-70">
          {groom && bride ? `${groom} & ${bride}` : title}
        </p>
        <p className="mt-10 text-[10px] uppercase tracking-[0.28em] opacity-40">
          <a href="/">Dibuat dengan OurDay</a>
        </p>
      </footer>
    </div>
  );
}
