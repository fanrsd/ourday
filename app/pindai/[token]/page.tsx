import type { Metadata } from "next";
import { resolveScannerLink } from "@/lib/checkin.ts";
import { withCtx } from "@/lib/db.ts";
import { Scanner } from "./scanner.tsx";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pemindai check-in",
  robots: { index: false, follow: false },
};

export default async function ScannerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const link = await resolveScannerLink(token);

  if (!link) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 text-center">
        <h1 className="font-display text-2xl">Link pemindai tidak berlaku</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Link ini sudah kedaluwarsa atau dicabut. Minta link baru ke pengantin
          lewat halaman Kehadiran.
        </p>
      </main>
    );
  }

  const [wedding] = await withCtx({ scannerWeddingId: link.weddingId }, (tx) => tx<
    { groom_name: string; bride_name: string; checkin_photo_enabled: boolean }[]
  >`select groom_name, bride_name, checkin_photo_enabled
      from weddings where id = ${link.weddingId}`);

  return (
    <Scanner
      token={token}
      label={link.label}
      couple={[wedding?.groom_name, wedding?.bride_name].filter(Boolean).join(" & ")}
      photoEnabled={Boolean(wedding?.checkin_photo_enabled)}
    />
  );
}
