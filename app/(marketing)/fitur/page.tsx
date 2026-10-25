import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCTS } from "@/lib/products.ts";
import { Cta, Eyebrow, rupiah } from "../ui.tsx";

const DESC =
  "Fitur OurDay dikelompokkan menurut tahap pernikahan: merencanakan dengan perencana gratis, mengundang lewat undangan website dengan link personal per tamu, dan menyambut dengan buku tamu digital QR di hari-H.";

export const metadata: Metadata = {
  title: "Fitur: merencanakan, mengundang, menyambut",
  description: DESC,
  alternates: { canonical: "/fitur" },
  openGraph: {
    title: "Fitur: merencanakan, mengundang, menyambut · OurDay",
    description: DESC,
    url: "/fitur",
    siteName: "OurDay",
    locale: "id_ID",
    type: "website",
  },
};

type Feature = { title: string; body: string };

const PLANNING: Feature[] = [
  {
    title: "Anggaran per pos, estimasi dipisah dari realisasi",
    body: "Gedung, katering, dokumentasi, busana. Tandai yang baru DP dan yang sudah lunas, dan totalnya menjumlah sendiri termasuk sub-pos, tanpa menghitung ganda.",
  },
  {
    title: "To-do dengan tenggat yang dihitung dari tanggalmu",
    body: "Mulai dari daftar bawaan supaya tidak menatap halaman kosong. Tugaskan tiap baris ke kamu atau pasangan, dan lihat yang jatuh tempo minggu ini terpisah dari sisanya.",
  },
  {
    title: "Rundown per jam, plus link baca-saja untuk MC",
    body: "Tiap sesi punya penanggung jawab. MC dan vendor dapat satu link yang selalu menampilkan versi terbaru, jadi tidak ada dokumen yang dikirim bolak-balik.",
  },
  {
    title: "Seserahan dan seragam",
    body: "Kisaran harga dan tempat belinya, ditandai kalau sudah dibeli. Seragam dicatat per orang beserta ukurannya supaya pesanan ke penjahit tidak salah.",
  },
  {
    title: "Tabungan dengan angka yang jelas",
    body: "Pasang target dan tenggatnya, catat setoran satu per satu, dan lihat berapa yang harus disisihkan per bulan untuk mengejarnya.",
  },
  {
    title: "Vendor dibandingkan berdampingan",
    body: "Simpan penawaran dan kontak tiap kandidat. Vendor yang kamu pilih menyalin nilai penawarannya ke anggaran sekali, tanpa kamu ketik ulang.",
  },
  {
    title: "Dikerjakan berdua, bukan dua salinan",
    body: "Undang pasangan ke perencana yang sama. Satu ringkasan menyebut sisa hari, sisa anggaran, dan tugas yang lewat tenggat, dan datamu bisa diunduh kapan pun.",
  },
];

const INVITING: Feature[] = [
  {
    title: "Alamatmu sendiri, bukan link acak",
    body: "Terbitkan di ourday.id/nama-kalian dengan slug yang kamu tentukan. Bisa diedit setelah terbit, jadi jam atau lokasi yang berubah langsung berlaku.",
  },
  {
    title: "Isi undangan selengkap yang kamu mau",
    body: "Nama lengkap dan panggilan, nama orang tua, lebih dari satu acara dengan jam mulai–selesai dan link Maps, love story bertanggal, galeri prewedding, video YouTube, amplop digital, alamat kado, link live streaming, dan lagu latar dari daftar bebas hak cipta.",
  },
  {
    title: "Satu link personal untuk tiap tamu",
    body: "Undangan menyapa mereka dengan nama, RSVP-nya sudah terisi, dan jatah pax-nya ditegakkan. Ada juga satu link umum tanpa nama untuk disebar di grup atau story.",
  },
  {
    title: "Daftar tamu ditempel sekaligus dari catatanmu",
    body: "Tempel ratusan baris sekali jalan, kelompokkan (keluarga, kantor, teman kampus), tandai sesi acara, dan cari nama dengan cepat di daftar yang panjang.",
  },
  {
    title: "Kirim ke WhatsApp satu klik",
    body: "Pesan sudah terisi beserta link personalnya; kamu cuma menekan kirim. Tamu yang sudah dikirimi ditandai supaya tidak dobel dan tidak ada yang terlewat.",
  },
  {
    title: "RSVP yang angkanya bisa disetor ke katering",
    body: "Batas pax dan batas waktu ditegakkan di server, bukan cuma disembunyikan di tampilan. Tamu boleh mengubah jawabannya, dan kamu bisa melihat siapa yang bahkan belum membuka undangannya.",
  },
  {
    title: "Ucapan tamu, dengan moderasi",
    body: "Tamu menulis ucapan dan membaca ucapan yang lain, seperti buku tamu. Yang tidak pantas bisa kamu sembunyikan tanpa menghapus jejaknya.",
  },
];

