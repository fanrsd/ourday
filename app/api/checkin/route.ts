// The endpoint the scanner's offline queue drains into. Authenticated by the
// scanner link, never by a session: the person at the desk has no account.
// A batch, because a desk that has been offline for ten minutes has a backlog.
import {
  checkIn,
  findByName,
  liveStats,
  resolveScannerLink,
  undoCheckIn,
  walkIn,
} from "@/lib/checkin.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Errors the queue should stop retrying. Everything not listed here stays in
 * the queue: an unrecognised failure is far more likely to be a hiccup than a
 * reason to throw a guest's arrival away.
 */
const PERMANENT = /^(TAMU_TIDAK_DITEMUKAN|PAX_TIDAK_VALID|NAMA_KOSONG|EVENT_ID_KOSONG)$/;

const forbidden = () =>
  Response.json({ error: "Link pemindai tidak berlaku atau sudah dicabut." }, { status: 403 });

/** Name search, for the guest whose phone died on the way. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const link = await resolveScannerLink(url.searchParams.get("token"));
  if (!link) return forbidden();

  const guests = await findByName(link.weddingId, url.searchParams.get("q") ?? "");
  return Response.json({ guests });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const link = await resolveScannerLink(body?.token);
  if (!link) return forbidden();

  const events: any[] = Array.isArray(body.events) ? body.events.slice(0, 50) : [];
  const results = [];

  for (const ev of events) {
    try {
      if (ev.kind === "undo") {
        await undoCheckIn({ scannerWeddingId: link.weddingId, guestId: String(ev.guestId) });
        results.push({ id: ev.id, ok: true, status: "undone" as const });
      } else if (ev.kind === "walkin") {
        const guest = await walkIn(link.weddingId, String(ev.name ?? ""), Number(ev.pax));
        results.push({
          id: ev.id, ok: true, status: "ok" as const,
          guest, checkedInAt: guest.checked_in_at,
        });
      } else {
        const done = await checkIn({
          scannerWeddingId: link.weddingId,
          token: String(ev.token ?? ""),
          pax: ev.pax == null ? null : Number(ev.pax),
          clientEventId: String(ev.id ?? ""),
          photoPath: ev.photoPath ?? null,
        });
        results.push({ id: ev.id, ok: true, ...done });
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      results.push({ id: ev.id, ok: false, error: raw, drop: PERMANENT.test(raw) });
    }
  }

  return Response.json({ results, stats: await liveStats(link.weddingId) });
}
