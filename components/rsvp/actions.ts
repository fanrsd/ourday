"use server";

/**
 * The public write surface. These are the only actions a stranger can reach, so
 * they add nothing to lib/rsvp.ts except the caller's IP for rate limiting —
 * every rule that matters is enforced in there, inside the same transaction as
 * the write.
 */
import { headers } from "next/headers";
import { toResult, type ActionResult } from "@/lib/actions.ts";
import {
  listWishes, submitRsvp, submitWish, type Attending, type Wish,
} from "@/lib/rsvp.ts";

/**
 * Behind a proxy the socket address is the proxy, so the forwarded chain is all
 * we have. It is spoofable, which is why it only ever narrows a rate limit and
 * never grants anything.
 */
async function clientIp(): Promise<string | null> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || h.get("x-real-ip") || null;
}

export async function submitRsvpAction(input: {
  weddingId: string;
  guestToken: string | null;
  name: string;
  attending: Attending;
  pax: number;
}): Promise<ActionResult> {
  try {
    await submitRsvp({ ...input, ip: await clientIp() });
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}

export async function submitWishAction(input: {
  weddingId: string;
  guestToken: string | null;
  name: string;
  message: string;
}): Promise<ActionResult<Wish[]>> {
  try {
    await submitWish({ ...input, ip: await clientIp() });
    // Hand back the fresh wall so the guest sees their own message land.
    return { ok: true, data: await listWishes(input.weddingId) };
  } catch (err) {
    return toResult(err);
  }
}

/**
 * The invitation page is static so guests on bad signal get it fast; the wall is
 * the one part that has to be live, so it is fetched from the client instead.
 */
export async function loadWishesAction(weddingId: string): Promise<Wish[]> {
  return listWishes(weddingId);
}
