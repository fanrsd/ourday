import type { CSSProperties } from "react";
import {
  PALETTES,
  type InvitationContent,
  type InvitationTheme,
  type Person,
  type WeddingEvent,
} from "../invitation-content.ts";

/**
 * Everything the five templates need to know that is not markup. It lives apart
 * from the .tsx files for two reasons: the templates then differ only in layout,
 * and every fallible derivation here — dates out of jsonb, urls typed by hand,
 * calendar files — is a plain function that a test can hammer with garbage.
 *
 * Nothing in this file throws. An invitation is read by four hundred people on
 * one afternoon; a bad field must degrade to an absent section, never to a
 * blank screen.
 */

// ------------------------------------------------------------------- times --

/**
 * Event times are wall-clock strings from `<input type="datetime-local">`,
 * stored verbatim inside jsonb — never a timestamptz. That is deliberate: a
 * wedding invitation must print the hour the couple typed, and Indonesia spans
 * three time zones. Parsing the digits instead of constructing a Date keeps the
 * viewer's own zone out of it entirely.
 */
export type Stamp = { y: number; m: number; d: number; hh: number | null; mi: number | null };

const STAMP_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

export function parseStamp(v: unknown): Stamp | null {
  if (typeof v !== "string") return null;
  const m = STAMP_RE.exec(v.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  // Rejects 2026-13-40 as well as 2026-02-31: round-tripping through UTC is the
  // cheapest correct calendar check there is.
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) return null;
  const hh = m[4] === undefined ? null : Number(m[4]);
  const mi = m[5] === undefined ? null : Number(m[5]);
  if (hh !== null && (hh > 23 || mi! > 59)) return null;
  return { y, m: mo, d, hh, mi };
}

// timeZone UTC because the numbers were never in a zone to begin with.
const LONG = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const SHORT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function fmtDate(v: unknown, style: "long" | "short" = "long"): string | null {
  const s = parseStamp(v);
  if (!s) return null;
  return (style === "long" ? LONG : SHORT).format(Date.UTC(s.y, s.m - 1, s.d));
}

/** Indonesian clocks use a dot: 10.00, not 10:00. */
export function fmtTime(v: unknown): string | null {
  const s = parseStamp(v);
  if (!s || s.hh === null) return null;
  return `${String(s.hh).padStart(2, "0")}.${String(s.mi ?? 0).padStart(2, "0")}`;
}

export function fmtTimeRange(startsAt: unknown, endsAt: unknown): string | null {
  const from = fmtTime(startsAt);
  if (!from) return null;
  const to = fmtTime(endsAt);
  return to ? `${from} – ${to}` : `${from} WIB`;
}

/** Day-of-month and month only, for templates that stack a date vertically. */
export function dateParts(v: unknown): { d: string; m: string; y: string } | null {
  const s = parseStamp(v);
  if (!s) return null;
  return {
    d: String(s.d).padStart(2, "0"),
    m: new Intl.DateTimeFormat("id-ID", { month: "long", timeZone: "UTC" })
      .format(Date.UTC(s.y, s.m - 1, s.d)),
    y: String(s.y),
  };
}

// -------------------------------------------------------------------- urls --

/**
 * Content is typed by hand into a public page, so every href and src passes
 * through here. Only http(s) and our own uploads survive; `javascript:` and
 * `data:` do not.
 */
