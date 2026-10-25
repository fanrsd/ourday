import type { Metadata } from "next";
import { PALETTES } from "@/lib/invitation-content.ts";
import { PRODUCTS } from "@/lib/products.ts";
import { TEMPLATES, type TemplateId, type TemplateMeta } from "@/lib/templates/registry.ts";
import { ADAT_PACKS, adatIdOf } from "@/lib/templates/adat/packs.ts";
import { Cta, Eyebrow, Section, rupiah } from "../ui.tsx";

const ADAT_COUNT = TEMPLATES.filter((t) => t.group === "Adat").length;

const DESC = `Galeri ${TEMPLATES.length} template undangan website, termasuk ${ADAT_COUNT} desain adat: Jawa, Sunda, Minang, Batak, Bali, Tionghoa, Bugis-Makassar, Melayu. Buka demo yang sesungguhnya, bukan tangkapan layar.`;

export const metadata: Metadata = {
  title: "Galeri template undangan digital",
  description: DESC,
  alternates: { canonical: "/desain" },
  openGraph: {
    title: "Galeri template undangan digital · OurDay",
    description: DESC,
    url: "/desain",
    siteName: "OurDay",
    locale: "id_ID",
    type: "website",
  },
};

const PALETTE_NAMES: Record<keyof typeof PALETTES, string> = {
  sand: "Pasir",
  rose: "Mawar tua",
  sage: "Sage",
  ink: "Tinta",
};

/** Deliberately uneven so the gallery reads as an editorial spread, not a grid of thumbnails. */
const SPANS = ["lg:col-span-3", "lg:col-span-3", "lg:col-span-2", "lg:col-span-2", "lg:col-span-2"];

const GROUPS: { group: TemplateMeta["group"]; note: string }[] = [
  {
    group: "Pilihan",
    note: "Desain netral yang cocok untuk hampir semua acara. Warna dan font bisa kamu ganti dari preset.",
  },
  {
    group: "Adat",
    note: "Motif, warna, dan nama acaranya mengikuti adatnya — bukan desain netral yang ditempeli ornamen. Warna dikunci per adat, karena di sini warna bagian dari adatnya.",
  },
];

export default function DesainPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-14 pt-16 sm:pt-24">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow>Desain</Eyebrow>
            <h1 className="hd mt-7 text-[3rem] sm:text-[4.2rem]">
              {TEMPLATES.length} template, semuanya bisa dibuka <em>sungguhan</em>.
            </h1>
          </div>
          <p className="self-end text-[1.02rem] leading-relaxed text-ink-soft lg:col-span-4 lg:col-start-9">
            Setiap demo di bawah adalah undangan yang benar-benar jalan, berisi data contoh
            &mdash; bukan tangkapan layar yang sudah dipercantik. Buka di HP-mu, gulir sampai
            habis, coba tombol RSVP-nya.
          </p>
        </div>
      </section>

      {GROUPS.map(({ group, note }) => {
        const list = TEMPLATES.filter((t) => t.group === group);
        return (
          <section key={group} className="mx-auto max-w-6xl px-5 pb-4 pt-10 first:pt-0">
            <div className="mb-7 flex flex-wrap items-baseline gap-x-4 gap-y-3 border-b border-line/70 pb-5">
              <h2 className="hd text-4xl sm:text-5xl">{group}</h2>
              <span className="text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                <span className="tabular">{list.length}</span> desain
              </span>
              <p className="w-full text-sm leading-relaxed text-ink-soft sm:max-w-2xl">{note}</p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {list.map((t, i) => (
                <Card
                  key={t.id}
                  t={t}
                  span={group === "Adat" ? "lg:col-span-2" : (SPANS[i] ?? "lg:col-span-2")}
                />
              ))}
            </ul>
          </section>
        );
      })}

      <Section eyebrow="Yang bisa kamu ubah">
        <div className="grid gap-12 lg:grid-cols-12">
          <h2 className="hd text-4xl sm:text-5xl lg:col-span-5">
            Preset terbatas, sengaja.
          </h2>
          <div className="space-y-6 leading-relaxed text-ink-soft lg:col-span-6 lg:col-start-7">
            <p>
              Kamu memilih template, palet warna, dan font dari preset yang sudah kami uji
              di layar kecil. Tidak ada kanvas bebas dan tidak ada drag-and-drop, karena
              yang menentukan undangan terlihat mahal atau murah adalah spasi dan tipografi
              &mdash; dan itu yang paling mudah rusak kalau semuanya bisa digeser.
            </p>
            <p className="text-ink">
              Ganti template kapan pun tanpa kehilangan data yang sudah diisi. Nama, acara,
              love story, galeri, dan daftar tamu menempel pada pernikahanmu, bukan pada
              desainnya, jadi bereksperimen tidak menghukum kamu.
            </p>
            <p>
              Butuh warna yang tidak ada di preset atau desain custom? Itu di luar yang kami
              jual, dan kami lebih memilih mengatakannya di sini daripada setelah kamu
              bayar.
            </p>
          </div>
        </div>
      </Section>

      <section className="border-t border-line/70">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <div className="rise max-w-2xl">
            <h2 className="hd text-[2.7rem] sm:text-6xl">
              Sudah ada yang cocok? Isi datanya dulu.
            </h2>
            <p className="mt-6 leading-relaxed text-ink-soft">
              Mulai dari perencana yang gratis, isi undangan sampai puas, dan bayar{" "}
              <span className="tabular">{rupiah(PRODUCTS.invitation.price)}</span> saat kamu
              siap menerbitkan. Template masih bisa diganti setelah itu.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Cta href="/masuk">Mulai gratis</Cta>
              <Cta href="/harga" tone="paper">
                Lihat harga
              </Cta>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * The swatches on a card have to be the colours the demo actually opens in. An
 * adat design ignores `suggestedPalette` — its pack owns the colour, because
 * poleng is not a preference — so the card reads the pack, otherwise the gallery
 * advertises pasir and hands you songket.
 */
