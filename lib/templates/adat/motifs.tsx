import type { ReactNode } from "react";
import type { AdatId, Motif, MotifProps } from "./types.ts";

/**
 * The eight motifs. Each one is a real textile rule drawn as a seamless tile, not
 * a decorative squiggle: parang runs at 45 degrees because that is what parang
 * is, poleng is a plain check because poleng is a plain check, and ulos warp
 * bands are unequal because an even stripe is not an ulos.
 *
 * They render behind text at roughly 6-10% opacity, so subtlety is the whole
 * job. Anything with more detail than this reads as noise at that opacity, which
 * is a failed motif — the reader should feel the culture without being able to
 * point at a line.
 *
 * Every tile is authored in a fixed 0..100 box and mapped onto a `scale`-px
 * square by the pattern's own viewBox, so `scale` is the only size knob and
 * stroke weights scale with it. Content is drawn past the box edges on purpose:
 * the pattern clips to the tile, and the overhang is what makes the seams
 * disappear. Where a rule would land exactly on a seam it is drawn at both 0 and
 * 100, so the two clipped halves reassemble into one full-weight line instead of
 * a half-weight one.
 */

const BOX = 100;

type TileProps = Omit<MotifProps, "scale" | "color"> & {
  scale: number;
  children: ReactNode;
};

