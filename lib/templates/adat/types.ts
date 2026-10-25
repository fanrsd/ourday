import type { ComponentType } from "react";

/**
 * Adat as data, not as eight components.
 *
 * The first cut of this only varied the motif, the palette and the words, and
 * eight designs came out looking like one design in eight colourways — because
 * that is exactly what they were. What separates a Javanese invitation from a
 * Batak one is not only its colour: it is the shape the culture builds. Jawa
 * puts a gunungan over things, Minang an upswept gonjong roof, Bali a split
 * candi bentar, Tionghoa a round moon gate, Bugis the four-sided sulapa' eppa.
 *
 * So a pack carries architecture too — an enclosure, a rule, an edge treatment
 * and where a section announces itself — and the shared component is the
 * plumbing those hang on. Adding a ninth adat is still a data file; it is still
 * not a new component and not a new test.
 *
 * This is the same trade as planner_items: seven features, one table. The lesson
 * is that the table has to hold what actually differs.
 */
export type AdatId =
  | "jawa"
  | "sunda"
  | "minang"
  | "batak"
  | "bali"
  | "tionghoa"
  | "bugis"
  | "melayu";

/**
 * Colour is not decoration here. Balinese poleng is black, white and red because
 * that is what poleng means; a Minang design is gold on deep red because that is
 * songket. Letting a couple recolour these into pastel would erase the thing
 * they picked the template for, so the pack owns the palette and the generic
 * theme picker does not apply to adat designs.
 */
export type AdatPalette = {
  /** Page background. */
  bg: string;
  /** Body text. */
  fg: string;
  /** The one colour that carries the culture — used for rules, motifs, accents. */
  accent: string;
  /** Tinted panel behind cards and quiet sections. */
  soft: string;
  /** Hairlines and dividers. */
  line: string;
  /** Deepest tone, for inverted blocks such as the cover. */
  deep: string;
};

/**
 * The words. This is the part no competitor bothers with, and the part a family
 * notices immediately: a Javanese invitation that says "Rangkaian Acara" instead
 * of naming Siraman and Panggih reads as a generic template with batik pasted on.
 */
export type AdatVocab = {
  /** Greeting across the cover, in the language of the culture. */
  greeting: string;
  /** Small label above the couple's names, e.g. "Nuwun Rawuhipun". */
  invitationLabel: string;
  /** Section heading for the ceremonies. */
  eventsTitle: string;
  /** Ceremonies a couple of this culture is likely to hold, offered in the editor. */
  eventSuggestions: string[];
  /** Heading above the two families. */
  coupleTitle: string;
  /** How the groom's parents are introduced. */
  groomLine: string;
  /** How the bride's parents are introduced. */
  brideLine: string;
  /** Closing blessing at the foot of the page. */
  closing: string;
};

export type AdatPack = {
  id: AdatId;
  /** Shown in the gallery, e.g. "Adat Jawa". */
  name: string;
  blurb: string;
  palette: AdatPalette;
  vocab: AdatVocab;
};

/**
 * A motif is a seamless, tileable SVG pattern rendered at whatever opacity the
 * layout needs. Every one of these is geometric by nature — parang is a repeated
 * diagonal blade, kawung is intersecting circles, poleng is a check, ulos is warp
 * striping — which is why they are drawn rather than generated: a real motif has
 * rules, and an image model does not know them.
 */
export type MotifProps = {
  /** Unique id for the <pattern> element; two motifs on one page must not collide. */
  id: string;
  /** Stroke and fill colour. */
  color: string;
  /** Tile size in px. */
  scale?: number;
  opacity?: number;
  className?: string;
};

export type Motif = ComponentType<MotifProps>;

/**
 * A drawn shape that encloses or separates, rather than tiles.
 *
 * Unlike a motif it is never repeated and never sits behind text: it is the
 * architecture of the page — the arch over the names, the mark between a
 * heading and its content. It stretches to whatever box it is given, so a crest
 * and a rule are the same type at different sizes.
 *
 * `currentColor` throughout, so the caller decides the ink with a text colour
 * and one drawing serves both a full-strength crest and a quiet divider.
 */
export type Ornament = ComponentType<{ className?: string }>;

/**
 * The shape language of one culture, applied in four places so it is felt on
 * the whole page rather than only on the cover.
 *
 * Four and not forty: this is a catalogue of designs, not a page builder. Each
 * value has to be something the culture actually builds, and anything that
 * cannot be said with these belongs in the crest drawing itself.
 */
export type AdatShape = {
  /** The enclosure the couple's names sit inside on the cover. */
  crest: Ornament;
  /** The mark under a section heading. Repeats down the page. */
  rule: Ornament;
  /**
   * How a card is bounded.
   * - `frame` — a full rule around it, the default carpentry.
   * - `band` — a heavy bar along the top edge only, no sides: ulos and songket
   *   are woven end-bands, not boxes.
   * - `arch` — the top corners swept up, for the cultures that build arches.
   * - `split` — a gap down the middle of the top rule, after candi bentar.
   */
  card: "frame" | "band" | "arch" | "split";
  /** Whether a section announces itself on the centre line or off to the side. */
  align: "center" | "start";
};
