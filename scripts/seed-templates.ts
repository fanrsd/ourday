/**
 * The template demos the /desain gallery links to — one per design, thirteen of
 * them, five modern and eight adat.
 *
 * These are ordinary published invitations, not a special route: a demo that
 * renders through a different code path stops being evidence of anything. Run
 * from migrate so a fresh database never ships a gallery of dead links — which
 * is exactly how they were dead in the first place.
 *
 * Idempotent: re-running refreshes content in place and adds nothing.
 */
import { randomUUID } from "node:crypto";
import { loadEnv } from "../lib/env.ts";
import { withCtx } from "../lib/db.ts";
import { requestLogin, consumeLogin } from "../lib/login.ts";
import { getOrCreateInvitation, updateInvitation, publishInvitation } from "../lib/invitations.ts";
import { TEMPLATES, type TemplateId, type TemplateMeta } from "../lib/templates/registry.ts";
import { ADAT_PACKS, adatIdOf } from "../lib/templates/adat/packs.ts";
import type { InvitationContent } from "../lib/invitation-content.ts";

loadEnv();

const DEMO_EMAIL = "demo@ourday.id";

type Demo = {
  g: string; gn: string; gp: string;
  b: string; bn: string; bp: string;
  venue: string; city: string;
};

/**
 * A different family per design, so the gallery reads as thirteen weddings
 * rather than one wedding photocopied thirteen times. The adat rows carry the
 * naming conventions of their own culture, because that is the detail a family
 * checks first: Batak mothers are named with their `boru` clan, Balinese names
 * carry birth order, Bugis names carry Andi and Besse.
 *
 * Record<TemplateId, …>: a design without a demo is a compile error, not a
 * gallery card that 404s.
 */
