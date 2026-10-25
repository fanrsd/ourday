import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * The storefront's one scripted section, checked where it can fail silently.
 *
 * The captions in `story.tsx` are paper-coloured text laid over a photograph
 * nobody has measured: the scrim between them is the only thing standing
 * between a headline and an unreadable one. That scrim is three alpha values
 * buried in a Tailwind class string, so it is exactly the kind of thing that
 * gets "just a bit lighter" during a design pass and ships broken.
 *
 * So the numbers are read out of the shipped source rather than restated here.
 * Restating them would pass forever no matter what the page actually renders.
 */

const SRC = readFileSync(new URL("../app/(marketing)/story.tsx", import.meta.url), "utf8");

const INK = "#241f1c";
const PAPER = "#faf7f2";

const chan = (h: string) => {
  const c = parseInt(h, 16) / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const rgb = (hex: string) => [1, 3, 5].map((i) => chan(hex.slice(i, i + 2)));
const lum = ([r, g, b]: number[]) => 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** `bg-ink/30`, `from-ink/75`, `via-ink/40` → 0.30, 0.75, 0.40. */
function alphaOf(prefix: string): number {
  const m = SRC.match(new RegExp(`${prefix}-ink/(\\d+)`));
  assert.ok(m, `no ${prefix}-ink/<alpha> in story.tsx — the scrim was restructured`);
  return Number(m![1]) / 100;
}

describe("cerita di halaman depan", () => {
  /**
   * Worst case, deliberately: a photograph that is pure white everywhere. None
   * of the three shipped ones is, and that is the point — the photographs are
   * what a later designer swaps, and clearing the bar against white clears it
   * against anything they choose.
   *
   * Sampled at the right edge of the text, not the middle of the frame. A
   * headline is `max-w-2xl` (42rem) inside a `max-w-6xl` (72rem) container, so
   * the last letter of the longest line sits 58% of the way across — which is
   * also the thinnest scrim any caption pixel ever stands on.
   */
  it("teks caption tetap terbaca di atas foto paling terang", () => {
    const flat = alphaOf("bg");
    const from = alphaOf("from");
    const via = alphaOf("via");
    const viaAt = Number(SRC.match(/via-\[(\d+)%\]/)?.[1]);
    assert.ok(viaAt, "stop tengah gradien tidak eksplisit — teks bisa keluar dari lindungannya");
    // Scan the span rather than probe a point. The obvious sample — the right
    // edge of the longest line — happens to land exactly on the `via` stop,
    // where the `from` alpha cancels out of the interpolation entirely and
    // could be set to anything without moving the number.
    const TEXT_EDGE = 58;
    const alphaAt = (x: number) =>
      x <= viaAt ? from + (via - from) * (x / viaAt) : via * (1 - (x - viaAt) / (100 - viaAt));

    let scrim = 1;
    let thinnestAt = 0;
    for (let x = 0; x <= TEXT_EDGE; x++) {
      // The gradient image paints over the background colour, so they compose.
      const composed = alphaAt(x) + flat * (1 - alphaAt(x));
      if (composed < scrim) [scrim, thinnestAt] = [composed, x];
    }

    // Ink over white, composited in sRGB the way the compositor does it, and
    // only then linearised. Blending the linear values instead reads about two
    // stops brighter and silently passes scrims that are too light.
    const inked = [0, 1, 2].map((i) => {
      const ink = parseInt(INK.slice(1 + i * 2, 3 + i * 2), 16) / 255;
      const v = 1 - scrim * (1 - ink);
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });

    const contrast = ratio(lum(rgb(PAPER)), lum(inked));
    assert.ok(
      contrast >= 4.5,
      `caption di atas foto putih hanya ${contrast.toFixed(2)}:1 ` +
        `(scrim tertipis ${(scrim * 100).toFixed(0)}% di ${thinnestAt}% lebar)`,
    );
  });

  /**
   * Two rules about the dimmed elements, both learned the hard way.
   *
   * Nothing but a photograph may start at zero: the captions are the section's
   * content, and a timeline that never resolves must not be what decides
   * whether they are on screen — the failure the marketing layout's `.rise` was
   * written to avoid.
   *
   * And anything dimmed but not zero is still text a reader reads, so it owes
   * the same 4.5:1 as everything else. The stamps shipped at 0.28, which looked
   * like a reasonable "inactive" and measured 2.45:1 on 11px caps.
   */
  it("elemen redup tetap terbaca, dan hanya foto yang boleh nol", () => {
    const dimmed = [
      ...SRC.matchAll(/data-(\w+)=\{i\}[\s\S]{0,400}?opacity: i === 0 \? 1 : ([\d.]+)/g),
    ];
    assert.ok(dimmed.length >= 2, "tidak menemukan elemen redup — struktur berubah");

    // The dimmed text sits on the bottom shield, which is full ink at its base.
    const bg = lum(rgb(INK));
    const byteAt = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;

    for (const [, name, raw] of dimmed) {
      const a = Number(raw);
      if (a === 0) {
        assert.equal(name, "phase", `\`${name}\` mulai dari opacity 0 — hanya foto yang boleh`);
        continue;
      }
      // CSS opacity composites in sRGB, before the transfer function.
      const mixed = [0, 1, 2].map((i) => {
        const from = byteAt(INK, i);
        const v = from + (byteAt(PAPER, i) - from) * a;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      const contrast = ratio(lum(mixed), bg);
      assert.ok(contrast >= 4.5, `\`${name}\` pada opacity ${a} hanya ${contrast.toFixed(2)}:1`);
    }
  });
});
