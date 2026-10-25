// The guest list is the spine: one row per guest, three events hanging off it.
// Everything below enters through the same functions the pages call.
import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  addGuest, bulkAddGuests, exportCsv, findGuestByToken, listGroups, listGuests,
  markInvitationOpened, markSent, recap, removeGuest, unmarkSent, updateGuest,
} from "../lib/guests.ts";
import {
  hideWish, listWishes, listWishesForMember, submitRsvp, submitWish, unhideWish,
} from "../lib/rsvp.ts";
import { asGuest, asUser, closeDb, newCouple } from "./helpers.ts";

after(closeDb);

/**
 * Publishing belongs to the invitation editor, which is a different module; this
 * only seeds the precondition those tests need, it never verifies through it.
 */
async function publish(
  userId: string,
  weddingId: string,
  opts: { deadline?: string | null; status?: "draft" | "published" } = {},
) {
  const slug = "u" + randomUUID().replace(/-/g, "").slice(0, 20);
  await asUser(userId, (tx) => tx`
    insert into invitations (wedding_id, slug, status, rsvp_deadline)
    values (${weddingId}, ${slug}, ${opts.status ?? "published"},
            ${opts.deadline ?? null})`);
  return slug;
}

async function seedPublished() {
  const { user, wedding } = await newCouple();
  await publish(user.id, wedding.id);
  return { user, wedding };
}

// --------------------------------------------------------------- the pax cap --

describe("pax cap", () => {
  it("rejects an RSVP for more people than the invitation allows", async () => {
    const { user, wedding } = await seedPublished();
    const guest = await addGuest(user.id, wedding.id, { name: "Budi", pax_allowed: 2 });

    await assert.rejects(
      () => submitRsvp({
        weddingId: wedding.id, guestToken: guest.token,
        name: "Budi", attending: "yes", pax: 5,
      }),
      /maksimal 2 orang/i,
    );

    // and nothing was written on the way to being rejected
    const [row] = await listGuests(user.id, wedding.id);
    assert.equal(row!.attending, null);
  });

  it("accepts an RSVP exactly at the cap", async () => {
    const { user, wedding } = await seedPublished();
    const guest = await addGuest(user.id, wedding.id, { name: "Budi", pax_allowed: 2 });

    await submitRsvp({
      weddingId: wedding.id, guestToken: guest.token,
      name: "Budi", attending: "yes", pax: 2,
    });

    const [row] = await listGuests(user.id, wedding.id);
    assert.equal(row!.attending, "yes");
    assert.equal(row!.rsvp_pax, 2);
  });

  it("leaves an answer from the open link unbounded by any guest's cap", async () => {
    const { user, wedding } = await seedPublished();
    await addGuest(user.id, wedding.id, { name: "Budi", pax_allowed: 1 });

    await submitRsvp({
      weddingId: wedding.id, guestToken: null,
      name: "Tetangga", attending: "yes", pax: 15,
    });

    const r = await recap(user.id, wedding.id);
    assert.equal(r.openLinkYes, 1);
    assert.equal(r.openLinkPax, 15);
    // It is not one of the invited rows, so it must not inflate those counts.
    assert.equal(r.invited, 1);
    assert.equal(r.respondedYes, 0);
  });

  it("stores zero pax when a guest declines, whatever they typed", async () => {
    const { user, wedding } = await seedPublished();
    const guest = await addGuest(user.id, wedding.id, { name: "Budi", pax_allowed: 2 });

    await submitRsvp({
      weddingId: wedding.id, guestToken: guest.token,
      name: "Budi", attending: "no", pax: 2,
    });

    const [row] = await listGuests(user.id, wedding.id);
    assert.equal(row!.rsvp_pax, 0);
  });
});

// ------------------------------------------------------- deadline and status --

