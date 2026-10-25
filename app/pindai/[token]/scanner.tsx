"use client";

// The reception desk. Runs in the receptionist's own browser, on venue wifi
// that will drop. Every scan is written to localStorage BEFORE it is sent, and
// the unsent count is on screen permanently, because the only question that
// matters at the end of the night is "is it safe to leave the desk yet".
import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState } from "react";

type Guest = {
  id: string;
  name: string;
  guest_group: string;
  pax_allowed: number;
  checked_in_pax: number | null;
  token: string;
};

type Scan = {
  id: string;
  kind: "scan";
  token: string;
  pax: number | null;
  photo?: string;
  photoPath?: string;
  photoTried?: boolean;
};

type Queued =
  | Scan
  | { id: string; kind: "walkin"; name: string; pax: number }
  | { id: string; kind: "undo"; guestId: string };

type Outcome = {
  status: "ok" | "already" | "undone";
  guest?: Guest;
  checkedInAt?: string;
};

const jam = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

const PESAN: Record<string, string> = {
  TAMU_TIDAK_DITEMUKAN: "QR itu bukan tamu di pernikahan ini.",
  PAX_TIDAK_VALID: "Jumlah orang tidak masuk akal.",
  NAMA_KOSONG: "Nama tamu belum diisi.",
  "BELUM_DIBELI:guestbook": "Buku tamu digital belum aktif. Hubungi pengantin.",
};

