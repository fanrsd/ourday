import { redirect } from "next/navigation";
import { currentUserId } from "./auth.ts";
import { ensureWedding, type Wedding } from "./wedding.ts";
import { ownsProduct, type Product } from "./products.ts";
import { withCtx } from "./db.ts";

/** Every signed-in page starts here: identity, the wedding, and what was bought. */
export async function currentContext(): Promise<{
  userId: string;
  wedding: Wedding;
  owns: Record<Product, boolean>;
}> {
  const userId = await currentUserId();
  if (!userId) redirect("/masuk");

  const wedding = await ensureWedding(userId);
  const owns = await withCtx({ userId }, async (tx) => ({
    invitation: await ownsProduct(tx, wedding.id, "invitation"),
    guestbook: await ownsProduct(tx, wedding.id, "guestbook"),
  }));

  return { userId, wedding, owns };
}