function Tile({ id, scale, opacity, className, children }: TileProps) {
  // The id namespaces the pattern, so two motifs on one page cannot collide.
  const pid = `adat-motif-${id}`;
  return (
    <svg
      aria-hidden="true"
      className={className}
      style={{ opacity, pointerEvents: "none" }}
      width="100%"
      height="100%"
    >
      <defs>
        <pattern
          id={pid}
          patternUnits="userSpaceOnUse"
          width={scale}
          height={scale}
          viewBox={`0 0 ${BOX} ${BOX}`}
        >
          {children}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${pid})`} />
    </svg>
  );
}

// ---------------------------------------------------------------- jawa -------

/**
 * Batik parang: parallel diagonal bands, each holding a row of repeated blades,
 * with a line of mlinjon dots in the band between. The 45-degree run is the
 * point, so the tile content is drawn in a rotated frame.
 *
 * A pattern rotated 45 degrees only tiles a square if its own period is the
 * square's diagonal over two: 100/sqrt(2). That single number is why the blade
 * lattice below is 70.71 and not something round.
 */
const D = 70.710678;
const HALF = D / 2;

const Jawa: Motif = ({ color, scale = 92, ...rest }) => (
  <Tile scale={scale} {...rest}>
    <g transform={`rotate(-45 ${BOX / 2} ${BOX / 2})`} fill="none" stroke={color}>
      {[0, 1].map((k) =>
        [-1, 0, 1].map((j) => (
          <g
            key={`${k}:${j}`}
            transform={`translate(${(j * D).toFixed(3)} ${(k * D).toFixed(3)}) scale(${(D / BOX).toFixed(6)})`}
          >
            <path
              d="M 2 46 C 18 44 27 34 34 23 C 41 12 56 4 74 8"
              strokeWidth={5}
              strokeLinecap="round"
            />
            <path
              d="M 22 46 C 33 42 38 33 43 25 C 48 17 58 12 68 14"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        )),
      )}
      {[-1, 0, 1].map((k) => (
        <line
          key={k}
          x1={-90}
          x2={190}
          y1={(k * D + HALF * 1.5).toFixed(3)}
          y2={(k * D + HALF * 1.5).toFixed(3)}
          strokeWidth={2.4}
          strokeLinecap="round"
          // Dash period is D/6, so the dashes stay in phase across the seam.
          strokeDasharray="3 8.785113"
        />
      ))}
    </g>
  </Tile>
);

// --------------------------------------------------------------- sunda -------

/**
 * Mega mendung: stacked cloud outlines, four layers deep, on a half-drop so the
 * rows read as weather rather than as a border. Cirebon clouds are stepped
 * concentric curves; these are concentric arcs on a shared baseline, which is the
 * same rule with the curls left out — curls turn to mud below 10% opacity.
 */
const CLOUD_R = [25, 19, 13, 7];

function cloudBand(y: number, dx: number): string[] {
  return CLOUD_R.map((r, i) => {
    const inset = i * 6;
    let d = "";
    for (let x = -50; x <= 100; x += 50) {
      d += `M ${dx + x + inset} ${y} A ${r} ${r} 0 0 1 ${dx + x + 50 - inset} ${y} `;
    }
    return d.trim();
  });
}

const Sunda: Motif = ({ color, scale = 128, ...rest }) => (
  <Tile scale={scale} {...rest}>
    <g fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round">
      {[
        [48, 0],
        [98, 25],
      ].map(([y, dx]) =>
        cloudBand(y, dx).map((d, i) => <path key={`${y}:${i}`} d={d} />),
      )}
    </g>
  </Tile>
);

// -------------------------------------------------------------- minang -------

/**
 * Songket pucuak rabuang: the bamboo-shoot triangle, in two facing bands with a
 * line of seed dots between them, the way it sits on the head of a sarung. The
 * philosophy behind it — "ketek baguno, gadang tapakai" — is why the shoot is
 * always shown mid-growth and never as a plain triangle grid.
 */
const Minang: Motif = ({ color, scale = 104, ...rest }) => {
  const band = (base: number, apex: number, dx: number) => {
    let d = "";
    for (let x = -25; x <= 100; x += 25) {
      d += `M ${dx + x} ${base} L ${dx + x + 12.5} ${apex} L ${dx + x + 25} ${base} Z `;
    }
    return d.trim();
  };
  return (
    <Tile scale={scale} {...rest}>
      <path d={band(46, 20, 0)} fill={color} />
      <path d={band(72, 98, 12.5)} fill={color} />
      <g stroke={color} fill="none">
        <path d="M -10 46 H 110 M -10 72 H 110" strokeWidth={1.1} />
        {/* Dash period 12.5 divides the tile, so the seed line crosses the seam. */}
        <path d="M -10 59 H 110" strokeWidth={2.6} strokeDasharray="2 10.5" />
      </g>
    </Tile>
  );
};

// --------------------------------------------------------------- batak -------

/**
 * Ulos warp striping. The bands are deliberately unequal — an ulos is read by the
 * rhythm of its widths — and the fine cross-ticks are the weft crossing the warp.
 * Wide bands carry full weight, hairlines are lighter, which stands in for the
 * red-against-black the loom gives you and this single-colour tile cannot.
 */
const ULOS: Array<[number, number]> = [
  [0, 3],
  [5, 1],
  [8, 1],
  [12, 9],
  [24, 2],
  [28, 1],
  [32, 13],
  [48, 3],
  [53, 1],
  [56, 1],
  [60, 8],
  [71, 2],
  [75, 1],
  [79, 11],
  [93, 2],
  [97, 1],
];

const Batak: Motif = ({ color, scale = 112, ...rest }) => (
  <Tile scale={scale} {...rest}>
    {ULOS.map(([x, w]) => (
      <rect key={x} x={x} y={0} width={w} height={BOX} fill={color} fillOpacity={w >= 8 ? 1 : 0.7} />
    ))}
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
      <line
        key={i}
        x1={0}
        x2={BOX}
        y1={6.25 + i * 12.5}
        y2={6.25 + i * 12.5}
        stroke={color}
        strokeWidth={1.2}
        strokeOpacity={0.8}
        // Dash period 6.25 divides the tile; offset 6.25 keeps every tick off the seam.
        strokeDasharray="1.6 4.65"
      />
    ))}
  </Tile>
);

// ---------------------------------------------------------------- bali -------

/**
 * Poleng. Two squares. Rwa bhineda is a binary opposition and drawing it as
 * anything more elaborate than a check would be inventing a tradition.
 */
const Bali: Motif = ({ color, scale = 96, ...rest }) => (
  <Tile scale={scale} {...rest}>
    <rect x={0} y={0} width={BOX / 2} height={BOX / 2} fill={color} />
    <rect x={BOX / 2} y={BOX / 2} width={BOX / 2} height={BOX / 2} fill={color} />
  </Tile>
);

/**
 * Patra punggel — the curling foliage relief carved onto Balinese gates, door
 * panels and wall corners.
 *
 * Bali is the one pack that needs a second drawing. Poleng is half ink by area,
 * so as a full-page ground it renders a hard chequerboard at any opacity where
 * it is visible at all, and the text ends up sitting across two tones. Lowering
 * the number only makes it a fainter chequerboard. Poleng stays what it
 * actually is — the banner cloth wrapped round a pillar, which is exactly the
 * job the cover bands do — and the carving takes the wall.
 *
 * The spine enters at 0 and leaves at 100 on the same line, so the horizontal
 * seam disappears; two rows 50 apart make the vertical repeat even.
 */
const BaliGround: Motif = ({ color, scale = 104, ...rest }) => (
  <Tile scale={scale} {...rest}>
    <g fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round">
      {[0, 50].map((dy) => (
        <g key={dy} transform={`translate(0 ${dy})`}>
          <path d="M 0 30 C 18 30 18 8 38 8 C 58 8 58 30 76 30 C 88 30 94 26 100 30" />
          <path d="M 38 8 C 29 8 25 15 30 20 C 34 23 40 20 39 15" />
          <path d="M 62 22 C 67 30 64 39 57 43" />
          <path d="M 62 22 C 60 31 58 37 57 43" />
        </g>
      ))}
    </g>
  </Tile>
);

// ------------------------------------------------------------ tionghoa -------

/**
 * A lattice of key-fret brackets around the 囍 double-happiness glyph — the one
 * mark that is not optional on a Chinese wedding invitation.
 */
// ponytail: 囍 is set as <text> and relies on the platform's CJK fallback font
// rather than being traced to a path. Every Windows, macOS, Android and iOS
// install we care about ships one; a device with no CJK font at all draws tofu
// at 8% opacity behind the page, which is a smudge, not a broken layout.
const Tionghoa: Motif = ({ color, scale = 124, ...rest }) => (
  <Tile scale={scale} {...rest}>
    <g fill="none" stroke={color}>
      <path d="M 0 0 H 100 M 0 100 H 100 M 0 0 V 100 M 100 0 V 100" strokeWidth={1.6} />
      <path
        d="M 10 26 V 10 H 26 M 90 26 V 10 H 74 M 10 74 V 90 H 26 M 90 74 V 90 H 74"
        strokeWidth={2.4}
      />
    </g>
    <text
      x={BOX / 2}
      y={BOX / 2}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={42}
      fill={color}
    >
      囍
    </text>
  </Tile>
);

// --------------------------------------------------------------- bugis -------

/**
 * Lipa' sabbe: the Bugis silk check, warp and weft crossing in three weights.
 * The square is the sulapa' eppa — four sides, cosmological balance — so the
 * grid is regular on purpose, and no line sits on a tile edge where the seam
 * would halve its weight.
 */
const Bugis: Motif = ({ color, scale = 88, ...rest }) => (
  <Tile scale={scale} {...rest}>
    <g fill="none" stroke={color}>
      <path d="M 6 0 V 100 M 56 0 V 100 M 0 6 H 100 M 0 56 H 100" strokeWidth={3.2} />
      <path d="M 31 0 V 100 M 81 0 V 100 M 0 31 H 100 M 0 81 H 100" strokeWidth={1.4} />
      <path
        d="M 18 0 V 100 M 44 0 V 100 M 68 0 V 100 M 94 0 V 100 M 0 18 H 100 M 0 44 H 100 M 0 68 H 100 M 0 94 H 100"
        strokeWidth={0.6}
      />
    </g>
  </Tile>
);

// -------------------------------------------------------------- melayu -------

/**
 * Tampuk manggis on a tenun grid. The motif is the calyx of a mangosteen seen
 * from below, which the loom renders as an eight-point rosette; the corner
 * rosettes are quartered across four tiles, which is how they come out whole.
 */
function rosette(cx: number, cy: number, R: number, r: number): string {
  const pts = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 2;
    const rad = i % 2 ? r : R;
    return `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  });
  return `M ${pts.join(" L ")} Z`;
}

