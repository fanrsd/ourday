"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The three moments the hero already promises — "setahun merencanakan, satu
 * malam mengundang, satu pagi menyambut di pintu" — shown instead of asserted.
 *
 * Why this section carries JavaScript when nothing else on the storefront does:
 * the argument is that ONE token survives all three moments. Three separate
 * bands cannot make that point, because the token would be drawn three times
 * and three drawings of a thing is the opposite of the claim. It has to be the
 * same chip, held still, while the day changes around it — and holding one
 * element still while its surroundings cross-fade against scroll position is
 * scrubbing, which CSS cannot do without tying visibility to a timeline that
 * may never resolve.
 *
 * The division of labour is deliberate:
 *
 *  - **Pinning is `position: sticky`**, not `ScrollTrigger.pin`. Sticky is
 *    native, needs no spacer element, and does not fight the mobile URL bar
 *    resizing the viewport mid-scroll — which is exactly when a pinned section
 *    jumps. GSAP is not asked to do a job the platform already does.
 *  - **Scrubbing is GSAP**, because that is the part with no native answer here.
 *
 * Nothing readable depends on the script. Every heading and paragraph is in
 * normal flow at full opacity; the only things the timeline touches are the
 * decorative photographs and the rail. If the bundle never arrives the section
 * is one photograph with three captions scrolling over it, which is a page,
 * not a blank.
 */

const PHASES = [
  {
    src: "/marketing/01-merencanakan.webp",
    when: "Setahun sebelumnya",
    title: "Merencanakan.",
    body: "Anggaran, to-do, rundown, vendor. Belum ada tamu yang perlu tahu apa pun, dan belum ada yang perlu dibeli.",
    alt: "Sepasang calon pengantin merencanakan pernikahan di meja makan pada pagi hari.",
  },
  {
    src: "/marketing/02-mengundang.webp",
    when: "Satu malam",
    title: "Mengundang.",
    body: "Daftar tamu yang sudah ada di perencana berangkat ke WhatsApp. Tiap orang menerima link berisi tokennya sendiri.",
    alt: "Sebuah tangan memegang ponsel yang menyala di ruang keluarga pada malam hari.",
  },
  {
    src: "/marketing/03-menyambut.webp",
    when: "Satu pagi",
    title: "Menyambut.",
    body: "Token yang sama dipindai di meja penerima tamu. Tidak ada daftar tamu kedua, dan tidak ada yang diketik ulang.",
    alt: "Meja penerima tamu pernikahan dengan tablet pemindai, dua tamu datang dari kejauhan.",
  },
];

/** The four stamps a guest row collects, in the order the day collects them. */
const STAMPS = ["Dikirim", "Dibuka", "Menjawab", "Hadir"];

