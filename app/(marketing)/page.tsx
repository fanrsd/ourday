import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCTS } from "@/lib/products.ts";
import { TEMPLATES } from "@/lib/templates/registry.ts";
import { Story } from "./story.tsx";
import { Cta, Eyebrow, Section, SITE, rupiah } from "./ui.tsx";

const DESC =
  "Satu daftar tamu untuk tiga hal: wedding planner gratis, undangan website dengan link personal per tamu, dan buku tamu digital QR yang memakai token tamu yang sama.";

export const metadata: Metadata = {
  title: { absolute: "Undangan Digital, Buku Tamu QR & Wedding Planner — OurDay" },
  description: DESC,
  keywords: [
    "undangan digital",
    "undangan website",
    "buku tamu digital",
    "QR check-in pernikahan",
    "wedding planner",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Undangan Digital, Buku Tamu QR & Wedding Planner — OurDay",
    description: DESC,
    url: "/",
    siteName: "OurDay",
    locale: "id_ID",
    type: "website",
  },
};

const ORG = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "OurDay",
  url: SITE,
  description: DESC,
  areaServed: "ID",
  knowsLanguage: "id",
  sameAs: ["https://instagram.com/ourday.id"],
};

/** The seven planner tools, named the way a couple names them. */
const PLANNER_TOOLS = [
  "Anggaran",
  "To-do",
  "Rundown",
  "Seserahan",
  "Seragam",
  "Tabungan",
  "Vendor",
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG) }}
      />

      {/* ── Hero: editorial split. The argument first, the mechanism beside it. ── */}
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7 lg:pr-6">
            <Eyebrow>Satu tamu &middot; satu token &middot; tiga kejadian</Eyebrow>
            <h1 className="hd mt-7 text-[3.1rem] sm:text-[4.4rem] lg:text-[5.1rem]">
              Ketik daftar tamu <em>sekali</em>, pakai tiga kali.
            </h1>
            <p className="mt-8 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">
              Setahun merencanakan, satu malam mengundang, satu pagi menyambut di pintu.
              Nama, jatah pax, dan token yang sama membawa ketiganya — jadi tidak ada 400
              nama yang diketik ulang tiga kali ke tiga alat yang tidak saling bicara.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Cta href="/masuk">Mulai gratis di perencana</Cta>
              <Cta href="/desain" tone="paper">
                Lihat contoh undangan
              </Cta>
            </div>
            <p className="mt-6 max-w-md text-sm text-ink-soft">
              Perencananya gratis, tanpa kartu kredit. Undangan dan buku tamu dibeli
              belakangan, kalau kamu memang butuh.
            </p>
          </div>

          <div className="lg:col-span-5">
            <GuestCard />
          </div>
        </div>
      </section>

      {/* ── The three moments the hero just named, shown. ── */}
      <Story />

      {/* ── The gap between the three jobs is what actually costs money. ── */}
      <Section eyebrow="Kenapa ini penting">
        <div className="grid gap-12 lg:grid-cols-12">
          <h2 className="hd text-4xl sm:text-5xl lg:col-span-6">
            Yang merugikan bukan salah satu pekerjaannya, tapi jurang di antaranya.
          </h2>
          <div className="space-y-5 text-[1.02rem] leading-relaxed text-ink-soft lg:col-span-5 lg:col-start-8">
            <p>
              Anggaran di spreadsheet, to-do di catatan HP, rundown di dokumen yang dikirim
              bolak-balik ke MC. Undangan digital menyelesaikan sebagian, tapi RSVP-nya
              tidak akurat: satu orang bisa mengisi tiga kali dan tidak ada batas pax.
            </p>
            <p>
              Lalu di hari-H, buku tamu kertas mulai dari nol lagi. Jumlah RSVP tidak pernah
              dibandingkan dengan jumlah yang benar-benar hadir, jadi pasangan berikutnya
              tetap menebak.
            </p>
            <p className="text-ink">
              Karena ketiga kejadian menempel pada baris tamu yang sama, dashboard bisa
              menjawab pertanyaan yang hari ini tidak ada yang bisa jawab:
            </p>
          </div>
        </div>

        <dl className="mt-14 grid grid-cols-2 border-t border-line/70 lg:grid-cols-4">
          <Stat n="400" label="diundang" />
          <Stat n="312" label="menjawab hadir" />
          <Stat n="287" label="benar-benar datang" />
          <Stat n="25" label="tidak datang, dan ini namanya" tone="rose" />
        </dl>
        <p className="mt-4 text-xs text-ink-soft">
          Contoh angka dari satu pernikahan 400 tamu. Rekapmu memakai angkamu sendiri dan
          bisa diunduh sebagai CSV.
        </p>
      </Section>

      {/* ── Three products, not three equal cards. ── */}
      <Section eyebrow="Tiga produk, satu daftar tamu">
        <div className="grid gap-4 lg:grid-cols-12 lg:grid-rows-2">
          <Shell className="lg:col-span-7 lg:row-span-2">
            <div className="flex h-full flex-col">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="hd text-4xl sm:text-5xl">Wedding Planner</h3>
                <span className="whitespace-nowrap rounded-full border border-line px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-leaf">
                  Gratis
                </span>
              </div>
              <p className="mt-5 max-w-md leading-relaxed text-ink-soft">
                Dipakai 6&ndash;12 bulan sebelum hari-H, saat belum ada apa pun yang perlu
                dibeli. Tujuh daftar yang biasanya tersebar di spreadsheet, catatan HP, dan
                screenshot chat, dalam satu tempat yang tahu tanggal pernikahanmu.
              </p>
              <ul className="mt-7 flex flex-wrap gap-2">
                {PLANNER_TOOLS.map((t) => (
                  <li
                    key={t}
                    className="rounded-full border border-line px-3 py-1.5 text-[13px] text-ink-soft"
                  >
                    {t}
                  </li>
                ))}
              </ul>
              <dl className="mt-9 grid grid-cols-3 gap-4 rounded-2xl border border-line/70 bg-paper px-5 py-4">
                {[
                  ["Sisa hari", "212"],
                  ["Sisa anggaran", "Rp 70 jt"],
                  ["Lewat tenggat", "3 tugas"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[11px] text-ink-soft">{k}</dt>
                    <dd className="hd tabular mt-0.5 text-xl">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-ink-soft">
                Ringkasan yang dihitung dari tanggal pernikahanmu, bukan dari tujuh halaman
                yang harus kamu buka satu-satu.
              </p>
              <div className="mt-auto pt-9">
                <p className="hd text-3xl">Gratis selamanya</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Tanpa kuota, tanpa tier, tanpa kartu kredit.
                </p>
                <div className="mt-6">
                  <Cta href="/masuk">Buat perencana</Cta>
                </div>
              </div>
            </div>
          </Shell>

          <Shell className="lg:col-span-5">
            <h3 className="hd text-3xl">Undangan Website</h3>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Pilih template, isi data, terbitkan di <span className="text-ink">ourday.id/nama-kalian</span>.
              Tiap tamu dapat link berisi tokennya sendiri, dikirim ke WhatsApp satu klik.
            </p>
            <p className="mt-6 hd text-3xl tabular">{rupiah(PRODUCTS.invitation.price)}</p>
            <p className="mt-1 text-sm text-ink-soft">
              Bayar sekali &middot; aktif {PRODUCTS.invitation.activeDays} hari sejak lunas
            </p>
            <Link
              href="/desain"
              className="mt-5 inline-block text-sm text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
            >
              Lihat {TEMPLATES.length} template
            </Link>
          </Shell>

          <Shell className="lg:col-span-5">
            <h3 className="hd text-3xl">Buku Tamu Digital &amp; QR</h3>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Token yang sudah ada di tangan tamu sejak undangan dikirim, dipindai di meja
              penerima tamu. Tanpa cetak QR, tanpa aplikasi, tanpa daftar tamu kedua.
            </p>
            <p className="mt-6 hd text-3xl tabular">{rupiah(PRODUCTS.guestbook.price)}</p>
            <p className="mt-1 text-sm text-ink-soft">
              Bayar sekali &middot; aktif {PRODUCTS.guestbook.activeDays} hari sejak lunas
            </p>
            <Link
              href="/fitur#menyambut"
              className="mt-5 inline-block text-sm text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
            >
              Cara kerjanya di hari-H
            </Link>
          </Shell>
        </div>
      </Section>

      {/* ── Proof. We have no customers yet, so the proof is the mechanism. ── */}
      <Section eyebrow="Kenapa angkanya bisa dipercaya">
        <div className="grid gap-14 lg:grid-cols-12">
          <h2 className="hd text-4xl sm:text-5xl lg:col-span-5">
            Tiga hal yang kami tidak malaskan.
          </h2>
          <ol className="lg:col-span-6 lg:col-start-7">
            <Proof
              n="01"
              title="Satu token per tamu, bukan formulir terbuka"
              body="RSVP terikat pada orang, jadi tidak bisa diisi tiga kali dan tidak bisa mengonfirmasi enam orang kalau jatahnya dua. Batas pax ditegakkan di server, bukan cuma disembunyikan di tampilan — begitu juga batas waktu RSVP."
            />
            <Proof
              n="02"
              title="Check-in tetap jalan saat wifi gedung mati"
              body="Setiap pemindaian ditulis ke antrean di HP penerima tamu lebih dulu, lalu terkirim sendiri saat tersambung, dan tidak menggandakan hitungan kalau terkirim dua kali. Jumlah yang belum terkirim selalu terlihat, jadi penerima tamu tahu kapan aman meninggalkan meja."
            />
            <Proof
              n="03"
              title="Masa aktif berakhir, datamu tidak dihapus"
              body="Setelah masa aktif habis, halaman undangan berhenti tayang dan pemindai berhenti menerima. Dashboard tetap terbuka dan tamu, RSVP, serta kehadiran tetap bisa diunduh sebagai CSV."
              last
            />
          </ol>
        </div>
      </Section>

      {/* ── One call to action. ── */}
      <section className="border-t border-line/70">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <div className="rise max-w-3xl">
            <h2 className="hd text-[2.7rem] sm:text-6xl">
              Mulai dari daftar tamunya. Sisanya menyusul.
            </h2>
            <p className="mt-7 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">
              Buat perencana gratis hari ini, isi tamunya kapan pun kamu siap. Undangan dan
              buku tamu menunggu di daftar yang sama, dan tidak menagih apa pun sampai kamu
              menekannya.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
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

/** Outer shell + inner core, so a card reads as a plate set in a tray. */
function Shell({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={"rounded-[2rem] bg-white/55 p-1.5 ring-1 ring-ink/5 " + className}>
      <div className="mk-lift h-full rounded-[calc(2rem-0.375rem)] border border-line/70 bg-white p-7 sm:p-9">
        {children}
      </div>
    </div>
  );
}

function Stat({ n, label, tone }: { n: string; label: string; tone?: "rose" }) {
  return (
    <div className="border-b border-line/70 px-1 py-7 sm:py-9 lg:border-b-0">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span
          className={"hd tabular block text-5xl sm:text-6xl " + (tone ? "text-rose" : "")}
        >
          {n}
        </span>
        <span className="mt-2 block text-sm text-ink-soft">{label}</span>
      </dd>
    </div>
  );
}

function Proof({
  n,
  title,
  body,
  last,
}: {
  n: string;
  title: string;
  body: string;
  last?: boolean;
}) {
  return (
    <li
      className={
        "rise grid grid-cols-[2.5rem_1fr] gap-x-4 gap-y-2 py-7 " +
        (last ? "" : "border-b border-line/70")
      }
    >
      <span className="hd pt-0.5 text-lg text-rose">{n}</span>
      <h3 className="text-[1.05rem] font-medium">{title}</h3>
      <p className="col-start-2 leading-relaxed text-ink-soft">{body}</p>
    </li>
  );
}

/**
 * An honest mock of the guest row the product actually stores: one name, one
 * token, and the three timestamps that hang off it. No screenshot, no stock
 * photo — this is the same shape as the `guests` table.
 */
function GuestCard() {
  return (
    <div className="rounded-[2rem] bg-white/55 p-1.5 ring-1 ring-ink/5">
      <div className="rounded-[calc(2rem-0.375rem)] border border-line/70 bg-white p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.22em] text-ink-soft">
            Baris tamu
          </span>
          <span className="rounded-full bg-paper-deep px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-ink-soft">
            7QF2K8MD
          </span>
        </div>

        <p className="hd mt-5 text-3xl">Bu Retno Wijaya</p>
        <p className="mt-2 text-sm text-ink-soft">Keluarga &middot; Resepsi &middot; 2 pax</p>

        <ol className="mt-7 space-y-0">
          <Stamp label="Dikirim" value="12 Mei, lewat WhatsApp" />
          <Stamp label="Dibuka" value="12 Mei, 21.04" />
          <Stamp label="Menjawab" value="Hadir, 2 orang" accent />
          <Stamp label="Hadir" value="19.12, 2 orang dipindai" accent last />
        </ol>

        <p className="mt-6 border-t border-line/70 pt-5 text-sm leading-relaxed text-ink-soft">
          Satu baris ini yang dipakai undangan, RSVP, dan meja penerima tamu. Tidak ada
          salinan kedua yang bisa berbeda.
        </p>
      </div>
    </div>
  );
}

function Stamp({
  label,
  value,
  accent,
  last,
}: {
  label: string;
  value: string;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <li className="relative flex items-baseline gap-4 pb-5 pl-6 last:pb-0">
      <span
        aria-hidden="true"
        className={
          "absolute left-0 top-1.5 h-2 w-2 rounded-full " +
          (accent ? "bg-rose" : "bg-line")
        }
      />
      {last ? null : (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-[3.5px] top-4 w-px bg-line"
        />
      )}
      <span className="w-20 shrink-0 text-[13px] text-ink-soft">{label}</span>
      <span className="text-[13px] text-ink">{value}</span>
    </li>
  );
}
