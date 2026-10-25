import Link from "next/link";
import { currentContext } from "@/lib/current.ts";
import { listWishesForMember } from "@/lib/rsvp.ts";
import { setWishHiddenAction } from "../actions.ts";

export const metadata = { title: "Ucapan tamu — OurDay" };

export default async function UcapanPage() {
  const { userId, wedding } = await currentContext();
  const wishes = await listWishesForMember(userId, wedding.id);
  const hidden = wishes.filter((w) => w.hidden_at).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Ucapan tamu</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Yang disembunyikan hilang dari undangan tapi tidak terhapus, jadi
            keputusan ini selalu bisa dibatalkan.
          </p>
        </div>
        <Link href="/tamu" className="btn btn-ghost">Daftar tamu</Link>
      </header>

      <p className="text-sm text-ink-soft">
        <span className="tabular font-medium text-ink">{wishes.length}</span> ucapan
        {hidden > 0 ? (
          <>
            , <span className="tabular font-medium text-ink">{hidden}</span> disembunyikan
          </>
        ) : null}
      </p>

      {wishes.length === 0 ? (
        <p className="card px-4 py-8 text-center text-sm text-ink-soft">
          Belum ada ucapan. Ucapan muncul di sini begitu tamu menulis di
          undangan.
        </p>
      ) : (
        <ul className="space-y-3">
          {wishes.map((w) => (
            <li key={w.id} className={`card p-4 ${w.hidden_at ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <strong className="text-sm font-medium">{w.name}</strong>
                <time dateTime={w.created_at} className="text-xs text-ink-soft">
                  {new Date(w.created_at).toLocaleDateString("id-ID", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {w.message}
              </p>
              <form action={setWishHiddenAction} className="mt-3 flex items-center gap-3">
                <input type="hidden" name="id" value={w.id} />
                <input type="hidden" name="hide" value={w.hidden_at ? "0" : "1"} />
                <button className={`btn text-xs ${w.hidden_at ? "btn-ghost" : "btn-danger"}`}>
                  {w.hidden_at ? "Tampilkan lagi" : "Sembunyikan"}
                </button>
                {w.hidden_at ? (
                  <span className="text-xs text-ink-soft">
                    Tidak tampil di undangan
                  </span>
                ) : null}
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
