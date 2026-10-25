import { withCtx, type Tx } from "./db.ts";

export type Wedding = {
  id: string;
  groom_name: string;
  bride_name: string;
  event_date: string | null;
  checkin_photo_enabled: boolean;
};

/** Every mutation in the app funnels through here, so identity is never optional. */
export function asUser<T>(userId: string, fn: (tx: Tx) => Promise<T>) {
  return withCtx({ userId }, fn);
}

/**
 * The planner is free and is the front door, so a wedding is created on first
 * use rather than at checkout. Everything else hangs off the row this returns.
 */
export async function ensureWedding(userId: string): Promise<Wedding> {
  return asUser(userId, async (tx) => {
    const [existing] = await tx<Wedding[]>`
      select w.id, w.groom_name, w.bride_name, w.event_date, w.checkin_photo_enabled
        from weddings w
        join wedding_members m on m.wedding_id = w.id
       where m.user_id = ${userId}
       order by w.created_at
       limit 1`;
    if (existing) return existing;

    // Bootstrapping is the one thing RLS cannot express, so it lives in a
    // definer function that derives the owner from the session.
    const [{ app_create_wedding: id }] = await tx<[{ app_create_wedding: string }]>`
      select app_create_wedding()`;
    const [created] = await tx<Wedding[]>`
      select id, groom_name, bride_name, event_date, checkin_photo_enabled
        from weddings where id = ${id}`;
    return created!;
  });
}

export async function requireMember(tx: Tx, weddingId: string, userId: string) {
  const [row] = await tx`
    select 1 from wedding_members
     where wedding_id = ${weddingId} and user_id = ${userId} limit 1`;
  if (!row) throw new Error("FORBIDDEN");
}
