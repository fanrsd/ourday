import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCTS } from "@/lib/products.ts";
import { TEMPLATES } from "@/lib/templates/registry.ts";
import { Cta, Eyebrow, Section, SITE, WA_HREF, rupiah } from "../ui.tsx";

const DESC = `Perencana pernikahan gratis. Undangan website ${rupiah(
  PRODUCTS.invitation.price,
)} aktif ${PRODUCTS.invitation.activeDays} hari, buku tamu digital QR ${rupiah(
  PRODUCTS.guestbook.price,
)} aktif ${PRODUCTS.guestbook.activeDays} hari. Bayar sekali, tanpa langganan.`;

export const metadata: Metadata = {
  title: "Harga undangan digital & buku tamu QR",
  description: DESC,
  alternates: { canonical: "/harga" },
  openGraph: {
    title: "Harga undangan digital & buku tamu QR · OurDay",
    description: DESC,
    url: "/harga",
    siteName: "OurDay",
    locale: "id_ID",
    type: "website",
  },
};

const FAQ = [
  {
    q: "Apa yang terjadi kalau masa aktif habis?",
    a: "Halaman undangan publik berhenti tayang dan menampilkan keterangan bahwa undangan sudah berakhir, dan pemindai berhenti menerima check-in. Dashboard-mu tetap bisa dibuka seperti biasa. Kalau butuh lebih lama, beli produk yang sama sekali lagi — masa aktifnya menyambung, datanya tetap yang itu.",
  },
  {
    q: "Datanya dihapus setelah masa aktif habis?",
    a: "Tidak. Daftar tamu, RSVP, ucapan, kehadiran, dan seluruh isi perencana tetap tersimpan, dan tetap bisa diunduh sebagai CSV kapan pun. Yang berakhir adalah penayangan publik dan pemindaian, bukan datamu.",
  },
  {
    q: "Ada paket Lite yang nanti bisa di-upgrade?",
    a: "Tidak ada tier dan tidak ada paket. Satu harga per produk, dan dua produk itu berdiri sendiri: kamu bisa membeli undangan sekarang lalu buku tamu seminggu sebelum hari-H, atau salah satunya saja. Semua yang sudah kamu isi di perencana dan daftar tamu tetap di tempatnya saat kamu membeli.",
  },
  {
    q: "Berapa lama setup-nya?",
    a: "Perencana: satu menit — masuk pakai email atau Google, isi tanggal pernikahan. Undangan: 30–60 menit kalau data dan foto sudah siap, dan boleh dikerjakan bertahap; kamu bisa mengisi dulu dan membayar saat siap menerbitkan. Buku tamu: nol setup — token tamu sudah ada sejak undangan dikirim, jadi di hari-H penerima tamu cuma membuka link pemindai di HP-nya.",
  },
  {
    q: "Bayarnya bagaimana?",
    a: "QRIS, Virtual Account, atau e-wallet lewat Midtrans. Akses terbuka otomatis begitu pembayaran lunas, tanpa aktivasi manual dan tanpa menunggu admin. Bukti bayar dikirim ke emailmu.",
  },
];

