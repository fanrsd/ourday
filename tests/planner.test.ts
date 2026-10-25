// Planner behaviour, through the same functions the pages call, against real
// Postgres. One table holds seven features, so kind leakage and double-counted
// totals are the failures most likely to happen — both are pinned here.
import { test, after } from "node:test";
import assert from "node:assert/strict";

import { newCouple, asUser, closeDb } from "./helpers.ts";
import {
  KINDS,
  budgetTotals,
  chooseVendor,
  createItem,
  daysUntil,
  deleteItem,
  dueFromDate,
  dueFromDateTime,
  ensureRundownShare,
  listItems,
  plannerSummary,
  reorderItems,
  revokeRundownShare,
  rundownByShareToken,
  saveBasics,
  savingsProgress,
  seedDefaultTodos,
  toggleDone,
  updateItem,
} from "../lib/planner.ts";
import { inputDate, inputDateTime } from "../app/(app)/rencana/format.ts";

after(closeDb);

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

test("what the couple types into a form is what the form reads back", async () => {
  const { user, wedding } = await newCouple();

  // A rundown typed as 08:00 must come back as 08:00, whatever timezone the
  // server's clock happens to be set to. Indonesia is the only audience.
  const akad = await createItem(user.id, wedding.id, "rundown", {
    title: "Akad nikah",
    dueAt: dueFromDateTime("2027-06-12T08:00"),
  });
  const kirim = await createItem(user.id, wedding.id, "todo", {
    title: "Kirim undangan",
    dueAt: dueFromDate("2027-02-14"),
  });

  const rundown = (await listItems(user.id, wedding.id, "rundown")).find(
    (i) => i.id === akad,
  )!;
  assert.equal(inputDateTime(rundown.due_at), "2027-06-12T08:00");

  const todo = (await listItems(user.id, wedding.id, "todo")).find(
    (i) => i.id === kirim,
  )!;
  assert.equal(inputDate(todo.due_at), "2027-02-14");
});

test("budget totals take a pos's sub-items instead of counting them twice", async () => {
  const { user, wedding } = await newCouple();

  // A parent the couple also filled in a number on: the sub-items win, so the
  // 999 below must never reach the total.
  const gedung = await createItem(user.id, wedding.id, "budget", {
    title: "Gedung",
    amountPlanned: 999_000_000,
    amountActual: 999_000_000,
  });
  await createItem(user.id, wedding.id, "budget", {
    title: "Sewa gedung",
    parentId: gedung,
    amountPlanned: 40_000_000,
    amountActual: 42_000_000,
  });
  await createItem(user.id, wedding.id, "budget", {
    title: "Dekorasi",
    parentId: gedung,
    amountPlanned: 15_000_000,
    amountActual: 14_000_000,
  });

  // A leaf: its own amount counts.
  await createItem(user.id, wedding.id, "budget", {
    title: "Katering",
    amountPlanned: 60_000_000,
    amountActual: 58_500_000,
  });
  // A leaf with no numbers at all must not turn the sums into null.
  await createItem(user.id, wedding.id, "budget", { title: "Souvenir" });

  assert.deepEqual(await budgetTotals(user.id, wedding.id), {
    planned: 40_000_000 + 15_000_000 + 60_000_000,
    actual: 42_000_000 + 14_000_000 + 58_500_000,
  });

  // And the list nests the sub-items under their pos rather than flattening
  // them next to it, which is what makes the total legible on screen.
  const list = await listItems(user.id, wedding.id, "budget");
  assert.equal(list.length, 3);
  assert.equal(list.find((i) => i.id === gedung)!.children.length, 2);
});