const COUPLES: Record<TemplateId, Demo> = {
  klasik:   { g: "Rizky Ananda",    gn: "Rizky",  gp: "Bpk. Sutrisno & Ibu Wahyuni", b: "Salsabila Putri", bn: "Salsa", bp: "Bpk. Anwar & Ibu Lestari", venue: "Masjid Agung Jawa Tengah", city: "Semarang" },
  modern:   { g: "Damar Wicaksono", gn: "Damar",  gp: "Bpk. Bambang & Ibu Yuni",     b: "Tara Meidina",    bn: "Tara",  bp: "Bpk. Rudi & Ibu Ratna",    venue: "The Hall Senayan City",    city: "Jakarta" },
  botani:   { g: "Arya Pradipta",   gn: "Arya",   gp: "Bpk. Gede & Ibu Komang",      b: "Ayu Larasati",    bn: "Ayu",   bp: "Bpk. Wayan & Ibu Nyoman",  venue: "Plataran Canggu",          city: "Bali" },
  senja:    { g: "Bagas Prasetyo",  gn: "Bagas",  gp: "Bpk. Slamet & Ibu Retno",     b: "Nadia Rahmawati", bn: "Nadia", bp: "Bpk. Hadi & Ibu Sri",      venue: "Gedung Wanita Candra",     city: "Surabaya" },
  monokrom: { g: "Fajar Nugroho",   gn: "Fajar",  gp: "Bpk. Hendra & Ibu Dewi",      b: "Kirana Maheswari", bn: "Kirana", bp: "Bpk. Joko & Ibu Endah",  venue: "Pendopo Ambarrukmo",       city: "Yogyakarta" },

  "adat-jawa": {
    g: "Danurwendo Prakoso", gn: "Danur", gp: "Bpk. Suryanto & Ibu Sumarni",
    b: "Sekar Ayuningtyas",  bn: "Sekar", bp: "Bpk. Widodo & Ibu Sri Rahayu",
    venue: "Pendapa Sasana Kridha", city: "Surakarta",
  },
  "adat-sunda": {
    g: "Raka Permana",       gn: "Raka",  gp: "Bpk. Endang Suryana & Ibu Euis Rohayati",
    b: "Cahya Purnamasari",  bn: "Cahya", bp: "Bpk. Dedi Kurniawan & Ibu Nining Sumiati",
    venue: "Gedung Serbaguna Sabilulungan", city: "Bandung",
  },
  "adat-minang": {
    g: "Fauzan Malik",       gn: "Fauzan", gp: "Bpk. H. Amiruddin & Ibu Hj. Rosniati",
    b: "Zahra Amelia",       bn: "Zahra",  bp: "Bpk. H. Zainal Arifin & Ibu Hj. Nurmalis",
    venue: "Balai Adat Nagari Pariangan", city: "Tanah Datar",
  },
  "adat-batak": {
    // `br.` is boru: a Batak mother is named with the clan she was born into.
    g: "Ruben Simatupang",   gn: "Ruben",  gp: "Bpk. J. Simatupang & Ibu R. br. Sitorus",
    b: "Debora Hutasoit",    bn: "Debora", bp: "Bpk. M. Hutasoit & Ibu T. br. Nainggolan",
    venue: "Sopo Godang HKBP Balige", city: "Toba",
  },
  "adat-bali": {
    g: "I Gede Adnyana",     gn: "Gede",  gp: "I Wayan Sudiarta & Ni Made Ratih",
    b: "Ni Luh Padmawati",   bn: "Padma", bp: "I Nyoman Suwecana & Ni Ketut Sriani",
    venue: "Wantilan Puri Agung", city: "Gianyar",
  },
  "adat-tionghoa": {
    g: "Kevin Wijaya",       gn: "Kevin",    gp: "Bpk. Andi Wijaya & Ibu Lina Halim",
    b: "Michelle Tanadi",    bn: "Michelle", bp: "Bpk. Robert Tanadi & Ibu Mei Ling",
    venue: "Grand Ballroom Wisma Dharma", city: "Medan",
  },
  "adat-bugis": {
    g: "Andi Muhammad Faisal", gn: "Faisal", gp: "Bpk. H. Andi Baso & Ibu Hj. Andi Tenri",
    b: "Besse Nurul Hikmah",   bn: "Besse",  bp: "Bpk. H. Muhammad Yusuf & Ibu Hj. Sitti Aminah",
    venue: "Baruga Adat Sudiang", city: "Makassar",
  },
  "adat-melayu": {
    g: "Muhammad Iqbal Hakim", gn: "Iqbal",  gp: "Bpk. H. Zulkifli & Ibu Hj. Rohana",
    b: "Aisyah Zulaikha",      bn: "Aisyah", bp: "Bpk. H. Amran & Ibu Hj. Maimunah",
    venue: "Balai Adat Melayu Riau", city: "Pekanbaru",
  },
};

const dayAt = (offset: number) =>
  new Date(Date.now() + (120 + offset) * 864e5).toISOString().slice(0, 10);

const day = dayAt(0);

/**
 * An adat wedding is not one afternoon: the preparations run on the days before
 * and the reception closes it. Three slots, filled from the tail of the pack's
 * own ceremony list so the last one is always the reception on `day`.
 */
const SLOTS = [
  { d: -2, s: "09:00", e: "11:00" },
  { d: -1, s: "16:00", e: "18:00" },
  { d: 0, s: "18:30", e: "21:00" },
];