describe("the RSVP gate is on the server", () => {
  it("rejects an RSVP after the deadline even when the client posts directly", async () => {
    const { user, wedding } = await newCouple();
    await publish(user.id, wedding.id, {
      deadline: new Date(Date.now() - 86_400_000).toISOString(),
    });
    const guest = await addGuest(user.id, wedding.id, { name: "Budi" });

    // submitRsvp *is* the direct post: there is no UI in this call at all.
    await assert.rejects(
      () => submitRsvp({
        weddingId: wedding.id, guestToken: guest.token,
        name: "Budi", attending: "yes", pax: 1,
      }),
      /batas waktu/i,
    );
  });

  it("still accepts an RSVP before the deadline", async () => {
    const { user, wedding } = await newCouple();
    await publish(user.id, wedding.id, {
      deadline: new Date(Date.now() + 86_400_000).toISOString(),
    });
    const guest = await addGuest(user.id, wedding.id, { name: "Budi" });

    await submitRsvp({
      weddingId: wedding.id, guestToken: guest.token,
      name: "Budi", attending: "yes", pax: 1,
    });
    const [row] = await listGuests(user.id, wedding.id);
    assert.equal(row!.attending, "yes");
  });

  it("rejects an RSVP against a draft invitation", async () => {
    const { user, wedding } = await newCouple();
    await publish(user.id, wedding.id, { status: "draft" });
    const guest = await addGuest(user.id, wedding.id, { name: "Budi" });

    await assert.rejects(
      () => submitRsvp({
        weddingId: wedding.id, guestToken: guest.token,
        name: "Budi", attending: "yes", pax: 1,
      }),
      /belum terbit/i,
    );
  });

  it("rejects an RSVP when there is no invitation at all", async () => {
    const { user, wedding } = await newCouple();
    const guest = await addGuest(user.id, wedding.id, { name: "Budi" });

    await assert.rejects(
      () => submitRsvp({
        weddingId: wedding.id, guestToken: guest.token,
        name: "Budi", attending: "yes", pax: 1,
      }),
      /belum terbit/i,
    );
  });

  it("rejects a wish against an unpublished invitation too", async () => {
    const { user, wedding } = await newCouple();
    await publish(user.id, wedding.id, { status: "draft" });

    await assert.rejects(
      () => submitWish({
        weddingId: wedding.id, guestToken: null,
        name: "Tetangga", message: "Selamat!",
      }),
      /belum terbit/i,
    );
  });
});

// ------------------------------------------------------------ changing an answer --

describe("changing an RSVP", () => {
  it("edits the one row instead of adding a second", async () => {
    const { user, wedding } = await seedPublished();
    const guest = await addGuest(user.id, wedding.id, { name: "Budi", pax_allowed: 4 });

    await submitRsvp({
      weddingId: wedding.id, guestToken: guest.token,
      name: "Budi", attending: "yes", pax: 4,
    });
    await submitRsvp({
      weddingId: wedding.id, guestToken: guest.token,
      name: "Budi Santoso", attending: "no", pax: 0,
    });

    // One guest row, carrying the latest answer and only the latest answer.
    const rows = await listGuests(user.id, wedding.id);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.attending, "no");
    assert.equal(rows[0]!.rsvp_pax, 0);

    const r = await recap(user.id, wedding.id);
    assert.equal(r.respondedYes, 0);
    assert.equal(r.respondedNo, 1);
    assert.equal(r.paxConfirmed, 0);
  });
});

// -------------------------------------------------------------- bulk paste --

describe("bulk paste", () => {
  const PASTED = [
    "Budi Santoso",                             // name only
    "Siti Aminah, 0812-3456-7890",              // name + phone
    "Rina Wijaya, 081298765432, Kantor",        // name + phone + group
    "Agus Salim\t08111222333",                  // tab separated
    "",                                          // blank
    "     ",                                     // whitespace only
    "Budi Santoso",                             // duplicate within the paste
  ].join("\n");

  it("handles every line shape, and normalises the phone on the way in", async () => {
    const { user, wedding } = await newCouple();
    const result = await bulkAddGuests(user.id, wedding.id, PASTED);

    assert.deepEqual(result, { added: 4, skipped: 1 });

    const rows = await listGuests(user.id, wedding.id);
    const by = (n: string) => rows.find((r) => r.name === n)!;

    assert.equal(rows.length, 4);
    assert.equal(by("Budi Santoso").phone, null);
    assert.equal(by("Budi Santoso").guest_group, "");
    assert.equal(by("Siti Aminah").phone, "6281234567890");
    assert.equal(by("Rina Wijaya").phone, "6281298765432");
    assert.equal(by("Rina Wijaya").guest_group, "Kantor");
    assert.equal(by("Agus Salim").phone, "628111222333");
  });

  it("skips names the wedding already has, so a re-paste is safe", async () => {
    const { user, wedding } = await newCouple();
    await bulkAddGuests(user.id, wedding.id, PASTED);

    // The couple pastes the same list again after adding one name to their notes.
    const again = await bulkAddGuests(
      user.id, wedding.id, PASTED + "\nDewi Lestari, 08122223333",
    );
    assert.deepEqual(again, { added: 1, skipped: 5 });
    assert.equal((await listGuests(user.id, wedding.id)).length, 5);
  });

  it("matches existing names regardless of case and padding", async () => {
    const { user, wedding } = await newCouple();
    await addGuest(user.id, wedding.id, { name: "Budi Santoso" });
    const result = await bulkAddGuests(user.id, wedding.id, "  budi SANTOSO  ");
    assert.deepEqual(result, { added: 0, skipped: 1 });
  });

  it("adds nothing at all for an empty paste", async () => {
    const { user, wedding } = await newCouple();
    assert.deepEqual(await bulkAddGuests(user.id, wedding.id, "\n\n   \n"),
      { added: 0, skipped: 0 });
  });

  it("gives every pasted guest a distinct token", async () => {
    const { user, wedding } = await newCouple();
    await bulkAddGuests(user.id, wedding.id, PASTED);
    const rows = await listGuests(user.id, wedding.id);
    assert.equal(new Set(rows.map((r) => r.token)).size, rows.length);
  });
});