const WELCOMING: Feature[] = [
  {
    title: "Pemindai jalan di HP penerima tamu",
    body: "Buka satu link, izinkan kamera, selesai. Tanpa aplikasi yang dipasang dan tanpa perangkat yang disewa. Beberapa meja boleh memindai bersamaan supaya antrean terpecah.",
  },
  {
    title: "QR-nya sudah ada di tangan tamu",
    body: "Token yang dipakai undangan dan RSVP itu juga isi QR-nya. Tidak ada QR yang perlu dibuat, dicetak, atau dikirim ulang — tamu cukup membuka undangannya sendiri di hari-H, dan halaman itu tetap tampil walau sinyal gedung buruk.",
  },
  {
    title: "Yang benar-benar datang, bukan salinan RSVP",
    body: "Setelah dipindai, nama, kelompok, dan jatah pax langsung terlihat, dan penerima tamu bisa mengoreksi jumlah orang yang sungguh datang. Tamu dadakan yang tidak ada di daftar bisa didaftarkan di meja.",
  },
  {
    title: "Pindai ulang tidak ditolak",
    body: "Tamu wajar kembali ke meja. QR yang sudah dipakai menampilkan “sudah check-in pukul X” beserta data tamunya, bukan pesan galat di depan antrean. Salah pindai bisa dibatalkan.",
  },
  {
    title: "Aman saat wifi gedung mati",
    body: "Setiap pemindaian ditulis ke antrean di perangkat lebih dulu, bertahan menembus refresh, dan terkirim sendiri saat tersambung tanpa menggandakan hitungan. Jumlah yang belum terkirim selalu terlihat di layar.",
  },
  {
    title: "Foto check-in dan layar tampilan langsung",
    body: "Tamu bisa difoto saat check-in dan fotonya muncul di layar acara secara langsung. Defaultnya mati, karena foto orang adalah data pribadi dan tidak semua acara menginginkannya.",
  },
  {
    title: "Rekap yang menutup lingkarannya",
    body: "Diundang, menjawab hadir, benar-benar datang, dan selisihnya — dalam satu layar, bisa difilter per kelompok, dan bisa diunduh sebagai CSV.",
  },
];

