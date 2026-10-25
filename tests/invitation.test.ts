import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import module from "node:module";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { toResult } from "../lib/actions.ts";
import { normaliseContent, PALETTES, type InvitationContent } from "../lib/invitation-content.ts";
import {
  getOrCreateInvitation,
  getPublicInvitation,
  isExpired,
  publishBlockers,
  publishInvitation,
  updateInvitation,
} from "../lib/invitations.ts";
import { TEMPLATES } from "../lib/templates/registry.ts";
import { asNobody, asUser, closeDb, grantProduct, newCouple } from "./helpers.ts";

after(closeDb);

/**
 * Node's type stripping handles `.ts` but refuses `.tsx` outright — JSX is a
 * transform, not an erasure. The templates are the thing this product is sold
 * on and they read untrusted jsonb, so "does it throw on a half-filled
 * document" has to be a real test rather than a promise.
 *
 * TypeScript is already a devDependency, so a ~15 line loader hook buys the
 * whole render path with no new package and no build step. The hooks module is a
 * data: URL, which is why the one import inside it is an absolute file URL.
 *
 * ponytail: the day this repo gains a bundler-based test runner, delete this and
 * import the templates normally.
 */
module.register(
  "data:text/javascript," +
    encodeURIComponent(`
import ts from ${JSON.stringify(import.meta.resolve("typescript"))};
import { readFile } from "node:fs/promises";
export async function resolve(spec, ctx, next) {
  if (spec.endsWith(".tsx")) {
    return {
      url: spec.startsWith(".") ? new URL(spec, ctx.parentURL).href : spec,
      format: "module",
      shortCircuit: true,
    };
  }
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (url.endsWith(".tsx")) {
    const src = await readFile(new URL(url), "utf8");
    const out = ts.transpileModule(src, {
      fileName: url,
      compilerOptions: { jsx: 4, target: 9, module: 99 },
    });
    return { format: "module", source: out.outputText, shortCircuit: true };
  }
  return next(url, ctx);
}
`),
);

const { TEMPLATE_COMPONENTS } = await import("../lib/templates/index.ts");

// ------------------------------------------------------------------ fixtures --

/** Everything filled in, the way a couple's invitation looks the day they send it. */
const FULL = normaliseContent({
  couple: {
    groom: {
      fullName: "Dimas Anggara Putra",
      nickName: "Dimas",
      parents: "Bapak Ahmad Suryana & Ibu Siti Aminah",
      photo: "/media/00000000-0000-4000-8000-000000000001.jpg",
      instagram: "@dimasanggara",
    },
    bride: {
      fullName: "Sari Puspita Dewi",
      nickName: "Sari",
      parents: "Bapak Budi Hartono & Ibu Rina Wulandari",
      photo: "/media/00000000-0000-4000-8000-000000000002.jpg",
    },
    coverPhoto: "/media/00000000-0000-4000-8000-000000000003.jpg",
  },
  events: [
    {
      name: "Akad Nikah",
      startsAt: "2027-06-12T08:00",
      endsAt: "2027-06-12T10:00",
      venue: "Masjid Raya Al-Ikhlas",
      address: "Jl. Merdeka No. 1, Bandung",
      mapsUrl: "https://maps.app.goo.gl/contoh",
    },
    {
      name: "Resepsi",
      startsAt: "2027-06-12T11:00",
      venue: "Gedung Bina Karya",
      address: "Jl. Asia Afrika No. 5, Bandung",
    },
  ],
  story: [
    { date: "2019-03-02", title: "Pertama bertemu", body: "Di kelas pagi yang sama." },
    { date: "2024-11-17", title: "Melamar", body: "Di depan orang tua, gugup sekali." },
  ],
  gallery: [
    "/media/00000000-0000-4000-8000-000000000004.jpg",
    "/media/00000000-0000-4000-8000-000000000005.jpg",
    "/media/00000000-0000-4000-8000-000000000006.jpg",
  ],
  video: "https://youtu.be/dQw4w9WgXcQ",
  gifts: {
    banks: [{ bank: "BCA", number: "1234567890", holder: "Sari Puspita Dewi" }],
    ewallets: [{ bank: "GoPay", number: "081234567890", holder: "Dimas Anggara" }],
    shippingAddress: "Jl. Melati No. 9, Bandung 40123",
  },
  stream: "https://www.youtube.com/live/abcdefghijk",
  music: "/media/00000000-0000-4000-8000-000000000007.mp3",
});

