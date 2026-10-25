import { sql, withCtx, type Tx } from "./db.ts";
import { asUser, requireMember } from "./wedding.ts";
import { ownsProduct, PRODUCTS, type Product } from "./products.ts";
import { urlToken } from "./ids.ts";
import {
  createSnapTransaction,
  isOrderIdTaken,
  mapTransactionStatus,
  verifyNotificationSignature,
  type Notification,
  type OrderStatus,
} from "./midtrans.ts";

export type Order = {
  id: string;
  wedding_id: string;
  product: Product;
  amount: number;
  provider_order_id: string;
  status: OrderStatus;
  paid_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
};

/** The active period per product, shipped to SQL so the constant stays in one file. */
const ACTIVE_DAYS = Object.fromEntries(
  Object.entries(PRODUCTS).map(([k, v]) => [k, v.activeDays]),
);

export function listOrders(userId: string, weddingId: string): Promise<Order[]> {
  return asUser(userId, (tx) => tx<Order[]>`
    select id, wedding_id, product, amount, provider_order_id, status,
           paid_at, expires_at, created_at
      from orders where wedding_id = ${weddingId}
     order by created_at desc`);
}

/** One order by the provider's id. RLS keeps it scoped to the caller's weddings. */
export async function findOrder(userId: string, providerOrderId: string) {
  const [row] = await asUser(userId, (tx) => tx<Order[]>`
    select id, wedding_id, product, amount, provider_order_id, status,
           paid_at, expires_at, created_at
      from orders where provider_order_id = ${providerOrderId} limit 1`);
  return row ?? null;
}

/**
 * Opens the Snap popup for one product. Both SKUs are one-off, so this creates a
 * pending order and asks Midtrans for a token — nothing here grants anything.
 */
export async function startCheckout(
  userId: string,
  weddingId: string,
  product: Product,
): Promise<{ token: string; redirectUrl: string; orderId: string }> {
  const prepared = await asUser(userId, async (tx) => {
    await requireMember(tx, weddingId, userId);
    if (await ownsProduct(tx, weddingId, product)) {
      throw new Error("Produk ini sudah aktif, tidak perlu dibeli lagi.");
    }
    return {
      order: await pendingOrder(tx, weddingId, product),
      customer: await customerOf(tx, userId),
    };
  });

  const { customer } = prepared;
  let { order } = prepared;
  try {
    return { orderId: order.orderId, ...(await createSnapTransaction({ ...order, customer })) };
  } catch (err) {
    if (!isOrderIdTaken(err)) throw err;
    // Midtrans holds an order id for as long as its payment instruction lives,
    // so a buyer who picked a virtual account and walked away cannot be handed
    // that same id again. Retire the row and issue a fresh one rather than
    // mutating the id in place: if that abandoned payment does land later, its
    // notification must still find the order it belongs to.
    order = await asUser(userId, async (tx) => {
      await tx`update orders set status = 'expired'
                where provider_order_id = ${order.orderId} and status = 'pending'`;
      return pendingOrder(tx, weddingId, product);
    });
    return { orderId: order.orderId, ...(await createSnapTransaction({ ...order, customer })) };
  }
}

/**
 * Reuses the pending order for this wedding and product instead of littering the
 * table: a buyer who abandons the popup and comes back tomorrow is still paying
 * for the same thing, at the price the order was written at.
 */
async function pendingOrder(tx: Tx, weddingId: string, product: Product) {
  const [existing] = await tx<{ orderId: string; amount: number }[]>`
    select provider_order_id as "orderId", amount from orders
     where wedding_id = ${weddingId} and product = ${product} and status = 'pending'
     order by created_at desc limit 1`;
  if (existing) return existing;

  const orderId = `${product}-${urlToken(9)}`;
  const amount = PRODUCTS[product].price;
  await tx`insert into orders (wedding_id, product, amount, provider_order_id)
           values (${weddingId}, ${product}, ${amount}, ${orderId})`;
  return { orderId, amount };
}

async function customerOf(tx: Tx, userId: string) {
  const [user] = await tx<{ email: string; name: string }[]>`
    select email, name from users where id = ${userId}`;
  return { name: user?.name.trim() || "Pengantin", email: user?.email ?? "" };
}

export type NotificationResult =
  | { ok: false; reason: string }
  | { ok: true; order: Order | null; status: OrderStatus };

/**
 * The only function that may set status = 'paid'. A browser redirect never
 * reaches here; this is the trust boundary and it has no lazy version.
 *
 * The signature is checked before a single other field is read, and the
 * first-transition guarantees (paid_at once, expires_at once, no downgrade of a
 * paid order) live inside `order_apply_notification` where a row lock makes two
 * racing notifications safe.
 *
 * // ponytail: a paid row is frozen, so a refund or chargeback notification is
 * accepted with 200 and then ignored — there is no reversal path and no second
 * payload kept. Operations undo a sale by hand today. Give the SQL function a
 * 'refunded' branch when the first chargeback actually arrives.
 */
export async function applyNotification(body: unknown): Promise<NotificationResult> {
  if (!body || typeof body !== "object") return { ok: false, reason: "malformed" };
  if (!verifyNotificationSignature(body as Notification)) {
    return { ok: false, reason: "signature" };
  }

  const notification = body as Notification;
  const status = mapTransactionStatus(notification);
  const providerOrderId = String(notification.order_id);

  // The raw body is stored for support. It came from JSON.parse, so it is JSON by
  // construction; the cast only tells the driver that, since the type is
  // deliberately `unknown`-valued.
  const [order] = await withCtx({}, (tx) => tx<Order[]>`
    select id, wedding_id, product, amount, provider_order_id, status,
           paid_at, expires_at, created_at
      from order_apply_notification(
        ${providerOrderId}, ${status},
        ${sql.json(notification as Parameters<typeof sql.json>[0])}::jsonb,
        ${sql.json(ACTIVE_DAYS)}::jsonb)`);

  return { ok: true, order: order ?? null, status };
}
