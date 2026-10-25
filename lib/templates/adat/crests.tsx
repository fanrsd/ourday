import type { ComponentProps } from "react";
import type { AdatId, Ornament } from "./types.ts";

/**
 * Sixteen drawings: a crest and a rule for each adat.
 *
 * The motifs give a page its surface. These give it its shape, and shape is the
 * thing a buyer actually compares — two invitations with the same architecture
 * and different backgrounds are one design in two colourways. So each crest is
 * built from what that culture literally builds: a gunungan is a wayang
 * silhouette, a gonjong is a roof, a candi bentar is a gate cut in half. None of
 * them is an "ethnic" flourish, because a flourish is the same drawing eight
 * times with the corners moved.
 *
 * Every crest is authored in one 340x420 portrait box, the size of a phone
 * cover, and sits behind the couple's names — so the centre carries no fill and
 * no fine detail, and the mass goes to the crown, the shoulders and the base
 * where the type is not. `preserveAspectRatio` is chosen per culture, not
 * globally: a moon gate stretched into an ellipse is not a moon gate, while a
 * rumah gadang roof that fails to reach both edges is not a rumah gadang.
 *
 * Rules are the same shape language reduced to a 120x16 strip, read at 64-110px.
 * At that width anything with interior detail turns to grey mush, so each rule
 * is a handful of strokes and nothing else.
 *
 * Ink is `currentColor` throughout with tone carried by fill/stroke opacity, so
 * one drawing serves a full-strength cover crest and a quiet divider.
 */

const CW = 340;
const CH = 420;
const RW = 120;
const RH = 16;

function mirrorAt(w: number): string {
  return `translate(${w} 0) scale(-1 1)`;
}

const CMIRROR = mirrorAt(CW);
const RMIRROR = mirrorAt(RW);
const CFLIP = `translate(0 ${CH}) scale(1 -1)`;

type ShellProps = ComponentProps<"svg"> & { fit?: string };

function Crest({ className, fit = "xMidYMid meet", children, ...rest }: ShellProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      style={{ pointerEvents: "none" }}
      width="100%"
      height="100%"
      viewBox={`0 0 ${CW} ${CH}`}
      preserveAspectRatio={fit}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      {...rest}
    >
      {children}
    </svg>
  );
}

function Rule({ className, children, ...rest }: ShellProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      style={{ pointerEvents: "none" }}
      width="100%"
      height="100%"
      viewBox={`0 0 ${RW} ${RH}`}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      {...rest}
    >
      {children}
    </svg>
  );
}

/**
 * Six of the eight forms are mirror-symmetric about the vertical axis, because
 * a gate, an arch and a roof are built that way. Authoring one half and
 * reflecting it is not a shortcut: it is the only way the two halves stay
 * exactly equal when the curve is edited.
 */
type PairProps = ComponentProps<"path"> & { t?: string; m?: string };

function Pair({ d, t, m = CMIRROR, ...rest }: PairProps) {
  return (
    <>
      <path d={d} transform={t} {...rest} />
      <path d={d} transform={t ? `${m} ${t}` : m} {...rest} />
    </>
  );
}

