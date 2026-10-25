import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { currentContext } from "@/lib/current.ts";
import {
  budgetTotals,
  isKind,
  KINDS,
  listItems,
  rundownShareToken,
  savingsProgress,
} from "@/lib/planner.ts";
import { PlannerList } from "./list.tsx";
import { VIEWS } from "./view.ts";

// One page for all seven lists. Everything that differs between them is data in
// `view.ts`, so there is nothing here to write seven times.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ kind: string }>;
}): Promise<Metadata> {
  const { kind } = await params;
  return { title: isKind(kind) ? `${VIEWS[kind].label} — OurDay` : "OurDay" };
}

export default async function KindPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const { kind } = await params;
  if (!isKind(kind)) notFound();

  const view = VIEWS[kind];
  const { userId, wedding } = await currentContext();

  const [nodes, totals, savings] = await Promise.all([
    listItems(userId, wedding.id, kind),
    kind === "budget" ? budgetTotals(userId, wedding.id) : { planned: 0, actual: 0 },
    kind === "tabungan" ? savingsProgress(userId, wedding.id) : [],
  ]);

  // The share link has to be copyable, so it needs the real origin.
  let shareUrl: string | null = null;
  if (view.share) {
    const token = await rundownShareToken(userId, wedding.id);
    if (token) {
      const h = await headers();
      const host = h.get("host") ?? "localhost:3000";
      const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      shareUrl = `${proto}://${host}/rundown/${token}`;
    }
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Bagian perencana" className="flex flex-wrap gap-1.5">
        {KINDS.map((k) => (
          <Link
            key={k}
            href={`/rencana/${k}`}
            aria-current={k === kind ? "page" : undefined}
            className={
              "rounded-full border px-3 py-1.5 text-xs transition-colors " +
              (k === kind
                ? "border-ink bg-ink text-paper"
                : "border-line bg-white text-ink-soft hover:bg-paper-deep")
            }
          >
            {VIEWS[k].label}
          </Link>
        ))}
      </nav>

      <header>
        <h1 className="font-display text-3xl">{view.label}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">{view.blurb}</p>
      </header>

      <PlannerList
        kind={kind}
        view={view}
        nodes={nodes}
        totals={totals}
        savings={savings}
        shareUrl={shareUrl}
      />
    </div>
  );
}