// --------------------------------------------------------------- csv export --

describe("csv export", () => {
  it("escapes quotes and commas, and defuses formula prefixes", async () => {
    const { user, wedding } = await seedPublished();
    await addGuest(user.id, wedding.id, {
      name: 'Ibu "Tante" Sari, S.H.', guest_group: "=SUM(A1:A9)",
    });
    await addGuest(user.id, wedding.id, { name: "-Ari", guest_group: "+62 Grup" });
    await addGuest(user.id, wedding.id, { name: "@Mention", guest_group: "Kantor" });

    const csv = await exportCsv(user.id, wedding.id);

    // Quotes doubled, the whole cell wrapped because it holds a comma.
    assert.match(csv, /"Ibu ""Tante"" Sari, S\.H\."/);
    // Every formula lead-in is neutralised by a leading apostrophe.
    assert.ok(csv.includes("'=SUM(A1:A9)"), "= must be quoted out");
    assert.ok(csv.includes("'-Ari"), "- must be quoted out");
    assert.ok(csv.includes("'+62 Grup"), "+ must be quoted out");
    assert.ok(csv.includes("'@Mention"), "@ must be quoted out");

    // No cell anywhere may still start with a live formula character.
    for (const line of csv.split("\r\n")) {
      for (const cell of line.split(",")) {
        assert.ok(!/^[=+@]/.test(cell), `live formula cell: ${cell}`);
      }
    }
  });

  it("reports the three events for one guest on one row", async () => {
    const { user, wedding } = await seedPublished();
    const guest = await addGuest(user.id, wedding.id, {
      name: "Budi", phone: "0812-3456-7890", guest_group: "Keluarga", pax_allowed: 3,
    });
    await markSent(user.id, [guest.id]);
    await markInvitationOpened(guest.token);
    await submitRsvp({
      weddingId: wedding.id, guestToken: guest.token,
      name: "Budi", attending: "yes", pax: 3,
    });
    await asUser(user.id, (tx) => tx`
      update guests set checked_in_at = now(), checked_in_pax = 2
       where id = ${guest.id}`);

    const [header, row] = (await exportCsv(user.id, wedding.id)).split("\r\n");
    assert.equal(header, "Nama,Telepon,Kelompok,Sesi,Jatah pax,Token,Dikirim,Dibuka,RSVP,Pax RSVP,Check-in,Pax hadir");

    const cells = row!.split(",");
    assert.equal(cells[0], "Budi");
    assert.equal(cells[1], "6281234567890");
    assert.equal(cells[2], "Keluarga");
    assert.equal(cells[4], "3");
    assert.equal(cells[5], guest.token);
    assert.ok(cells[6], "sent_at must be present");
    assert.ok(cells[7], "first_opened_at must be present");
    assert.equal(cells[8], "Hadir");
    assert.equal(cells[9], "3");
    assert.ok(cells[10], "checked_in_at must be present");
    assert.equal(cells[11], "2");
  });

  it("says so plainly when a guest has not answered", async () => {
    const { user, wedding } = await seedPublished();
    await addGuest(user.id, wedding.id, { name: "Budi" });
    assert.match(await exportCsv(user.id, wedding.id), /Belum menjawab/);
  });
});

