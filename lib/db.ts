import postgres from "postgres";
import { loadEnv } from "./env.ts";

loadEnv();

// One pool. The app role owns no tables, so every statement below runs under RLS.
export const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  onnotice: () => {},
  transform: { undefined: null },
});

export type Tx = postgres.TransactionSql<{}>;

export type Ctx = {
  userId?: string | null;
  guestToken?: string | null;
  scannerWeddingId?: string | null;
};

/**
 * Runs fn in a transaction whose identity settings are visible to RLS policies.
 * set_config(..., true) is transaction-local, so a pooled connection can never
 * leak one request's identity into the next.
 */
export function withCtx<T>(ctx: Ctx, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return sql.begin(async (tx) => {
    await tx`select
      set_config('app.user_id',            ${ctx.userId ?? ""},           true),
      set_config('app.guest_token',        ${ctx.guestToken ?? ""},       true),
      set_config('app.scanner_wedding_id', ${ctx.scannerWeddingId ?? ""}, true)`;
    return fn(tx as Tx);
  }) as Promise<T>;
}

/** Anonymous visitor: no identity at all. */
export const asAnon = <T>(fn: (tx: Tx) => Promise<T>) => withCtx({}, fn);
