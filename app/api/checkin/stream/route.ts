// The projector screen's feed. Postgres already knows the moment a guest is
// checked in, so a trigger NOTIFYs and this bridges that straight to SSE — no
// polling loop and no websocket library for a one-way stream.
import { sql } from "@/lib/db.ts";
import { liveStats, resolveScannerLink } from "@/lib/checkin.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const link = await resolveScannerLink(url.searchParams.get("token"));
  if (!link) return new Response("tidak berlaku", { status: 403 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const push = async () => {
        if (closed) return;
        try {
          const stats = await liveStats(link.weddingId);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`));
        } catch {
          // A failed read is not worth tearing the screen down; the next
          // notification will carry the same state.
        }
      };

      await push();
      // The payload is only the wedding id: guest names have no business on a
      // shared broadcast channel.
      const sub = await sql.listen("checkin", (payload) => {
        if (payload === link.weddingId) void push();
      });

      // Proxies drop idle connections; a comment frame is the cheapest heartbeat.
      const beat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": ping\n\n"));
      }, 25_000);

      req.signal.addEventListener("abort", async () => {
        closed = true;
        clearInterval(beat);
        await sub.unlisten().catch(() => {});
        try {
          controller.close();
        } catch {
          // already closed by the runtime
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store, no-transform",
      connection: "keep-alive",
    },
  });
}
