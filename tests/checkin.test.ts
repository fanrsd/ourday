// Check-in is the one place where a lost write cannot be repaired, so these
// tests go after exactly that: replays, re-scans, undo, entitlement and the
// blast radius of a scanner link.
import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  checkIn,
  createScannerLink,
  findByName,
  liveStats,
  resolveScannerLink,
  revokeScannerLink,
  undoCheckIn,
  walkIn,
} from "../lib/checkin.ts";
import { asScanner, asUser, closeDb, grantProduct, newCouple } from "./helpers.ts";

after(closeDb);

/** Setup only. Guest creation is the guest-list slice's seam, not this one. */
async function seed({ paid = true } = {}) {
  const { user, wedding } = await newCouple();
  if (paid) await grantProduct(user.id, wedding.id, "guestbook");
  const [guest] = await asUser(user.id, (tx) => tx<{ id: string; token: string }[]>`
    insert into guests (wedding_id, name, guest_group, pax_allowed, token)
    values (${wedding.id}, 'Budi Santoso', 'Kantor', 4, ${"T" + randomUUID().slice(0, 7)})
    returning id, token`);
  return { user, wedding, guest: guest! };
}

describe("check-in idempotency", () => {
  it("applies the same client event twice without changing anything", async () => {
    const { user, wedding, guest } = await seed();
    const eventId = randomUUID();

    const first = await checkIn({
      scannerWeddingId: wedding.id, token: guest.token, pax: 2, clientEventId: eventId,
    });
    const replay = await checkIn({
      scannerWeddingId: wedding.id, token: guest.token, pax: 2, clientEventId: eventId,
    });

    assert.equal(first.status, "ok");
    assert.equal(replay.status, "already");
    assert.equal(replay.checkedInAt, first.checkedInAt, "arrival time must not move");

    const stats = await liveStats(wedding.id, { userId: user.id });
    assert.equal(stats.arrived, 1);
    assert.equal(stats.pax, 2, "a retry must not add pax a second time");
  });

  it("updates the same guest under a new event id instead of duplicating", async () => {
    const { user, wedding, guest } = await seed();
    const first = await checkIn({
      scannerWeddingId: wedding.id, token: guest.token, pax: 2, clientEventId: randomUUID(),
    });
    const corrected = await checkIn({
      scannerWeddingId: wedding.id, token: guest.token, pax: 4, clientEventId: randomUUID(),
    });

    assert.equal(corrected.guest.id, first.guest.id);
    assert.equal(corrected.guest.checked_in_pax, 4);

    const stats = await liveStats(wedding.id, { userId: user.id });
    assert.equal(stats.arrived, 1, "attendance is a column, so it cannot duplicate");
    assert.equal(stats.pax, 4);
  });

  it("keeps a corrected pax when the guest is scanned again", async () => {
    const { wedding, guest } = await seed(); // pax_allowed is 4
    const first = await checkIn({
      scannerWeddingId: wedding.id, token: guest.token, pax: null,
      clientEventId: randomUUID(),
    });
    assert.equal(first.guest.checked_in_pax, 4, "an uncorrected arrival takes the allowance");

    await checkIn({
      scannerWeddingId: wedding.id, token: guest.token, pax: 1, clientEventId: randomUUID(),
    });
    const again = await checkIn({
      scannerWeddingId: wedding.id, token: guest.token, pax: null,
      clientEventId: randomUUID(),
    });
    assert.equal(again.guest.checked_in_pax, 1, "a re-scan must not undo the desk's correction");
  });

  it("greets a re-scan with the original time rather than an error", async () => {
    const { wedding, guest } = await seed();
    const first = await checkIn({
      scannerWeddingId: wedding.id, token: guest.token, pax: 3, clientEventId: randomUUID(),
    });
    const again = await checkIn({
      scannerWeddingId: wedding.id, token: guest.token, pax: 3, clientEventId: randomUUID(),
    });

    assert.equal(again.status, "already");
    assert.equal(again.checkedInAt, first.checkedInAt);
    assert.equal(again.guest.name, "Budi Santoso");
    assert.equal(again.guest.guest_group, "Kantor");
    assert.equal(again.guest.pax_allowed, 4);
  });
});

describe("undo", () => {
  it("puts the count back exactly where it was", async () => {
    const { user, wedding, guest } = await seed();
    const before = await liveStats(wedding.id, { userId: user.id });

    await checkIn({
      scannerWeddingId: wedding.id, token: guest.token, pax: 3, clientEventId: randomUUID(),
    });
    await undoCheckIn({ scannerWeddingId: wedding.id, guestId: guest.id });

    const after_ = await liveStats(wedding.id, { userId: user.id });
    assert.deepEqual(
      { arrived: after_.arrived, pax: after_.pax, recent: after_.recent.length },
      { arrived: before.arrived, pax: before.pax, recent: before.recent.length },
    );
  });

  it("lets the guest check in again afterwards", async () => {
    const { wedding, guest } = await seed();
    await checkIn({
      scannerWeddingId: wedding.id, token: guest.token, pax: 1, clientEventId: randomUUID(),
    });
    await undoCheckIn({ scannerWeddingId: wedding.id, guestId: guest.id });
    const redo = await checkIn({
      scannerWeddingId: wedding.id, token: guest.token, pax: 1, clientEventId: randomUUID(),
    });
    assert.equal(redo.status, "ok");
  });
});