const LD = [
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: PRODUCTS.invitation.label,
    description:
      "Undangan pernikahan website dengan link personal per tamu, RSVP berbatas pax, dan ucapan tamu.",
    brand: { "@type": "Brand", name: "OurDay" },
    url: `${SITE}/harga`,
    offers: {
      "@type": "Offer",
      price: PRODUCTS.invitation.price,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
      url: `${SITE}/harga`,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: PRODUCTS.guestbook.label,
    description:
      "Buku tamu digital dengan check-in QR dari token tamu yang sama, pemindai lewat HP tanpa aplikasi, dan rekap kehadiran.",
    brand: { "@type": "Brand", name: "OurDay" },
    url: `${SITE}/harga`,
    offers: {
      "@type": "Offer",
      price: PRODUCTS.guestbook.price,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
      url: `${SITE}/harga`,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

/** null = tidak termasuk, string = catatan, true = termasuk. */
const ROWS: { label: string; planner: true | string | null; inv: true | string | null; gb: true | string | null }[] = [
  { label: "Satu daftar tamu untuk ketiga produk", planner: true, inv: true, gb: true },
  { label: "Anggaran, to-do, rundown, seserahan, seragam, tabungan, vendor", planner: true, inv: null, gb: null },
  { label: "Undang pasangan ke perencana yang sama", planner: true, inv: null, gb: null },
  { label: "Link rundown baca-saja untuk MC dan vendor", planner: true, inv: null, gb: null },
  { label: "Halaman undangan di ourday.id/nama-kalian", planner: null, inv: true, gb: null },
  { label: `${TEMPLATES.length} template, preset warna dan font`, planner: null, inv: true, gb: null },
  { label: "Link personal per tamu, kirim ke WhatsApp satu klik", planner: null, inv: true, gb: null },
  { label: "RSVP dengan batas pax dan batas waktu", planner: null, inv: true, gb: null },
  { label: "Ucapan tamu beserta moderasinya", planner: null, inv: true, gb: null },
  { label: "Amplop digital, alamat kado, link live streaming", planner: null, inv: true, gb: null },
  { label: "QR check-in dari token tamu yang sudah ada", planner: null, inv: null, gb: true },
  { label: "Pemindai di HP penerima tamu, tanpa aplikasi", planner: null, inv: null, gb: true },
  { label: "Antrean offline, aman saat wifi gedung mati", planner: null, inv: null, gb: true },
  { label: "Foto check-in (bisa dimatikan) dan layar tampilan langsung", planner: null, inv: null, gb: true },
  { label: "Rekap dan unduh CSV", planner: "Perencana", inv: "RSVP", gb: "Kehadiran" },
  {
    label: "Masa aktif",
    planner: "Selamanya",
    inv: `${PRODUCTS.invitation.activeDays} hari`,
    gb: `${PRODUCTS.guestbook.activeDays} hari`,
  },
];

export default function HargaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }}
      />

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pt-24">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow>Harga</Eyebrow>
            <h1 className="hd mt-7 text-[3rem] sm:text-[4.2rem]">
              Perencananya gratis. Yang dijual cuma <em>dua</em>.
            </h1>
          </div>
          <p className="self-end text-[1.02rem] leading-relaxed text-ink-soft lg:col-span-4 lg:col-start-9">
            Bayar sekali, bukan langganan. Tidak ada kartu yang disimpan, tidak ada tagihan
            bulanan, dan tidak ada harga yang harus ditanyakan ke admin dulu.
          </p>
        </div>
      </section>

      {/* Free tier is a band, not a card: only two things are actually for sale. */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="rounded-[2rem] bg-white/55 p-1.5 ring-1 ring-ink/5">
          <div className="flex flex-col gap-6 rounded-[calc(2rem-0.375rem)] border border-line/70 bg-white px-7 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-9">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="hd text-3xl">Wedding Planner</h2>
                <span className="rounded-full border border-line px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-leaf">
                  Gratis
                </span>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
                Tujuh daftar persiapan, dipakai 6&ndash;12 bulan sebelum hari-H. Gratis
                selamanya karena ini pintu masuknya, bukan produk percobaan: tanpa kuota,
                tanpa kartu kredit, tanpa fitur yang tiba-tiba terkunci.
              </p>
            </div>
            <div className="shrink-0">
              <p className="hd text-4xl">Rp 0</p>
              <p className="mt-1 text-xs text-ink-soft">selamanya</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <PriceCard
            name={PRODUCTS.invitation.label}
            price={PRODUCTS.invitation.price}
            days={PRODUCTS.invitation.activeDays}
            body="Terbitkan undangan di alamatmu sendiri, kirim link personal per tamu, dan kumpulkan RSVP yang angkanya cukup dipercaya untuk disetor ke katering."
            note={`Masa aktif dihitung sejak pembayaran lunas. Undangan biasanya disebar 3–6 minggu sebelum hari-H, jadi ${PRODUCTS.invitation.activeDays} hari menutup penyebaran sampai beberapa minggu setelah acara.`}
            href="/desain"
            hrefLabel="Lihat template"
          />
          <PriceCard
            name={PRODUCTS.guestbook.label}
            price={PRODUCTS.guestbook.price}
            days={PRODUCTS.guestbook.activeDays}
            body="Pindai token yang sudah ada di tangan tamu, catat jumlah yang benar-benar datang, dan bandingkan dengan RSVP di satu layar."
            note={`Buku tamu hanya dipakai di hari-H, jadi ${PRODUCTS.guestbook.activeDays} hari sudah cukup. Beli seminggu sebelum acara, dan sisa harinya jadi ruang untuk gladi bersih serta unduh rekap.`}
            href="/fitur#menyambut"
            hrefLabel="Cara kerjanya"
          />
        </div>
      </section>

      <Section eyebrow="Perbandingan jujur">
        <h2 className="hd max-w-2xl text-4xl sm:text-5xl">
          Apa saja yang benar-benar kamu dapat.
        </h2>

        {/* Fits a 390px phone without sideways scrolling: the answer column is the
            whole point of the table, so it must never be the part that is off-screen. */}
        <div className="mt-10">
          <table className="w-full table-fixed border-collapse text-left text-[13px] sm:text-sm">
            <caption className="sr-only">
              Perbandingan isi Wedding Planner, Undangan Website, dan Buku Tamu Digital &amp; QR
            </caption>
            <thead>
              <tr className="border-b border-ink/15">
                <th scope="col" className="w-auto py-4 pr-3 font-medium">
                  <span className="sr-only">Kemampuan</span>
                </th>
                <th scope="col" className="w-[3.4rem] py-4 pr-2 align-bottom font-medium sm:w-[12%] sm:pr-4">
                  Planner
                  <span className="mt-1 block text-xs font-normal text-ink-soft">Gratis</span>
                </th>
                <th scope="col" className="w-[3.4rem] py-4 pr-2 align-bottom font-medium sm:w-[16%] sm:pr-4">
                  Undangan
                  <span className="tabular mt-1 block text-xs font-normal text-ink-soft">
                    {rupiah(PRODUCTS.invitation.price)}
                  </span>
                </th>
                <th scope="col" className="w-[3.4rem] py-4 align-bottom font-medium sm:w-[16%]">
                  Buku Tamu
                  <span className="tabular mt-1 block text-xs font-normal text-ink-soft">
                    {rupiah(PRODUCTS.guestbook.price)}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label} className="border-b border-line/70 align-top">
                  <th scope="row" className="py-4 pr-3 font-normal text-ink-soft sm:pr-6">
                    {r.label}
                  </th>
                  <Cell v={r.planner} />
                  <Cell v={r.inv} />
                  <Cell v={r.gb} last />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="Pertanyaan umum" id="tanya">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="hd text-4xl sm:text-5xl">Yang paling sering ditanya.</h2>
            <p className="mt-5 text-sm leading-relaxed text-ink-soft">
              Belum terjawab?{" "}
              <a
                href={WA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
              >
                Tanya lewat WhatsApp
              </a>
              . Dijawab orang, bukan bot.
            </p>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            {FAQ.map((f) => (
              <div key={f.q} className="border-b border-line/70">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-[1.05rem] font-medium">
                    {f.q}
                    <span
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-ink-soft transition-transform duration-500 group-open:rotate-45"
                    >
                      <svg viewBox="0 0 16 16" className="h-4 w-4">
                        <path
                          d="M8 3v10M3 8h10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.1"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </summary>
                  <p className="max-w-2xl pb-7 pr-10 leading-relaxed text-ink-soft">{f.a}</p>
                </details>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <section className="border-t border-line/70">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <div className="rise max-w-2xl">
            <h2 className="hd text-[2.7rem] sm:text-6xl">
              Coba dulu bagian yang gratis.
            </h2>
            <p className="mt-6 leading-relaxed text-ink-soft">
              Isi perencana dan daftar tamunya. Kalau nanti mau diundang dan disambut dari
              daftar yang sama, harganya sudah kamu lihat di atas.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Cta href="/masuk">Mulai gratis</Cta>
              <Cta href="/fitur" tone="paper">
                Lihat semua fitur
              </Cta>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Cell({ v, last }: { v: true | string | null; last?: boolean }) {
  return (
    <td className={"py-4 " + (last ? "" : "pr-4")}>
      {v === null ? (
        <span className="text-ink-soft" aria-label="tidak termasuk">
          &mdash;
        </span>
      ) : v === true ? (
        <span className="text-leaf" role="img" aria-label="termasuk">
          <svg viewBox="0 0 16 16" className="h-4 w-4">
            <path
              d="M3.5 8.5 6.5 11.5 12.5 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      ) : (
        <span className="text-ink-soft">{v}</span>
      )}
    </td>
  );
}

function PriceCard({
  name,
  price,
  days,
  body,
  note,
  href,
  hrefLabel,
}: {
  name: string;
  price: number;
  days: number;
  body: string;
  note: string;
  href: string;
  hrefLabel: string;
}) {
  return (
    <div className="rounded-[2rem] bg-white/55 p-1.5 ring-1 ring-ink/5">
      <div className="mk-lift flex h-full flex-col rounded-[calc(2rem-0.375rem)] border border-line/70 bg-white p-7 sm:p-9">
        <h2 className="hd text-3xl">{name}</h2>
        <p className="mt-4 leading-relaxed text-ink-soft">{body}</p>
        <p className="hd tabular mt-8 text-5xl">{rupiah(price)}</p>
        <p className="mt-2 text-sm text-ink-soft">
          Bayar sekali &middot; aktif <span className="tabular">{days}</span> hari sejak lunas
        </p>
        <p className="mt-5 border-t border-line/70 pt-5 text-[13px] leading-relaxed text-ink-soft">
          {note}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-8">
          <Cta href="/masuk">Mulai isi datanya</Cta>
          <Link
            href={href}
            className="text-sm text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
          >
            {hrefLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
