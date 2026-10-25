import Link from "next/link";
import { currentContext } from "@/lib/current.ts";
import { listGroups, recap } from "@/lib/guests.ts";

export const metadata = { title: "Rekap tamu — OurDay" };

export default async function RekapPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group = "" } = await searchParams;
  const { userId, wedding } = await currentContext();
  const [r, groups] = await Promise.all([
    recap(userId, wedding.id, group),
    listGroups(userId, wedding.id),
  ]);

  const gap = r.paxConfirmed - r.paxPresent;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Rekap</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Angka yang bisa kamu setor ke katering, dan setelah acara: siapa yang
            benar-benar datang.
          </p>
        </div>
        <Link href="/tamu" className="btn btn-ghost">Daftar tamu</Link>
      </header>

      <form className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="group">Kelompok</label>
          <select id="group" name="group" defaultValue={group} className="input">
            <option value="">Semua kelompok</option>
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <button className="btn btn-ghost">Terapkan</button>
        {group ? (
          <Link href="/tamu/rekap" className="text-sm text-ink-soft underline underline-offset-2">
            Semua
          </Link>
        ) : null}
      </form>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Diundang" value={r.invited} />
        <Stat label="Menjawab hadir" value={r.respondedYes} tone="leaf" />
        <Stat label="Menjawab tidak hadir" value={r.respondedNo} />
        <Stat label="Belum menjawab" value={r.notResponded} />
        <Stat label="Total pax dikonfirmasi" value={r.paxConfirmed} tone="leaf"
              note="Angka untuk katering" />
        <Stat label="Tamu yang check-in" value={r.checkedIn} />
        <Stat label="Total pax hadir" value={r.paxPresent} />
        <Stat
          label="Selisih konfirmasi vs hadir"
          value={Math.abs(gap)}
          tone={gap > 0 ? "rose" : undefined}
          note={
            gap > 0
              ? `${gap} pax dikonfirmasi tapi tidak datang`
              : gap < 0
                // Walk-ins and guests who bring an extra seat. Real, and worth
                // naming rather than showing as a negative number.
                ? `${-gap} pax hadir tanpa dikonfirmasi lebih dulu`
                : "Konfirmasi dan kehadiran sama"
          }
        />
      </section>

      {/* Answers from the no-token link cannot join the guest list, so they are
          reported beside it instead of being quietly dropped. */}
      {!group && r.openLinkYes > 0 ? (
        <p className="card px-4 py-3 text-sm text-ink-soft">
          Ditambah <span className="tabular font-medium text-ink">{r.openLinkYes}</span>{" "}
          konfirmasi dari link umum (
          <span className="tabular font-medium text-ink">{r.openLinkPax}</span> pax).
          Mereka tidak punya baris di daftar tamu, jadi tidak ikut dihitung di
          angka atas. Total pax untuk katering:{" "}
          <span className="tabular font-medium text-ink">
            {r.paxConfirmed + r.openLinkPax}
          </span>
          .
        </p>
      ) : null}

      <section>
        <h2 className="text-sm font-medium">
          Konfirmasi hadir tapi tidak datang
          <span className="tabular ml-2 text-ink-soft">
            {r.confirmedAbsent.length}
          </span>
        </h2>
        <p className="mb-3 mt-1 text-sm text-ink-soft">
          Daftar yang hari ini tidak ada yang bisa jawab. Berguna untuk
          menghubungi mereka setelah acara, dan untuk menakar undangan berikutnya.
        </p>

        {r.confirmedAbsent.length === 0 ? (
          <p className="card px-4 py-6 text-center text-sm text-ink-soft">
            {r.respondedYes === 0
              ? "Belum ada yang mengonfirmasi hadir."
              : "Semua tamu yang mengonfirmasi hadir sudah tercatat datang."}
          </p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-xs text-ink-soft">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Kelompok</th>
                  <th className="px-4 py-3 font-medium">Pax dikonfirmasi</th>
                </tr>
              </thead>
              <tbody>
                {r.confirmedAbsent.map((g) => (
                  <tr key={g.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">{g.name}</td>
                    <td className="px-4 py-3 text-ink-soft">{g.guest_group || "—"}</td>
                    <td className="tabular px-4 py-3">{g.rsvp_pax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: number;
  note?: string;
  tone?: "leaf" | "rose";
}) {
  const colour = tone === "leaf" ? "text-leaf" : tone === "rose" ? "text-rose" : "text-ink";
  return (
    <div className="card p-4">
      <div className="text-xs text-ink-soft">{label}</div>
      {/* Not font-display: it falls back to Georgia, whose old-style figures
          render 1 as an I-shape and drop 3 and 4 below the baseline. On the one
          screen that is nothing but numbers, that is unreadable. */}
      <div className={`tabular mt-1 text-3xl font-medium tracking-tight ${colour}`}>
        {value}
      </div>
      {note ? <div className="mt-1 text-xs text-ink-soft">{note}</div> : null}
    </div>
  );
}
