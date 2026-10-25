import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { rundownByShareToken } from "@/lib/planner.ts";

// Story 14: the read-only rundown for the MC and the vendors.
//
// It lives at /rundown/<token> rather than under /rencana for two reasons that
// both bite. The whole planner is driven by /rencana/[kind], so a static
// `rundown` segment there would shadow the rundown list itself; and everything
// under /rencana sits inside the (app) layout, which redirects anyone without a
// session. An MC has no account, so this page has to sit outside both.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rundown acara",
  robots: { index: false, follow: false },
};

const TZ = "Asia/Jakarta";

export default async function SharedRundownPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await rundownByShareToken(token);
  // A revoked or wrong link is indistinguishable from one that never existed.
  if (!data) notFound();

  const couple = [data.groom_name, data.bride_name].filter(Boolean).join(" & ");
  const eventDate = data.event_date
    ? new Date(`${data.event_date}T12:00:00+07:00`).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: TZ,
      })
    : null;

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Rundown acara</p>
        <h1 className="mt-2 font-display text-4xl">{couple || "Pernikahan"}</h1>
        {eventDate ? <p className="mt-1 text-sm text-ink-soft">{eventDate}</p> : null}
      </header>

      {data.items.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-soft">
          Rundown belum diisi.
        </p>
      ) : (
        <ol className="mt-10 space-y-px">
          {data.items.map((item) => {
            const pic = typeof item.meta?.pic === "string" ? item.meta.pic : "";
            return (
              <li
                key={item.id}
                className="card flex gap-4 rounded-none px-4 py-3 first:rounded-t-card last:rounded-b-card"
              >
                <span className="tabular w-14 shrink-0 pt-0.5 text-sm font-medium">
                  {item.due_at
                    ? new Date(item.due_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: TZ,
                      })
                    : "—"}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  {item.note ? (
                    <p className="mt-0.5 text-sm text-ink-soft">{item.note}</p>
                  ) : null}
                  {pic ? (
                    <p className="mt-0.5 text-xs text-ink-soft">
                      Penanggung jawab: {pic}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-10 text-center text-xs text-ink-soft">
        Halaman baca-saja. Selalu menampilkan versi terbaru.
      </p>
    </main>
  );
}
