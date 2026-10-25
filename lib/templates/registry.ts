/**
 * The catalogue. Data only, so the marketing pages and the editor can both list
 * designs without importing the components that render them.
 *
 * Adding a design is: one entry here, one component in this folder. There is no
 * page builder and no drag-and-drop — the thing that sells this product is a
 * small number of genuinely good templates, not an infinite number of knobs.
 */
export type ModernTemplateId = "klasik" | "modern" | "botani" | "senja" | "monokrom";

/** Adat designs are `adat-<culture>`; all eight render through one component. */
export type AdatTemplateId =
  | "adat-jawa"
  | "adat-sunda"
  | "adat-minang"
  | "adat-batak"
  | "adat-bali"
  | "adat-tionghoa"
  | "adat-bugis"
  | "adat-melayu";

export type TemplateId = ModernTemplateId | AdatTemplateId;

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  blurb: string;
  /** Which gallery tab it belongs under. */
  group: "Pilihan" | "Adat";
  /**
   * Palette that flatters this layout. Adat designs ignore it: their colour is
   * part of the culture, not a preference, so the pack owns it.
   */
  suggestedPalette: "sand" | "rose" | "sage" | "ink";
};

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "klasik",
    name: "Klasik",
    blurb: "Serif tinggi, banyak ruang kosong, tanpa ornamen. Untuk akad yang khidmat.",
    group: "Pilihan",
    suggestedPalette: "sand",
  },
  {
    id: "modern",
    name: "Modern",
    blurb: "Tipografi besar dan grid tegas. Terbaca sekali lihat di layar kecil.",
    group: "Pilihan",
    suggestedPalette: "ink",
  },
  {
    id: "botani",
    name: "Botani",
    blurb: "Hijau teduh dan foto besar. Cocok untuk resepsi outdoor.",
    group: "Pilihan",
    suggestedPalette: "sage",
  },
  {
    id: "senja",
    name: "Senja",
    blurb: "Hangat dan intim, aksen mawar tua. Untuk acara sore.",
    group: "Pilihan",
    suggestedPalette: "rose",
  },
  {
    id: "monokrom",
    name: "Monokrom",
    blurb: "Hitam putih, nol dekorasi. Undangan yang tidak berusaha keras.",
    group: "Pilihan",
    suggestedPalette: "ink",
  },
  {
    id: "adat-jawa",
    name: "Adat Jawa",
    blurb: "Parang dan sogan. Menyebut Siraman, Midodareni, Panggih, Ngunduh Mantu.",
    group: "Adat",
    suggestedPalette: "sand",
  },
  {
    id: "adat-sunda",
    name: "Adat Sunda",
    blurb: "Mega mendung berlapis. Ngeuyeuk Seureuh sampai Saweran, disapa wilujeng sumping.",
    group: "Adat",
    suggestedPalette: "sand",
  },
  {
    id: "adat-minang",
    name: "Adat Minang",
    blurb: "Songket emas di atas merah tua. Manjapuik Marapulai dan Baralek Gadang.",
    group: "Adat",
    suggestedPalette: "rose",
  },
  {
    id: "adat-batak",
    name: "Adat Batak",
    blurb: "Jalur ulos merah, hitam, putih. Martumpol, Pemberkatan, Marunjuk. Horas.",
    group: "Adat",
    suggestedPalette: "ink",
  },
  {
    id: "adat-bali",
    name: "Adat Bali",
    blurb: "Poleng hitam putih dengan aksen merah. Mekala-kalaan dan Pawiwahan.",
    group: "Adat",
    suggestedPalette: "ink",
  },
  {
    id: "adat-tionghoa",
    name: "Adat Tionghoa",
    blurb: "Merah dan emas, lambang 囍. Sangjit, Teapai, sampai resepsi.",
    group: "Adat",
    suggestedPalette: "rose",
  },
  {
    id: "adat-bugis",
    name: "Adat Bugis-Makassar",
    blurb: "Kotak sutra lipa' sabbe. Mappacci, akad, lalu resepsi.",
    group: "Adat",
    suggestedPalette: "sage",
  },
  {
    id: "adat-melayu",
    name: "Adat Melayu",
    blurb: "Tampuk manggis dan tenun. Akad, Tepung Tawar, Bersanding.",
    group: "Adat",
    suggestedPalette: "sand",
  },
];

export const DEFAULT_TEMPLATE: TemplateId = "klasik";

export function isTemplateId(v: string): v is TemplateId {
  return TEMPLATES.some((t) => t.id === v);
}