describe("entitlement", () => {
  it("refuses check-in when the guest book was never bought", async () => {
    const { wedding, guest } = await seed({ paid: false });
    await assert.rejects(
      () => checkIn({
        scannerWeddingId: wedding.id, token: guest.token, pax: 2, clientEventId: randomUUID(),
      }),
      /BELUM_DIBELI:guestbook/,
    );
  });

  it("stops accepting once the order has expired", async () => {
    const { user, wedding, guest } = await seed();
    await asUser(user.id, (tx) => tx`
      update orders set expires_at = now() - interval '1 day'
       where wedding_id = ${wedding.id} and product = 'guestbook'`);

    await assert.rejects(
      () => checkIn({
        scannerWeddingId: wedding.id, token: guest.token, pax: 2, clientEventId: randomUUID(),
      }),
      /BELUM_DIBELI:guestbook/,
    );
  });
});

describe("scanner links", () => {
  it("resolves a fresh link to its wedding", async () => {
    const { user, wedding } = await seed();
    const { token } = await createScannerLink(user.id, wedding.id, "Meja Depan", 8);
    assert.deepEqual(await resolveScannerLink(token), {
      weddingId: wedding.id,
      label: "Meja Depan",
    });
  });

  it("resolves an expired link to null", async () => {
    const { user, wedding } = await seed();
    const { id, token } = await createScannerLink(user.id, wedding.id, "Meja 1", 1);
    await asUser(user.id, (tx) => tx`
      update scanner_links set expires_at = now() - interval '1 minute' where id = ${id}`);
    assert.equal(await resolveScannerLink(token), null);
  });

  it("resolves a revoked link to null", async () => {
    const { user, wedding } = await seed();
    const { id, token } = await createScannerLink(user.id, wedding.id, "Meja 2", 8);
    await revokeScannerLink(user.id, id);
    assert.equal(await resolveScannerLink(token), null);
  });

  it("resolves an unknown token to null", async () => {
    assert.equal(await resolveScannerLink("bukan-token"), null);
    assert.equal(await resolveScannerLink(""), null);
  });
});

describe("scanner authority", () => {
  it("reads guests and writes check-ins but sees no planner or payment data", async () => {
    const { user, wedding, guest } = await seed();
    await asUser(user.id, (tx) => tx`
      insert into planner_items (wedding_id, kind, title, amount_planned)
      values (${wedding.id}, 'budget', 'Katering', 80000000)`);

    const guests = await asScanner(wedding.id, (tx) =>
      tx`select id from guests where wedding_id = ${wedding.id}`);
    assert.equal(guests.length, 1, "the desk must be able to look guests up");

    const done = await checkIn({
      scannerWeddingId: wedding.id, token: guest.token, pax: 2, clientEventId: randomUUID(),
    });
    assert.equal(done.status, "ok");

    const planner = await asScanner(wedding.id, (tx) =>
      tx`select id from planner_items where wedding_id = ${wedding.id}`);
    const orders = await asScanner(wedding.id, (tx) =>
      tx`select id from orders where wedding_id = ${wedding.id}`);
    assert.equal(planner.length, 0, "a receptionist must not see the budget");
    assert.equal(orders.length, 0, "a receptionist must not see the payments");
  });

  it("cannot touch a guest belonging to another wedding", async () => {
    const a = await seed();
    const b = await seed();
    await assert.rejects(
      () => checkIn({
        scannerWeddingId: b.wedding.id, token: a.guest.token, pax: 1,
        clientEventId: randomUUID(),
      }),
      /TAMU_TIDAK_DITEMUKAN/,
    );
  });
});

describe("desk fallbacks", () => {
  it("finds a guest by part of their name", async () => {
    const { wedding } = await seed();
    const found = await findByName(wedding.id, "santo");
    assert.equal(found.length, 1);
    assert.equal(found[0]!.name, "Budi Santoso");
    assert.equal((await findByName(wedding.id, "x")).length, 0);
  });

  it("registers and checks in a walk-in guest in one step", async () => {
    const { user, wedding } = await seed();
    const guest = await walkIn(wedding.id, "  Tamu Dadakan Sekali  ", 3);

    assert.equal(guest.name, "Tamu Dadakan Sekali");
    assert.notEqual(guest.checked_in_at, null);
    assert.equal(guest.checked_in_pax, 3);

    const stats = await liveStats(wedding.id, { userId: user.id });
    assert.equal(stats.invited, 2, "the walk-in joins the same guest list");
    assert.equal(stats.arrived, 1);
    assert.equal(stats.recent[0]!.name, "Tamu Dadakan Sekali");
  });

  it("refuses a walk-in when the guest book was never bought", async () => {
    const { wedding } = await seed({ paid: false });
    await assert.rejects(() => walkIn(wedding.id, "Tamu", 1), /BELUM_DIBELI:guestbook/);
  });

  it("rejects a nonsense pax count", async () => {
    const { wedding, guest } = await seed();
    await assert.rejects(
      () => checkIn({
        scannerWeddingId: wedding.id, token: guest.token, pax: -1,
        clientEventId: randomUUID(),
      }),
      /PAX_TIDAK_VALID/,
    );
  });
});
