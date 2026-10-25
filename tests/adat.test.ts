import { describe, it } from "node:test";
import assert from "node:assert/strict";
import module from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { normaliseContent, PALETTES, type InvitationContent } from "../lib/invitation-content.ts";
import { TEMPLATES, type TemplateId } from "../lib/templates/registry.ts";
import { ADAT_PACKS, adatIdOf } from "../lib/templates/adat/packs.ts";

import type { AdatId } from "../lib/templates/adat/types.ts";

/**
 * Eight cultures rendered by one component is only a good trade if a wrong
 * motif or a copy-pasted pack fails loudly. That is what this file is: the
 * structure is tested once in invitation.test.ts, and here we check that each
 * pack actually says its own words and nobody else's.
 *
 * Same `.tsx` loader hook as invitation.test.ts, because Node's type stripping
 * erases types but will not transform JSX.
 *
 * ponytail: copied rather than shared. Two call sites and no test-helper module
 * that is safe to import without a database connection; the day there is a
 * third, hoist it.
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

// Dynamic on purpose: the `.tsx` loader hook above has to be registered before
// anything that pulls in a component module, and a static import would hoist
// above it.
const { TEMPLATE_COMPONENTS } = await import("../lib/templates/index.ts");
const { GROUND_ALPHA } = await import("../lib/templates/adat/motifs.tsx");
const { crestAlpha } = await import("../lib/templates/adat/adat.tsx");

const ADAT = TEMPLATES.filter((t) => t.group === "Adat");

/** React escapes text children, so a greeting with an apostrophe — Tabe' — is
 *  not in the html verbatim. Compare against what actually lands there. */
const escaped = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

/** WCAG relative luminance, then the ratio against white. Written out here on
 *  purpose: the template picks a colour, this checks the colour, and a shared
 *  helper would only prove the two agree with themselves. */
function contrastOnWhite(hex: string): number {
  const chan = (h: string) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const m = hex.trim().match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  assert.ok(m, `bukan warna hex: ${hex}`);
  const l = 0.2126 * chan(m![1]!) + 0.7152 * chan(m![2]!) + 0.0722 * chan(m![3]!);
  return 1.05 / (l + 0.05);
}

const render = (
  id: TemplateId,
  content: InvitationContent,
  guestName: string | null = null,
  slot: string | null = null,
) =>
  renderToStaticMarkup(
    createElement(TEMPLATE_COMPONENTS[id], {
      content,
      theme: { palette: "sand", display: "serif" } as const,
      palette: PALETTES.sand,
      guestName,
      slug: "demo-" + id,
      rsvpSlot: slot,
      wishSlot: null,
      qrSlot: null, rundownSlot: null,
    }),
  );

const EMPTY = normaliseContent({});

/**
 * A finished invitation for one culture: every section filled, and the events
 * named with that pack's own ceremonies, which is how a real family fills it in.
 */
function fullFor(adat: AdatId, opts: { coverPhoto?: string } = {}): InvitationContent {
  return normaliseContent({
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
      ...(opts.coverPhoto ? { coverPhoto: opts.coverPhoto } : {}),
    },
    events: ADAT_PACKS[adat].vocab.eventSuggestions.map((name, i) => ({
      name,
      startsAt: `2027-06-${12 + i}T08:00`,
      endsAt: `2027-06-${12 + i}T10:00`,
      venue: "Gedung Serbaguna Contoh",
      address: "Jl. Contoh No. 1, Bandung",
      mapsUrl: "https://maps.app.goo.gl/contoh",
    })),
    story: [{ date: "2019-03-02", title: "Pertama bertemu", body: "Di kelas pagi yang sama." }],
    gallery: [
      "/media/00000000-0000-4000-8000-000000000004.jpg",
      "/media/00000000-0000-4000-8000-000000000005.jpg",
    ],
    video: "https://youtu.be/dQw4w9WgXcQ",
    gifts: {
      banks: [{ bank: "BCA", number: "1234567890", holder: "Sari Puspita Dewi" }],
      shippingAddress: "Jl. Melati No. 9, Bandung 40123",
    },
    stream: "https://www.youtube.com/live/abcdefghijk",
    music: "/media/00000000-0000-4000-8000-000000000007.mp3",
  });
}

// ------------------------------------------------------------------ wiring --

