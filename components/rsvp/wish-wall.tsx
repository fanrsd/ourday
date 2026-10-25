"use client";

/**
 * The guest book on the invitation itself. Fetched from the client on mount
 * rather than rendered on the server, because the invitation page is static so
 * that guests on bad signal get it instantly — the wall is the one part that has
 * to be fresh.
 */
import { useEffect, useState, useTransition } from "react";
import type { Wish } from "@/lib/rsvp.ts";
import { loadWishesAction, submitWishAction } from "./actions.ts";

const LIMIT = 1000;

export function WishWall({
  weddingId,
  guestToken,
  guestName,
  accent,
}: {
  weddingId: string;
  guestToken: string | null;
  guestName: string;
  accent: string;
}) {
  const [wishes, setWishes] = useState<Wish[] | null>(null);
  const [name, setName] = useState(guestName);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let live = true;
    loadWishesAction(weddingId)
      .then((w) => live && setWishes(w))
      .catch(() => live && setWishes([]));
    return () => {
      live = false;
    };
  }, [weddingId]);

  const surface = `color-mix(in srgb, var(--accent, ${accent}) 4%, #fff)`;
  const border = `color-mix(in srgb, var(--accent, ${accent}) 22%, transparent)`;

  function send() {
    setError(null);
    start(async () => {
      const res = await submitWishAction({ weddingId, guestToken, name, message });
      if (res.ok) {
        setMessage("");
        if (res.data) setWishes(res.data);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <section style={box(surface, border)} aria-labelledby="wish-title">
      <h3 id="wish-title" style={heading(accent)}>Ucapan &amp; doa</h3>

      <label style={label} htmlFor="wish-name">Nama kamu</label>
      <input
        id="wish-name"
        style={field(border)}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama lengkap"
        autoComplete="name"
      />

      <label style={{ ...label, marginTop: "1rem" }} htmlFor="wish-message">
        Ucapan
      </label>
      <textarea
        id="wish-message"
        rows={3}
        maxLength={LIMIT}
        style={{ ...field(border), resize: "vertical" }}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tulis ucapan untuk mempelai"
      />
      <p style={{ fontSize: ".72rem", opacity: 0.6, margin: ".3rem 0 0", textAlign: "right" }}>
        {message.length}/{LIMIT}
      </p>

      <button
        type="button"
        onClick={send}
        disabled={pending || !name.trim() || !message.trim()}
        style={{
          marginTop: ".5rem", width: "100%", border: 0, borderRadius: 10,
          padding: ".7rem 1rem", fontSize: ".9rem", fontWeight: 500,
          background: `var(--accent, ${accent})`, color: "#fff",
          cursor: pending ? "progress" : "pointer",
          opacity: pending || !name.trim() || !message.trim() ? 0.55 : 1,
        }}
      >
        {pending ? "Mengirim…" : "Kirim ucapan"}
      </button>

      <p role="status" aria-live="polite" style={{ margin: ".6rem 0 0", fontSize: ".82rem" }}>
        {error ? <span style={{ color: "#9c4a54" }}>{error}</span> : null}
      </p>

      <ul style={{ listStyle: "none", padding: 0, margin: "1.5rem 0 0" }}>
        {wishes === null ? (
          <li style={{ fontSize: ".85rem", opacity: 0.6 }}>Memuat ucapan…</li>
        ) : wishes.length === 0 ? (
          <li style={{ fontSize: ".85rem", opacity: 0.6 }}>
            Belum ada ucapan. Jadilah yang pertama.
          </li>
        ) : (
          wishes.map((w) => (
            <li
              key={w.id}
              style={{
                borderTop: `1px solid ${border}`,
                padding: ".9rem 0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: ".5rem" }}>
                <strong style={{ fontSize: ".85rem", fontWeight: 500 }}>{w.name}</strong>
                <time
                  dateTime={w.created_at}
                  style={{ fontSize: ".72rem", opacity: 0.55, whiteSpace: "nowrap" }}
                >
                  {formatDate(w.created_at)}
                </time>
              </div>
              <p style={{ margin: ".3rem 0 0", fontSize: ".88rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {w.message}
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// Inline styles, not classes: the public invitation does not load the dashboard
// stylesheet, and colour has to come from the template's own accent.
const box = (surface: string, border: string) => ({
  background: surface,
  border: `1px solid ${border}`,
  borderRadius: 14,
  padding: "1.5rem",
  maxWidth: 480,
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
  fontFamily: "inherit",
});
