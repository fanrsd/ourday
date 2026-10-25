import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { signSession, verifySession } from "../lib/session.ts";
import { requestLogin, consumeLogin } from "../lib/login.ts";
import { normalisePhone, waLink } from "../lib/phone.ts";
import { ownsProduct } from "../lib/products.ts";
import { ensureWedding } from "../lib/wedding.ts";
import { asNobody, asUser, closeDb, grantProduct, newCouple, newUser } from "./helpers.ts";

after(closeDb);

describe("session cookie", () => {
  it("round-trips the user id", () => {
    const uid = randomUUID();
    assert.equal(verifySession(signSession(uid)), uid);
  });

  it("rejects a tampered payload", () => {
    const token = signSession(randomUUID());
    const [body, mac] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ uid: randomUUID(), exp: Date.now() + 1e6 }))
      .toString("base64url");
    assert.equal(verifySession(`${forged}.${mac}`), null);
    assert.equal(verifySession(`${body}.${mac!.slice(0, -2)}xx`), null);
  });

  it("rejects an expired session", () => {
    assert.equal(verifySession(signSession(randomUUID(), -1)), null);
  });

  it("rejects junk", () => {
    for (const junk of ["", "abc", "a.b", "...."]) assert.equal(verifySession(junk), null);
  });
});

describe("magic link", () => {
  it("is single use", async () => {
    const email = `t-${randomUUID()}@example.test`;
    const token = new URL(await requestLogin(email)).searchParams.get("token")!;

    const first = await consumeLogin(token);
    assert.ok(first, "first use should log in");
    assert.equal(await consumeLogin(token), null, "second use must fail");
  });

  it("returns the same user for the same email", async () => {
    const email = `t-${randomUUID()}@example.test`;
    const a = await consumeLogin(new URL(await requestLogin(email)).searchParams.get("token")!);
    const b = await consumeLogin(new URL(await requestLogin(email)).searchParams.get("token")!);
    assert.equal(a, b);
  });

  it("rejects an unknown token", async () => {
    assert.equal(await consumeLogin("not-a-real-token"), null);
  });

  it("rate limits repeated requests for one address", async () => {
    const email = `t-${randomUUID()}@example.test`;
    for (let i = 0; i < 5; i++) await requestLogin(email);
    await assert.rejects(() => requestLogin(email), /Terlalu banyak/);
  });
});

describe("row level security", () => {
  it("hides one couple's wedding from another", async () => {
    const a = await newCouple();
    const b = await newCouple();

    const seen = await asUser(b.user.id, (tx) =>
      tx`select id from weddings where id = ${a.wedding.id}`);
    assert.equal(seen.length, 0, "B must not see A's wedding");
  });

  it("hides one couple's planner rows from another", async () => {
    const a = await newCouple();
    const b = await newCouple();
    await asUser(a.user.id, (tx) => tx`
      insert into planner_items (wedding_id, kind, title, amount_planned)
      values (${a.wedding.id}, 'budget', 'Gedung', 50000000)`);

    const mine = await asUser(a.user.id, (tx) =>
      tx`select id from planner_items where wedding_id = ${a.wedding.id}`);
    const theirs = await asUser(b.user.id, (tx) =>
      tx`select id from planner_items where wedding_id = ${a.wedding.id}`);

    assert.equal(mine.length, 1);
    assert.equal(theirs.length, 0);
  });

  it("refuses writes into another couple's wedding", async () => {
    const a = await newCouple();
    const b = await newCouple();
    await assert.rejects(
      () => asUser(b.user.id, (tx) => tx`
        insert into planner_items (wedding_id, kind, title)
        values (${a.wedding.id}, 'todo', 'sabotase')`),
      /row-level security/i,
    );
  });

  it("gives an invited partner the same access as the owner", async () => {
    const a = await newCouple();
    const partner = await newUser();
    await asUser(a.user.id, (tx) => tx`
      insert into wedding_members (wedding_id, user_id, role)
      values (${a.wedding.id}, ${partner.id}, 'editor')`);

    const seen = await asUser(partner.id, (tx) =>
      tx`select id from weddings where id = ${a.wedding.id}`);
    assert.equal(seen.length, 1);
  });

  it("shows nothing at all to an anonymous caller", async () => {
    const a = await newCouple();
    const seen = await asNobody((tx) =>
      tx`select id from weddings where id = ${a.wedding.id}`);
    assert.equal(seen.length, 0);
  });

  it("reuses the existing wedding instead of creating a second", async () => {
    const user = await newUser();
    const first = await ensureWedding(user.id);
    const second = await ensureWedding(user.id);
    assert.equal(first.id, second.id);
  });
});

describe("entitlements", () => {
  it("are absent until an order is paid", async () => {
    const { user, wedding } = await newCouple();
    const before = await asUser(user.id, (tx) => ownsProduct(tx, wedding.id, "invitation"));
    assert.equal(before, false);

    await grantProduct(user.id, wedding.id, "invitation");
    const after = await asUser(user.id, (tx) => ownsProduct(tx, wedding.id, "invitation"));
    assert.equal(after, true);
  });

  it("do not leak across products", async () => {
    const { user, wedding } = await newCouple();
    await grantProduct(user.id, wedding.id, "invitation");
    const guestbook = await asUser(user.id, (tx) => ownsProduct(tx, wedding.id, "guestbook"));
    assert.equal(guestbook, false);
  });

  it("lapse once the order expires", async () => {
    const { user, wedding } = await newCouple();
    await grantProduct(user.id, wedding.id, "invitation");
    await asUser(user.id, (tx) => tx`
      update orders set expires_at = now() - interval '1 day'
       where wedding_id = ${wedding.id}`);
    const still = await asUser(user.id, (tx) => ownsProduct(tx, wedding.id, "invitation"));
    assert.equal(still, false);
  });
});

describe("phone normalisation", () => {
  it("collapses every Indonesian format onto one number", () => {
    for (const raw of ["081234567890", "0812-3456-7890", "+62 812 3456 7890",
                       "62812 3456 7890", "8123456789 0"]) {
      assert.equal(normalisePhone(raw), "6281234567890", `failed for ${raw}`);
    }
  });

  it("rejects what is not a phone number", () => {
    for (const raw of ["", null, undefined, "abc", "62123", "6281234567890123456"]) {
      assert.equal(normalisePhone(raw), null, `should reject ${raw}`);
    }
  });

  it("builds a wa.me link with the message escaped", () => {
    const link = waLink("6281234567890", "Halo Budi & keluarga");
    assert.equal(link, "https://wa.me/6281234567890?text=Halo%20Budi%20%26%20keluarga");
  });
});
