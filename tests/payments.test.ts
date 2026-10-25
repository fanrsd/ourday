// Payments run without a browser and without the network: the provider is
// stubbed at the HTTP boundary, which is the only place it exists. Signatures
// are computed here with the documented formula, from the same server key the
// app reads, so the test would catch us changing the scheme.
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { loadEnv } from "../lib/env.ts";
import {
  mapTransactionStatus,
  verifyNotificationSignature,
  type Notification,
} from "../lib/midtrans.ts";
import { applyNotification, listOrders, startCheckout } from "../lib/orders.ts";
import { ownsProduct, PRODUCTS } from "../lib/products.ts";
import { asUser, closeDb, newCouple } from "./helpers.ts";

loadEnv();

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;

const sign = (orderId: string, statusCode: string, grossAmount: string) =>
  createHash("sha512").update(orderId + statusCode + grossAmount + SERVER_KEY).digest("hex");

/** A notification exactly as Midtrans sends it, signed the way Midtrans signs it. */
function notification(orderId: string, over: Record<string, unknown> = {}): Notification {
  const body = {
    order_id: orderId,
    status_code: "200",
    gross_amount: "100000.00",
    transaction_status: "settlement",
    fraud_status: "accept",
    payment_type: "qris",
    ...over,
  };
  return { ...body, signature_key: sign(String(body.order_id), body.status_code, body.gross_amount) };
}

// The Snap call is the one thing that would reach the wire. Replace it with a
// fixed answer so checkout is exercised end to end, offline.
const realFetch = globalThis.fetch;
let snapCalls: { orderId: string; amount: number }[] = [];
let snapRejectsAsTaken = false;

before(() => {
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    const sent = JSON.parse(String(init.body)).transaction_details;
    snapCalls.push({ orderId: sent.order_id, amount: sent.gross_amount });
    if (snapRejectsAsTaken) {
      snapRejectsAsTaken = false;
      return Response.json(
        { error_messages: ["transaction_details.order_id has already been taken"] },
        { status: 406 },
      );
    }
    return Response.json({ token: `snap-${sent.order_id}`, redirect_url: "https://snap.test/x" });
  }) as typeof fetch;
});

after(async () => {
  globalThis.fetch = realFetch;
  await closeDb();
});

/** A wedding with a pending order for one product, ready to be notified about. */
async function pendingCheckout(product: "invitation" | "guestbook" = "invitation") {
  snapCalls = [];
  const { user, wedding } = await newCouple();
  const { orderId } = await startCheckout(user.id, wedding.id, product);
  return { user, wedding, orderId };
}

const orderOf = async (userId: string, weddingId: string, orderId: string) =>
  (await listOrders(userId, weddingId)).find((o) => o.provider_order_id === orderId)!;

describe("notification signature", () => {
  it("accepts a correctly computed signature", () => {
    assert.equal(verifyNotificationSignature(notification("invitation-abc")), true);
  });

  it("rejects a wrong signature", () => {
    const body = notification("invitation-abc");
    assert.equal(
      verifyNotificationSignature({ ...body, signature_key: sign("invitation-abc", "200", "1.00") }),
      false,
    );
  });

  it("rejects a body whose amount was tampered with after signing", () => {
    const body = notification("invitation-abc");
    assert.equal(verifyNotificationSignature({ ...body, gross_amount: "1.00" }), false);
  });

  it("rejects a missing or malformed signature without throwing", () => {
    const body = notification("invitation-abc");
    for (const key of [undefined, "", "deadbeef", 12345]) {
      assert.equal(verifyNotificationSignature({ ...body, signature_key: key }), false);
    }
    assert.equal(verifyNotificationSignature({ ...body, order_id: undefined }), false);
  });
});

describe("transaction status mapping", () => {
  it("follows the provider's documented meanings", () => {
    const cases: [Record<string, unknown>, string][] = [
      [{ transaction_status: "settlement" }, "paid"],
      [{ transaction_status: "capture", fraud_status: "accept" }, "paid"],
      [{ transaction_status: "capture", fraud_status: "challenge" }, "pending"],
      [{ transaction_status: "capture" }, "pending"],
      [{ transaction_status: "deny" }, "failed"],
      [{ transaction_status: "cancel" }, "failed"],
      [{ transaction_status: "expire" }, "expired"],
      [{ transaction_status: "pending" }, "pending"],
      [{ transaction_status: "something_new" }, "pending"],
      [{}, "pending"],
    ];
    for (const [body, expected] of cases) {
      assert.equal(mapTransactionStatus(body), expected, JSON.stringify(body));
    }
  });
});