function eventsFor(t: TemplateMeta, c: Demo): InvitationContent["events"] {
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(c.venue + " " + c.city)}`;
  const address = `${c.venue}, ${c.city}`;
  const adat = adatIdOf(t.id);

  if (!adat) {
    return [
      { name: "Akad Nikah", startsAt: `${day}T08:00`, endsAt: `${day}T10:00`,
        venue: c.venue, address, mapsUrl },
      { name: "Resepsi", startsAt: `${day}T18:30`, endsAt: `${day}T21:00`,
        venue: c.venue, address },
    ];
  }

  // ponytail: three of the pack's ceremonies, not all of them. A demo is a
  // sample of the vocabulary; the editor offers the whole list.
  const picked = ADAT_PACKS[adat].vocab.eventSuggestions.slice(-SLOTS.length);
  const slots = SLOTS.slice(-picked.length);
  return picked.map((name, i) => {
    const d = dayAt(slots[i]!.d);
    return {
      name,
      startsAt: `${d}T${slots[i]!.s}`,
      endsAt: `${d}T${slots[i]!.e}`,
      venue: c.venue,
      address,
      mapsUrl,
    };
  });
}

// Wall clock, exactly what <input type="datetime-local"> writes.
const content = (t: TemplateMeta, c: Demo): InvitationContent => ({
  couple: {
    groom: { fullName: c.g, nickName: c.gn, parents: c.gp },
    bride: { fullName: c.b, nickName: c.bn, parents: c.bp },
  },
  events: eventsFor(t, c),
  story: [
    { date: "2020-08-17", title: "Pertama bertemu", body: `Di sebuah acara kecil di ${c.city}, tanpa firasat apa pun.` },
    { date: "2023-05-02", title: "Menjadi kami", body: "Memutuskan untuk berjalan searah, dengan restu dua keluarga." },
    { date: "2025-11-09", title: "Melamar", body: "Di ruang tamu, disaksikan orang-orang yang paling kami sayangi." },
  ],
  gallery: [],
  gifts: {
    banks: [{ bank: "BCA", number: "1234567890", holder: c.b }],
    ewallets: [{ bank: "GoPay", number: "081234567890", holder: c.b }],
    shippingAddress: `Jl. Melati No. 21, ${c.city}`,
  },
});

/**
 * Idempotent: a re-run refreshes the thirteen in place and creates nothing
 * extra. Does not close the pool — the caller owns its lifetime.
 */
export async function seedTemplateDemos(): Promise<void> {
  // Created through the real magic-link path because that is the only way a user
  // row may come into existence: the app role cannot insert into `users`, and RLS
  // is right to stop it. auth_consume_login upserts on email, so a re-run lands
  // on the same account.
  const ownerId = (await consumeLogin(
    new URL(await requestLogin(DEMO_EMAIL)).searchParams.get("token")!,
  ))!;

  for (const t of TEMPLATES) {
    const slug = `demo-${t.id}`;
    const c = COUPLES[t.id];

    // One wedding per template, found by the slug its invitation already carries.
    const [found] = await withCtx({ userId: ownerId }, (tx) =>
      tx<{ wedding_id: string }[]>`select wedding_id from invitations where slug = ${slug}`);

    let weddingId = found?.wedding_id;
    if (!weddingId) {
      const [{ app_create_wedding: id }] = await withCtx({ userId: ownerId }, (tx) =>
        tx<[{ app_create_wedding: string }]>`select app_create_wedding()`);
      weddingId = id;
    }

    await withCtx({ userId: ownerId }, async (tx) => {
      await tx`update weddings set groom_name = ${c.gn}, bride_name = ${c.bn}, event_date = ${day}
                where id = ${weddingId}`;
      // expires_at null: a showroom piece has no active period to run out.
      await tx`insert into orders (wedding_id, product, amount, provider_order_id,
                                   status, paid_at, expires_at)
               select ${weddingId}, 'invitation', 0, ${"demo-" + randomUUID()}, 'paid', now(), null
                where not exists (select 1 from orders
                                   where wedding_id = ${weddingId} and product = 'invitation')`;
    });

    const inv = await getOrCreateInvitation(ownerId, weddingId!);

    // Carry the cover across. This function rewrites `content` whole, so without
    // this every `npm run db:migrate` silently unlinks the demo cover photos —
    // which is exactly what happened once. The images stay on disk, so the only
    // symptom is four demos quietly losing their photograph.
    const next = content(t, c);
    const existingCover = inv.content?.couple?.coverPhoto;
    if (existingCover) next.couple.coverPhoto = existingCover;

    await updateInvitation(ownerId, inv.id, {
      slug,
      templateId: t.id,
      theme: { palette: t.suggestedPalette, display: t.id === "modern" ? "sans" : "serif" },
      content: next,
    });
    if (inv.status !== "published") await publishInvitation(ownerId, inv.id);

    console.log(`demo ready: /u/${slug}  (${t.name})`);
  }
}
