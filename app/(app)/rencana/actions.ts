"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth.ts";
import { ensureWedding } from "@/lib/wedding.ts";
import { toResult, type ActionResult } from "@/lib/actions.ts";
import { saveBasics } from "@/lib/planner.ts";

/**
 * Story 2: the wedding date is asked for on the first screen, because every
 * deadline in the planner is counted back from it.
 */
export async function saveBasicsAction(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const wedding = await ensureWedding(userId);
    await saveBasics(userId, wedding.id, {
      groomName: String(form.get("groom") ?? ""),
      brideName: String(form.get("bride") ?? ""),
      eventDate: String(form.get("eventDate") ?? "") || null,
    });
    revalidatePath("/rencana");
    revalidatePath("/rencana/todo");
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}
