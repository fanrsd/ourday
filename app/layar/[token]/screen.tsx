"use client";

// The venue projector. Postgres notifies on every arrival and the server bridges
// that to SSE, so this screen never polls and there is no websocket library to
// keep alive. EventSource reconnects on its own when the venue wifi blinks.
import { useEffect, useState } from "react";
import type { LiveStats } from "@/lib/checkin.ts";

const jam = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export function Screen({
  token,
  couple,
  initial,
}: {
  token: string;
  couple: string;
  initial: LiveStats;
}) {
  const [stats, setStats] = useState(initial);

  useEffect(() => {
    const src = new EventSource(`/api/checkin/stream?token=${encodeURIComponent(token)}`);
    src.onmessage = (e) => setStats(JSON.parse(e.data));
    return () => src.close();
  }, [token]);

  return (
    <main className="min-h-dvh bg-ink px-8 py-8 text-paper">
      <header className="flex items-baseline gap-6">
        <h1 className="font-display text-4xl">{couple || "Selamat datang"}</h1>
        <p className="ml-auto tabular text-right">
          <span className="font-display text-6xl leading-none">{stats.pax}</span>
          <span className="ml-3 text-sm text-paper/60">
            orang hadir · {stats.arrived} undangan
          </span>
        </p>
      </header>

      {stats.recent.length === 0 ? (
        <p className="mt-24 text-center font-display text-3xl text-paper/50">
          Menanti tamu pertama.
        </p>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {stats.recent.map((g) => (
            <li key={g.id} className="overflow-hidden rounded-card bg-white/5">
              {g.checkin_photo_path ? (
                // eslint-disable-next-line @next/next/no-img-element -- served by a token-guarded route, not the image optimiser
                <img
                  src={`/api/checkin/photo?token=${encodeURIComponent(token)}&p=${encodeURIComponent(g.checkin_photo_path)}`}
                  alt=""
                  className="aspect-4/3 w-full object-cover"
                />
              ) : (
                <div className="flex aspect-4/3 w-full items-center justify-center bg-white/5">
                  <span className="font-display text-5xl text-paper/40">
                    {g.name.slice(0, 1).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="px-4 py-3">
                <p className="truncate font-display text-2xl leading-tight">{g.name}</p>
                <p className="tabular mt-1 text-xs text-paper/60">
                  {jam(g.checked_in_at)}
                  {g.guest_group ? ` · ${g.guest_group}` : ""}
                  {g.checked_in_pax ? ` · ${g.checked_in_pax} orang` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