function diamond(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx} ${cy - ry} L ${cx + rx} ${cy} L ${cx} ${cy + ry} L ${cx - rx} ${cy} Z`;
}

// ---------------------------------------------------------------- jawa -------

/**
 * Gunungan (kayon) — the mountain the dalang plants centre-stage before the
 * story starts.
 *
 * Four step-outs on each flank, and the flank between them is very nearly
 * straight: a kayon is cut from a hide with a knife, so its edge is a sequence
 * of ruled runs and hard notches, never one continuous bulge. Rounding those
 * runs is what turns the drawing into a dome, which is a mosque and not a
 * mountain. The flank stands vertical for the last quarter so the mass is at
 * the base, and the widest part of the body falls across the middle of the
 * cover, which is where the names have to fit.
 */
const GUNUNGAN =
  "M 170 6 L 178 78 L 192 78 L 208 134 L 226 134 L 268 212 L 288 212 " +
  "L 302 300 L 316 300 L 316 384";

// Shrinking about the plinth centre keeps the echo standing on the same ground.
const GUNUNGAN_ECHO = "translate(170 384) scale(0.88) translate(-170 -384)";

const JawaCrest: Ornament = ({ className }) => (
  <Crest className={className}>
    <Pair d={GUNUNGAN} />
    <Pair d={GUNUNGAN} t={GUNUNGAN_ECHO} strokeWidth={1.3} strokeOpacity={0.45} />
    {/* The finial: a bud the spire runs into, solid so the crown reads first. */}
    <path d="M 170 0 L 177 24 L 170 44 L 163 24 Z" fill="currentColor" fillOpacity={0.85} />
    {/* Flare ticks on the notches, which is where a kayon's shoulders are. */}
    <Pair d="M 192 78 L 202 72 M 226 134 L 238 128 M 288 212 L 300 208" strokeWidth={2.2} />
    <rect x={30} y={384} width={280} height={24} fill="currentColor" fillOpacity={0.12} />
    <rect x={30} y={384} width={280} height={24} />
    <path d="M 12 416 H 328" strokeWidth={4} />
  </Crest>
);

const JawaRule: Ornament = ({ className }) => (
  <Rule className={className}>
    <path d="M 2 13 H 44 M 76 13 H 118" />
    <path d="M 44 13 L 52 13 L 52 8 L 57 8 L 60 1 L 63 8 L 68 8 L 68 13 L 76 13" />
  </Rule>
);

// --------------------------------------------------------------- sunda -------


/**
 * Julang ngapak — "a bird spreading its wings", the Sundanese roof whose eaves
 * break outward and lift at the ends.
 *
 * The first version of this crest was mega mendung, and it was the one drawing
 * here that failed: mega mendung is already the Sunda ground, so the cover was
 * saying the same word twice and the crest read as noise over a motif that was
 * more legible than it. Every other pack sets its architecture against its
 * textile; this one now does too. Clouds stay on the cloth, the roof takes the
 * cover.
 *
 * Two tiers, because julang ngapak is stacked, and the break in each slope is
 * the whole signature — a straight rafter to the eave is any roof at all.
 * `fit="none"`: it has to reach both edges to be a roof, and the geometry is
 * ruled lines that survive the stretch.
 */
function wing(ridgeY: number, eaveY: number, tipY: number, half: number, breakAt: number): string {
  const cx = CW / 2;
  return (
    `M ${cx} ${ridgeY} L ${cx - breakAt} ${eaveY} L ${cx - half} ${tipY} ` +
    `M ${cx} ${ridgeY} L ${cx + breakAt} ${eaveY} L ${cx + half} ${tipY}`
  );
}

const SundaCrest: Ornament = ({ className }) => (
  <Crest className={className} fit="none" strokeWidth={2.6}>
    {/* Upper tier. The tips lift above the eave line — that rise is the wing. */}
    <path d={wing(34, 104, 88, 168, 96)} strokeWidth={3.4} />
    <path d={wing(48, 112, 98, 156, 92)} strokeOpacity={0.55} />
    <path d="M 152 34 h 36" strokeWidth={5} strokeLinecap="round" />

    {/* Lower tier, wider and shallower, the way the roof steps down a bale. */}
    <path d={wing(150, 214, 200, 170, 108)} strokeWidth={3.4} />
    <path d={wing(164, 222, 210, 158, 104)} strokeOpacity={0.55} />

    {/* The posts and the raised floor a bale stands on. */}
    {[92, 170, 248].map((x) => (
      <path key={x} d={`M ${x} 330 V 386`} strokeOpacity={0.5} />
    ))}
    <path d="M 44 330 H 296" strokeWidth={3.4} />
    <path d="M 34 392 H 306" strokeWidth={3.4} />
    <path d="M 52 402 H 288" strokeOpacity={0.45} />
  </Crest>
);

const SundaRule: Ornament = ({ className }) => (
  <Rule className={className}>
    {/* The same roof, three strokes: ridge, the break, and tips that finish
        higher than the eave they came from. */}
    <path d="M 60 3 L 42 11 L 28 8 M 60 3 L 78 11 L 92 8" />
    <path d="M 60 8 L 50 12 M 60 8 L 70 12" strokeOpacity={0.55} />
    <path d="M 2 14 H 26 M 94 14 H 118" />
  </Rule>
);

// -------------------------------------------------------------- minang -------

/**
 * Rumah gadang. Four rules, and all four have to hold or it turns into a crown:
 * the gonjong leaves its tip steeply and flattens into the valley, so the sweep
 * is a buffalo horn and not the side of a triangle; the roof is thickest at the
 * ridge and thins to nothing at the tips, so the peaks are a roof and not a row
 * of points; the eave lifts at the corners instead of running level, which is
 * the line a crown does not have; and the outermost horn leans out past that
 * eave, which is why the house reads as wider than its own walls.
 *
 * Authored to touch both edges and stretched rather than fitted, because a
 * rumah gadang that stops short of the margins reads as a tent.
 */
// The roof sits high in the box: everything below the fascia is wall, and the
// wall is where the names go.
const GONJONG =
  "M 2 6 C 28 52 52 92 88 108 C 106 96 120 72 128 40 " +
  "C 140 64 155 82 170 92 L 170 150 C 120 148 62 138 22 116 " +
  "C 16 86 6 44 2 6 Z";

const MinangCrest: Ornament = ({ className }) => (
  <Crest className={className} fit="none" strokeWidth={2.6}>
    <Pair d={GONJONG} fill="currentColor" fillOpacity={0.12} />
    {/* One batten line following the roof plane. It stops short of the tip, as battens do. */}
    <Pair d="M 34 108 C 82 128 128 138 168 140" strokeWidth={1.2} strokeOpacity={0.5} />
    {/* The head of the wall is drawn as a rule, not a filled band: a solid bar this
        close under the eave lands straight on the first line of the names. */}
    <path d="M 58 150 H 282 M 58 158 H 282" strokeWidth={2.2} />
    {/* Walls lean outward as they rise — the other half of the profile. */}
    <Pair d="M 58 168 L 74 344" strokeWidth={2.2} />
    <rect x={74} y={344} width={192} height={16} fill="currentColor" fillOpacity={0.12} />
    <rect x={74} y={344} width={192} height={16} strokeWidth={2.2} />
    {/* Stilts. A rumah gadang stands off the ground and the gap reads from far away. */}
    {[0, 1, 2, 3, 4].map((i) => (
      <path key={i} d={`M ${96 + i * 37} 360 V 394`} strokeWidth={2.2} />
    ))}
    <path d="M 52 400 H 288" strokeWidth={4} />
  </Crest>
);

const MinangRule: Ornament = ({ className }) => (
  <Rule className={className}>
    <path d="M 6 13 H 114" />
    <Pair d="M 60 13 C 50 12 42 9 32 1" m={RMIRROR} />
    <Pair d="M 92 13 C 88 12 84 10 79 6" m={RMIRROR} strokeWidth={1.2} />
  </Rule>
);

// --------------------------------------------------------------- batak -------

/**
 * Ulos and gorga together: the cloth is read by the rhythm of unequal warp
 * bands, the carving by right angles. Neither has a curve in it anywhere, so
 * neither does this — the crest is two woven end-bands with a carved field
 * between them, which is also how an ulos is actually worn.
 *
 * Band opacity is capped well below solid: at full strength two end-bands this
 * deep turn the cover into a letterbox and the names lose the page.
 */
const ULOS_BANDS: Array<[number, number, number]> = [
  [0, 11, 0.7],
  [15, 3, 0.3],
  [21, 3, 0.3],
  [27, 17, 0.5],
  [48, 4, 0.3],
  [55, 8, 0.7],
  [67, 3, 0.25],
  [72, 3, 0.25],
];

// Gorga hook: a square spiral, cut with a chisel that only ever turns 90 degrees.
const GORGA = "M 20 116 H 92 V 162 H 54 V 138 H 76";

const BatakCrest: Ornament = ({ className }) => (
  <Crest className={className} fit="none" strokeWidth={2.4}>
    {[undefined, CFLIP].map((t, k) => (
      <g key={k} transform={t}>
        {ULOS_BANDS.map(([y, h, o]) => (
          <rect key={y} x={0} y={y} width={CW} height={h} fill="currentColor" fillOpacity={o} />
        ))}
        {/* Ipon-ipon: the tooth row that finishes a band. Squares, never points. */}
        {Array.from({ length: 17 }, (_, i) => (
          <rect key={i} x={5 + i * 20} y={82} width={10} height={10} fill="currentColor" fillOpacity={0.5} />
        ))}
      </g>
    ))}
    {/* Selvedge rails hold the open field; the four gorga turn in at its corners. */}
    <Pair d="M 20 106 V 314" strokeWidth={5} />
    <Pair d={GORGA} strokeWidth={2.6} />
    <Pair d={GORGA} t={CFLIP} strokeWidth={2.6} />
  </Crest>
);

const BatakRule: Ornament = ({ className }) => (
  <Rule className={className}>
    <path d="M 0 3 H 120" strokeWidth={3} />
    <path d="M 0 8 H 120" strokeWidth={1} />
    <path d="M 0 13.5 H 120" strokeWidth={2} />
    <path d="M 34 13.5 V 8 H 42 M 86 3 V 8 H 78" strokeWidth={1.4} />
    <path d="M 56 3 V 13.5 M 64 3 V 13.5" strokeWidth={1} />
  </Rule>
);

// ---------------------------------------------------------------- bali -------

/**
 * Candi bentar — one gate built whole, then sliced down the middle and pulled
 * apart. Everything follows from the slice: the two halves are stepped
 * ziggurats, the profile is tallest at the cut face and steps down away from it,
 * and there is no lintel, because the gap is the doorway. The gap is also where
 * the names go, so the one form that must stay open in the middle is the one
 * that is defined by being open in the middle.
 */
const PYLON =
  "M 88 26 L 72 26 L 72 48 L 58 48 L 58 74 L 46 74 L 46 104 " +
  "L 38 104 L 38 176 L 30 176 L 30 250 L 20 250 L 20 322 L 12 322 L 12 372 " +
  "L 4 372 L 4 402 L 104 402 L 104 372 L 88 372 Z";

const BaliCrest: Ornament = ({ className }) => (
  <Crest className={className}>
    <Pair d={PYLON} fill="currentColor" fillOpacity={0.1} />
    {/* Carved tier joints, each on the step it belongs to. */}
    <Pair
      d="M 38 104 H 88 M 30 176 H 88 M 20 250 H 88 M 12 322 H 88"
      strokeWidth={1.2}
      strokeOpacity={0.55}
    />
    {/* The cap keeps stepping: a candi finial is the same ziggurat, smaller. */}
    <Pair d="M 72 26 L 72 16 L 80 16 L 80 6 L 88 6 L 88 26 Z" fill="currentColor" fillOpacity={0.85} />
    <path d="M 0 408 H 340" strokeWidth={4} />
  </Crest>
);

const BaliRule: Ornament = ({ className }) => (
  <Rule className={className}>
    <Pair d="M 4 15 V 11 H 26 V 7 H 42 V 3 H 52 V 15" m={RMIRROR} />
    <path d="M 0 15.5 H 120" strokeWidth={1.2} />
  </Rule>
);

// ------------------------------------------------------------ tionghoa -------

/**
 * Moon gate between two couplet boards. The circle has to be a true circle —
 * that is the entire idea, a round door cut in a straight wall — so this is the
 * one crest that must never be stretched. Everything touching it is square: the
 * couplet boards, the seals at their head and foot, and a key-fret bracket
 * astride each of the ring's four anchors, drawn once and rotated round the
 * centre so all four are necessarily the same bracket. The side brackets reach
 * the boards, which is what ties the round door into the straight wall.
 */
const RING_C = 212;
const RING_R = 118;
const KEY_FRET = `M 146 ${RING_C - RING_R} H 158 V ${RING_C - RING_R - 14} H 182 V ${RING_C - RING_R} H 194`;

const TionghoaCrest: Ornament = ({ className }) => (
  <Crest className={className}>
    <Pair d="M 4 40 H 38 V 384 H 4 Z" strokeWidth={2.6} />
    <Pair d="M 10 46 H 32 V 378 H 10 Z" strokeWidth={1} strokeOpacity={0.5} />
    <Pair d="M 13 56 H 29 V 76 H 13 Z" fill="currentColor" fillOpacity={0.85} strokeWidth={0} />
    <Pair d="M 13 348 H 29 V 368 H 13 Z" fill="currentColor" fillOpacity={0.85} strokeWidth={0} />
    <circle cx={170} cy={RING_C} r={RING_R} strokeWidth={3.2} />
    <circle cx={170} cy={RING_C} r={RING_R - 8} strokeWidth={1} strokeOpacity={0.5} />
    {[0, 90, 180, 270].map((a) => (
      <path key={a} d={KEY_FRET} transform={`rotate(${a} 170 ${RING_C})`} strokeWidth={2.6} />
    ))}
    <path d="M 56 398 H 284 M 76 406 H 264" strokeWidth={2.4} />
  </Crest>
);

const TionghoaRule: Ornament = ({ className }) => (
  <Rule className={className}>
    <Pair d="M 2 12 H 18 V 4 H 30 V 12 H 24" m={RMIRROR} />
    <Pair d="M 30 12 H 50" m={RMIRROR} />
    <circle cx={60} cy={8} r={6.5} />
  </Rule>
);

// --------------------------------------------------------------- bugis -------

/**
 * Sulapa' eppa — the four-cornered square, the Bugis account of a complete
 * world. Standing it on its corner is not a stylistic choice; that is the
 * orientation it is always drawn in, and it happens to open the widest part of
 * the figure exactly across the middle of the cover.
 *
 * Authored square rather than filling the box, because a rhombus taller than it
 * is wide has stopped being a square on its corner.
 */
const RH_CX = 170;
const RH_CY = 212;
const RH_R = 158;

const BugisCrest: Ornament = ({ className }) => (
  <Crest className={className}>
    <path d={diamond(RH_CX, RH_CY, RH_R, RH_R)} strokeWidth={3.2} />
    <path d={diamond(RH_CX, RH_CY, RH_R * 0.84, RH_R * 0.84)} strokeWidth={1.6} strokeOpacity={0.7} />
    {/* The four corners are the whole point of the figure, so they carry solid ink. */}
    {[
      [RH_CX, RH_CY - RH_R],
      [RH_CX + RH_R, RH_CY],
      [RH_CX, RH_CY + RH_R],
      [RH_CX - RH_R, RH_CY],
    ].map(([x, y]) => (
      <path
        key={`${x}:${y}`}
        d={diamond(x, y, 15, 15)}
        fill="currentColor"
        fillOpacity={0.9}
        strokeWidth={0}
      />
    ))}
    {/* Seed diamonds mid-span on each inner edge, as lipa' sabbe marks its crossings. */}
    {[
      [RH_CX + 66, RH_CY - 66],
      [RH_CX + 66, RH_CY + 66],
      [RH_CX - 66, RH_CY + 66],
      [RH_CX - 66, RH_CY - 66],
    ].map(([x, y]) => (
      <path key={`${x}:${y}`} d={diamond(x, y, 9, 9)} strokeWidth={1.6} />
    ))}
    {/* Crown diamond on a stem, so the apex has a top and not just a corner. */}
    <path d="M 170 40 V 26" strokeWidth={2} />
    <path d={diamond(RH_CX, 16, 12, 13)} fill="currentColor" fillOpacity={0.9} strokeWidth={0} />
    <path d="M 70 396 H 270 M 92 406 H 248" strokeWidth={2.6} />
  </Crest>
);

const BugisRule: Ornament = ({ className }) => (
  <Rule className={className}>
    <path d={diamond(60, 8, 9, 7)} />
    <path d={diamond(60, 8, 4, 3)} />
    <path d="M 2 8 H 44 M 76 8 H 118" />
    <Pair d={diamond(32, 8, 4, 3.5)} m={RMIRROR} fill="currentColor" strokeWidth={0} />
  </Rule>
);

// -------------------------------------------------------------- melayu -------

/**
 * The ogee — an S on each side meeting in a point, the arch over every Melayu
 * doorway and mimbar. A semicircle here would be Roman and wrong: the curve has
 * to be convex where it springs and concave where it closes, and the join has
 * to arrive at a point rather than a crown.
 *
 * Tampuk manggis, the mangosteen calyx the loom renders as an eight-point
 * rosette, is the boss on the spine and at each springing — the same motif that
 * runs across the cloth, doing the carpentry's job here. Its points are cut
 * shallow: a deep-cut star reads as a sparkle, which is a different and much
 * worse drawing.
 */
function rosette(cx: number, cy: number, R: number, r: number): string {
  const pts = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 2;
    const rad = i % 2 ? r : R;
    return `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  });
  return `M ${pts.join(" L ")} Z`;
}