function cardPalette(t: TemplateMeta) {
  const adat = adatIdOf(t.id);
  if (!adat) return { p: PALETTES[t.suggestedPalette], label: PALETTE_NAMES[t.suggestedPalette] };
  const { bg, fg, accent, soft } = ADAT_PACKS[adat].palette;
  return { p: { bg, fg, accent, soft }, label: "Warna adat" };
}

/** The width the preview is rendered at before it is scaled into the card. A
 *  phone, because that is what four hundred guests open the invitation on. */
const PREVIEW_W = 420;

function Card({ t, span }: { t: TemplateMeta; span: string }) {
  const { p, label } = cardPalette(t);
  return (
    <li className={span}>
      <div className="rise h-full rounded-[2rem] bg-white/55 p-1.5 ring-1 ring-ink/5">
        <div className="mk-lift flex h-full flex-col rounded-[calc(2rem-0.375rem)] border border-line/70 bg-white p-4">
          <Specimen id={t.id} name={t.name} />
          <div className="flex flex-1 flex-col px-3 pb-2 pt-6">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="hd text-3xl">{t.name}</h3>
              <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                {label}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{t.blurb}</p>
            <div className="mt-5 flex items-center gap-1.5">
              {/* Index keys: a poleng palette legitimately repeats a colour. */}
              {[p.bg, p.soft, p.accent, p.fg].map((c, i) => (
                <span
                  key={i}
                  className="h-4 w-4 rounded-full ring-1 ring-ink/10"
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="mt-auto pt-7">
              <Cta href={`/u/demo-${t.id}`} tone="paper">
                Buka demo {t.name}
              </Cta>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * The card shows the template, by being the template.
 *
 * This was a mock — one hand-drawn card recoloured per palette — and it
 * defended itself as "one source of truth, the demo is one click away". That
 * reasoning fails the one job a gallery has: someone deciding between thirteen
 * designs compares them side by side, and thirteen recolours of the same mock
 * say "thirteen palettes", not "thirteen designs". Every ornament, motif and
 * ground was invisible at exactly the moment it had to sell.
 *
 * An iframe of the real demo keeps the single source of truth and makes it
 * true: there is no screenshot to regenerate and nothing that can go stale,
 * because this *is* the page. Rendered at a phone width and scaled to the card
 * with container query units, so it stays a phone at every breakpoint.
 *
 * Inert on purpose — decorative, unfocusable, and hidden from screen readers,
 * which reach the same content through the link below it.
 */
function Specimen({ id, name }: { id: TemplateId; name: string }) {
  return (
    <div className="@container relative aspect-[4/5] overflow-hidden rounded-[1.1rem] border border-line/70">
      <iframe
        src={`/u/demo-${id}`}
        title={`Pratinjau ${name}`}
        loading="lazy"
        tabIndex={-1}
        aria-hidden="true"
        scrolling="no"
        className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
        style={{ width: PREVIEW_W, height: 900, transform: `scale(calc(100cqw / ${PREVIEW_W}))` }}
      />
    </div>
  );
}
