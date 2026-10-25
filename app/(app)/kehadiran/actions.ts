"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth.ts";
import { ensureWedding } from "@/lib/wedding.ts";
import { toResult, type ActionResult } from "@/lib/actions.ts";
import { createScannerLink, revokeScannerLink, setCheckinPhoto } from "@/lib/checkin.ts";

export async function createLinkAction(
  label: string,
  hours: number,
): Promise<ActionResult<{ id: string; token: string }>> {
  try {
    const userId = await requireUserId();
    const wedding = await ensureWedding(userId);
    const link = await createScannerLink(userId, wedding.id, label, hours);
    revalidatePath("/kehadiran");
    // The raw token travels back exactly once; nothing stores it after this.
    return { ok: true, data: link };
  } catch (err) {
    return toResult(err);
  }
}

export async function revokeLinkAction(id: string): Promise<ActionResult> {
  try {
    await revokeScannerLink(await requireUserId(), id);
    revalidatePath("/kehadiran");
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}

export async function setPhotoAction(on: boolean): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const wedding = await ensureWedding(userId);
    await setCheckinPhoto(userId, wedding.id, on);
    revalidatePath("/kehadiran");
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}
