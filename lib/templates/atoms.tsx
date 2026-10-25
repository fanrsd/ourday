"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The only three pieces of an invitation that genuinely need JavaScript. Every
 * other moving part — the scroll reveal, the hover states — is CSS, because the
 * guest opening this is on a phone on hotel wifi and each kilobyte of script is
 * a kilobyte between them and the address of the venue.
 */

/** Counts down to a wall-clock time. Renders dashes until mounted so the server
 *  HTML and the first client render cannot disagree. */
export function Countdown({ target, className = "" }: { target: string; className?: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const at = new Date(target).getTime();
    if (Number.isNaN(at)) return;
    const tick = () => setLeft(Math.max(0, at - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const s = left === null ? null : Math.floor(left / 1000);
  const cells: [string, number | null][] = [
    ["Hari", s === null ? null : Math.floor(s / 86400)],
    ["Jam", s === null ? null : Math.floor((s % 86400) / 3600)],
    ["Menit", s === null ? null : Math.floor((s % 3600) / 60)],
    ["Detik", s === null ? null : s % 60],
  ];

  return (
    <div className={"flex justify-center gap-2 sm:gap-3 " + className}>
      {cells.map(([label, v]) => (
        <div
          key={label}
          className="min-w-[4.25rem] rounded-xl border border-[var(--line)] bg-[var(--tint)] px-2 py-2.5"
        >
          <div className="tabular text-center text-2xl leading-none">
            {v === null ? "––" : String(v).padStart(2, "0")}
          </div>
          <div className="mt-1.5 text-center text-[10px] uppercase tracking-[0.2em] opacity-55">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

/** A bank or e-wallet number the guest can take in one tap. Falls back to
 *  selecting the text when the Clipboard API is unavailable or refused. */
export function CopyNumber({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<"idle" | "done">("idle");
  const ref = useRef<HTMLSpanElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("done");
      setTimeout(() => setState("idle"), 1800);
    } catch {
      const node = ref.current;
      if (!node) return;
      const range = document.createRange();
      range.selectNodeContents(node);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Salin nomor ${label}`}
      className="flex w-full items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--tint)] px-3.5 py-3 text-left transition-colors hover:bg-[var(--soft)]"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] uppercase tracking-[0.16em] opacity-55">{label}</span>
        <span ref={ref} className="tabular block truncate text-[0.95rem]">
          {value}
        </span>
      </span>
      <span className="shrink-0 text-[11px] font-medium text-[var(--accent)]">
        {state === "done" ? "Tersalin" : "Salin"}
      </span>
    </button>
  );
}

/** Background music. Never autoplays — browsers refuse, and a guest reading in a
 *  quiet room should not be ambushed. Hides itself if the file will not load. */
export function MusicToggle({ src }: { src: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [broken, setBroken] = useState(false);

  if (broken) return null;

  return (
    <>
      <audio
        ref={audio}
        src={src}
        loop
        preload="none"
        onError={() => setBroken(true)}
        onEnded={() => setPlaying(false)}
      />
      <button
        type="button"
        aria-label={playing ? "Matikan musik" : "Nyalakan musik"}
        aria-pressed={playing}
        onClick={async () => {
          const el = audio.current;
          if (!el) return;
          if (playing) {
            el.pause();
            setPlaying(false);
            return;
          }
          try {
            await el.play();
            setPlaying(true);
          } catch {
            setBroken(true);
          }
        }}
        className="fixed bottom-4 right-4 z-40 grid h-11 w-11 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg)]/90 shadow-sm backdrop-blur"
      >
        {/* Two bars that animate only while playing; CSS, not a sprite. */}
        <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
          <span className={"w-[3px] bg-[var(--accent)] " + (playing ? "h-4 od-eq" : "h-2")} />
          <span
            className={"w-[3px] bg-[var(--accent)] " + (playing ? "h-2.5 od-eq" : "h-3.5")}
            style={playing ? { animationDelay: "-0.35s" } : undefined}
          />
          <span className={"w-[3px] bg-[var(--accent)] " + (playing ? "h-3 od-eq" : "h-2")} />
        </span>
      </button>
    </>
  );
}