// ---------------------------------------------------------------- the recap --

describe("recap", () => {
  /**
   * The scenario the whole platform exists to be able to answer: five invited,
   * three said yes, two of those actually walked in.
   */
  async function scenario() {
    const { user, wedding } = await seedPublished();
    const mk = (name: string, group: string, pax: number) =>
      addGuest(user.id, wedding.id, { name, guest_group: group, pax_allowed: pax });

    const g1 = await mk("Ani", "Keluarga", 2);
    const g2 = await mk("Bayu", "Keluarga", 4);
    const g3 = await mk("Citra", "Keluarga", 2);
    const g4 = await mk("Dedi", "Kantor", 2);
    const g5 = await mk("Eka", "Kantor", 2);

    const rsvp = (token: string, attending: "yes" | "no", pax: number) =>
      submitRsvp({ weddingId: wedding.id, guestToken: token, name: "x", attending, pax });

    await rsvp(g1.token, "yes", 2);
    await rsvp(g2.token, "yes", 3);   // says yes, never arrives
    await rsvp(g3.token, "no", 0);
    await rsvp(g5.token, "yes", 1);
    // g4 never answers.

    const checkIn = (id: string, pax: number) => asUser(user.id, (tx) => tx`
      update guests set checked_in_at = now(), checked_in_pax = ${pax} where id = ${id}`);
    await checkIn(g1.id, 2);
    await checkIn(g5.id, 1);

    return { user, wedding, g1, g2, g3, g4, g5 };
  }

  it("counts the seeded scenario exactly", async () => {
    const { user, wedding, g2 } = await scenario();
    const r = await recap(user.id, wedding.id);

    assert.equal(r.invited, 5);
    assert.equal(r.respondedYes, 3);
    assert.equal(r.respondedNo, 1);
    assert.equal(r.notResponded, 1);
    assert.equal(r.paxConfirmed, 6);   // 2 + 3 + 1
    assert.equal(r.checkedIn, 2);
    assert.equal(r.paxPresent, 3);     // 2 + 1

    // yes + no + silent must reconcile with invited, or the screen lies.
    assert.equal(r.respondedYes + r.respondedNo + r.notResponded, r.invited);

    assert.deepEqual(
      r.confirmedAbsent.map((g) => [g.name, g.rsvp_pax]),
      [["Bayu", 3]],
    );
    assert.equal(r.confirmedAbsent[0]!.id, g2.id);
  });

  it("filters every figure by group", async () => {
    const { user, wedding } = await scenario();
    const r = await recap(user.id, wedding.id, "Kantor");

    assert.equal(r.invited, 2);
    assert.equal(r.respondedYes, 1);
    assert.equal(r.respondedNo, 0);
    assert.equal(r.notResponded, 1);
    assert.equal(r.paxConfirmed, 1);
    assert.equal(r.checkedIn, 1);
    assert.equal(r.paxPresent, 1);
    assert.deepEqual(r.confirmedAbsent, []);
  });

  it("keeps a cancelled check-in out of the present count", async () => {
    const { user, wedding, g1 } = await scenario();
    await asUser(user.id, (tx) => tx`
      update guests set checked_in_at = null, checked_in_pax = null
       where id = ${g1.id}`);

    const r = await recap(user.id, wedding.id);
    assert.equal(r.checkedIn, 1);
    assert.equal(r.paxPresent, 1);
    assert.deepEqual(r.confirmedAbsent.map((g) => g.name), ["Ani", "Bayu"]);
  });

  it("reports nothing for an empty guest list rather than blowing up", async () => {
    const { user, wedding } = await seedPublished();
    const r = await recap(user.id, wedding.id);
    assert.equal(r.invited, 0);
    assert.equal(r.paxConfirmed, 0);
    assert.equal(r.paxPresent, 0);
    assert.deepEqual(r.confirmedAbsent, []);
  });
});

// ------------------------------------------------- what a guest token can see --

