"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth.ts";
import { ensureWedding } from "@/lib/wedding.ts";
import { toResult, type ActionResult } from "@/lib/actions.ts";
import {
  addGuest, bulkAddGuests, markSent, removeGuest, unmarkSent, updateGuest,
} from "@/lib/guests.ts";
import { hideWish, unhideWish } from "@/lib/rsvp.ts";

/** The wedding is never taken from the form: it is derived from the session. */
async function me() {
  const userId = await requireUserId();
  return { userId, wedding: await ensureWedding(userId) };
}

const field = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

function inputFrom(form: FormData) {
  return {
    name: field(form, "name"),
    phone: field(form, "phone") || null,
    guest_group: field(form, "guest_group"),
    session_label: field(form, "session_label"),
    pax_allowed: Number(form.get("pax_allowed")),
  };
}

/** One action for add and edit: the form is the same form either way. */
export async function saveGuestAction(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const id = field(form, "id");
  try {
    const { userId, wedding } = await me();
    if (id) await updateGuest(userId, id, inputFrom(form));
    else await addGuest(userId, wedding.id, inputFrom(form));
  } catch (err) {
    return toResult(err);
  }
  revalidatePath("/tamu");
  // Editing happens in place of a row, so success has to close the row.
  if (id) redirect("/tamu");
  return { ok: true };
}

export async function pasteGuestsAction(
  _prev: ActionResult<{ added: number; skipped: number }> | null,
  form: FormData,
): Promise<ActionResult<{ added: number; skipped: number }>> {
  try {
    const { userId, wedding } = await me();
    const data = await bulkAddGuests(userId, wedding.id, String(form.get("pasted") ?? ""));
    revalidatePath("/tamu");
    return { ok: true, data };
  } catch (err) {
    return toResult(err);
  }
}

/**
 * Records that the couple pressed send. We use a wa.me deep link, so we cannot
 * know the message arrived — hence this is reversible, and the table says
 * "Terkirim" rather than "Diterima".
 */
export async function setSentAction(guestId: string, sent: boolean): Promise<void> {
  const { userId } = await me();
  if (sent) await markSent(userId, [guestId]);
  else await unmarkSent(userId, guestId);
  revalidatePath("/tamu");
}

export async function removeGuestAction(form: FormData): Promise<void> {
  const { userId } = await me();
  await removeGuest(userId, field(form, "id"));
  revalidatePath("/tamu");
  revalidatePath("/tamu/rekap");
}

export async function setWishHiddenAction(form: FormData): Promise<void> {
  const { userId } = await me();
  const id = field(form, "id");
  if (field(form, "hide") === "1") await hideWish(userId, id);
  else await unhideWish(userId, id);
  revalidatePath("/tamu/ucapan");
}