test("required-per-month tracks the deadline and survives one that has passed", async () => {
  const { user, wedding } = await newCouple();

  // 300 days out, 10 months of runway by the planner's 30-day month.
  const onTrack = await createItem(user.id, wedding.id, "tabungan", {
    title: "Tabungan resepsi",
    amountPlanned: 120_000_000,
    dueAt: inDays(300),
  });
  await createItem(user.id, wedding.id, "tabungan", {
    title: "Setoran Januari",
    parentId: onTrack,
    amountActual: 20_000_000,
  });
  await createItem(user.id, wedding.id, "tabungan", {
    title: "Setoran Februari",
    parentId: onTrack,
    amountActual: 10_000_000,
  });

  const past = await createItem(user.id, wedding.id, "tabungan", {
    title: "Tabungan seserahan",
    amountPlanned: 8_000_000,
    dueAt: inDays(-5),
  });
  await createItem(user.id, wedding.id, "tabungan", {
    title: "Setoran awal",
    parentId: past,
    amountActual: 3_000_000,
  });

  const noDeadline = await createItem(user.id, wedding.id, "tabungan", {
    title: "Tabungan bulan madu",
    amountPlanned: 5_000_000,
  });

  const reached = await createItem(user.id, wedding.id, "tabungan", {
    title: "Tabungan cincin",
    amountPlanned: 9_000_000,
    dueAt: inDays(-1),
  });
  await createItem(user.id, wedding.id, "tabungan", {
    title: "Setoran lunas",
    parentId: reached,
    amountActual: 9_500_000,
  });

  const by = new Map((await savingsProgress(user.id, wedding.id)).map((s) => [s.id, s]));

  const a = by.get(onTrack)!;
  assert.equal(a.saved, 30_000_000);
  assert.equal(a.remaining, 90_000_000);
  assert.equal(a.monthsLeft, 10);
  assert.equal(a.perMonth, 9_000_000);

  // Past deadline: no months left, and the answer is the whole remainder now —
  // not Infinity and not NaN.
  const b = by.get(past)!;
  assert.equal(b.monthsLeft, 0);
  assert.equal(b.perMonth, 5_000_000);
  assert.ok(Number.isFinite(b.perMonth));

  const c = by.get(noDeadline)!;
  assert.equal(c.monthsLeft, 0);
  assert.equal(c.perMonth, 5_000_000);

  // Oversaved past its deadline: nothing left to set aside, never a negative.
  const d = by.get(reached)!;
  assert.equal(d.remaining, 0);
  assert.equal(d.perMonth, 0);
});

test("choosing a vendor copies its quote into the budget exactly once", async () => {
  const { user, wedding } = await newCouple();

  const vendor = await createItem(user.id, wedding.id, "vendor", {
    title: "Dapur Bu Ani",
    amountPlanned: 62_500_000,
    meta: { category: "Katering", contact: "0812-3456-7890" },
  });
  await createItem(user.id, wedding.id, "vendor", {
    title: "Katering Sari Rasa",
    amountPlanned: 71_000_000,
    meta: { category: "Katering" },
  });

  const first = await chooseVendor(user.id, vendor);
  assert.equal(first.alreadyChosen, false);

  // Impatient second click.
  const second = await chooseVendor(user.id, vendor);
  assert.equal(second.alreadyChosen, true);
  assert.equal(second.budgetItemId, first.budgetItemId);

  const budget = await listItems(user.id, wedding.id, "budget");
  assert.equal(budget.length, 1);
  assert.equal(budget[0]!.title, "Katering: Dapur Bu Ani");
  assert.equal(budget[0]!.amount_planned, 62_500_000);
  assert.deepEqual(await budgetTotals(user.id, wedding.id), {
    planned: 62_500_000,
    actual: 0,
  });

  const chosen = (await listItems(user.id, wedding.id, "vendor")).find(
    (v) => v.id === vendor,
  )!;
  assert.equal(chosen.meta.chosen, true);

  // A one-time copy, not a live link: re-quoting the vendor leaves the budget
  // row where the couple put it.
  await updateItem(user.id, vendor, { amountPlanned: 80_000_000 });
  const after = await listItems(user.id, wedding.id, "budget");
  assert.equal(after[0]!.amount_planned, 62_500_000);
  // ...and editing the vendor did not wipe the internal meta keys.
  const reread = (await listItems(user.id, wedding.id, "vendor")).find(
    (v) => v.id === vendor,
  )!;
  assert.equal(reread.meta.copiedBudgetId, first.budgetItemId);
  assert.equal(reread.meta.category, "Katering");
});

