import type { Metadata } from "next";
import { Clause, Eyebrow, WA_HREF } from "../ui.tsx";

export const metadata: Metadata = {
  title: "Kebijakan privasi",
  description:
    "Kebijakan privasi OurDay: data apa yang kami simpan, kenapa, siapa yang bisa membacanya, dan bagaimana data tamu serta foto check-in diperlakukan.",
  alternates: { canonical: "/privasi" },
  robots: { index: true, follow: true },
};

export default function PrivasiPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 pb-24 pt-16 sm:pt-24">
      <Eyebrow>Kebijakan privasi</Eyebrow>
      <h1 className="hd mt-6 text-[2.6rem] sm:text-5xl">
        Data siapa, dibaca siapa, disimpan sampai kapan.
      </h1>
      <p className="mt-4 text-sm text-ink-soft">
        Halaman ini menyebut data yang benar-benar ada di sistem, bukan daftar umum.
      </p>

      <div className="mt-12 space-y-10 leading-relaxed text-ink-soft">
        <Clause n="1" title="Data akunmu">
          Email, dan nama serta foto profil kalau kamu masuk lewat Google. Dipakai untuk
          mengirim link masuk, mengenali akunmu, dan mengirim bukti bayar. Tidak ada password
          yang kami simpan karena tidak ada password.
        </Clause>

        <Clause n="2" title="Data pernikahanmu">
          Nama mempelai, tanggal acara, isi perencana (anggaran, to-do, rundown, seserahan,
          seragam, tabungan, vendor), isi undangan, dan foto yang kamu unggah. Semua ini kamu
          yang masukkan, dan hanya kamu serta anggota yang kamu undang ke pernikahan yang sama
          yang bisa membacanya.
        </Clause>

        <Clause n="3" title="Data tamu yang kamu masukkan">
          Nama, nomor telepon, kelompok, sesi, dan jatah pax. Nomor telepon dinormalkan ke
          format Indonesia supaya link WhatsApp-nya benar. Data ini milikmu dan tanggung
          jawabmu: kamu yang mengumpulkannya dari tamu-tamumu. Kami memakainya hanya untuk
          menjalankan undangan, RSVP, dan check-in pernikahanmu &mdash; tidak dijual, tidak
          dipakai untuk iklan, dan tidak dipakai lintas pernikahan.
        </Clause>

        <Clause n="4" title="Token tamu">
          Setiap tamu punya satu token acak yang dipakai untuk tiga hal: menyapa namanya di
          undangan, mengikat jawaban RSVP-nya, dan menjadi isi QR check-in. Token bukan
          kredensial akun: siapa pun yang memegang link tamu bisa melihat undangan itu dan
          mengubah RSVP tamu tersebut, tapi tidak bisa membuka perencana, anggaran, daftar
          tamu, atau data pembayaran. Perlakukan link tamu seperti undangan fisik.
        </Clause>

        <Clause n="5" title="Jawaban RSVP dan ucapan">
          Nama, jumlah pax, dan pesan yang ditulis tamu. Ucapan tampil di halaman undangan
          yang bersifat publik-lewat-link, dan bisa kamu sembunyikan. Nama tamu tidak
          ditampilkan ke tamu lain di luar ucapan yang mereka tulis sendiri.
        </Clause>

        <Clause n="6" title="Foto check-in">
          Foto orang adalah data pribadi, jadi fitur ini mati secara default dan hanya menyala
          kalau kamu menyalakannya. Kalau menyala, foto diambil di perangkat penerima tamu,
          dikompres di sana, lalu diunggah ke penyimpanan kami dan bisa muncul di layar acara
          selama acara berlangsung. Kamu bisa mematikannya kapan saja, dan tugas
          memberitahukannya ke tamu ada padamu.
        </Clause>

        <Clause n="7" title="Data pembayaran">
          Kami menyimpan nomor pesanan, jumlah, status, dan catatan mentah dari penyedia
          pembayaran, supaya komplain pembayaran bisa ditelusuri. Nomor kartu, PIN, atau
          kredensial e-wallet tidak pernah melewati sistem kami; itu ditangani penyedia
          pembayaran.
        </Clause>

        <Clause n="8" title="Link pemindai">
          Penerima tamu biasanya bukan pemilik akun, jadi mereka bekerja lewat link pemindai
          berbatas waktu yang kamu terbitkan dan bisa kamu cabut. Link itu hanya boleh membaca
          daftar tamu dan menulis check-in untuk satu pernikahan &mdash; bukan perencana,
          anggaran, atau data pembayaran.
        </Clause>

        <Clause n="9" title="Pihak ketiga">
          Kami memakai penyedia basis data dan penyimpanan berkas, penyedia pembayaran, dan
          pengirim email untuk link masuk serta bukti bayar. Video yang kamu tempelkan diambil
          dari layanan video pihak ketiga; membuka undangan berarti pemutar video itu bisa
          membaca data teknis kunjungan menurut kebijakan mereka sendiri.
        </Clause>

        <Clause n="10" title="Retensi dan penghapusan">
          Datamu tidak dihapus saat masa aktif produk berakhir &mdash; justru supaya kamu masih
          bisa mengunduh rekapnya setelah acara. Kalau kamu ingin seluruh data pernikahanmu
          dihapus, minta lewat kontak di bawah dan kami hapus, termasuk foto check-in dan data
          tamu. Catatan pembayaran kami simpan lebih lama karena kewajiban pembukuan.
        </Clause>

        <Clause n="11" title="Haknya ada padamu">
          Kamu bisa mengunduh data pernikahanmu kapan pun dari dashboard, dan bisa meminta
          koreksi atau penghapusan. Kalau tamumu meminta datanya dihapus, kamu bisa menghapus
          barisnya sendiri dari daftar tamu.
        </Clause>

        <Clause n="12" title="Kontak">
          Pertanyaan atau permintaan penghapusan:{" "}
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
