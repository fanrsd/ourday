import { applyNotification } from "@/lib/orders.ts";

/**
 * The one public endpoint a third party may call, and the only path that grants
 * entitlement. Nothing in the body is trusted before `applyNotification` has
 * verified the signature.
 *
 * A validly-signed notification always gets 200, duplicate or not: Midtrans
 * retries anything else, and it re-sends notifications by design.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("json tidak valid", { status: 400 });
  }

  const result = await applyNotification(body);
  if (!result.ok) return new Response(result.reason, { status: 401 });

  // 200 even when no order matched: retrying will not conjure the row.
  return Response.json({ ok: true, status: result.status });
}
