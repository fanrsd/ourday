import { createHash, timingSafeEqual } from "node:crypto";
import { loadEnv } from "./env.ts";

loadEnv();

/**
 * One payment provider: Midtrans Snap, which covers QRIS, virtual account and
 * e-wallet in a single popup. There is deliberately no `PaymentProvider`
 * interface — an abstraction with one implementation is a cost with no payer.
 *
 * This file is split so that the two security-critical functions
 * (`verifyNotificationSignature`, `mapTransactionStatus`) are pure and testable
 * with no network at all. Only `createSnapTransaction` touches the wire.
 */

export type OrderStatus = "pending" | "paid" | "failed" | "expired";

/** The notification body as it arrives: untrusted until the signature checks out. */
export type Notification = Record<string, unknown> & {
  order_id?: unknown;
  status_code?: unknown;
  gross_amount?: unknown;
  signature_key?: unknown;
  transaction_status?: unknown;
  fraud_status?: unknown;
};

const env = (name: string) => process.env[name] ?? "";

const str = (v: unknown) =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : "";

/**
 * Midtrans's documented scheme:
 *   sha512(order_id + status_code + gross_amount + serverKey) === signature_key
 *
 * `gross_amount` is compared as the exact string Midtrans sent ("100000.00"),
 * never re-formatted from a number, because the hash is over the literal bytes.
 */
export function verifyNotificationSignature(body: Notification): boolean {
  const key = env("MIDTRANS_SERVER_KEY");
  // Refusing loudly beats silently rejecting every real notification: a 500
  // makes Midtrans retry until the config is fixed, a 401 makes it give up.
  if (!key) throw new Error("MIDTRANS_SERVER_KEY belum diatur");

  const orderId = str(body.order_id);
  const statusCode = str(body.status_code);
  const gross = str(body.gross_amount);
  const given = str(body.signature_key).toLowerCase();
  if (!orderId || !statusCode || !gross || !given) return false;

  const expected = createHash("sha512")
    .update(orderId + statusCode + gross + key)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(given, "utf8");
  // timingSafeEqual throws on a length mismatch, so length is checked first.
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * `capture` alone is not payment: a card capture held for fraud review can still
 * be denied, so only `accept` counts. Everything unrecognised stays pending,
 * because inventing a terminal status from an unknown string is how entitlements
 * get handed out by accident.
 */
export function mapTransactionStatus(body: Notification): OrderStatus {
  switch (str(body.transaction_status)) {
    case "settlement":
      return "paid";
    case "capture":
      return str(body.fraud_status) === "accept" ? "paid" : "pending";
    case "deny":
    case "cancel":
      return "failed";
    case "expire":
      return "expired";
    default:
      return "pending";
  }
}

/** The Snap popup script, derived from the same base URL as the API. */
export const snapScriptUrl = () =>
  env("MIDTRANS_BASE_URL").replace(/\/v1\/?$/, "/snap.js");

export const snapClientKey = () => env("MIDTRANS_CLIENT_KEY");

/** True when Midtrans still holds a live payment instruction for that order id. */
export const isOrderIdTaken = (err: unknown) =>
  err instanceof Error && /already been taken/i.test(err.message);

export async function createSnapTransaction(input: {
  orderId: string;
  amount: number;
  customer: { name: string; email: string };
}): Promise<{ token: string; redirectUrl: string }> {
  const res = await fetch(`${env("MIDTRANS_BASE_URL")}/transactions`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      // HTTP Basic with an empty password, per Midtrans.
      authorization: `Basic ${Buffer.from(env("MIDTRANS_SERVER_KEY") + ":").toString("base64")}`,
    },
    body: JSON.stringify({
      transaction_details: { order_id: input.orderId, gross_amount: input.amount },
      customer_details: { first_name: input.customer.name, email: input.customer.email },
      // The browser is told where to land, but landing there proves nothing:
      // only the webhook may mark an order paid.
      callbacks: { finish: `${env("APP_URL")}/tagihan/selesai?order=${input.orderId}` },
    }),
    // A hung gateway must not hang a checkout click.
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);

  if (!res) throw new Error("Gerbang pembayaran tidak merespons. Coba lagi sebentar.");

  const text = await res.text();
  if (!res.ok) throw new Error(`Pembayaran belum bisa dimulai: ${detail(text, res.status)}`);

  const body = JSON.parse(text) as { token?: string; redirect_url?: string };
  if (!body.token || !body.redirect_url) {
    throw new Error("Pembayaran belum bisa dimulai: jawaban gerbang tidak lengkap.");
  }
  return { token: body.token, redirectUrl: body.redirect_url };
}

function detail(text: string, status: number) {
  try {
    const parsed = JSON.parse(text) as { error_messages?: unknown };
    if (Array.isArray(parsed.error_messages)) return parsed.error_messages.join("; ");
  } catch {
    // not JSON; fall through to the raw body
  }
  return text.slice(0, 200) || `HTTP ${status}`;
}
