import type { PublicRundownItem } from "@/lib/invitations.ts";

/**
 * The day, as the couple already typed it into the planner.
 *
 * The competitor sells this twice — once inside their planner, once as an add-on
 * to their invitation — because the two were built by different teams in
 * different years. Here it is one table read twice, so a couple who moves the
 * akad moves it everywhere.
 *
 * Rendered into a template slot, so it inherits the template's palette through
 * the CSS variables and needs no per-design version of itself.
 */

// Every date in this product is read by someone standing in Indonesia, and the
// planner already stores and shows these in WIB. Formatting them any other way
// here would print two different times for the same row.
const TZ = "Asia/Jakarta";

const jam = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: TZ })
    : null;

export function RundownTimeline({ items }: { items: PublicRundownItem[] }) {
  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-md">
      <h2 className="text-center text-[10px] uppercase tracking-[0.3em] text-[var(--accent)]">
        Susunan Acara
      </h2>

      <ol className="mt-7 grid gap-0">
        {items.map((item, i) => {
          const at = jam(item.at);
          return (
            <li key={i} className="flex gap-4">
              {/* The rail is drawn by the row, not by a border on the list, so
                  the last item's line stops at its own dot instead of running
                  on into whatever the template puts underneath. */}
              <div className="flex flex-col items-center">
                <span
                  className="mt-1.5 size-1.5 shrink-0 rotate-45 bg-[var(--accent)]"
                  aria-hidden="true"
                />
                {i < items.length - 1 ? (
                  <span className="w-px flex-1 bg-[var(--line)]" aria-hidden="true" />
                ) : null}
              </div>

              <div className={i < items.length - 1 ? "pb-7" : ""}>
                {at ? <p className="tabular text-[0.82rem] opacity-60">{at} WIB</p> : null}
                <p className="mt-0.5 text-[1.02rem] font-medium leading-snug">{item.title}</p>
                {item.note.trim() ? (
                  <p className="mt-1 text-[0.85rem] leading-relaxed opacity-70">
                    {item.note.trim()}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
