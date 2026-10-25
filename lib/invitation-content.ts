/**
 * The invitation document. Stored as one jsonb column because an invitation is
 * always read whole and never queried by part.
 *
 * Events are a list, not a fixed akad/resepsi pair: plenty of weddings have one
 * ceremony, and plenty have three.
 */
export type Person = {
  fullName: string;
  nickName: string;
  parents: string;
  photo?: string;
  instagram?: string;
};

export type WeddingEvent = {
  name: string;
  startsAt: string;
  endsAt?: string;
  venue: string;
  address: string;
  mapsUrl?: string;
};

export type Milestone = { date: string; title: string; body: string };
export type BankAccount = { bank: string; number: string; holder: string };

export type InvitationContent = {
  couple: { groom: Person; bride: Person; coverPhoto?: string };
  events: WeddingEvent[];
  story: Milestone[];
  gallery: string[];
  video?: string;
  gifts: { banks: BankAccount[]; ewallets: BankAccount[]; shippingAddress?: string };
  stream?: string;
  music?: string;
};

export type InvitationTheme = {
  palette: "sand" | "rose" | "sage" | "ink";
  display: "serif" | "sans";
};

export const EMPTY_PERSON: Person = { fullName: "", nickName: "", parents: "" };

export const EMPTY_CONTENT: InvitationContent = {
  couple: { groom: { ...EMPTY_PERSON }, bride: { ...EMPTY_PERSON } },
  events: [],
  story: [],
  gallery: [],
  gifts: { banks: [], ewallets: [] },
};

export const DEFAULT_THEME: InvitationTheme = { palette: "sand", display: "serif" };

export const PALETTES: Record<
  InvitationTheme["palette"],
  { bg: string; fg: string; accent: string; soft: string }
> = {
  sand: { bg: "#faf7f2", fg: "#241f1c", accent: "#b08340", soft: "#f2ece3" },
  rose: { bg: "#fdf6f5", fg: "#3a2226", accent: "#9c4a54", soft: "#f6e9e8" },
  sage: { bg: "#f5f8f4", fg: "#22301f", accent: "#4a6551", soft: "#e7efe6" },
  ink: { bg: "#f4f4f5", fg: "#18181b", accent: "#3f3f46", soft: "#e4e4e7" },
};

/** jsonb is unknown-shaped; fill gaps rather than crash an invitation on its wedding day. */
export function normaliseContent(raw: unknown): InvitationContent {
  const c = (raw ?? {}) as Partial<InvitationContent>;
  return {
    couple: {
      groom: { ...EMPTY_PERSON, ...(c.couple?.groom ?? {}) },
      bride: { ...EMPTY_PERSON, ...(c.couple?.bride ?? {}) },
      coverPhoto: c.couple?.coverPhoto,
    },
    events: Array.isArray(c.events) ? c.events : [],
    story: Array.isArray(c.story) ? c.story : [],
    gallery: Array.isArray(c.gallery) ? c.gallery : [],
    video: c.video,
    gifts: {
      banks: Array.isArray(c.gifts?.banks) ? c.gifts.banks : [],
      ewallets: Array.isArray(c.gifts?.ewallets) ? c.gifts.ewallets : [],
      shippingAddress: c.gifts?.shippingAddress,
    },
    stream: c.stream,
    music: c.music,
  };
}

export function normaliseTheme(raw: unknown): InvitationTheme {
  const t = (raw ?? {}) as Partial<InvitationTheme>;
  return {
    palette: t.palette && t.palette in PALETTES ? t.palette : DEFAULT_THEME.palette,
    display: t.display === "sans" ? "sans" : "serif",
  };
}