const Melayu: Motif = ({ color, scale = 104, ...rest }) => (
  <Tile scale={scale} {...rest}>
    <path
      d="M 0 0 H 100 M 0 100 H 100 M 0 0 V 100 M 100 0 V 100"
      fill="none"
      stroke={color}
      strokeWidth={1.2}
    />
    <path d={rosette(BOX / 2, BOX / 2, 27, 11.5)} fill={color} />
    <path
      d={[
        [0, 0],
        [BOX, 0],
        [0, BOX],
        [BOX, BOX],
      ]
        .map(([x, y]) => rosette(x, y, 13, 5.5))
        .join(" ")}
      fill={color}
    />
  </Tile>
);

export const MOTIFS: Record<AdatId, Motif> = {
  jawa: Jawa,
  sunda: Sunda,
  minang: Minang,
  batak: Batak,
  bali: Bali,
  tionghoa: Tionghoa,
  bugis: Bugis,
  melayu: Melayu,
};

/**
 * How hard each tile may be pressed into the page as a full-bleed ground.
 *
 * Not a taste knob and not one shared number: it is the tile's ink coverage,
 * which is a property of the drawing. Parang is hairlines and mlinjon dots and
 * covers a few percent of its box, so at 0.05 it reads as texture. Poleng is a
 * plain check — literally half the tile is filled — so the same 0.05 renders a
 * hard chequerboard behind the text and shifts contrast letter by letter. The
 * value is what makes the *weave* read at the same weight, not the tile.
 *
 * Bands are unaffected: those sit on `--soft` where no text ever lands, so they
 * stay at full strength and the culture still arrives loud on the cover.
 */
export const GROUND_ALPHA: Record<AdatId, number> = {
  jawa: 0.05, // diagonal hairlines + dots
  sunda: 0.05, // open scallop arcs
  minang: 0.05, // triangle row, sparse
  batak: 0.045, // vertical warp stripes, continuous but thin
  bali: 0.055, // patra punggel line work, open
  tionghoa: 0.04, // lattice + glyph, medium
  bugis: 0.05, // thin plaid
  melayu: 0.032, // eight-point stars on a grid, dense
};

/**
 * What a pack lays down as its ground, when that is not the motif it bands
 * with. One entry, and the reason is in `BaliGround`: a plain check cannot be
 * wallpaper. Everything else grounds with the tile it bands with, which is why
 * this is an override map and not a second full table.
 */
export const GROUND_MOTIFS: Partial<Record<AdatId, Motif>> = {
  bali: BaliGround,
};
