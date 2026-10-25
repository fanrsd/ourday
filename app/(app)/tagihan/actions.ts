"use server";

import { requireUserId } from "@/lib/auth.ts";
import { ensureWedding } from "@/lib/wedding.ts";
import { isProduct } from "@/lib/products.ts";
import { startCheckout } from "@/lib/orders.ts";
import { toResult, type ActionResult } from "@/lib/actions.ts";

export type CheckoutState = ActionResult<{ token: string; redirectUrl: string }>;

/** Opens a Snap transaction. It grants nothing — only the webhook can do that. */
export async function startCheckoutAction(product: string): Promise<CheckoutState> {
  try {
    if (!isProduct(product)) throw new Error("Produk itu tidak ada.");
    const userId = await requireUserId();
    const wedding = await ensureWedding(userId);
    const { token, redirectUrl } = await startCheckout(userId, wedding.id, product);
    return { ok: true, data: { token, redirectUrl } };
  } catch (err) {
    return toResult(err);
  }
}
