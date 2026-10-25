"use server";

import { requireUserId } from "@/lib/auth.ts";
import { toResult, type ActionResult } from "@/lib/actions.ts";
import {
  publishInvitation,
  updateInvitation,
  type Invitation,
  type InvitationPatch,
} from "@/lib/invitations.ts";

/**
 * Two actions, because the editor does exactly two things. Both return the saved
 * invitation so the form can adopt whatever the server settled on — a normalised
 * slug, a tidied document — instead of drifting away from it.
 */
export async function saveInvitationAction(
  id: string,
  patch: InvitationPatch,
): Promise<ActionResult<Invitation>> {
  try {
    return { ok: true, data: await updateInvitation(await requireUserId(), id, patch) };
  } catch (err) {
    return toResult(err);
  }
}

/** Saves first: publishing content the couple has not seen saved is a trap. */
export async function publishInvitationAction(
  id: string,
  patch: InvitationPatch,
): Promise<ActionResult<Invitation>> {
  try {
    const userId = await requireUserId();
    await updateInvitation(userId, id, patch);
    return { ok: true, data: await publishInvitation(userId, id) };
  } catch (err) {
    return toResult(err);
  }
}
