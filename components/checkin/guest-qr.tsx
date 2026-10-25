import QRCode from "qrcode";
import { withCtx } from "@/lib/db.ts";

/**
 * The guest's check-in QR, rendered inside their own invitation. The payload is
 * the bare guest token — the same value that personalised the invitation and
 * identified their RSVP — which is why nothing here ever has to be generated,
 * printed or re-sent.
 *
 * Inline SVG rather than a stored image: no file to create, cache-bust or clean
 * up, and it still draws when the venue's signal drops mid-queue.
 */
export async function GuestQr({
  token,
  guestName,
  accent,
}: {
  token: string;
  guestName: string;
  accent: string;
}) {
  // Guest-token context: RLS shows this caller exactly one guest row. The
  // entitlement boolean comes from a definer function because `orders` is, and
  // must stay, invisible to anyone holding only a guest token.
  const enabled = await withCtx({ guestToken: token }, async (tx) => {
    const [guest] = await tx<{ wedding_id: string }[]>`
      select wedding_id from guests where token = ${token}`;
    if (!guest) return false;
    const [row] = await tx<{ ok: boolean }[]>`
      select app_has_product(${guest.wedding_id}, 'guestbook') as ok`;
    return Boolean(row?.ok);
  });
  if (!enabled) return null;

  const svg = await QRCode.toString(token, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
  });

  return (
    <section className="mx-auto w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-sm">
      <p
        className="text-[11px] font-medium uppercase tracking-[0.22em]"
        style={{ color: accent }}
      >
        QR Check-in
      </p>
      <div
        className="mx-auto mt-4 w-44 [&>svg]:h-auto [&>svg]:w-full"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="mt-4 font-medium text-ink">{guestName}</p>
      <p className="mt-1 text-xs text-ink-soft">
        Tunjukkan ini di meja penerima tamu.
      </p>
      <p className="sr-only">Kode check-in untuk {guestName}: {token}</p>
    </section>
  );
}
