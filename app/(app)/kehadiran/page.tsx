import Link from "next/link";
import { currentContext } from "@/lib/current.ts";
import { liveStats, listScannerLinks } from "@/lib/checkin.ts";
import { PRODUCTS } from "@/lib/products.ts";
import { Desk } from "./desk.tsx";

export const metadata = { title: "Kehadiran" };
export const dynamic = "force-dynamic";

const waktu = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export default async function KehadiranPage() {
  const { userId, wedding, owns } = await currentContext();

  if (!owns.guestbook) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h1 className="font-display text-2xl">Buku Tamu Digital & QR</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Tamu sudah memegang QR-nya sejak undangan dikirim. Aktifkan buku tamu
          dan penerima tamu tinggal memindai dari HP sendiri — tanpa cetak QR,
          tanpa daftar tamu kedua, dan tetap jalan saat wifi gedung putus.
        </p>
        <p className="tabular mt-5 font-display text-3xl">
          Rp {PRODUCTS.guestbook.price.toLocaleString("id-ID")}
        </p>
        <p className="text-xs text-ink-soft">
          sekali bayar · aktif {PRODUCTS.guestbook.activeDays} hari
        </p>
        <Link href="/tagihan" className="btn btn-primary mt-6">
          Beli buku tamu
        </Link>
      </div>
    );
  }

  const [stats, links] = await Promise.all([
    liveStats(wedding.id, { userId }),
    listScannerLinks(userId, wedding.id),
  ]);

  return (
    <Desk
      stats={stats}
      photoEnabled={wedding.checkin_photo_enabled}
      origin={process.env.APP_URL ?? ""}
      links={links.map((l) => ({
        id: l.id,
        label: l.label,
        revoked: l.revoked_at !== null,
        expired: new Date(l.expires_at).getTime() < Date.now(),
        expiresLabel: waktu.format(new Date(l.expires_at)),
      }))}
    />
  );
}