describe("a guest token", () => {
  it("exposes exactly its own row and nothing else in the wedding", async () => {
    const { user, wedding } = await seedPublished();
    const mine = await addGuest(user.id, wedding.id, { name: "Ani", phone: "08123456789" });
    await addGuest(user.id, wedding.id, { name: "Bayu" });
    await addGuest(user.id, wedding.id, { name: "Citra" });

    const found = await findGuestByToken(mine.token);
    assert.equal(found?.id, mine.id);
    assert.equal(found?.name, "Ani");

    // The blunt version of the same question, straight at the table.
    const visible = await asGuest(mine.token, (tx) =>
      tx`select id, name from guests where wedding_id = ${wedding.id}`);
    assert.equal(visible.length, 1);
    assert.equal(visible[0]!.id, mine.id);
  });

  it("reaches no other part of the wedding", async () => {
    const { user, wedding } = await seedPublished();
    const mine = await addGuest(user.id, wedding.id, { name: "Ani" });
    const other = await addGuest(user.id, wedding.id, { name: "Bayu" });
    await submitRsvp({
      weddingId: wedding.id, guestToken: other.token,
      name: "Bayu", attending: "yes", pax: 1,
    });
    await asUser(user.id, (tx) => tx`
      insert into planner_items (wedding_id, kind, title, amount_planned)
      values (${wedding.id}, 'budget', 'Gedung', 50000000)`);

    const seen = await asGuest(mine.token, async (tx) => ({
      rsvps: await tx`select id from rsvps where wedding_id = ${wedding.id}`,
      planner: await tx`select id from planner_items where wedding_id = ${wedding.id}`,
      orders: await tx`select id from orders where wedding_id = ${wedding.id}`,
      members: await tx`select user_id from wedding_members where wedding_id = ${wedding.id}`,
    }));

    assert.equal(seen.rsvps.length, 0, "must not read another guest's answer");
    assert.equal(seen.planner.length, 0, "must not read the couple's budget");
    assert.equal(seen.orders.length, 0, "must not read the couple's payments");
    assert.equal(seen.members.length, 0, "must not read who the couple are");
  });

  it("cannot raise its own pax allowance", async () => {
    const { user, wedding } = await seedPublished();
    const mine = await addGuest(user.id, wedding.id, { name: "Ani", pax_allowed: 2 });

    await asGuest(mine.token, (tx) => tx`
      update guests set pax_allowed = 20 where token = ${mine.token}`);

    const [row] = await listGuests(user.id, wedding.id);
    assert.equal(row!.pax_allowed, 2, "RLS must give the token no write path here");
  });

  it("returns nothing for a token that was never issued", async () => {
    assert.equal(await findGuestByToken("BOGUS234"), null);
    assert.equal(await findGuestByToken(""), null);
  });

  it("records the first open and does not overwrite it", async () => {
    const { user, wedding } = await seedPublished();
    const guest = await addGuest(user.id, wedding.id, { name: "Ani" });
    assert.equal(guest.first_opened_at, null);

    await markInvitationOpened(guest.token);
    const first = (await findGuestByToken(guest.token))!.first_opened_at;
    assert.ok(first, "opening a personal link must be recorded");

    await markInvitationOpened(guest.token);
    assert.deepEqual((await findGuestByToken(guest.token))!.first_opened_at, first);
  });
});

// -------------------------------------------------------- the rest of the crud --