export default function FiturPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-8 pt-16 sm:pt-24">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow>Fitur</Eyebrow>
            <h1 className="hd mt-7 text-[3rem] sm:text-[4.2rem]">
              Tiga tahap pernikahan. <em>Satu</em> daftar tamu.
            </h1>
          </div>
          <p className="self-end text-[1.02rem] leading-relaxed text-ink-soft lg:col-span-4 lg:col-start-9">
            Ini bukan daftar fitur menurut modul kami, tapi menurut urutan kamu
            mengerjakannya: setahun merencanakan, beberapa minggu mengundang, satu pagi
            menyambut.
          </p>
        </div>
        <nav aria-label="Tahap" className="mt-12 flex flex-wrap gap-2">
          {[
            { href: "#merencanakan", label: "Merencanakan" },
            { href: "#mengundang", label: "Mengundang" },
            { href: "#menyambut", label: "Menyambut" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="mk-press rounded-full border border-line bg-white px-4 py-2 text-[13px] hover:bg-paper-deep"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </section>

      <Phase
        id="merencanakan"
        step="01"
        when="12–6 bulan sebelum"
        product="Wedding Planner"
        price="Gratis selamanya"
        heading="Semua persiapan berhenti berpindah-pindah aplikasi."
        lede="Anggaran di spreadsheet, to-do di catatan HP, rundown di dokumen yang dikirim bolak-balik. Tujuh daftar itu pindah ke satu tempat yang tahu tanggal pernikahanmu, dan hitung mundurnya berjalan sendiri."
        features={PLANNING}
        mock={<BudgetMock />}
      />

      <Phase
        id="mengundang"
        step="02"
        when="6–3 minggu sebelum"
        product={PRODUCTS.invitation.label}
        price={`${rupiah(PRODUCTS.invitation.price)} · aktif ${PRODUCTS.invitation.activeDays} hari`}
        heading="Undangan yang menyapa nama, dan RSVP yang bisa dipercaya."
        lede="Daftar tamu yang sudah kamu isi di perencana langsung jadi link personal per orang. Tidak ada nama yang diketik ulang, dan tiap jawaban terikat pada orangnya."
        features={INVITING}
        mock={<WaMock />}
      />

      <Phase
        id="menyambut"
        step="03"
        when="Hari-H"
        product={PRODUCTS.guestbook.label}
        price={`${rupiah(PRODUCTS.guestbook.price)} · aktif ${PRODUCTS.guestbook.activeDays} hari`}
        heading="Meja penerima tamu tanpa antre, tanpa tulisan tangan."
        lede="Token yang sama dipindai di pintu. Nol setup di hari-H, karena QR-nya sudah ada di tangan tamu sejak undangan dikirim."
        features={WELCOMING}
        mock={<ScanMock />}
      />

      <section className="border-t border-line/70">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <div className="rise max-w-2xl">
            <h2 className="hd text-[2.7rem] sm:text-6xl">
              Mulai dari tahap satu. Gratis.
            </h2>
            <p className="mt-6 leading-relaxed text-ink-soft">
              Perencana tidak menagih apa pun dan tidak punya kuota. Tahap dua dan tiga
              menunggu di daftar tamu yang sama, dan kamu membelinya kalau memang sudah
              butuh.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Cta href="/masuk">Buat perencana</Cta>
              <Link
                href="/harga"
                className="self-center text-sm text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
              >
                Lihat harga lengkap
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Phase({
  id,
  step,
  when,
  product,
  price,
  heading,
  lede,
  features,
  mock,
}: {
  id: string;
  step: string;
  when: string;
  product: string;
  price: string;
  heading: string;
  lede: string;
  features: Feature[];
  mock: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-t border-line/70 py-20 sm:py-28"
      aria-labelledby={`${id}-h`}
    >
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-baseline gap-4">
              <span className="hd text-5xl text-rose">{step}</span>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-soft">
                  {when}
                </p>
                <p className="mt-1 text-sm">{product}</p>
              </div>
            </div>
            <h2 id={`${id}-h`} className="hd mt-8 text-4xl sm:text-5xl">
              {heading}
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-ink-soft">{lede}</p>
            <p className="tabular mt-6 inline-block rounded-full border border-line bg-white px-4 py-1.5 text-[13px]">
              {price}
            </p>
            <div className="mt-10 max-w-sm">{mock}</div>
          </div>

          <ul className="lg:col-span-6 lg:col-start-7">
            {features.map((f, i) => (
              <li
                key={f.title}
                className={
                  "rise py-6 " + (i === features.length - 1 ? "" : "border-b border-line/70")
                }
              >
                <h3 className="text-[1.05rem] font-medium">{f.title}</h3>
                <p className="mt-2 max-w-xl leading-relaxed text-ink-soft">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Honest HTML mocks of the real screens. No screenshots to keep in sync. */
function Mock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div aria-hidden="true" className="rounded-[1.6rem] bg-white/55 p-1.5 ring-1 ring-ink/5">
      <div className="rounded-[calc(1.6rem-0.375rem)] border border-line/70 bg-white">
        <p className="border-b border-line/70 px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-ink-soft">
          {title}
        </p>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function BudgetMock() {
  const rows = [
    ["Gedung", "60.000.000", "60.000.000", "Lunas"],
    ["Katering 400 pax", "72.000.000", "20.000.000", "DP"],
    ["Dokumentasi", "18.000.000", "—", "Belum"],
  ];
  return (
    <Mock title="Anggaran">
      <table className="w-full text-[12px]">
        <tbody>
          {rows.map(([pos, est, real, status]) => (
            <tr key={pos} className="border-b border-line/60 last:border-0">
              <td className="py-2 pr-2">{pos}</td>
              <td className="tabular py-2 pr-2 text-right text-ink-soft">{est}</td>
              <td className="tabular py-2 pr-2 text-right">{real}</td>
              <td className="py-2 text-right text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                {status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-baseline justify-between border-t border-ink/15 pt-3 text-[12px]">
        <span className="text-ink-soft">Estimasi vs realisasi</span>
        <span className="tabular">150.000.000 / 80.000.000</span>
      </div>
    </Mock>
  );
}

function WaMock() {
  return (
    <Mock title="Kirim undangan">
      <div className="flex items-center justify-between text-[12px]">
        <span>Bu Retno Wijaya</span>
        <span className="text-ink-soft">628123456789</span>
      </div>
      <div className="mt-3 rounded-xl rounded-br-sm bg-paper-deep px-3 py-2.5 text-[12px] leading-relaxed">
        Bismillah, dengan hormat kami mengundang Bu Retno Wijaya di pernikahan kami.
        Undangan lengkapnya di sini:
        <span className="mt-1 block break-all text-ink-soft">
          ourday.id/arum-bagas?to=7QF2K8MD
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="rounded-full bg-paper-deep px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-ink-soft">
          Sudah dikirim
        </span>
        <span className="text-[11px] text-ink-soft">Jatah 2 pax</span>
      </div>
    </Mock>
  );
}

function ScanMock() {
  return (
    <Mock title="Pemindai · Meja 2">
      <p className="hd text-2xl">Bu Retno Wijaya</p>
      <p className="mt-1 text-[12px] text-ink-soft">Keluarga &middot; Resepsi &middot; jatah 2 pax</p>
      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-full border border-line px-2.5 py-1 text-[11px] tabular">
          Datang: 2
        </span>
        <span className="rounded-full bg-rose-soft px-2.5 py-1 text-[11px] text-rose">
          Sudah check-in 19.12
        </span>
      </div>
      <p className="mt-4 border-t border-line/60 pt-3 text-[11px] text-ink-soft">
        Antrean belum terkirim: <span className="tabular text-leaf">0</span>
      </p>
    </Mock>
  );
}