const OGEE = "M 300 300 C 300 188 268 128 214 84 C 196 70 176 48 170 16";
const OGEE_INNER = "M 286 300 C 286 194 256 138 206 96 C 190 82 176 60 170 34";

const MelayuCrest: Ornament = ({ className }) => (
  <Crest className={className}>
    <Pair d={OGEE} strokeWidth={3.2} />
    <Pair d={OGEE_INNER} strokeWidth={1.3} strokeOpacity={0.5} />
    <Pair d="M 300 300 V 386" strokeWidth={3.2} />
    <path d={rosette(170, 78, 21, 16)} fill="currentColor" fillOpacity={0.9} strokeWidth={0} />
    <Pair d={rosette(300, 300, 14, 10.5)} fill="currentColor" fillOpacity={0.8} strokeWidth={0} />
    <rect x={16} y={386} width={308} height={22} fill="currentColor" fillOpacity={0.12} />
    <rect x={16} y={386} width={308} height={22} strokeWidth={2.6} />
  </Crest>
);

const MelayuRule: Ornament = ({ className }) => (
  <Rule className={className}>
    <Pair d="M 80 15 C 80 9 73 8 66 4 C 63 2.5 61.5 1.5 60 0.5" m={RMIRROR} />
    <path d="M 2 15 H 40 M 80 15 H 118" />
    <Pair d={diamond(80, 15, 3, 3)} m={RMIRROR} fill="currentColor" strokeWidth={0} />
  </Rule>
);

export const CRESTS: Record<AdatId, Ornament> = {
  jawa: JawaCrest,
  sunda: SundaCrest,
  minang: MinangCrest,
  batak: BatakCrest,
  bali: BaliCrest,
  tionghoa: TionghoaCrest,
  bugis: BugisCrest,
  melayu: MelayuCrest,
};

export const RULES: Record<AdatId, Ornament> = {
  jawa: JawaRule,
  sunda: SundaRule,
  minang: MinangRule,
  batak: BatakRule,
  bali: BaliRule,
  tionghoa: TionghoaRule,
  bugis: BugisRule,
  melayu: MelayuRule,
};
