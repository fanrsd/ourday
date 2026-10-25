// The one test seam: everything enters through the same functions the UI calls,
// against a real Postgres. No mocks, no repository doubles.
import { randomUUID } from "node:crypto";
import { loadEnv } from "../lib/env.ts";
import { sql, withCtx, type Ctx, type Tx } from "../lib/db.ts";
import { requestLogin, consumeLogin } from "../lib/login.ts";
import { ensureWedding } from "../lib/wedding.ts";
import { PRODUCTS, type Product } from "../lib/products.ts";

loadEnv();

/** Signs up through the real magic-link path rather than inserting a user row. */
export async function newUser(): Promise<{ id: string; email: string }> {
  const email = `t-${randomUUID()}@example.test`;
  const url = await requestLogin(email);
  const token = new URL(url).searchParams.get("token")!;
  const id = await consumeLogin(token);
  if (!id) throw new Error("login gagal di helper");
  return { id, email };
}

export async function newCouple() {
  const user = await newUser();
  const wedding = await ensureWedding(user.id);
  return { user, wedding };
}

/** Grants a product the way operations would: a paid order, priced at zero. */
export async function grantProduct(userId: string, weddingId: string, product: Product) {
  await withCtx({ userId }, async (tx) => {
    await tx`
      insert into orders (wedding_id, product, amount, provider_order_id,
                          status, paid_at, expires_at)
      values (${weddingId}, ${product}, 0, ${"test-" + randomUUID()}, 'paid', now(),
              now() + ${PRODUCTS[product].activeDays + " days"}::interval)`;
  });
}

export const asUser = <T>(userId: string, fn: (tx: Tx) => Promise<T>) =>
  withCtx({ userId }, fn);

export const asGuest = <T>(guestToken: string, fn: (tx: Tx) => Promise<T>) =>
  withCtx({ guestToken }, fn);

export const asScanner = <T>(scannerWeddingId: string, fn: (tx: Tx) => Promise<T>) =>
  withCtx({ scannerWeddingId }, fn);

export const asNobody = <T>(fn: (tx: Tx) => Promise<T>) => withCtx({} as Ctx, fn);

export async function closeDb() {
  await sql.end();
}