/**
 * The document a real draft actually looks like halfway through: missing keys,
 * wrong types, dates that are not dates, and a `javascript:` url someone pasted.
 */
const HALF = normaliseContent({
  couple: { groom: { fullName: "Dimas" } },
  events: [
    null,
    { venue: "Gedung tanpa tanggal" },
    { startsAt: "bukan-tanggal", venue: "Gedung" },
    { startsAt: "2027-13-45", venue: "Bulan ke tiga belas" },
  ],
  story: "bukan array",
  gallery: ["javascript:alert(1)", "/media/00000000-0000-4000-8000-000000000008.jpg", 42],
  video: "javascript:alert(1)",
  stream: "not a url at all",
  gifts: { banks: [{ bank: "BCA" }] },
});

const render = (id: string, content: InvitationContent, guestName: string | null) =>
  renderToStaticMarkup(
    createElement(TEMPLATE_COMPONENTS[id as keyof typeof TEMPLATE_COMPONENTS], {
      content,
      theme: { palette: "sand", display: "serif" },
      palette: PALETTES.sand,
      guestName,
      slug: "dimas-sari",
      rsvpSlot: null,
      wishSlot: null,
      qrSlot: null, rundownSlot: null,
    }),
  );

/** A publishable draft, so each test can start from "ready except for X". */
async function readyDraft() {
  const { user, wedding } = await newCouple();
  const inv = await getOrCreateInvitation(user.id, wedding.id);
  await updateInvitation(user.id, inv.id, { content: FULL });
  return { user, wedding, inv };
}

// ------------------------------------------------------------- entitlement --

describe("menerbitkan undangan", () => {
  it("ditolak selama undangan belum dibayar", async () => {
    const { user, inv } = await readyDraft();

    await assert.rejects(
      () => publishInvitation(user.id, inv.id),
      /BELUM_DIBELI:invitation/,
    );

    // And the guest still gets nothing, which is the part that matters.
    assert.equal(await getPublicInvitation(inv.slug), null);
  });

  it("berhasil begitu pesanan lunas", async () => {
    const { user, wedding, inv } = await readyDraft();
    await grantProduct(user.id, wedding.id, "invitation");

    const published = await publishInvitation(user.id, inv.id);
    assert.equal(published.status, "published");
  });

  it("memberi pesan yang bisa ditindaklanjuti, bukan kode error", async () => {
    const { user, inv } = await readyDraft();
    const err = await publishInvitation(user.id, inv.id).catch((e) => e);
    assert.deepEqual(toResult(err), {
      ok: false,
      error: "Undangan Website belum dibeli.",
    });
  });
});

// -------------------------------------------------------- publish blockers --

describe("kelengkapan sebelum terbit", () => {
  it("menolak undangan tanpa nama mempelai", async () => {
    const { user, wedding } = await newCouple();
    await grantProduct(user.id, wedding.id, "invitation");
    const inv = await getOrCreateInvitation(user.id, wedding.id);
    await updateInvitation(user.id, inv.id, {
      content: normaliseContent({ events: FULL.events }),
    });

    await assert.rejects(
      () => publishInvitation(user.id, inv.id),
      /Nama kedua mempelai belum diisi/,
    );
  });

  it("menolak undangan tanpa satu pun acara", async () => {
    const { user, wedding } = await newCouple();
    await grantProduct(user.id, wedding.id, "invitation");
    const inv = await getOrCreateInvitation(user.id, wedding.id);
    await updateInvitation(user.id, inv.id, {
      content: normaliseContent({ couple: FULL.couple }),
    });

    await assert.rejects(
      () => publishInvitation(user.id, inv.id),
      /minimal satu acara/,
    );
  });

  it("menolak acara yang punya tanggal tapi tidak punya tempat", async () => {
    assert.deepEqual(
      publishBlockers(
        normaliseContent({
          couple: FULL.couple,
          events: [{ name: "Akad", startsAt: "2027-06-12T08:00", venue: "  " }],
        }),
      ),
      ["Butuh minimal satu acara dengan tanggal dan nama tempat."],
    );
  });

  it("melepas semua hambatan ketika dokumen lengkap", async () => {
    assert.deepEqual(publishBlockers(FULL), []);
  });

  it("menyebut kedua hambatan sekaligus pada draf kosong", async () => {
    assert.equal(publishBlockers(normaliseContent({})).length, 2);
  });
});

