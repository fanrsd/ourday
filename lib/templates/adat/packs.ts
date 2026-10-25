import type { AdatId, AdatPack } from "./types.ts";

/**
 * The eight cultures, as data.
 *
 * Two rules were followed throughout and both are load-bearing:
 *
 * 1. No invented ceremonies. Every name in `eventSuggestions` is one a family of
 *    that culture actually holds, spelled the way the culture spells it, in
 *    chronological order. Where a ritual has a regional variant name the common
 *    one wins; where the order genuinely varies by region the most widely
 *    documented order wins.
 * 2. Regional language only where it is idiomatic on a real invitation. Javanese,
 *    Sundanese and Malay invitations are written in the regional language, so
 *    they get it down to "Putra saking" / "Putri ti". Batak, Balinese, Bugis and
 *    Chinese-Indonesian invitations are written in Indonesian with the greeting
 *    and blessing in the regional language, so that is what they get. Forcing a
 *    half-remembered regional phrase into every slot would read as a machine
 *    guessing, which is the one thing this template cannot afford.
 *
 * Contrast: `fg` on `bg` is 9.7:1 at worst and `accent` on `bg` 6.8:1 at worst,
 * so both clear AA for body text on every pack. `accent` on `deep` does NOT —
 * on a `deep` block the text colour is the pack's lightest tone, which is `bg`
 * for the five light packs and `fg` for minang, tionghoa and bugis.
 */

// ponytail: `name` and `blurb` deliberately mirror the matching TEMPLATES entry
// in ../registry.ts rather than being imported from it — AdatPack demands them
// and the registry cannot import a pack without dragging colour into the
// catalogue. Two short strings duplicated; if they ever drift, registry wins for
// the gallery and this wins inside the invitation.

