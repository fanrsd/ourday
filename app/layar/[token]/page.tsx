import type { Metadata } from "next";
import { liveStats, resolveScannerLink } from "@/lib/checkin.ts";
import { withCtx } from "@/lib/db.ts";
import { Screen } from "./screen.tsx";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Layar kehadiran",
  robots: { index: false, follow: false },
};

export default async function LayarPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const link = await resolveScannerLink(token);

  if (!link) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-ink px-8 text-center">
        <p className="font-display text-3xl text-paper">
          Link layar tidak berlaku lagi.
        </p>
      </main>
    );
  }

  const [wedding] = await withCtx({ scannerWeddingId: link.weddingId }, (tx) => tx<
    { groom_name: string; bride_name: string }[]
  >`select groom_name, bride_name from weddings where id = ${link.weddingId}`);

  return (
    <Screen
      token={token}
      couple={[wedding?.groom_name, wedding?.bride_name].filter(Boolean).join(" & ")}
      initial={await liveStats(link.weddingId)}
    />
  );
}