// ------------------------------------------------------------- public read --

describe("halaman publik", () => {
  it("terbaca tanpa identitas apa pun setelah terbit", async () => {
    const { user, wedding, inv } = await readyDraft();
    await grantProduct(user.id, wedding.id, "invitation");
    await publishInvitation(user.id, inv.id);

    const read = await getPublicInvitation(inv.slug);
    assert.ok(read && !isExpired(read), "undangan terbit harus terbaca publik");
    assert.equal(read.content.couple.groom.nickName, "Dimas");
    assert.equal(read.content.events.length, 2);
    // The jsonb round trip is the failure this asserts against: a stringified
    // document lands as a jsonb string and every field reads back empty.
    assert.equal(read.content.gifts.banks[0]?.number, "1234567890");
  });

  it("tidak terbaca selama masih draf, walau slug-nya benar", async () => {
    const { user, wedding, inv } = await readyDraft();
    await grantProduct(user.id, wedding.id, "invitation");

    assert.equal(await getPublicInvitation(inv.slug), null);
    // The draft is not merely hidden by the query: RLS itself refuses it.
    const rows = await asNobody((tx) => tx`select id from invitations where id = ${inv.id}`);
    assert.equal(rows.length, 0);
    // Its own couple still sees it.
    const mine = await asUser(user.id, (tx) => tx`select id from invitations where id = ${inv.id}`);
    assert.equal(mine.length, 1);
  });

  it("mengembalikan null untuk slug yang tidak ada", async () => {
    assert.equal(await getPublicInvitation("slug-yang-tidak-pernah-ada"), null);
  });

  it("menjadi kedaluwarsa, bukan hilang, ketika masa aktif habis", async () => {
    const { user, wedding, inv } = await readyDraft();
    await grantProduct(user.id, wedding.id, "invitation");
    await publishInvitation(user.id, inv.id);

    await asUser(user.id, (tx) => tx`
      update orders set expires_at = now() - interval '1 day'
       where wedding_id = ${wedding.id} and product = 'invitation'`);

    const read = await getPublicInvitation(inv.slug);
    assert.ok(read !== null, "undangan kedaluwarsa bukan 404");
    assert.ok(isExpired(read), "harus dilaporkan sebagai kedaluwarsa");
  });

  it("menandai batas RSVP yang sudah lewat", async () => {
    const { user, wedding, inv } = await readyDraft();
    await grantProduct(user.id, wedding.id, "invitation");
    await updateInvitation(user.id, inv.id, {
      rsvpDeadline: new Date(Date.now() - 60_000).toISOString(),
    });
    await publishInvitation(user.id, inv.id);

    const read = await getPublicInvitation(inv.slug);
    assert.ok(read && !isExpired(read));
    assert.equal(read.deadlinePassed, true);
  });
});

// -------------------------------------------------------------------- slug --