test("one table, seven lists: a row never shows up under another kind", async () => {
  const { user, wedding } = await newCouple();

  for (const kind of KINDS) {
    await createItem(user.id, wedding.id, kind, { title: `baris ${kind}` });
  }

  for (const kind of KINDS) {
    const rows = await listItems(user.id, wedding.id, kind);
    assert.equal(rows.length, 1, `${kind} harus punya tepat satu baris`);
    assert.equal(rows[0]!.title, `baris ${kind}`);
    assert.equal(rows[0]!.kind, kind);
  }

  await assert.rejects(
    // @ts-expect-error deliberately not a kind: the enum check lives in the app.
    () => listItems(user.id, wedding.id, "anggaran"),
    /Jenis daftar tidak dikenal/,
  );
  await assert.rejects(
    // @ts-expect-error same, on the write path.
    () => createItem(user.id, wedding.id, "drop table", { title: "x" }),
    /Jenis daftar tidak dikenal/,
  );
});

test("meta is validated per kind: unknown keys never reach the row", async () => {
  const { user, wedding } = await newCouple();

  const todo = await createItem(user.id, wedding.id, "todo", {
    title: "Tes rias",
    meta: { assignee: "  Dinda  ", pic: "bukan milik todo", paid: true },
  });
  const [row] = await listItems(user.id, wedding.id, "todo");
  assert.deepEqual(row!.meta, { assignee: "Dinda" });

  // Clearing is explicit: an empty value blanks it, an absent key leaves it.
  await updateItem(user.id, todo, { title: "Tes rias pagi" });
  assert.equal((await listItems(user.id, wedding.id, "todo"))[0]!.meta.assignee, "Dinda");
  await updateItem(user.id, todo, { meta: { assignee: "" } });
  assert.equal((await listItems(user.id, wedding.id, "todo"))[0]!.meta.assignee, "");

  // A form post cannot forge the keys this module owns.
  await updateItem(user.id, todo, {
    meta: { chosen: true, copiedBudgetId: "x", shareToken: "y" },
  });
  const final = (await listItems(user.id, wedding.id, "todo"))[0]!;
  assert.equal(final.meta.chosen, undefined);
  assert.equal(final.meta.shareToken, undefined);

  await assert.rejects(
    () => createItem(user.id, wedding.id, "todo", { title: "   " }),
    /Judul tidak boleh kosong/,
  );
});

test("seedDefaultTodos fills an empty checklist once and dates it from the wedding", async () => {
  const { user, wedding } = await newCouple();
  await saveBasics(user.id, wedding.id, {
    groomName: "Rizky",
    brideName: "Dinda",
    eventDate: "2027-06-12",
  });

  const seeded = await seedDefaultTodos(user.id, wedding.id);
  assert.ok(seeded >= 11, "daftar bawaan harus mencakup semua pos umum");

  const todos = await listItems(user.id, wedding.id, "todo");
  assert.equal(todos.length, seeded);
  const titles = todos.map((t) => t.title.toLowerCase()).join(" | ");
  for (const topic of [
    "kua",
    "gedung",
    "katering",
    "dokumentasi",
    "busana",
    "rias",
    "undangan",
    "seserahan",
    "souvenir",
    "mc",
    "hiburan",
  ]) {
    assert.ok(titles.includes(topic), `daftar bawaan harus menyebut ${topic}`);
  }

  // Every deadline counts back from the wedding date, so all of them land before
  // it and in the order the seed lists them.
  const due = todos.map((t) => t.due_at!);
  assert.ok(due.every(Boolean), "setiap tugas bawaan punya tenggat");
  assert.ok(due.every((d) => d < "2027-06-12"));
  assert.deepEqual(due, [...due].sort());

  // Re-running is a no-op, and it does not touch what the couple has since done.
  await toggleDone(user.id, todos[0]!.id);
  assert.equal(await seedDefaultTodos(user.id, wedding.id), 0);
  const again = await listItems(user.id, wedding.id, "todo");
  assert.equal(again.length, seeded);
  assert.ok(again.find((t) => t.id === todos[0]!.id)!.done_at);

  // Still a no-op when only one todo is left, because "empty" means zero rows.
  for (const t of again.slice(1)) await deleteItem(user.id, t.id);
  assert.equal(await seedDefaultTodos(user.id, wedding.id), 0);
  assert.equal((await listItems(user.id, wedding.id, "todo")).length, 1);
});