export const ADAT_PACKS: Record<AdatId, AdatPack> = {
  jawa: {
    id: "jawa",
    name: "Adat Jawa",
    blurb: "Parang dan sogan. Menyebut Siraman, Midodareni, Panggih, Ngunduh Mantu.",
    palette: {
      bg: "#F8F1E3",
      fg: "#2B1D10",
      accent: "#27356B",
      soft: "#EFE2CB",
      line: "#D6C3A2",
      deep: "#3D2716",
    },
    vocab: {
      greeting: "Sugeng Rawuh",
      invitationLabel: "Nuwun Rawuhipun",
      eventsTitle: "Rantaman Adicara",
      eventSuggestions: [
        "Siraman",
        "Midodareni",
        "Ijab Kabul",
        "Panggih",
        "Resepsi",
        "Ngunduh Mantu",
      ],
      coupleTitle: "Penganten Kekalih",
      groomLine: "Putra saking",
      brideLine: "Putri saking",
      closing: "Matur nuwun awit saking rawuh saha pangestunipun.",
    },
  },

  sunda: {
    id: "sunda",
    name: "Adat Sunda",
    blurb: "Mega mendung berlapis. Ngeuyeuk Seureuh sampai Saweran, disapa wilujeng sumping.",
    palette: {
      bg: "#F4F2EA",
      fg: "#14243E",
      accent: "#1D5490",
      soft: "#E4EAF0",
      line: "#BBCDDC",
      deep: "#0F2E52",
    },
    vocab: {
      greeting: "Wilujeng Sumping",
      invitationLabel: "Neda Kasumpingan",
      eventsTitle: "Runtuyan Acara",
      eventSuggestions: [
        "Ngeuyeuk Seureuh",
        "Akad Nikah",
        "Nincak Endog",
        "Saweran",
        "Huap Lingkung",
        "Sungkeman",
        "Resepsi",
      ],
      coupleTitle: "Kadua Panganten",
      groomLine: "Putra ti",
      brideLine: "Putri ti",
      closing: "Hatur nuhun kana rawuh sareng du'ana.",
    },
  },

  minang: {
    id: "minang",
    name: "Adat Minang",
    blurb: "Songket emas di atas merah tua. Manjapuik Marapulai dan Baralek Gadang.",
    palette: {
      bg: "#490C11",
      fg: "#F7E9CB",
      accent: "#D9A94A",
      soft: "#5E1217",
      line: "#83262A",
      deep: "#2C0709",
    },
    vocab: {
      greeting: "Salamaik Datang",
      invitationLabel: "Mohon Doa jo Restu",
      eventsTitle: "Rangkaian Baralek",
      eventSuggestions: [
        "Malam Bainai",
        "Akad Nikah",
        "Manjapuik Marapulai",
        "Basandiang",
        "Baralek Gadang",
      ],
      coupleTitle: "Anak Daro jo Marapulai",
      groomLine: "Putra dari",
      brideLine: "Putri dari",
      closing: "Tarimo kasih ateh doa jo restu Sanak sadonyo.",
    },
  },

  batak: {
    id: "batak",
    name: "Adat Batak",
    blurb: "Jalur ulos merah, hitam, putih. Martumpol, Pemberkatan, Marunjuk. Horas.",
    palette: {
      bg: "#F3EEE7",
      fg: "#17130F",
      accent: "#9E1B1F",
      soft: "#E5DCD0",
      line: "#C7BAA9",
      deep: "#17120E",
    },
    vocab: {
      greeting: "Horas",
      invitationLabel: "Tangiang dohot Pasu-pasu",
      eventsTitle: "Rangkaian Ulaon",
      eventSuggestions: [
        "Marhusip",
        "Martumpol",
        "Pemberkatan",
        "Pesta Adat (Marunjuk)",
        "Mangulosi",
      ],
      coupleTitle: "Kedua Mempelai",
      groomLine: "Putra dari",
      brideLine: "Putri dari",
      closing: "Horas! Horas! Horas!",
    },
  },

  bali: {
    id: "bali",
    name: "Adat Bali",
    blurb: "Poleng hitam putih dengan aksen merah. Mekala-kalaan dan Pawiwahan.",
    palette: {
      bg: "#F5F4F1",
      fg: "#121212",
      accent: "#A3231F",
      soft: "#E7E6E2",
      line: "#C9C8C4",
      deep: "#0D0D0D",
    },
    vocab: {
      greeting: "Om Swastyastu",
      invitationLabel: "Mohon Kehadiran dan Doa Restu",
      eventsTitle: "Rangkaian Upacara",
      eventSuggestions: [
        "Mesegehagung",
        "Mekala-kalaan",
        "Pawiwahan",
        "Resepsi",
        "Mejauman",
      ],
      coupleTitle: "Sang Penganten",
      groomLine: "Putra dari",
      brideLine: "Putri dari",
      closing: "Om Santih Santih Santih Om",
    },
  },

  tionghoa: {
    id: "tionghoa",
    name: "Adat Tionghoa",
    blurb: "Merah dan emas, lambang 囍. Sangjit, Teapai, sampai resepsi.",
    palette: {
      bg: "#7C1015",
      fg: "#FDF2D9",
      accent: "#F0C862",
      soft: "#8E171B",
      line: "#B4863C",
      deep: "#4E0709",
    },
    vocab: {
      greeting: "Shuang Xi 囍",
      invitationLabel: "Dengan Penuh Sukacita",
      eventsTitle: "Rangkaian Acara",
      eventSuggestions: ["Sangjit", "Tea Pai", "Pemberkatan", "Resepsi"],
      coupleTitle: "Kedua Mempelai",
      groomLine: "Putra dari",
      brideLine: "Putri dari",
      closing: "Bai Nian Hao He (百年好合) — semoga rukun hingga seratus tahun.",
    },
  },

  bugis: {
    id: "bugis",
    name: "Adat Bugis-Makassar",
    blurb: "Kotak sutra lipa' sabbe. Mappacci, akad, lalu resepsi.",
    palette: {
      bg: "#10291D",
      fg: "#EFEEDF",
      accent: "#D8B75E",
      soft: "#1A3527",
      line: "#33513C",
      deep: "#08170F",
    },
    vocab: {
      greeting: "Tabe'",
      invitationLabel: "Mohon Doa dan Restu",
      eventsTitle: "Rangkaian Acara Adat",
      eventSuggestions: [
        "Mappasili",
        "Mappacci",
        "Mappenre' Botting",
        "Akad Nikah",
        "Resepsi",
        "Mapparola",
      ],
      coupleTitle: "Kedua Mempelai",
      groomLine: "Putra dari",
      brideLine: "Putri dari",
      closing: "Sipakatau, Sipakalebbi, Sipakainge'.",
    },
  },

  melayu: {
    id: "melayu",
    name: "Adat Melayu",
    blurb: "Tampuk manggis dan tenun. Akad, Tepung Tawar, Bersanding.",
    palette: {
      bg: "#FAF0D6",
      fg: "#3E1226",
      accent: "#8E1F3F",
      soft: "#F2E3BB",
      line: "#DCC58E",
      deep: "#2A0A1A",
    },
    vocab: {
      greeting: "Selamat Datang",
      invitationLabel: "Sudilah Kiranya Hadir",
      eventsTitle: "Susunan Majlis",
      eventSuggestions: [
        "Menghantar Belanja",
        "Berinai",
        "Khatam Qur'an",
        "Akad Nikah",
        "Tepung Tawar",
        "Bersanding",
        "Resepsi",
      ],
      coupleTitle: "Kedua Pengantin",
      groomLine: "Putra dari",
      brideLine: "Putri dari",
      closing: "Semoga bahagia hingga ke akhir hayat.",
    },
  },
};

/**
 * `"adat-jawa"` -> `"jawa"`. Anything else, including an unknown adat suffix and
 * the five modern template ids, is null — the caller renders a modern template.
 */
export function adatIdOf(templateId: string): AdatId | null {
  const id = templateId.startsWith("adat-") ? templateId.slice(5) : "";
  return id in ADAT_PACKS ? (id as AdatId) : null;
}