describe("alamat undangan", () => {
  // Slugs are globally unique by design, so a fixed literal would pass once and
  // then fail on every later run against the same database. The collision this
  // suite needs is created inside the test, not inherited from history.
  const uniqueSlug = () => `t-${randomUUID().slice(0, 8)}`;

  it("memberi pesan ramah ketika slug sudah dipakai orang lain", async () => {
    const a = await newCouple();
    const b = await newCouple();
    const mine = await getOrCreateInvitation(a.user.id, a.wedding.id);
    const theirs = await getOrCreateInvitation(b.user.id, b.wedding.id);
    const taken = uniqueSlug();

    await updateInvitation(a.user.id, mine.id, { slug: taken });

    const err = await updateInvitation(b.user.id, theirs.id, { slug: taken }).catch((e) => e);

    assert.deepEqual(toResult(err), {
      ok: false,
      error: "Alamat undangan itu sudah dipakai. Coba yang lain.",
    });
  });

  it("menolak bentuk yang salah sebelum menyentuh database", async () => {
    const { user, wedding } = await newCouple();
    const inv = await getOrCreateInvitation(user.id, wedding.id);

    for (const bad of ["ab", "-awal", "akhir-", "Huruf Besar", "pakai_spasi", "a".repeat(51)]) {
      const err = await updateInvitation(user.id, inv.id, { slug: bad }).catch((e) => e);
      assert.match(
        String(err.message),
        /huruf kecil, angka, dan tanda hubung/,
        `slug "${bad}" seharusnya ditolak`,
      );
    }
  });

  it("menerima dan merapikan slug yang sah", async () => {
    const { user, wedding } = await newCouple();
    const inv = await getOrCreateInvitation(user.id, wedding.id);
    const base = uniqueSlug();
    const saved = await updateInvitation(user.id, inv.id, { slug: `  ${base.toUpperCase()}  ` });
    assert.equal(saved.slug, base);
  });

  it("memakai satu draf yang sama pada kunjungan berikutnya", async () => {
    const { user, wedding } = await newCouple();
    const first = await getOrCreateInvitation(user.id, wedding.id);
    const second = await getOrCreateInvitation(user.id, wedding.id);
    assert.equal(first.id, second.id);
    assert.equal(first.slug, second.slug);
  });

  it("tidak bisa disunting oleh pasangan lain", async () => {
    const a = await newCouple();
    const b = await newCouple();
    const mine = await getOrCreateInvitation(a.user.id, a.wedding.id);

    await assert.rejects(
      () => updateInvitation(b.user.id, mine.id, { slug: "bajakan-slug" }),
      /FORBIDDEN/,
    );
  });
});

// ---------------------------------------------------------------- documents --

describe("dokumen setengah jadi", () => {
  it("tetap punya bentuk yang bisa dirender", () => {
    assert.equal(HALF.couple.groom.fullName, "Dimas");
    assert.equal(HALF.couple.bride.fullName, "", "mempelai yang hilang jadi kosong, bukan undefined");
    assert.deepEqual(HALF.story, [], "story bertipe salah jadi array kosong");
    assert.ok(Array.isArray(HALF.gallery));
    assert.deepEqual(publishBlockers(HALF), [
      "Nama kedua mempelai belum diisi.",
      "Butuh minimal satu acara dengan tanggal dan nama tempat.",
    ]);
  });

  it("bertahan melewati simpan dan baca ulang", async () => {
    const { user, wedding } = await newCouple();
    const inv = await getOrCreateInvitation(user.id, wedding.id);
    const saved = await updateInvitation(user.id, inv.id, { content: HALF });
    assert.deepEqual(saved.content, HALF);
  });
});

// ---------------------------------------------------------------- templates --