export function safeUrl(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

export function mapsHref(ev: WeddingEvent): string | null {
  const given = safeUrl(ev?.mapsUrl);
  if (given) return given;
  const query = [ev?.venue, ev?.address].filter(Boolean).join(", ").trim();
  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : null;
}

/** youtube-nocookie so a guest is not tracked for opening an invitation. */
export function youtubeEmbed(v: unknown): string | null {
  const url = safeUrl(v);
  if (!url) return null;
  const id = /(?:v=|youtu\.be\/|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/.exec(url)?.[1];
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

// -------------------------------------------------------------- calendar --

const icsText = (v: string) =>
  v.replace(/[\\;,]/g, (c) => "\\" + c).replace(/\r?\n/g, "\\n");

/**
 * "Simpan ke kalender" without a library and without a round trip: the whole
 * .ics is the href. Times are written as floating local time — no Z, no TZID —
 * which is exactly what a wall-clock wedding hour means.
 */
export function icsDataUrl(ev: WeddingEvent, title: string): string | null {
  const s = parseStamp(ev?.startsAt);
  if (!s) return null;
  const at = (x: Stamp) =>
    `${x.y}${String(x.m).padStart(2, "0")}${String(x.d).padStart(2, "0")}T` +
    `${String(x.hh ?? 0).padStart(2, "0")}${String(x.mi ?? 0).padStart(2, "0")}00`;

  const end = parseStamp(ev?.endsAt);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OurDay//Undangan//ID",
    "BEGIN:VEVENT",
    // Deterministic: re-downloading must update the entry, not add a second one.
    `UID:${at(s)}-ourday`,
    `DTSTAMP:${at(s)}Z`,
    `DTSTART:${at(s)}`,
    // ponytail: two hours when no end time was given. The editor can ask for one.
    end && at(end) > at(s) ? `DTEND:${at(end)}` : "DURATION:PT2H",
    `SUMMARY:${icsText([ev?.name, title].filter(Boolean).join(" — ") || "Pernikahan")}`,
    `LOCATION:${icsText([ev?.venue, ev?.address].filter(Boolean).join(", "))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(lines.join("\r\n"));
}

// ------------------------------------------------------------------ content --

export const displayName = (p: Person | undefined) =>
  (p?.nickName || p?.fullName || "").trim();

export const fullName = (p: Person | undefined) => (p?.fullName || p?.nickName || "").trim();

/** "Dimas & Sari", or an honest placeholder while the draft is still empty. */
export function coupleTitle(content: InvitationContent): string {
  const both = [displayName(content.couple.groom), displayName(content.couple.bride)]
    .filter(Boolean)
    .join(" & ");
  return both || "Undangan Pernikahan";
}

/** Events with a usable date, in the order they happen. */
export function usableEvents(content: InvitationContent): WeddingEvent[] {
  return content.events
    .filter((e): e is WeddingEvent => Boolean(e) && parseStamp(e.startsAt) !== null)
    .sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));
}

/** What the countdown counts to: the first event that has not happened yet. */
export function countdownTarget(content: InvitationContent): string | null {
  const events = usableEvents(content);
  if (!events.length) return null;
  const today = new Date().toISOString().slice(0, 10);
  const next = events.find((e) => String(e.startsAt).slice(0, 10) >= today);
  return (next ?? events[0]!).startsAt;
}

export function galleryPhotos(content: InvitationContent): string[] {
  return content.gallery.map(safeUrl).filter((s): s is string => s !== null);
}

/** An account with no number is not a gift channel, it is an unfinished draft
 *  row — and a heading over an empty list is worse than no heading. */
export function hasGifts(content: InvitationContent): boolean {
  const { banks, ewallets, shippingAddress } = content.gifts;
  return (
    [...banks, ...ewallets].some((b) => b && (b.number ?? "").trim() !== "") ||
    (shippingAddress ?? "").trim() !== ""
  );
}

// -------------------------------------------------------------------- theme --

/**
 * Colour and font reach the templates as custom properties on the root element.
 * There is no generated stylesheet anywhere: swapping a palette is six string
 * values, and every template reads the same six names.
 *
 * --line and --tint are mixed here rather than in a utility class so a template
 * can write `border-[var(--line)]` and get a hairline that already belongs to
 * the chosen palette.
 */
export function themeStyle(theme: InvitationTheme): CSSProperties {
  const p = PALETTES[theme.palette] ?? PALETTES.sand;
  return {
    "--bg": p.bg,
    "--fg": p.fg,
    "--accent": p.accent,
    "--soft": p.soft,
    "--line": `color-mix(in srgb, ${p.accent} 26%, ${p.bg})`,
    "--tint": `color-mix(in srgb, ${p.accent} 7%, ${p.bg})`,
    "--display": theme.display === "sans" ? "var(--font-sans)" : "var(--font-display)",
  } as CSSProperties;
}

/** Used by every template, so it is one string rather than five. */
export const DISPLAY = "font-[family-name:var(--display)]";