test("a seeded checklist still works before the couple knows their date", async () => {
  const { user, wedding } = await newCouple();
  assert.ok((await seedDefaultTodos(user.id, wedding.id)) > 0);
  const todos = await listItems(user.id, wedding.id, "todo");
  assert.ok(todos.every((t) => t.due_at === null));
});

test("reordering swaps positions and the list reads back in the new order", async () => {
  const { user, wedding } = await newCouple();
  const ids = [];
  for (const title of ["Gedung", "Katering", "Dokumentasi"]) {
    ids.push(await createItem(user.id, wedding.id, "budget", { title }));
  }
  assert.deepEqual(
    (await listItems(user.id, wedding.id, "budget")).map((i) => i.title),
    ["Gedung", "Katering", "Dokumentasi"],
  );

  // What the up button does: swap a row with the one above it.
  const moved = [ids[0]!, ids[2]!, ids[1]!];
  await reorderItems(user.id, wedding.id, "budget", moved);
  assert.deepEqual(
    (await listItems(user.id, wedding.id, "budget")).map((i) => i.title),
    ["Gedung", "Dokumentasi", "Katering"],
  );
});

test("rundown reads in clock order however it was typed in", async () => {
  const { user, wedding } = await newCouple();
  await createItem(user.id, wedding.id, "rundown", {
    title: "Resepsi",
    dueAt: "2027-06-12T11:00:00+07:00",
  });
  await createItem(user.id, wedding.id, "rundown", {
    title: "Akad nikah",
    dueAt: "2027-06-12T08:00:00+07:00",
  });
  assert.deepEqual(
    (await listItems(user.id, wedding.id, "rundown")).map((i) => i.title),
    ["Akad nikah", "Resepsi"],
  );
});

test("the rundown share link reads without an account, and revoking kills it", async () => {
  const { user, wedding } = await newCouple();
  await saveBasics(user.id, wedding.id, {
    groomName: "Rizky",
    brideName: "Dinda",
    eventDate: "2027-06-12",
  });

  // Nothing to share yet.
  assert.equal(await ensureRundownShare(user.id, wedding.id), null);

  await createItem(user.id, wedding.id, "rundown", {
    title: "Akad nikah",
    note: "Keluarga inti sudah duduk 15 menit sebelumnya",
    dueAt: "2027-06-12T08:00:00+07:00",
    meta: { pic: "Pak Ustadz" },
  });
  await createItem(user.id, wedding.id, "rundown", {
    title: "Resepsi",
    dueAt: "2027-06-12T11:00:00+07:00",
    meta: { pic: "MC Yudha" },
  });

  const token = await ensureRundownShare(user.id, wedding.id);
  assert.ok(token);
  // Asking twice hands out the same link, not a second one.
  assert.equal(await ensureRundownShare(user.id, wedding.id), token);

  const shared = await rundownByShareToken(token!);
  assert.ok(shared);
  assert.equal(shared!.bride_name, "Dinda");
  assert.deepEqual(
    shared!.items.map((i) => i.title),
    ["Akad nikah", "Resepsi"],
  );
  assert.equal(shared!.items[0]!.meta.pic, "Pak Ustadz");
  assert.match(shared!.items[0]!.note, /Keluarga inti/);

  assert.equal(await rundownByShareToken("bukan-token"), null);
  assert.equal(await rundownByShareToken(""), null);

  // The link is read-only: it exposes the rundown and nothing else about the
  // wedding, and it cannot be used to reach the budget.
  await createItem(user.id, wedding.id, "budget", {
    title: "Katering",
    amountPlanned: 60_000_000,
  });
  assert.equal(JSON.stringify(shared).includes("60000000"), false);

  await revokeRundownShare(user.id, wedding.id);
  assert.equal(await rundownByShareToken(token!), null);
  assert.equal(await rundownShareTokenIsGone(user.id, wedding.id), true);
});