describe("managing the list", () => {
  it("searches by name and filters by group independently", async () => {
    const { user, wedding } = await newCouple();
    await bulkAddGuests(user.id, wedding.id,
      "Budi Santoso,,Keluarga\nSiti Budiman,,Kantor\nRina Wijaya,,Kantor");

    assert.deepEqual(
      (await listGuests(user.id, wedding.id, { q: "budi" })).map((g) => g.name).sort(),
      ["Budi Santoso", "Siti Budiman"],
    );
    assert.deepEqual(
      (await listGuests(user.id, wedding.id, { group: "Kantor" })).map((g) => g.name),
      ["Rina Wijaya", "Siti Budiman"],
    );
    assert.deepEqual(
      (await listGuests(user.id, wedding.id, { q: "budi", group: "Kantor" }))
        .map((g) => g.name),
      ["Siti Budiman"],
    );
    // Alphabetical, because the filter control is a list the couple scans.
    assert.deepEqual(await listGroups(user.id, wedding.id), ["Kantor", "Keluarga"]);
  });

  it("re-normalises the phone when a wrong number is corrected", async () => {
    const { user, wedding } = await newCouple();
    const guest = await addGuest(user.id, wedding.id, { name: "Budi", phone: "0811" });
    assert.equal(guest.phone, null, "a number too short to be real is not stored");

    await updateGuest(user.id, guest.id, { name: "Budi", phone: "+62 812 3456 7890" });
    const [row] = await listGuests(user.id, wedding.id);
    assert.equal(row!.phone, "6281234567890");
    assert.equal(row!.token, guest.token, "correcting a number must not move the link");
  });

  it("clamps a pax allowance the form should never have sent", async () => {
    const { user, wedding } = await newCouple();
    const a = await addGuest(user.id, wedding.id, { name: "A", pax_allowed: 0 });
    const b = await addGuest(user.id, wedding.id, { name: "B", pax_allowed: 999 });
    assert.equal(a.pax_allowed, 1);
    assert.equal(b.pax_allowed, 20);
  });

  it("refuses a nameless guest", async () => {
    const { user, wedding } = await newCouple();
    await assert.rejects(
      () => addGuest(user.id, wedding.id, { name: "   " }), /Nama tamu/i);
  });

  it("records sending as intent and lets it be taken back", async () => {
    const { user, wedding } = await newCouple();
    const a = await addGuest(user.id, wedding.id, { name: "A" });
    const b = await addGuest(user.id, wedding.id, { name: "B" });

    await markSent(user.id, [a.id, b.id]);
    assert.equal((await listGuests(user.id, wedding.id)).filter((g) => g.sent_at).length, 2);

    await unmarkSent(user.id, a.id);
    const rows = await listGuests(user.id, wedding.id);
    assert.equal(rows.find((g) => g.id === a.id)!.sent_at, null);
    assert.ok(rows.find((g) => g.id === b.id)!.sent_at);
  });

  it("removes a guest and their answer together", async () => {
    const { user, wedding } = await seedPublished();
    const guest = await addGuest(user.id, wedding.id, { name: "Budi" });
    await submitRsvp({
      weddingId: wedding.id, guestToken: guest.token,
      name: "Budi", attending: "yes", pax: 1,
    });

    await removeGuest(user.id, guest.id);
    const r = await recap(user.id, wedding.id);
    assert.equal(r.invited, 0);
    assert.equal(r.respondedYes, 0);
  });

  it("keeps one couple's list out of another's reach", async () => {
    const a = await newCouple();
    const b = await newCouple();
    await addGuest(a.user.id, a.wedding.id, { name: "Ani" });

    await assert.rejects(() => listGuests(b.user.id, a.wedding.id), /FORBIDDEN/);
    await assert.rejects(
      () => addGuest(b.user.id, a.wedding.id, { name: "penyusup" }), /FORBIDDEN/);
    await assert.rejects(() => recap(b.user.id, a.wedding.id), /FORBIDDEN/);
  });
});

// -------------------------------------------------------------------- wishes --

describe("wishes", () => {
  it("are readable by the public until a member hides one", async () => {
    const { user, wedding } = await seedPublished();
    const guest = await addGuest(user.id, wedding.id, { name: "Ani" });

    await submitWish({
      weddingId: wedding.id, guestToken: guest.token,
      name: "Ani", message: "Selamat ya, bahagia selalu.",
    });
    await submitWish({
      weddingId: wedding.id, guestToken: null, name: "Tetangga", message: "kasar",
    });

    assert.equal((await listWishes(wedding.id)).length, 2);

    const rude = (await listWishesForMember(user.id, wedding.id))
      .find((w) => w.message === "kasar")!;
    await hideWish(user.id, rude.id);

    const publicView = await listWishes(wedding.id);
    assert.equal(publicView.length, 1);
    assert.equal(publicView[0]!.name, "Ani");
    // The couple can still see it, which is the only way to undo the decision.
    assert.equal((await listWishesForMember(user.id, wedding.id)).length, 2);

    await unhideWish(user.id, rude.id);
    assert.equal((await listWishes(wedding.id)).length, 2);
  });

  it("refuses an empty message and one over the stored limit", async () => {
    const { user, wedding } = await seedPublished();
    for (const message of ["", "   ", "x".repeat(1001)]) {
      await assert.rejects(() => submitWish({
        weddingId: wedding.id, guestToken: null, name: "Tetangga", message,
      }), /Ucapan/i);
    }
    await assert.rejects(() => submitWish({
      weddingId: wedding.id, guestToken: null, name: " ", message: "hai",
    }), /Nama/i);
  });
});
