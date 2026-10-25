"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth.ts";
import { ensureWedding } from "@/lib/wedding.ts";
import { toResult, type ActionResult } from "@/lib/actions.ts";
import { revalidateWeddingInvitation } from "@/lib/invitations.ts";
import {
  chooseVendor,
  createItem,
  deleteItem,
  dueFromDate,
  dueFromDateTime,
  ensureRundownShare,
  isKind,
  listItems,
  reorderItems,
  revokeRundownShare,
  seedDefaultTodos,
  toggleDone,
  updateItem,
  type ItemPatch,
  type Kind,
} from "@/lib/planner.ts";
import { fieldsFor, VIEWS } from "./view.ts";

async function ctx(kind: string) {
  if (!isKind(kind)) throw new Error("Jenis daftar tidak dikenal.");
  const userId = await requireUserId();
  const wedding = await ensureWedding(userId);
  return { userId, weddingId: wedding.id, kind: kind as Kind };
}

/**
 * Every planner mutation ends here. Rundown rows are the one kind that is also
 * read by someone outside the app — a guest on the invitation — so this is where
 * the guest's cached page is busted. Doing it here rather than in each action
 * means a new rundown mutation cannot forget to.
 */
const refresh = async (c: { userId: string; weddingId: string; kind: Kind }) => {
  revalidatePath(`/rencana/${c.kind}`);
  revalidatePath("/rencana"); // the summary reads the same rows
  if (c.kind === "rundown") await revalidateWeddingInvitation(c.userId, c.weddingId);
};

/** Digits only: a couple types "62.500.000", "62500000" or "Rp 62 juta"-ish. */
function parseMoney(raw: FormDataEntryValue | null): number | null {
  const digits = String(raw ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

/**
 * Builds the patch from exactly the fields this view shows. Anything the view
 * does not show stays absent, and absent means "leave it alone" downstream.
 */
function patchFrom(kind: Kind, isChild: boolean, form: FormData): ItemPatch {
  const patch: ItemPatch = {};
  const meta: Record<string, unknown> = {};

  for (const f of fieldsFor(VIEWS[kind], isChild)) {
    switch (f.type) {
      case "title":
        patch.title = String(form.get("title") ?? "");
        break;
      case "note":
        patch.note = String(form.get("note") ?? "");
        break;
      case "planned":
        patch.amountPlanned = parseMoney(form.get("planned"));
        break;
      case "actual":
        patch.amountActual = parseMoney(form.get("actual"));
        break;
      case "date": {
        const v = String(form.get("due") ?? "").trim();
        patch.dueAt = v ? dueFromDate(v) : null;
        break;
      }
      case "datetime": {
        const v = String(form.get("due") ?? "").trim();
        patch.dueAt = v ? dueFromDateTime(v) : null;
        break;
      }
      case "text":
      case "url":
        meta[f.key] = String(form.get(`meta.${f.key}`) ?? "");
        break;
      case "flag":
        // An unchecked box sends nothing, so presence is the value.
        meta[f.key] = form.has(`meta.${f.key}`);
        break;
    }
  }
  if (Object.keys(meta).length) patch.meta = meta;
  return patch;
}

export async function saveItemAction(
  kind: string,
  itemId: string | null,
  parentId: string | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    const c = await ctx(kind);
    const patch = patchFrom(c.kind, Boolean(parentId), form);
    if (itemId) {
      await updateItem(c.userId, itemId, patch);
    } else {
      await createItem(c.userId, c.weddingId, c.kind, {
        ...patch,
        title: patch.title ?? "",
        parentId,
      });
    }
    await refresh(c);
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}

export async function deleteItemAction(
  kind: string,
  itemId: string,
): Promise<ActionResult> {
  try {
    const c = await ctx(kind);
    await deleteItem(c.userId, itemId);
    await refresh(c);
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}

export async function toggleDoneAction(
  kind: string,
  itemId: string,
): Promise<ActionResult> {
  try {
    const c = await ctx(kind);
    await toggleDone(c.userId, itemId);
    await refresh(c);
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}

/**
 * Up/down rather than drag-and-drop: it is one swap, it works with a keyboard
 * without any extra code, and it works on a phone.
 */
export async function moveItemAction(
  kind: string,
  itemId: string,
  direction: -1 | 1,
): Promise<ActionResult> {
  try {
    const c = await ctx(kind);
    const nodes = await listItems(c.userId, c.weddingId, c.kind);
    const parent = nodes.find((n) => n.children.some((child) => child.id === itemId));
    const siblings = (parent ? parent.children : nodes).map((n) => n.id);

    const from = siblings.indexOf(itemId);
    if (from < 0) return { ok: false, error: "Baris tidak ditemukan." };
    const to = from + direction;
    if (to < 0 || to >= siblings.length) return { ok: true }; // already at the edge

    [siblings[from], siblings[to]] = [siblings[to]!, siblings[from]!];
    await reorderItems(c.userId, c.weddingId, c.kind, siblings);
    await refresh(c);
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}

export async function chooseVendorAction(itemId: string): Promise<ActionResult> {
  try {
    const c = await ctx("vendor");
    await chooseVendor(c.userId, itemId);
    await refresh(c);
    revalidatePath("/rencana/budget");
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}

export async function seedTodosAction(): Promise<ActionResult> {
  try {
    const c = await ctx("todo");
    const n = await seedDefaultTodos(c.userId, c.weddingId);
    await refresh(c);
    if (n === 0) return { ok: false, error: "Daftar to-do kamu sudah terisi." };
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}

export async function shareRundownAction(): Promise<ActionResult> {
  try {
    const c = await ctx("rundown");
    const token = await ensureRundownShare(c.userId, c.weddingId);
    await refresh(c);
    if (!token) return { ok: false, error: "Isi rundown-nya dulu, baru bisa dibagikan." };
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}

export async function revokeShareAction(): Promise<ActionResult> {
  try {
    const c = await ctx("rundown");
    await revokeRundownShare(c.userId, c.weddingId);
    await refresh(c);
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}