export function Scanner({
  token,
  label,
  couple,
  photoEnabled,
}: {
  token: string;
  label: string;
  couple: string;
  photoEnabled: boolean;
}) {
  const KEY = `ourday.checkin.${token.slice(0, 10)}`;

  const queue = useRef<Queued[]>([]);
  const flushing = useRef(false);
  const awaiting = useRef<string | null>(null);
  const lastDecode = useRef({ token: "", at: 0 });
  const video = useRef<HTMLVideoElement | null>(null);

  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(true);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [paxDraft, setPaxDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [arrived, setArrived] = useState<{ arrived: number; pax: number } | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [tab, setTab] = useState<"pindai" | "cari">("pindai");

  // ------------------------------------------------------------- the queue --

  const save = useCallback(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(queue.current));
    } catch {
      // Photos are the only thing big enough to overflow the quota, and a photo
      // is worth less than an arrival. Drop them and keep the check-ins.
      for (const item of queue.current) if (item.kind === "scan") delete item.photo;
      try {
        localStorage.setItem(KEY, JSON.stringify(queue.current));
      } catch {
        // Nothing left to shed; the in-memory queue still flushes.
      }
    }
    setPending(queue.current.length);
  }, [KEY]);

  const flush = useCallback(async () => {
    if (flushing.current || queue.current.length === 0) return;
    flushing.current = true;
    try {
      const batch = queue.current.slice(0, 20);

      for (const item of batch) {
        if (item.kind !== "scan" || !item.photo || item.photoTried) continue;
        // Exactly one attempt: a photo must never hold an arrival hostage.
        item.photoTried = true;
        const dataUrl = item.photo;
        delete item.photo;
        try {
          const res = await fetch(
            `/api/checkin/photo?token=${encodeURIComponent(token)}`,
            {
              method: "POST",
              headers: { "content-type": "image/jpeg" },
              body: await (await fetch(dataUrl)).blob(),
            },
          );
          if (res.ok) item.photoPath = (await res.json()).path;
        } catch {
          // offline; the check-in below will fail too and stay queued
        }
        save();
      }

      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, events: batch }),
      });
      if (!res.ok) {
        setNotice(
          res.status === 403
            ? "Link pemindai sudah dicabut. Minta link baru."
            : "Server menolak kiriman. Antrean tetap tersimpan.",
        );
        return;
      }

      const { results, stats } = await res.json();
      const settled = new Set<string>();
      for (const r of results) {
        if (r.ok || r.drop) settled.add(r.id);
        if (!r.ok) setNotice(PESAN[r.error] ?? r.error);
        if (r.id === awaiting.current) {
          awaiting.current = null;
          if (r.ok && r.status !== "undone") {
            setOutcome(r);
            setPaxDraft(String(r.guest?.checked_in_pax ?? ""));
            setNotice(null);
          }
        }
      }
      queue.current = queue.current.filter((e) => !settled.has(e.id));
      save();
      setArrived({ arrived: stats.arrived, pax: stats.pax });
      setOnline(true);
    } catch {
      setOnline(false);
    } finally {
      flushing.current = false;
    }
  }, [KEY, save, token]);

  const enqueue = useCallback(
    (event: Queued, watch = true) => {
      if (watch) awaiting.current = event.id;
      queue.current.push(event);
      save();
      void flush();
    },
    [flush, save],
  );

  // Restore anything left over from a refresh or a closed tab, then keep trying.
  useEffect(() => {
    try {
      queue.current = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {
      queue.current = [];
    }
    setPending(queue.current.length);
    setOnline(navigator.onLine);
    void flush();

    const tick = setInterval(() => void flush(), 4000);
    const back = () => {
      setOnline(true);
      void flush();
    };
    const gone = () => setOnline(false);
    window.addEventListener("online", back);
    window.addEventListener("offline", gone);
    return () => {
      clearInterval(tick);
      window.removeEventListener("online", back);
      window.removeEventListener("offline", gone);
    };
  }, [KEY, flush]);

  // ----------------------------------------------------------- the camera --

  const capture = useCallback((): string | undefined => {
    const v = video.current;
    if (!photoEnabled || !v?.videoWidth) return undefined;
    const w = Math.min(1000, v.videoWidth);
    const h = Math.round((v.videoHeight / v.videoWidth) * w);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(v, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.72);
  }, [photoEnabled]);

  const scan = useCallback(
    (guestToken: string) => {
      navigator.vibrate?.(50);
      enqueue({
        id: crypto.randomUUID(),
        kind: "scan",
        token: guestToken,
        pax: null, // the desk corrects it on the next screen
        photo: capture(),
      });
    },
    [capture, enqueue],
  );

  useEffect(() => {
    let raf = 0;
    let stream: MediaStream | null = null;
    let stopped = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 } },
        });
        if (stopped || !video.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.current.srcObject = stream;
        await video.current.play();

        // One decoder for every platform. BarcodeDetector does not exist in
        // Safari on iOS, and half the desks are iPhones.
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        const tick = () => {
          const v = video.current;
          if (v && v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth) {
            const w = 480;
            const h = Math.round((v.videoHeight / v.videoWidth) * w) || 480;
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(v, 0, 0, w, h);
            const found = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, {
              inversionAttempts: "dontInvert",
            });
            const raw = found?.data.trim().toUpperCase() ?? "";
            if (/^[0-9A-Z]{6,16}$/.test(raw)) {
              const now = Date.now();
              if (lastDecode.current.token !== raw || now - lastDecode.current.at > 4000) {
                lastDecode.current = { token: raw, at: now };
                scan(raw);
              }
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        setCamError(
          "Kamera tidak bisa dibuka. Izinkan akses kamera, atau pakai tab Cari nama.",
        );
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [scan]);

  // ------------------------------------------------------------- the desk --

  const savePax = () => {
    const g = outcome?.guest;
    if (!g) return;
    enqueue({
      id: crypto.randomUUID(),
      kind: "scan",
      token: g.token,
      pax: Number(paxDraft),
    });
  };

  const undo = () => {
    const g = outcome?.guest;
    if (!g) return;
    enqueue({ id: crypto.randomUUID(), kind: "undo", guestId: g.id }, false);
    setOutcome(null);
    lastDecode.current = { token: "", at: 0 };
  };

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-16 pt-4">
      <header className="flex items-center gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-lg leading-tight">{label}</p>
          <p className="truncate text-xs text-ink-soft">{couple || "Check-in tamu"}</p>
        </div>
        <div className="ml-auto text-right">
          <p
            className={
              "tabular text-sm font-medium " +
              (pending > 0 ? "text-rose" : "text-ink-soft")
            }
          >
            {pending > 0 ? `${pending} belum terkirim` : "Semua terkirim"}
          </p>
          <p className="text-[11px] text-ink-soft">
            {online ? "Tersambung" : "Tanpa koneksi — tersimpan di HP"}
            {arrived ? ` · ${arrived.arrived} hadir (${arrived.pax} orang)` : ""}
          </p>
        </div>
      </header>

      <div className="mt-3 flex gap-1 border-b border-line">
        {(["pindai", "cari"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "rounded-t-lg px-3 py-2 text-sm " +
              (tab === t
                ? "border-b-2 border-ink font-medium"
                : "border-b-2 border-transparent text-ink-soft")
            }
          >
            {t === "pindai" ? "Pindai QR" : "Cari nama"}
          </button>
        ))}
      </div>

      {notice ? (
        <p className="mt-3 rounded-lg bg-rose-soft px-3 py-2 text-sm text-rose">{notice}</p>
      ) : null}

      <div className={tab === "pindai" ? "mt-4" : "hidden"}>
        <div className="relative overflow-hidden rounded-card bg-ink">
          {/* Kept mounted across tabs so the camera never has to warm up twice. */}
          <video
            ref={video}
            playsInline
            muted
            className="h-64 w-full object-cover"
            aria-label="Pratinjau kamera"
          />
          <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-white/70" />
        </div>
        {camError ? (
          <p className="mt-2 text-sm text-rose">{camError}</p>
        ) : (
          <p className="mt-2 text-center text-xs text-ink-soft">
            Arahkan ke QR di undangan tamu.
          </p>
        )}
      </div>

      {tab === "cari" ? (
        <SearchPanel token={token} online={online} onPick={(g) => scan(g.token)} onWalkIn={(name, pax) =>
          enqueue({ id: crypto.randomUUID(), kind: "walkin", name, pax })
        } />
      ) : null}

      {outcome?.guest ? (
        <section className="mt-5 card p-5 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">
            {outcome.status === "already"
              ? `Sudah check-in pukul ${jam(outcome.checkedInAt!)}`
              : "Selamat datang"}
          </p>
          <h2 className="mt-2 font-display text-3xl leading-tight">{outcome.guest.name}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {outcome.guest.guest_group || "Tamu"} · jatah {outcome.guest.pax_allowed} orang
          </p>

          <div className="mt-4 flex items-end justify-center gap-2">
            <div className="w-28 text-left">
              <label className="label" htmlFor="pax">Yang datang</label>
              <input
                id="pax"
                className="input tabular"
                type="number"
                min={0}
                max={99}
                value={paxDraft}
                onChange={(e) => setPaxDraft(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={savePax}>Simpan</button>
          </div>

          <button className="btn btn-danger mt-4 w-full" onClick={undo}>
            Batalkan check-in ini
          </button>
        </section>
      ) : null}
    </main>
  );
}

function SearchPanel({
  token,
  online,
  onPick,
  onWalkIn,
}: {
  token: string;
  online: boolean;
  onPick: (guest: Guest) => void;
  onWalkIn: (name: string, pax: number) => void;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Guest[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [pax, setPax] = useState("1");

  const search = async () => {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/checkin?token=${encodeURIComponent(token)}&q=${encodeURIComponent(q)}`,
      );
      setHits(res.ok ? (await res.json()).guests : []);
    } catch {
      setHits(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 space-y-5">
      <div>
        <label className="label" htmlFor="q">Nama tamu</label>
        <div className="flex gap-2">
          <input
            id="q"
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Minimal 2 huruf"
          />
          <button className="btn btn-ghost" onClick={search} disabled={busy || !online}>
            Cari
          </button>
        </div>
        {!online ? (
          <p className="mt-2 text-xs text-ink-soft">
            Pencarian butuh koneksi. Pindai QR tetap jalan tanpa sinyal.
          </p>
        ) : null}

        {hits?.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">Tidak ada yang cocok.</p>
        ) : null}
        <ul className="mt-3 space-y-2">
          {hits?.map((g) => (
            <li key={g.id} className="card flex items-center gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{g.name}</p>
                <p className="truncate text-xs text-ink-soft">
                  {g.guest_group || "Tamu"} · jatah {g.pax_allowed}
                </p>
              </div>
              <button className="btn btn-ghost ml-auto text-xs" onClick={() => onPick(g)}>
                Check-in
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-4">
        <p className="text-sm font-medium">Tamu tidak ada di daftar</p>
        <p className="mt-1 text-xs text-ink-soft">
          Daftarkan sekarang; namanya masuk ke daftar tamu yang sama.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama tamu"
            aria-label="Nama tamu dadakan"
          />
          <input
            className="input tabular w-20"
            type="number"
            min={1}
            max={99}
            value={pax}
            onChange={(e) => setPax(e.target.value)}
            aria-label="Jumlah orang"
          />
        </div>
        <button
          className="btn btn-primary mt-3 w-full"
          disabled={name.trim().length < 2}
          onClick={() => {
            onWalkIn(name.trim(), Number(pax));
            setName("");
            setPax("1");
          }}
        >
          Daftarkan & check-in
        </button>
      </div>
    </div>
  );
}
