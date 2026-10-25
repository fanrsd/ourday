import type { Metadata } from "next";
import { PRODUCTS } from "@/lib/products.ts";
import { Clause, Eyebrow, WA_HREF, rupiah } from "../ui.tsx";

export const metadata: Metadata = {
  title: "Ketentuan layanan",
  description:
    "Ketentuan layanan OurDay: apa yang kamu beli, masa aktif tiap produk, apa yang terjadi setelah masa aktif berakhir, dan batas tanggung jawab kami.",
  alternates: { canonical: "/ketentuan" },
  robots: { index: true, follow: true },
};

export default function KetentuanPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 pb-24 pt-16 sm:pt-24">
      <Eyebrow>Ketentuan layanan</Eyebrow>
      <h1 className="hd mt-6 text-[2.6rem] sm:text-5xl">
        Yang kamu beli, dan yang kami janjikan.
      </h1>
      <p className="mt-4 text-sm text-ink-soft">Berlaku sejak versi pertama layanan ini.</p>

      <div className="mt-12 space-y-10 leading-relaxed text-ink-soft">
        <Clause n="1" title="Apa yang kami sediakan">
          OurDay adalah layanan web berisi tiga bagian: Wedding Planner yang gratis, Undangan
          Website, dan Buku Tamu Digital &amp; QR. Ketiganya bekerja di atas satu daftar tamu
          milik satu pernikahan.
        </Clause>

        <Clause n="2" title="Akun">
          Kamu masuk lewat link yang dikirim ke emailmu atau lewat Google. Tidak ada password.
          Kamu bertanggung jawab atas akses ke email itu, dan atas siapa saja yang kamu undang
          sebagai anggota pernikahanmu, karena mereka mendapat akses yang sama denganmu.
        </Clause>

        <Clause n="3" title="Harga dan masa aktif">
          Wedding Planner gratis, tanpa kuota dan tanpa batas waktu. Undangan Website{" "}
          <span className="tabular">{rupiah(PRODUCTS.invitation.price)}</span> dan aktif{" "}
          <span className="tabular">{PRODUCTS.invitation.activeDays}</span> hari sejak
          pembayaran lunas. Buku Tamu Digital &amp; QR{" "}
          <span className="tabular">{rupiah(PRODUCTS.guestbook.price)}</span> dan aktif{" "}
          <span className="tabular">{PRODUCTS.guestbook.activeDays}</span> hari sejak
          pembayaran lunas. Keduanya bayar sekali, bukan langganan, dan tidak ada kartu yang
          kami simpan atau tagih ulang.
        </Clause>

        <Clause n="4" title="Setelah masa aktif berakhir">
          Halaman undangan publik berhenti tayang dan pemindai check-in berhenti menerima.
          Dashboard-mu tetap bisa dibuka, dan datamu tidak dihapus: daftar tamu, RSVP, ucapan,
          kehadiran, dan isi perencana tetap tersimpan serta tetap bisa diunduh. Untuk
          menayangkan kembali, beli produk yang sama sekali lagi.
        </Clause>

        <Clause n="5" title="Pembayaran dan pengembalian dana">
          Pembayaran diproses penyedia pembayaran pihak ketiga (QRIS, Virtual Account,
          e-wallet). Akses terbuka otomatis begitu pembayaran dinyatakan lunas oleh penyedia.
          Karena produk terbuka seketika dan bersifat digital, pembayaran yang sudah lunas
          tidak dikembalikan. Kalau ada kegagalan di sisi kami yang membuat produk tidak bisa
          dipakai, hubungi kami dan kami perbaiki atau perpanjang masa aktifnya.
        </Clause>

        <Clause n="6" title="Isi yang kamu unggah">
          Foto, nama, dan teks yang kamu unggah tetap milikmu. Kamu memberi kami izin
          menyimpan dan menayangkannya sebatas untuk menjalankan layanan ini. Kamu memastikan
          punya hak atas apa yang kamu unggah, termasuk foto orang lain dan nomor telepon tamu
          yang kamu masukkan. Kami tidak menghosting video: video masuk lewat embed pihak
          ketiga.
        </Clause>

        <Clause n="7" title="Yang tidak boleh">
          Menggunakan layanan untuk menyebarkan spam, konten melanggar hukum, atau mengambil
          data pernikahan orang lain. Kami boleh menutup akses tanpa pengembalian dana untuk
          pelanggaran ini.
        </Clause>

        <Clause n="8" title="Batas tanggung jawab">
          Kami berusaha keras menjaga layanan tetap jalan, terutama di hari-H: halaman undangan
          disajikan statis dan pemindai menyimpan antrean di perangkat supaya check-in tetap
          tercatat saat koneksi gedung terputus. Meski begitu, kami tidak bisa menjamin
          layanan bebas gangguan, dan tanggung jawab kami dibatasi paling banyak sebesar yang
          kamu bayarkan untuk produk terkait.
        </Clause>

        <Clause n="9" title="Perubahan ketentuan">
          Kalau ketentuan ini berubah, versi yang berlaku untuk pembelianmu adalah versi saat
          kamu membayar. Perubahan harga tidak berlaku surut ke produk yang sudah kamu beli.
        </Clause>

        <Clause n="10" title="Kontak">
          Pertanyaan soal ketentuan ini:{" "}
          <a
            href="mailto:halo@ourday.id"
            className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
          >
            halo@ourday.id
          </a>{" "}
          atau{" "}
          <a
            href={WA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
          >
            WhatsApp
          </a>
          .
        </Clause>
      </div>
    </article>
  );
}
