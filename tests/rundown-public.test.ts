import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getOrCreateInvitation,
  getPublicInvitation,
  publishInvitation,
  updateInvitation,
} from "../lib/invitations.ts";
import { normaliseContent } from "../lib/invitation-content.ts";
import { createItem, dueFromDateTime } from "../lib/planner.ts";
import { closeDb, grantProduct, newCouple } from "./helpers.ts";

after(closeDb);

/**
 * The planner is members-only and the invitation is world-readable, so putting
 * one on the other crosses a trust boundary. These tests are about what a
 * stranger with the slug can see — never about how the query is written.
 */

/** The minimum a draft needs before publish will accept it. */
const CONTENT = normaliseContent({
  couple: { groom: { fullName: "Bagas Prasetyo" }, bride: { fullName: "Nadia Rahmawati" } },
  events: [{ name: "Akad", startsAt: "2026-10-08T08:00", venue: "Masjid Al-Falah" }],
});

async function publishedCouple() {
  const { user, wedding } = await newCouple();
  await grantProduct(user.id, wedding.id, "invitation");
  const inv = await getOrCreateInvitation(user.id, wedding.id);
  await updateInvitation(user.id, inv.id, { content: CONTENT });
  await publishInvitation(user.id, inv.id);
  return { user, wedding, slug: inv.slug };
}

/** The public read, narrowed — every test here is on a live invitation. */
async function publicRundown(slug: string) {
  const read = await getPublicInvitation(slug);
  assert.ok(read && !("expired" in read), "expected a live invitation");
  return read.rundown;
}

const session = (
  userId: string,
  weddingId: string,
  title: string,
  hhmm: string,
  meta: Record<string, string | boolean>,
) =>
  createItem(userId, weddingId, "rundown", {
    title,
    dueAt: dueFromDateTime(`2026-10-08T${hhmm}`),
    meta,
  });

describe("rundown on the invitation", () => {
  it("shows only the sessions the couple ticked", async () => {
    const { user, wedding, slug } = await publishedCouple();
    await session(user.id, wedding.id, "Vendor bongkar muat", "05:00", { guest: false });
    await session(user.id, wedding.id, "Akad nikah", "08:00", { guest: true });

    const rundown = await publicRundown(slug);
    assert.deepEqual(
      rundown.map((r) => r.title),
      ["Akad nikah"],
    );
  });

  it("shows nothing at all until something is ticked", async () => {
    const { user, wedding, slug } = await publishedCouple();
    await session(user.id, wedding.id, "Briefing MC", "06:00", {});

    assert.deepEqual(await publicRundown(slug), []);
  });

  it("keeps the internal columns off the public page", async () => {
    const { user, wedding, slug } = await publishedCouple();
    await session(user.id, wedding.id, "Resepsi", "11:00", { guest: true, pic: "MC Yudha" });

    const [row] = await publicRundown(slug);
    // The row is here, but nothing on it names the staff running the day.
    assert.equal(row!.title, "Resepsi");
    assert.equal(JSON.stringify(row).includes("Yudha"), false);
  });

  it("orders by the clock, not by insertion", async () => {
    const { user, wedding, slug } = await publishedCouple();
    await session(user.id, wedding.id, "Resepsi", "11:00", { guest: true });
    await session(user.id, wedding.id, "Akad nikah", "08:00", { guest: true });

    assert.deepEqual(
      (await publicRundown(slug)).map((r) => r.title),
      ["Akad nikah", "Resepsi"],
    );
  });

  it("hides the schedule again when the invitation is not published", async () => {
    const { user, wedding } = await newCouple();
    await grantProduct(user.id, wedding.id, "invitation");
    const inv = await getOrCreateInvitation(user.id, wedding.id);
    await session(user.id, wedding.id, "Akad nikah", "08:00", { guest: true });

    // A draft has no public page at all, so there is no way through to the rows.
    assert.equal(await getPublicInvitation(inv.slug), null);
  });

  it("never serves one couple's schedule on another couple's invitation", async () => {
    const a = await publishedCouple();
    const b = await publishedCouple();
    await session(a.user.id, a.wedding.id, "Akad Rangga", "08:00", { guest: true });
    await session(b.user.id, b.wedding.id, "Akad Bagas", "09:00", { guest: true });

    assert.deepEqual(
      (await publicRundown(b.slug)).map((r) => r.title),
      ["Akad Bagas"],
    );
  });
});