describe("webhook", () => {
  it("refuses to touch an order when the signature is wrong", async () => {
    const { user, wedding, orderId } = await pendingCheckout();
    const body = notification(orderId);

    const result = await applyNotification({ ...body, signature_key: "0".repeat(128) });
    assert.equal(result.ok, false);

    assert.equal(await asUser(user.id, (tx) => ownsProduct(tx, wedding.id, "invitation")), false);
    assert.equal((await orderOf(user.id, wedding.id, orderId)).status, "pending");
  });

  it("marks the order paid and opens entitlement on the first notification", async () => {
    const { user, wedding, orderId } = await pendingCheckout();

    const before = await asUser(user.id, (tx) => ownsProduct(tx, wedding.id, "invitation"));
    assert.equal(before, false);

    const result = await applyNotification(notification(orderId));
    assert.equal(result.ok, true);

    const order = await orderOf(user.id, wedding.id, orderId);
    assert.equal(order.status, "paid");
    assert.ok(order.paid_at, "paid_at harus terisi");
    assert.ok(order.expires_at, "expires_at harus terisi");

    const days = Math.round(
      (new Date(order.expires_at!).getTime() - new Date(order.paid_at!).getTime()) / 86_400_000,
    );
    assert.equal(days, PRODUCTS.invitation.activeDays);

    const after = await asUser(user.id, (tx) => ownsProduct(tx, wedding.id, "invitation"));
    assert.equal(after, true);
  });

  it("is idempotent: a re-sent notification does not extend the active period", async () => {
    const { user, wedding, orderId } = await pendingCheckout("guestbook");
    const body = notification(orderId, { gross_amount: "150000.00" });

    await applyNotification(body);
    const first = await orderOf(user.id, wedding.id, orderId);

    // Midtrans re-sends the identical notification. Nothing may move.
    await applyNotification(body);
    await applyNotification(body);
    const again = await orderOf(user.id, wedding.id, orderId);

    assert.equal(again.status, "paid");
    assert.equal(again.paid_at!.getTime(), first.paid_at!.getTime());
    assert.equal(again.expires_at!.getTime(), first.expires_at!.getTime());
  });

  it("never un-pays an order: a later deny or expire is ignored", async () => {
    const { user, wedding, orderId } = await pendingCheckout();
    await applyNotification(notification(orderId));
    const paid = await orderOf(user.id, wedding.id, orderId);

    for (const status of ["deny", "cancel", "expire", "pending"]) {
      await applyNotification(notification(orderId, { transaction_status: status }));
    }

    const still = await orderOf(user.id, wedding.id, orderId);
    assert.equal(still.status, "paid");
    assert.equal(still.expires_at!.getTime(), paid.expires_at!.getTime());
    assert.equal(await asUser(user.id, (tx) => ownsProduct(tx, wedding.id, "invitation")), true);
  });

  it("records a failure without granting anything", async () => {
    const { user, wedding, orderId } = await pendingCheckout();
    const result = await applyNotification(notification(orderId, { transaction_status: "deny" }));
    assert.equal(result.ok, true);

    assert.equal((await orderOf(user.id, wedding.id, orderId)).status, "failed");
    assert.equal(await asUser(user.id, (tx) => ownsProduct(tx, wedding.id, "invitation")), false);
  });

  it("answers a validly-signed notification for an unknown order without failing", async () => {
    const result = await applyNotification(notification("invitation-tidak-ada"));
    assert.deepEqual(result, { ok: true, order: null, status: "paid" });
  });
});

describe("checkout", () => {
  it("charges the catalogue price and reuses the pending order", async () => {
    const { user, wedding, orderId } = await pendingCheckout();
    assert.deepEqual(snapCalls, [{ orderId, amount: PRODUCTS.invitation.price }]);

    const second = await startCheckout(user.id, wedding.id, "invitation");
    assert.equal(second.orderId, orderId, "order yang pending harus dipakai ulang");

    const orders = await listOrders(user.id, wedding.id);
    assert.equal(orders.length, 1);
  });

  it("issues a fresh order id when the provider still holds the old one", async () => {
    const { user, wedding, orderId } = await pendingCheckout();

    snapRejectsAsTaken = true;
    const retry = await startCheckout(user.id, wedding.id, "invitation");
    assert.notEqual(retry.orderId, orderId);

    // The abandoned row survives, so a late settlement for it still lands.
    const orders = await listOrders(user.id, wedding.id);
    assert.equal(orders.length, 2);
    assert.equal(orders.find((o) => o.provider_order_id === orderId)!.status, "expired");

    const late = await applyNotification(notification(orderId));
    assert.equal(late.ok, true);
    assert.equal((await orderOf(user.id, wedding.id, orderId)).status, "paid");
  });

  it("refuses to sell a product that is already active", async () => {
    const { user, wedding, orderId } = await pendingCheckout();
    await applyNotification(notification(orderId));

    await assert.rejects(
      () => startCheckout(user.id, wedding.id, "invitation"),
      /sudah aktif/i,
    );
  });

  it("keeps the two products independent", async () => {
    const { user, wedding, orderId } = await pendingCheckout();
    await applyNotification(notification(orderId));

    assert.equal(await asUser(user.id, (tx) => ownsProduct(tx, wedding.id, "guestbook")), false);
    const guestbook = await startCheckout(user.id, wedding.id, "guestbook");
    assert.ok(guestbook.token);
  });
});
