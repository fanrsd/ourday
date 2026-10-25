import Link from "next/link";
import type { Metadata } from "next";
import { currentContext } from "@/lib/current.ts";
import { asYmd, KINDS, plannerSummary } from "@/lib/planner.ts";
import { rupiah, selisih, tanggal } from "./format.ts";
import { VIEWS } from "./[kind]/view.ts";
import { BasicsForm } from "./basics-form.tsx";

export const metadata: Metadata = {
  title: "Rencana — OurDay",
  description: "Anggaran, to-do, rundown, seserahan, seragam, tabungan, dan vendor.",
};

/** Story 4: one screen that answers where the wedding stands. */
export default async function RencanaPage() {
  const { userId, wedding } = await currentContext();
  const summary = await plannerSummary(userId, wedding.id);
  const eventDate = asYmd(wedding.event_date);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl">Rencana</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Perencana ini gratis, selamanya. Isi tanggalnya dulu, sisanya menyusul.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Sisa waktu">
          {summary.daysLeft === null ? (
            <span className="text-base font-normal text-ink-soft">
              Tanggal belum diisi
            </span>
          ) : summary.daysLeft > 0 ? (
            <>
              <span className="tabular">{summary.daysLeft}</span>
              <span className="ml-1.5 text-base font-normal text-ink-soft">hari lagi</span>
            </>
          ) : summary.daysLeft === 0 ? (
            <span className="text-rose">Hari ini</span>
          ) : (
            <span className="text-base font-normal text-ink-soft">
              Sudah lewat {Math.abs(summary.daysLeft)} hari
            </span>
          )}
          <p className="mt-1 text-xs text-ink-soft">{tanggal(summary.eventDate)}</p>
        </Stat>

        <Stat label="Anggaran">
          <span className="tabular text-2xl">{rupiah(summary.budget.planned)}</span>
          <p className="mt-1 text-xs text-ink-soft">
            estimasi · realisasi{" "}
            <span className="tabular">{rupiah(summary.budget.actual)}</span>
          </p>
          {summary.budget.planned > 0 || summary.budget.actual > 0 ? (
            <p
              className={`mt-0.5 text-xs ${
                summary.budget.actual > summary.budget.planned ? "text-rose" : "text-leaf"
              }`}
            >
              selisih{" "}
              <span className="tabular">
                {selisih(summary.budget.actual - summary.budget.planned)}
              </span>
            </p>
          ) : null}
        </Stat>

        <Stat label="Tugas lewat tenggat">
          <span
            className={`tabular ${summary.overdueTodos > 0 ? "text-rose" : "text-leaf"}`}
          >
            {summary.overdueTodos}
          </span>
          <p className="mt-1 text-xs text-ink-soft">
            {summary.dueThisWeek} jatuh tempo minggu ini · {summary.openTodos} belum
            selesai
          </p>
          <Link href="/rencana/todo" className="mt-2 inline-block text-xs underline">
            Buka to-do
          </Link>
        </Stat>

        <Stat label="Tabungan">
          {summary.savings.length === 0 ? (
            <span className="text-base font-normal text-ink-soft">
              Belum ada target
            </span>
          ) : (
            <>
              <span className="tabular text-2xl">
                {rupiah(summary.savings.reduce((t, s) => t + s.saved, 0))}
              </span>
              <p className="mt-1 text-xs text-ink-soft">
                dari{" "}
                <span className="tabular">
                  {rupiah(summary.savings.reduce((t, s) => t + s.target, 0))}
                </span>
              </p>
            </>
          )}
          <Link href="/rencana/tabungan" className="mt-2 inline-block text-xs underline">
            Buka tabungan
          </Link>
        </Stat>
      </section>

      {summary.savings.length > 0 ? (
        <section className="card divide-y divide-line">
          <h2 className="px-4 py-3 text-sm font-medium">Progres tabungan</h2>
          {summary.savings.map((s) => {
            const percent =
              s.target > 0 ? Math.min(100, Math.round((s.saved / s.target) * 100)) : 0;
            return (
              <div key={s.id} className="px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-sm">
                  <span>{s.title}</span>
                  <span className="text-ink-soft">
                    {s.remaining === 0 ? (
                      <span className="text-leaf">Target tercapai.</span>
                    ) : s.monthsLeft > 0 ? (
                      <>
                        Sisihkan{" "}
                        <span className="tabular font-medium text-ink">
                          {rupiah(s.perMonth)}
                        </span>{" "}
                        per bulan, sisa {s.monthsLeft} bulan
                      </>
                    ) : (
                      <>
                        Tenggat lewat. Sisa{" "}
                        <span className="tabular font-medium text-ink">
                          {rupiah(s.remaining)}
                        </span>
                      </>
                    )}
                  </span>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-line"
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progres ${s.title}`}
                >
                  <div
                    className="h-full rounded-full bg-leaf"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-ink-soft tabular">
                  {rupiah(s.saved)} dari {rupiah(s.target)}
                </p>
              </div>
            );
          })}
        </section>
      ) : null}

      <BasicsForm
        groom={wedding.groom_name}
        bride={wedding.bride_name}
        eventDate={eventDate ?? ""}
      />

      <section>
        <h2 className="text-sm font-medium">Tujuh daftar</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {KINDS.map((k) => (
            <Link
              key={k}
              href={`/rencana/${k}`}
              className="card px-4 py-4 transition-colors hover:bg-paper-deep"
            >
              <span className="font-display text-lg">{VIEWS[k].label}</span>
              <p className="mt-1 text-xs text-ink-soft">{VIEWS[k].blurb}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="card px-4 py-4">
      <p className="text-xs text-ink-soft">{label}</p>
      <div className="mt-1 text-3xl font-medium">{children}</div>
    </div>
  );
}