async function rundownShareTokenIsGone(userId: string, weddingId: string) {
  const rows = await listItems(userId, weddingId, "rundown");
  return rows.every((r) => r.meta.shareToken === undefined);
}

test("the summary answers story 4 in one call", async () => {
  const { user, wedding } = await newCouple();
  await saveBasics(user.id, wedding.id, {
    groomName: "Rizky",
    brideName: "Dinda",
    eventDate: "2027-06-12",
  });

  await createItem(user.id, wedding.id, "budget", {
    title: "Gedung",
    amountPlanned: 40_000_000,
    amountActual: 41_000_000,
  });
  const late = await createItem(user.id, wedding.id, "todo", {
    title: "Bayar DP gedung",
    dueAt: inDays(-3),
  });
  await createItem(user.id, wedding.id, "todo", {
    title: "Tes makanan",
    dueAt: inDays(3),
  });
  await createItem(user.id, wedding.id, "todo", {
    title: "Fitting busana",
    dueAt: inDays(60),
  });
  await createItem(user.id, wedding.id, "tabungan", {
    title: "Tabungan resepsi",
    amountPlanned: 120_000_000,
    dueAt: inDays(300),
  });

  let s = await plannerSummary(user.id, wedding.id);
  assert.equal(s.eventDate, "2027-06-12");
  assert.equal(s.daysLeft, daysUntil("2027-06-12"));
  assert.deepEqual(s.budget, { planned: 40_000_000, actual: 41_000_000 });
  assert.equal(s.overdueTodos, 1);
  assert.equal(s.dueThisWeek, 2); // the overdue one is also still to be done
  assert.equal(s.openTodos, 3);
  assert.equal(s.savings.length, 1);
  assert.equal(s.savings[0]!.perMonth, 12_000_000);

  // Ticking the late task off clears it from both counts.
  await toggleDone(user.id, late);
  s = await plannerSummary(user.id, wedding.id);
  assert.equal(s.overdueTodos, 0);
  assert.equal(s.openTodos, 2);
});

test("days remaining counts whole days and goes negative after the wedding", () => {
  const now = new Date("2026-08-24T20:00:00+07:00");
  assert.equal(daysUntil("2026-08-24", now), 0);
  assert.equal(daysUntil("2026-08-25", now), 1);
  assert.equal(daysUntil("2026-08-20", now), -4);
  // Late at night in WIB is still the same day, whatever UTC thinks.
  assert.equal(daysUntil("2026-08-24", new Date("2026-08-24T23:30:00+07:00")), 0);
});

test("dates land on the day the couple picked, not the day before", async () => {
  const { user, wedding } = await newCouple();
  const id = await createItem(user.id, wedding.id, "todo", {
    title: "Kirim undangan",
    dueAt: dueFromDate("2027-02-14"),
  });
  const [row] = await listItems(user.id, wedding.id, "todo");
  assert.equal(row!.id, id);
  const shown = new Date(row!.due_at!).toLocaleDateString("sv-SE", {
    timeZone: "Asia/Jakarta",
  });
  assert.equal(shown, "2027-02-14");
});

