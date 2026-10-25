"use client";

/**
 * Rendered inside whichever template the couple chose, so it owns no chrome of
 * its own: colour comes from `--accent` on the invitation root, with the
 * `accent` prop as the fallback, and the surface is mixed from that accent
 * rather than hardcoded white — every palette sits on a tinted background.
 */
import { useState, useTransition } from "react";
import { submitRsvpAction } from "./actions.ts";

type Initial = { name: string; attending: "yes" | "no"; pax: number };

export function RsvpForm({
  weddingId,
  guestToken,
  paxAllowed,
  deadlinePassed,
  initial,
  guestName = "",
  accent,
}: {
  weddingId: string;
  guestToken: string | null;
  paxAllowed: number;
  deadlinePassed: boolean;
  initial: Initial | null;
  /** Whom the personal link belongs to. Mirrors WishWall, which already has it. */
  guestName?: string;
  accent: string;
}) {
  // An invitation that greets you by name and prints your name on your QR has no
  // business asking you to type it again. `initial` cannot carry this: it is also
  // what marks the RSVP as already answered.
  const [name, setName] = useState(initial?.name ?? guestName);
  const [attending, setAttending] = useState<"yes" | "no">(initial?.attending ?? "yes");
  const [pax, setPax] = useState(initial?.pax ?? 1);
  const [saved, setSaved] = useState(initial != null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // A personal link is capped by what the couple allotted. The open link has no
  // guest to cap, so it gets a sane ceiling instead of an unbounded field.
  const cap = guestToken ? paxAllowed : 10;
  const surface = `color-mix(in srgb, var(--accent, ${accent}) 4%, #fff)`;
  const border = `color-mix(in srgb, var(--accent, ${accent}) 22%, transparent)`;

  if (deadlinePassed) {
    return (
      <section style={box(surface, border)} aria-labelledby="rsvp-closed">
        <h3 id="rsvp-closed" style={heading(accent)}>Konfirmasi kehadiran ditutup</h3>
        <p style={{ fontSize: ".9rem", lineHeight: 1.6, opacity: 0.8, margin: 0 }}>
          Batas waktu konfirmasi sudah lewat dan jumlah tamu sudah disetor ke
          katering.{" "}
          {initial
            ? `Jawaban kamu tercatat: ${initial.attending === "yes" ? `hadir, ${initial.pax} orang` : "tidak dapat hadir"}.`
            : "Kalau rencanamu berubah, hubungi mempelai langsung."}
        </p>
      </section>
    );
  }

  function save() {
    setError(null);
    start(async () => {
      const res = await submitRsvpAction({ weddingId, guestToken, name, attending, pax });
      if (res.ok) setSaved(true);
      else setError(res.error);
    });
  }

  return (
    <section style={box(surface, border)} aria-labelledby="rsvp-title">
      <h3 id="rsvp-title" style={heading(accent)}>Konfirmasi kehadiran</h3>

      <label style={label} htmlFor="rsvp-name">Nama kamu</label>
      <input
        id="rsvp-name"
        style={field(border)}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama lengkap"
        autoComplete="name"
      />

      <fieldset style={{ border: 0, padding: 0, margin: "1rem 0 0" }}>
        <legend style={label}>Apakah kamu bisa hadir?</legend>
        <div style={{ display: "flex", gap: ".5rem" }}>
          {(["yes", "no"] as const).map((v) => (
            <label key={v} style={choice(attending === v, accent, border)}>
              <input
                type="radio"
                name="attending"
                value={v}
                checked={attending === v}
                onChange={() => setAttending(v)}
                style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
              />
              {v === "yes" ? "Ya, saya hadir" : "Maaf, tidak bisa"}
            </label>
          ))}
        </div>
      </fieldset>

      {attending === "yes" ? (
        <div style={{ marginTop: "1rem" }}>
          <label style={label} htmlFor="rsvp-pax">Jumlah orang</label>
          <select
            id="rsvp-pax"
            style={field(border)}
            value={pax}
            onChange={(e) => setPax(Number(e.target.value))}
          >
            {Array.from({ length: cap }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} orang</option>
            ))}
          </select>
          {/* Story 75: the guest is told the cap before they try to exceed it. */}
          {guestToken ? (
            <p style={{ fontSize: ".78rem", opacity: 0.7, margin: ".4rem 0 0" }}>
              Undangan ini berlaku untuk maksimal {paxAllowed} orang.
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={save}
        disabled={pending || !name.trim()}
        style={{
          marginTop: "1.25rem", width: "100%", border: 0, borderRadius: 10,
          padding: ".7rem 1rem", fontSize: ".9rem", fontWeight: 500,
          background: `var(--accent, ${accent})`, color: "#fff",
          cursor: pending ? "progress" : "pointer",
          opacity: pending || !name.trim() ? 0.55 : 1,
        }}
      >
        {pending ? "Menyimpan…" : saved ? "Ubah jawaban saya" : "Kirim konfirmasi"}
      </button>

      <p role="status" aria-live="polite" style={{ margin: ".6rem 0 0", fontSize: ".82rem" }}>
        {error ? (
          <span style={{ color: "#9c4a54" }}>{error}</span>
        ) : saved && !pending ? (
          <span style={{ opacity: 0.75 }}>
            Terima kasih, jawaban kamu tersimpan. Masih bisa diubah sampai batas waktu.
          </span>
        ) : null}
      </p>
    </section>
  );
}

// Inline styles, not classes: this renders on the public invitation, which does
// not load the dashboard stylesheet.
const box = (surface: string, border: string) => ({
  background: surface,
  border: `1px solid ${border}`,
  borderRadius: 14,
  padding: "1.5rem",
  maxWidth: 420,
  margin: "0 auto",
  textAlign: "left" as const,
});

const heading = (accent: string) => ({
  margin: "0 0 1.25rem",
  fontSize: "1.05rem",
  letterSpacing: ".02em",
  color: `var(--accent, ${accent})`,
});

const label = {
  display: "block",
  fontSize: ".78rem",
  fontWeight: 500,
  opacity: 0.75,
  marginBottom: ".3rem",
};

const field = (border: string) => ({
  width: "100%",
  boxSizing: "border-box" as const,
  border: `1px solid ${border}`,
  borderRadius: 10,
  padding: ".6rem .7rem",
  fontSize: ".9rem",
  background: "#fff",
  color: "inherit",
  font: "inherit",
  fontFamily: "inherit",
});

const choice = (on: boolean, accent: string, border: string) => ({
  position: "relative" as const,
  flex: 1,
  textAlign: "center" as const,
  borderRadius: 10,
  padding: ".6rem .5rem",
  fontSize: ".85rem",
  cursor: "pointer",
  border: `1px solid ${on ? `var(--accent, ${accent})` : border}`,
  background: on ? `color-mix(in srgb, var(--accent, ${accent}) 12%, #fff)` : "#fff",
  fontWeight: on ? 500 : 400,
});