export function Story() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Reduced motion keeps the section — it just stops scrubbing it. The
      // resting state is phase one, which is what a no-script reader sees too,
      // so there is one fallback to reason about rather than two.
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        // One unit of timeline is the whole section, so positions below read as
        // fractions of the scroll through it.
        tl.to({}, { duration: 1 }, 0);

        // `ease: "none"` throughout: with scrub the user's thumb is the easing,
        // and anything else reads as the page lagging behind the finger.
        // Two opaque photographs at half opacity are a double exposure, not a
        // transition, so the hand-over is deliberately abrupt.
        //
        // It also has to be *finished* before its caption arrives, not centred
        // on it. Caption i reaches the middle of the screen at exactly i/3 of
        // the scrub — the spacer below is what makes that true — so a swap
        // straddling i/3 is read as the ghost of the previous scene behind the
        // words describing the next one.
        PHASES.forEach((_, i) => {
          if (i === 0) return;
          tl.to(
            `[data-phase="${i}"]`,
            { opacity: 1, duration: 0.1, ease: "none" },
            i / PHASES.length - 0.13,
          );
        });

        // The day moves; the token does not. That contrast is the whole section,
        // so the drift is slow enough to notice only as depth.
        tl.to("[data-photo]", { scale: 1.07, duration: 1, ease: "none" }, 0);

        tl.to("[data-rail]", { scaleX: 1, duration: 1, ease: "none" }, 0);

        STAMPS.forEach((_, i) => {
          tl.to(
            `[data-stamp="${i}"]`,
            { opacity: 1, duration: 0.08, ease: "none" },
            i / STAMPS.length,
          );
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative" aria-labelledby="cerita-judul">
      <h2 id="cerita-judul" className="sr-only">
        Satu token tamu, tiga kejadian
      </h2>

      {/* The stage. Sticky, so the platform does the pinning. */}
      <div className="sticky top-0 h-dvh overflow-hidden bg-ink">
        {PHASES.map((p, i) => (
          <div
            key={p.src}
            data-phase={i}
            // Only phase one is painted before the script runs. The others are
            // decorative duplicates of a scene the captions already describe,
            // so leaving them dark costs nothing a reader needs.
            style={{ opacity: i === 0 ? 1 : 0 }}
            className="absolute inset-0"
          >
            <Image
              data-photo=""
              src={p.src}
              alt={p.alt}
              fill
              sizes="100vw"
              // All three were framed with the subject in the right third and
              // quiet air on the left, which is what a 16:9 hero wants and
              // exactly wrong for a portrait crop: `object-cover` keeps the
              // centre and throws the subject away, so a phone got a wall.
              // Off-centre here, centred once the frame is landscape again.
              className="object-cover object-[66%_center] sm:object-center"
              priority={i === 0}
            />
          </div>
        ))}

        {/* One scrim for all three, because the text may not move when the
            photograph under it does.

            The dark half has to reach as far right as the words do, not as far
            as looks balanced. A headline is `max-w-2xl` inside a `max-w-6xl`
            container, which is 58% of the way across at the narrowest viewport
            where that container is full width — so the midpoint stop sits at
            58%, not at the 50% a gradient defaults to. Before that it faded out
            under the last third of every headline.

            It is measured against a photograph that is pure white everywhere,
            which none of these three is. That is deliberate: the photographs
            are the part of this section a non-engineer will swap, and a caption
            going quietly unreadable is not a failure anything else would catch.
            tests/marketing.test.ts reads these alphas out of this file. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-ink/30 bg-gradient-to-r from-ink/78 via-ink/62 via-[58%] to-transparent"
        />

        {/* The thing that never changes.

            Captions scroll up through this band on their way out, so it carries
            its own gradient: text sliding under a dark edge reads as depth,
            while text crossing a bare rail reads as a collision.

            The bottom padding clears the WhatsApp button, which is fixed at
            bottom-5 right-5 and 48px square on phones — square on top of where
            "Hadir" ends. On sm and up that button becomes a wide pill sitting
            beside the rail rather than over it, so the padding goes back down. */}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-ink via-ink/85 to-transparent px-5 pb-20 pt-24 sm:px-8 sm:pb-8 sm:pt-28">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-paper/15 px-3 py-1.5 font-mono text-[11px] tracking-[0.18em] text-paper ring-1 ring-paper/25">
                7QF2K8MD
              </span>
              <span className="text-[13px] text-paper/70">
                Bu Retno Wijaya &middot; 2 pax
              </span>
            </div>

            <div className="relative mt-4 h-px w-full bg-paper/20">
              <div
                data-rail=""
                aria-hidden="true"
                className="absolute inset-0 origin-left scale-x-0 bg-paper/70"
              />
            </div>

            <ol className="mt-3 grid grid-cols-4 gap-2">
              {STAMPS.map((s, i) => (
                <li
                  key={s}
                  data-stamp={i}
                  // Not decoration: these four words name the four things a
                  // guest row collects, and a reader arriving mid-section reads
                  // the unlit ones to learn what is coming. 0.28 looked right
                  // and measured 2.45:1 on 11px caps; this clears AA.
                  style={{ opacity: i === 0 ? 1 : 0.55 }}
                  className="text-[11px] uppercase tracking-[0.14em] text-paper sm:text-xs"
                >
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* The captions, pulled back over the stage and scrolling normally. Full
          opacity, no animation, no timeline — this is the content.

          The trailing spacer is load-bearing, not padding. A sticky element
          releases when the section's bottom reaches the viewport's, so a section
          of 1dvh stage + 3dvh captions - 1dvh pull-back sticks for only 2dvh —
          one short of the three the captions need, and the last one never
          reaches centre before the stage lets go. The spacer buys that dvh back. */}
      <div className="relative -mt-[100dvh]">
        {PHASES.map((p) => (
          <div key={p.src} className="flex h-dvh items-center">
            <div className="mx-auto w-full max-w-6xl px-5 pb-32">
              <p className="text-[11px] uppercase tracking-[0.22em] text-paper/70">
                {p.when}
              </p>
              <p className="hd mt-4 max-w-2xl text-[3rem] text-paper sm:text-[4.2rem]">
                {p.title}
              </p>
              <p className="mt-5 max-w-md leading-relaxed text-paper/85">{p.body}</p>
            </div>
          </div>
        ))}
        <div className="h-dvh" aria-hidden="true" />
      </div>
    </section>
  );
}
