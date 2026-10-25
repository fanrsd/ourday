"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LiveStats } from "@/lib/checkin.ts";
import { createLinkAction, revokeLinkAction, setPhotoAction } from "./actions.ts";

type LinkRow = {
  id: string;
  label: string;
  revoked: boolean;
  expired: boolean;
  expiresLabel: string;
};

// Explicit zone on both sides of hydration, so the server and the phone agree.
const jam = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

export function Desk({
  stats,
  photoEnabled,
  origin,
  links,
}: {
  stats: LiveStats;
  photoEnabled: boolean;
  origin: string;
  links: LinkRow[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [label, setLabel] = useState("Meja 1");
  const [hours, setHours] = useState("24");
  // A raw token exists once. Held here until the tab closes, then it is gone.
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // The couple watches this from their seat during the reception.
  useEffect(() => {
    const tick = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 15_000);
    return () => clearInterval(tick);
  }, [router]);

  const create = () =>
    start(async () => {
      const res = await createLinkAction(label.trim(), Number(hours));
      if (!res.ok) return setError(res.error);
      setError(null);
      setRevealed((r) => ({ ...r, [res.data!.id]: res.data!.token }));
    });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-display text-2xl">Kehadiran</h1>
        <dl className="mt-4 grid grid-cols-3 gap-3">
          {[
            ["Hadir", stats.arrived, "undangan"],
            ["Orang", stats.pax, "termasuk pendamping"],
            ["Diundang", stats.invited, "di daftar tamu"],
          ].map(([title, value, note]) => (
            <div key={title as string} className="card px-4 py-3">
              <dt className="text-xs text-ink-soft">{title}</dt>
              <dd className="tabular font-display text-3xl">{value}</dd>
              <p className="text-[11px] text-ink-soft">{note}</p>
            </div>
          ))}
        </dl>

        {stats.recent.length > 0 ? (
          <ul className="mt-4 card divide-y divide-line">
            {stats.recent.map((g) => (
              <li key={g.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="truncate font-medium">{g.name}</span>
                <span className="truncate text-xs text-ink-soft">{g.guest_group}</span>
                <span className="tabular ml-auto text-xs text-ink-soft">
                  {g.checked_in_pax} orang · {jam.format(new Date(g.checked_in_at))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink-soft">Belum ada tamu yang check-in.</p>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl">Link pemindai</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Penerima tamu memakai link ini di HP mereka sendiri — tidak perlu akun
          kamu dan tidak perlu memasang aplikasi. Link hanya tampil sekali; kalau
          hilang, cabut yang lama dan buat baru.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div className="grow">
            <label className="label" htmlFor="label">Nama meja</label>
            <input
              id="label"
              className="input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="w-28">
            <label className="label" htmlFor="hours">Berlaku (jam)</label>
            <input
              id="hours"
              className="input tabular"
              type="number"
              min={1}
              max={336}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={create} disabled={pending}>
            Buat link
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-rose">{error}</p> : null}

        <ul className="mt-4 space-y-2">
          {links.map((l) => (
            <li key={l.id} className="card p-4">
              <div className="flex items-center gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{l.label}</p>
                  <p className="text-xs text-ink-soft">
                    {l.revoked
                      ? "Dicabut"
                      : l.expired
                        ? `Kedaluwarsa ${l.expiresLabel}`
                        : `Berlaku sampai ${l.expiresLabel}`}
                  </p>
                </div>
                {!l.revoked ? (
                  <button
                    className="btn btn-danger ml-auto text-xs"
                    disabled={pending}
                    onClick={() => start(async () => void (await revokeLinkAction(l.id)))}
                  >
                    Cabut
                  </button>
                ) : null}
              </div>

              {revealed[l.id] ? (
                <div className="mt-3 space-y-2 border-t border-line pt-3">
                  <Copyable
                    title="Untuk penerima tamu"
                    url={`${origin}/pindai/${revealed[l.id]}`}
                  />
                  <Copyable
                    title="Untuk layar di gedung"
                    url={`${origin}/layar/${revealed[l.id]}`}
                  />
                  <p className="text-[11px] text-ink-soft">
                    Salin sekarang. Setelah halaman ini ditutup, link tidak bisa
                    ditampilkan lagi.
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1"
            defaultChecked={photoEnabled}
            disabled={pending}
            onChange={(e) =>
              start(async () => void (await setPhotoAction(e.target.checked)))
            }
          />
          <span>
            <span className="text-sm font-medium">Foto tamu saat check-in</span>
            <span className="mt-1 block text-xs text-ink-soft">
              Penerima tamu memotret tamu saat dipindai, dan fotonya tampil di
              layar gedung. Foto orang adalah data pribadi, jadi ini mati sampai
              kamu menyalakannya.
            </span>
          </span>
        </label>
      </section>
    </div>
  );
}

function Copyable({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="label mb-1">{title}</p>
      <div className="flex gap-2">
        <input className="input text-xs" readOnly value={url} onFocus={(e) => e.target.select()} />
        <button
          className="btn btn-ghost shrink-0 text-xs"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Tersalin" : "Salin"}
        </button>
      </div>
    </div>
  );
}