describe("template", () => {
  it("tersedia untuk setiap desain di katalog", () => {
    for (const t of TEMPLATES) {
      assert.equal(typeof TEMPLATE_COMPONENTS[t.id], "function", `${t.id} tidak punya komponen`);
    }
    assert.equal(Object.keys(TEMPLATE_COMPONENTS).length, TEMPLATES.length);
  });

  for (const t of TEMPLATES) {
    it(`${t.id} merender dokumen kosong tanpa melempar`, () => {
      const html = render(t.id, normaliseContent({}), null);
      assert.ok(html.length > 200, "harus tetap menghasilkan halaman");
      assert.ok(!html.includes("undefined"), "tidak boleh membocorkan undefined");
      assert.ok(!html.includes("NaN"), "tidak boleh membocorkan NaN");
    });

    it(`${t.id} merender dokumen setengah jadi tanpa melempar`, () => {
      const html = render(t.id, HALF, "Budi Santoso");
      assert.ok(html.includes("Dimas"));
      assert.ok(html.includes("Budi Santoso"), "sapaan tamu harus muncul");
      // The pasted javascript: url must not survive into an attribute.
      assert.ok(!html.includes("javascript:"), "url berbahaya harus disaring");
      // No heading may be drawn over a section that turned out to be empty.
      assert.ok(!/Live streaming/i.test(html), "seksi kosong tidak boleh punya judul");
    });

    it(`${t.id} merender dokumen lengkap dengan semua bagiannya`, () => {
      const html = render(t.id, FULL, "Budi Santoso");

      assert.ok(html.includes("Dimas"), "nama mempelai");
      assert.ok(html.includes("Budi Santoso"), "sapaan tamu");
      assert.ok(html.includes("Masjid Raya Al-Ikhlas"), "tempat acara");
      assert.ok(html.includes("Juni 2027"), "tanggal berbahasa Indonesia");
      assert.ok(html.includes("Pertama bertemu"), "love story");
      assert.ok(html.includes("1234567890"), "rekening hadiah");
      assert.ok(html.includes("Jl. Melati No. 9, Bandung 40123"), "alamat kado");

      assert.ok(
        html.includes("youtube-nocookie.com/embed/dQw4w9WgXcQ"),
        "video ditanam tanpa cookie pelacak",
      );
      assert.ok(html.includes("data:text/calendar"), "tombol simpan ke kalender");
      assert.ok(html.includes("google.com/maps") || html.includes("maps.app.goo.gl"), "link peta");
      assert.ok(html.includes("--accent"), "warna tema dipasang sebagai custom property");
      assert.ok(!html.includes("undefined"));
      assert.ok(!html.includes("NaN"));
    });
  }

  it("memakai jam dinding apa adanya, tanpa digeser zona waktu", () => {
    // The couple typed 08.00. Every guest, in any timezone, must read 08.00.
    const html = render("klasik", FULL, null);
    assert.ok(html.includes("08.00"), "jam mulai persis seperti yang diisi");
    assert.ok(html.includes("10.00"), "jam selesai persis seperti yang diisi");
  });

  /**
   * The reduced-motion guard used to be asserted by grepping one template's
   * HTML for the string, which only ever proved that the `<style>` tag those
   * templates rendered was still there. It moved to globals.css — one delivery
   * for every page instead of one per invitation — and the old assertion failed
   * without anything about the behaviour having changed.
   *
   * So check the contract instead of the plumbing: every class the stylesheet
   * animates must be switched off under reduce, and no template may reach for a
   * motion class the stylesheet has never heard of.
   */
  it("setiap kelas beranimasi dimatikan saat kurangi-gerak", () => {
    // Comments first. The guard's own comment names `.od-eq` while explaining
    // why it needs stopping, and scanning the raw text let that prose stand in
    // for the selector — removing the class from the rule still "passed".
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8").replace(
      /\/\*[\s\S]*?\*\//g,
      "",
    );

    const start = css.indexOf("@media (prefers-reduced-motion: reduce)");
    assert.ok(start > 0, "globals.css tidak lagi punya blok kurangi-gerak");
    const guard = css.slice(start, css.indexOf("\n}", start));
    const guarded = new Set([...guard.matchAll(/\.(od-[\w-]+)/g)].map((m) => m[1]!));

    // Classes globals.css actually animates, outside the guard itself.
    const animated = [...css.slice(0, start).matchAll(/^([^@{}\n]+)\{([^}]*)\}/gm)]
      .filter(([, , body]) => /animation:/.test(body!))
      .flatMap(([, sel]) => [...sel!.matchAll(/\.(od-[\w-]+)/g)].map((m) => m[1]!));
    assert.ok(animated.length > 0, "tidak ada kelas beranimasi — struktur berubah");

    for (const c of animated) {
      assert.ok(guarded.has(c), `.${c} beranimasi tapi tidak dimatikan saat kurangi-gerak`);
    }

    // And nothing in a template may animate via a class nobody defined.
    const defined = new Set([...css.matchAll(/\.(od-[\w-]+)/g)].map((m) => m[1]!));
    for (const t of TEMPLATES) {
      const used = [...render(t.id, FULL, null).matchAll(/\b(od-[\w-]+)/g)].map((m) => m[1]!);
      for (const c of used) {
        assert.ok(defined.has(c), `${t.id} memakai .${c} yang tidak ada di globals.css`);
      }
    }
  });
});