test("another couple can neither read nor write your planner", async () => {
  const a = await newCouple();
  const b = await newCouple();

  const mine = await createItem(a.user.id, a.wedding.id, "budget", {
    title: "Gedung",
    amountPlanned: 40_000_000,
  });
  const sub = await createItem(a.user.id, a.wedding.id, "budget", {
    title: "Dekorasi",
    parentId: mine,
    amountPlanned: 15_000_000,
  });
  const target = await createItem(a.user.id, a.wedding.id, "tabungan", {
    title: "Tabungan resepsi",
    amountPlanned: 120_000_000,
    dueAt: inDays(300),
  });
  const vendorRow = await createItem(a.user.id, a.wedding.id, "vendor", {
    title: "Dapur Bu Ani",
    amountPlanned: 62_500_000,
  });

  // Reads come back empty rather than forbidden: RLS filters, it does not leak
  // the existence of the row.
  for (const kind of KINDS) {
    assert.deepEqual(await listItems(b.user.id, a.wedding.id, kind), []);
  }
  assert.deepEqual(await budgetTotals(b.user.id, a.wedding.id), {
    planned: 0,
    actual: 0,
  });
  assert.deepEqual(await savingsProgress(b.user.id, a.wedding.id), []);
  assert.deepEqual((await plannerSummary(b.user.id, a.wedding.id)).savings, []);

  // Writes by id fail even though the id is a valid one.
  await assert.rejects(() => updateItem(b.user.id, mine, { title: "dibajak" }));
  await assert.rejects(() => updateItem(b.user.id, sub, { amountPlanned: 1 }));
  await assert.rejects(() => deleteItem(b.user.id, sub));
  await assert.rejects(() => toggleDone(b.user.id, mine));
  await assert.rejects(() => chooseVendor(b.user.id, vendorRow));
  await assert.rejects(() =>
    saveBasics(b.user.id, a.wedding.id, {
      groomName: "x",
      brideName: "y",
      eventDate: null,
    }),
  );
  // Hanging a row off someone else's parent is refused too.
  await assert.rejects(() =>
    createItem(b.user.id, b.wedding.id, "budget", { title: "titipan", parentId: mine }),
  );
  await assert.rejects(() =>
    createItem(b.user.id, a.wedding.id, "budget", { title: "titipan" }),
  );

  // Reordering someone else's list silently matches nothing, so it cannot be
  // used to scramble it.
  await reorderItems(b.user.id, a.wedding.id, "budget", [mine, sub]);
  await reorderItems(b.user.id, b.wedding.id, "budget", [mine, sub]);

  // Everything above left the real owner's data exactly as it was.
  const still = await listItems(a.user.id, a.wedding.id, "budget");
  assert.equal(still.length, 1);
  assert.equal(still[0]!.title, "Gedung");
  assert.equal(still[0]!.children.length, 1);
  assert.deepEqual(await budgetTotals(a.user.id, a.wedding.id), {
    planned: 15_000_000,
    actual: 0,
  });
  assert.equal((await savingsProgress(a.user.id, a.wedding.id))[0]!.id, target);
});

test("a partner added to the wedding gets the same planner", async () => {
  const a = await newCouple();
  const partner = (await newCouple()).user;

  await createItem(a.user.id, a.wedding.id, "budget", {
    title: "Gedung",
    amountPlanned: 40_000_000,
  });

  // Story 3: the couple works on one copy, so membership is the whole grant.
  await asUser(a.user.id, (tx) => tx`
    insert into wedding_members (wedding_id, user_id, role)
    values (${a.wedding.id}, ${partner.id}, 'editor')`);

  const seen = await listItems(partner.id, a.wedding.id, "budget");
  assert.equal(seen.length, 1);
  await updateItem(partner.id, seen[0]!.id, { amountActual: 41_000_000 });
  assert.deepEqual(await budgetTotals(a.user.id, a.wedding.id), {
    planned: 40_000_000,
    actual: 41_000_000,
  });
});
