# OurDay

Platform pernikahan untuk Indonesia: **satu daftar tamu, satu token per tamu, tiga kejadian** (dikirimi, RSVP, hadir).

- **Wedding Planner**: anggaran, to-do, rundown, seserahan, seragam, tabungan, vendor.
- **Undangan Website**: 5 template modern dan template adat, link personal per tamu (kirim lewat WhatsApp), RSVP, ucapan.
- **Buku Tamu Digital & QR check-in**: token yang sama dipindai di meja penerima tamu. Tanpa cetak QR, tanpa daftar tamu kedua.
- Layar tampilan untuk resepsi (`/layar`), rekap kehadiran, pembayaran lewat Midtrans Snap.

Spesifikasi lengkap ada di [SPEC.md](SPEC.md).

## Stack

Next.js 15 (App Router), React, PostgreSQL (`postgres`), GSAP. Row level security di Postgres: aplikasi terhubung sebagai role non-owner supaya RLS benar-benar berlaku. Login lewat tautan sekali pakai (hanya hash yang disimpan).

## Menjalankan

Perlu Node 22+ dan PostgreSQL.

```sh
npm install
cp .env.example .env      # isi DATABASE_URL, SESSION_SECRET, kunci Midtrans
npm run db:migrate        # membuat database, role aplikasi, skema
node --experimental-strip-types scripts/seed-templates.ts   # opsional: contoh undangan
npm run dev
npm test
```

Email dikirim lewat fungsi `send_email` di database; di mode dev tautan masuk ditampilkan langsung. Hubungkan ke penyedia email sendiri untuk produksi. Tanpa kunci Midtrans, checkout tidak jalan; sisanya tetap bisa dipakai.

## Catatan

- Teks, harga, dan domain di halaman marketing (`ourday.id`) adalah contoh; ganti dengan milikmu.
- Proyek ini tidak dijual lagi dan dirilis apa adanya.

## Lisensi

[MIT](LICENSE)