describe("desain adat", () => {
  it("delapan adat terdaftar dan tiap satu punya komponen", () => {
    assert.equal(ADAT.length, 8, "katalog harus punya delapan desain adat");
    for (const t of ADAT) {
      assert.equal(typeof TEMPLATE_COMPONENTS[t.id], "function", `${t.id} tidak punya komponen`);
      assert.notEqual(adatIdOf(t.id), null, `${t.id} tidak punya pack`);
    }
  });

  it("adatIdOf hanya mengenali id adat", () => {
    assert.equal(adatIdOf("adat-jawa"), "jawa");
    assert.equal(adatIdOf("klasik"), null);
    assert.equal(adatIdOf("adat-yang-tidak-ada"), null);
  });

  for (const t of ADAT) {
    const adat = adatIdOf(t.id)!;
    const pack = ADAT_PACKS[adat];

    it(`${t.id} merender dokumen kosong tanpa melempar`, () => {
      const html = render(t.id, EMPTY);
      assert.ok(html.length > 200, "harus tetap menghasilkan halaman");
      assert.ok(!html.includes("undefined"), "tidak boleh membocorkan undefined");
      assert.ok(!html.includes("NaN"), "tidak boleh membocorkan NaN");
      // The motif is the design, so it has to be there even with nothing filled in.
      assert.ok(html.includes("<svg"), "motif harus tetap tampil");
      assert.ok(html.includes(escaped(pack.vocab.greeting)), "sapaan adat harus tetap tampil");
    });

    it(`${t.id} merender dokumen lengkap dengan semua bagiannya`, () => {
      const html = render(t.id, fullFor(adat), "Budi Santoso");
      assert.ok(html.includes("Dimas"), "nama mempelai");
      assert.ok(html.includes("Budi Santoso"), "sapaan tamu");
      assert.ok(html.includes("Gedung Serbaguna Contoh"), "tempat acara");
      assert.ok(html.includes("Juni 2027"), "tanggal berbahasa Indonesia");
      assert.ok(html.includes("1234567890"), "rekening hadiah");
      assert.ok(html.includes("data:text/calendar"), "tombol simpan ke kalender");
      assert.ok(html.includes("youtube-nocookie.com/embed/"), "video ditanam tanpa cookie");
      assert.ok(!html.includes("undefined"));
      assert.ok(!html.includes("NaN"));
    });

    it(`${t.id} memakai kata-kata dan warna packnya sendiri`, () => {
      const html = render(t.id, fullFor(adat));

      assert.ok(html.includes(escaped(pack.vocab.greeting)), "sapaan");
      assert.ok(html.includes(escaped(pack.vocab.eventsTitle)), "judul rangkaian acara");
      assert.ok(html.includes(escaped(pack.vocab.coupleTitle)), "judul mempelai");
      assert.ok(html.includes(escaped(pack.vocab.closing)), "doa penutup");
      assert.ok(html.includes(escaped(pack.vocab.groomLine)), "kalimat orang tua mempelai pria");
      assert.ok(html.includes(escaped(pack.vocab.brideLine)), "kalimat orang tua mempelai wanita");

      // At least one ceremony of this culture, named the way this culture names it.
      const ceremonies = pack.vocab.eventSuggestions.filter((n) => html.includes(escaped(n)));
      assert.ok(
        ceremonies.length > 0,
        `tidak ada nama acara ${adat} yang tampil: ${pack.vocab.eventSuggestions.join(", ")}`,
      );

      // Colour comes from the pack, never from the `sand` theme handed in above.
      assert.ok(html.includes(pack.palette.accent), "warna aksen pack dipasang");
      assert.ok(
        !html.includes(PALETTES.sand.accent) || pack.palette.accent === PALETTES.sand.accent,
        "palet tema umum tidak boleh menimpa warna adat",
      );
    });

    it(`${t.id} tidak memakai sapaan adat lain`, () => {
      const html = render(t.id, fullFor(adat));
      for (const other of Object.values(ADAT_PACKS)) {
        if (other.id === adat) continue;
        assert.ok(
          !html.includes(escaped(other.vocab.greeting)),
          `sapaan ${other.id} ("${other.vocab.greeting}") bocor ke desain ${adat}`,
        );
      }
    });

    it(`${t.id} tidak memesan satu layar penuh untuk foto yang tidak ada`, () => {
      // Most couples publish before the prewedding shoot exists. Viewport-height
      // units in the cover are the tell: with no photo there must be none.
      const bare = render(t.id, fullFor(adat));
      assert.ok(!/\d(?:svh|dvh|vh)\]/.test(bare), "sampul tanpa foto tidak boleh setinggi layar");

      const withCover = render(
        t.id,
        fullFor(adat, { coverPhoto: "/media/00000000-0000-4000-8000-000000000003.jpg" }),
      );
      assert.ok(/\d(?:svh|dvh|vh)\]/.test(withCover), "sampul berfoto memang setinggi layar");
      assert.ok(
        withCover.includes("00000000-0000-4000-8000-000000000003.jpg"),
        "foto sampul dipasang",
      );
    });

    it(`${t.id} memberi panel tamu tinta yang terbaca di kartu putih`, () => {
      // The RSVP and wish panels are white cards drawn by the guest modules, on
      // a page that for three packs is dark. They colour their heading and
      // button with --accent and inherit body text, so the template has to hand
      // them ink that clears AA on white — a gold accent on white does not.
      const html = render(t.id, fullFor(adat), null, "PANEL");
      const wrapper = html.match(/style="--accent:([^"]+)"[^>]*>PANEL/);
      assert.ok(wrapper, "pembungkus slot harus menimpa --accent");

      for (const colour of [wrapper![1]!.trim(), pack.palette.deep]) {
        assert.ok(
          contrastOnWhite(colour) >= 4.5,
          `${colour} hanya ${contrastOnWhite(colour).toFixed(2)}:1 di atas putih`,
        );
      }
    });
  }

  it("setiap pack punya sapaan sendiri", () => {
    // Two cultures sharing a cover greeting means one pack was copied from the
    // other and half-edited. This is the assertion that catches it — and one
    // greeting containing another counts, both because it makes the leak test
    // below unprovable and because two of eight cultures greeting in the same
    // words is the generic-template-with-ornaments failure we sell against.
    const packs = Object.values(ADAT_PACKS);
    for (const a of packs) {
      for (const b of packs) {
        if (a.id === b.id) continue;
        assert.ok(
          !a.vocab.greeting.includes(b.vocab.greeting),
          `sapaan ${a.id} ("${a.vocab.greeting}") memuat sapaan ${b.id} ("${b.vocab.greeting}")`,
        );
      }
    }
  });

  it("motif tampil lebih dari sekali dan selalu dekoratif", () => {
    for (const t of ADAT) {
      const adat = adatIdOf(t.id)!;
      const html = render(t.id, fullFor(adat));

      // Every instance mints its own pattern id. Counting them proves the motif
      // is drawn more than once; requiring them to be distinct proves two
      // instances on one page cannot capture each other's `url(#...)`. Names are
      // deliberately not asserted — where the motif is placed is a design
      // decision, that it never collides is a correctness one.
      const ids = [...html.matchAll(/id="(adat-motif-[\w-]+)"/g)].map((m) => m[1]!);
      assert.ok(ids.length > 1, `motif ${adat} hanya digambar ${ids.length} kali`);
      assert.equal(new Set(ids).size, ids.length, `id pattern ${adat} bertabrakan`);

      // A motif carries no meaning a screen reader should read out.
      assert.ok(html.includes('aria-hidden="true"'), "motif harus aria-hidden");
    }
  });

  /**
   * Two layers are drawn under the text and both cost contrast: the ground
   * thread over the whole page, and the crest behind the names on the cover. On
   * the dark packs the ground moves the wrong way — the thread there is the
   * light `fg`, which lifts the background toward the text rather than away.
   *
   * The rules and the luminance maths are recomputed here rather than imported,
   * so a change to either side has to be made twice on purpose. Adding a pack
   * whose palette has no headroom, or nudging one alpha, fails here.
   */
  it("teks tetap terbaca di atas motif latar dan crest", () => {

    const chan = (h: string) => {
      const c = parseInt(h, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const rgb = (hex: string) => [1, 3, 5].map((i) => chan(hex.slice(i, i + 2)));
    const lum = ([r, g, b]: number[]) => 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
    const ratio = (a: number, b: number) =>
      (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const over = (bg: string, ink: string, a: number) =>
      rgb(bg).map((c, i) => c * (1 - a) + rgb(ink)[i]! * a);

    for (const [id, pack] of Object.entries(ADAT_PACKS)) {
      const p = pack.palette;
      const fg = lum(rgb(p.fg));

      // Same rule as groundInk: dark cloth is woven in light thread.
      const thread = lum(rgb(p.bg)) < 0.2 ? p.fg : p.deep;
      const woven = ratio(fg, lum(over(p.bg, thread, GROUND_ALPHA[id as AdatId])));
      assert.ok(woven >= 4.5, `${id}: teks di atas motif hanya ${woven.toFixed(2)}:1`);

      // The weight the crest actually ships at, not a constant copied here:
      // adat.tsx derives it per palette, and this checks what that produced.
      const a = crestAlpha(p);
      assert.ok(a > 0 && a <= 0.22, `${id}: bobot crest di luar rentang (${a})`);
      const crest = ratio(fg, lum(over(p.bg, p.accent, a)));
      assert.ok(crest >= 4.5, `${id}: teks di atas crest hanya ${crest.toFixed(2)}:1`);
    }
  });
});
