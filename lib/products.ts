import type { Tx } from "./db.ts";

/**
 * The whole price list. Both SKUs are one-off purchases: there is no billing
 * engine, no proration, no stored cards. Changing a price or an active period
 * is a change here and nowhere else.
 */
export const PRODUCTS = {
  invitation: { label: "Undangan Website", price: 100_000, activeDays: 90 },
  guestbook: { label: "Buku Tamu Digital & QR", price: 150_000, activeDays: 30 },
} as const;

export type Product = keyof typeof PRODUCTS;

export const isProduct = (v: string): v is Product => v in PRODUCTS;

/**
 * Entitlement is not stored; it is derived. Owning a product means having a paid
 * order for it that has not expired. A manual grant is a zero-rupiah order, so
 * comps show up in the same ledger as sales instead of hiding in a flag.
 */
export async function ownsProduct(tx: Tx, weddingId: string, product: Product) {
  const [row] = await tx`
    select 1 from orders
     where wedding_id = ${weddingId} and product = ${product}
       and status = 'paid' and (expires_at is null or expires_at > now())
     limit 1`;
  return Boolean(row);
}

export async function requireProduct(tx: Tx, weddingId: string, product: Product) {
  if (!(await ownsProduct(tx, weddingId, product))) {
    throw new Error(`BELUM_DIBELI:${product}`);
  }
}
