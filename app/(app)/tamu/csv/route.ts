import { currentUserId } from "@/lib/auth.ts";
import { ensureWedding } from "@/lib/wedding.ts";
import { exportCsv } from "@/lib/guests.ts";

/**
 * Story 100 and 104: the data is theirs, including after the invitation expires.
 * A route handler rather than an action because this is a download, not a
 * mutation — the browser needs a response with a filename on it.
 */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return new Response("Perlu masuk dulu.", { status: 401 });

  const wedding = await ensureWedding(userId);
  const csv = await exportCsv(userId, wedding.id);
  const day = new Date().toISOString().slice(0, 10);

  return new Response(
    // Excel reads a UTF-8 CSV as latin-1 without a BOM, which mangles names.
    "\uFEFF" + csv,
    {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="tamu-ourday-${day}.csv"`,
        "cache-control": "no-store",
      },
    },
  );
}
