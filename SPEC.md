# SPEC — OurDay (v1)

Status: ready-for-agent
Scope: tiga produk dalam satu platform — Undangan Website, Buku Tamu Digital & QR Check-in, Wedding Planner. End-to-end: marketing → checkout → editor → undangan publik → RSVP → check-in hari-H → rekap.

---

## Problem Statement

Calon pengantin di Indonesia mengerjakan tiga hal yang saling terkait, dengan tiga alat yang tidak saling bicara:

1. **Merencanakan.** Anggaran di spreadsheet, to-do di catatan HP, rundown di dokumen yang dikirim bolak-balik ke MC, daftar vendor di screenshot chat. Enam sampai dua belas bulan, tidak ada satu tempat yang tahu status keseluruhan.
2. **Mengundang.** Undangan kertas mahal dan lambat, dan tidak memberi data. Undangan digital yang ada menyelesaikan sebagian, tapi RSVP-nya tidak akurat: tamu mengisi tanpa identitas, satu orang bisa mengisi tiga kali, tidak ada batas pax per undangan. Angka yang keluar tidak cukup dipercaya untuk disetor ke katering.
3. **Menerima tamu di hari-H.** Buku tamu kertas antre, tulisan tangan tidak terbaca, souvenir dibagikan tanpa kontrol, dan setelah acara tidak ada data siapa yang benar-benar datang.

Yang paling merugikan bukan salah satunya, tapi jurang di antaranya. Daftar tamu diketik ulang tiga kali: sekali untuk undangan, sekali untuk buku tamu, sekali untuk souvenir. Jumlah RSVP tidak pernah dibandingkan dengan jumlah yang benar-benar hadir, jadi pasangan berikutnya tetap menebak.

Dari sisi kami: repo kosong, belum ada produk, belum ada pelanggan.

## Solution

Satu platform dengan satu daftar tamu yang dipakai tiga kali.

- **Wedding Planner** (gratis) — dipakai 6–12 bulan sebelum hari-H untuk anggaran, to-do, rundown, seserahan, seragam, tabungan, dan vendor. Ini pintu masuknya: pasangan datang jauh sebelum mereka siap membeli apa pun.
- **Undangan Website** (bayar sekali) — pilih template, isi data, terbitkan di `ourday.id/nama-mereka`. Setiap tamu dapat link personal berisi token miliknya sendiri, dikirim lewat WhatsApp satu klik.
- **Buku Tamu Digital & QR** (bayar sekali) — token yang sama, yang sudah ada di tangan tamu sejak undangan dikirim, dipindai di meja penerima tamu. Tanpa cetak QR, tanpa daftar tamu kedua.

Rantai yang menyatukannya: **satu tamu, satu token, tiga kejadian** — dikirimi, menjawab RSVP, hadir. Karena ketiganya menempel pada baris tamu yang sama, dashboard bisa menjawab pertanyaan yang hari ini tidak ada yang bisa jawab: dari 400 yang diundang, 312 menjawab hadir, 287 benar-benar datang, dan ini daftar 25 yang tidak.

## User Stories

### Wedding Planner

1. Sebagai calon pengantin, saya ingin memakai perencana ini gratis tanpa kartu kredit, agar saya bisa mulai jauh sebelum saya siap belanja.
2. Sebagai calon pengantin, saya ingin memasukkan tanggal pernikahan saya di awal, agar semua tenggat dihitung mundur dari situ.
3. Sebagai calon pengantin, saya ingin mengundang pasangan saya ke perencana yang sama, agar kami tidak mengerjakan dua salinan.
4. Sebagai calon pengantin, saya ingin melihat satu ringkasan berisi sisa hari, sisa anggaran, dan tugas yang lewat tenggat, agar tahu keadaan tanpa membuka tujuh halaman.
5. Sebagai calon pengantin, saya ingin menyusun anggaran per pos (gedung, katering, dokumentasi, busana), agar tahu ke mana uang akan pergi.
6. Sebagai calon pengantin, saya ingin mencatat estimasi dan realisasi tiap pos secara terpisah, agar terlihat di mana saya membengkak.
7. Sebagai calon pengantin, saya ingin menandai pos yang sudah dibayar dan yang baru DP, agar tahu sisa kewajiban saya.
8. Sebagai calon pengantin, saya ingin melihat total estimasi versus total realisasi di satu baris, agar tidak perlu menjumlah manual.
9. Sebagai calon pengantin, saya ingin membuat to-do list persiapan dengan tenggat, agar tidak ada yang terlewat.
10. Sebagai calon pengantin, saya ingin menugaskan tiap to-do ke saya atau pasangan, agar jelas siapa yang mengerjakan.
11. Sebagai calon pengantin, saya ingin melihat to-do yang jatuh tempo minggu ini, agar tahu yang harus dikerjakan sekarang.
12. Sebagai calon pengantin, saya ingin memulai dari daftar to-do bawaan yang sudah umum dipakai, agar tidak menatap halaman kosong.
13. Sebagai calon pengantin, saya ingin menyusun rundown acara per jam dengan penanggung jawab tiap sesi, agar hari-H tidak kacau.
14. Sebagai calon pengantin, saya ingin membagikan rundown sebagai link baca-saja ke MC dan vendor, agar mereka selalu melihat versi terbaru.
15. Sebagai calon pengantin, saya ingin menyusun daftar seserahan beserta kisaran harga dan tempat belinya, agar tidak bolak-balik mencari.
16. Sebagai calon pengantin, saya ingin menandai seserahan yang sudah dibeli, agar tahu sisanya.
17. Sebagai calon pengantin, saya ingin mendata siapa saja yang mendapat seragam beserta ukurannya, agar pesanan ke penjahit tidak salah.
18. Sebagai calon pengantin, saya ingin menetapkan target tabungan pernikahan dan tenggatnya, agar punya angka yang jelas.
19. Sebagai calon pengantin, saya ingin mencatat setoran tabungan satu per satu, agar terlihat progresnya.
20. Sebagai calon pengantin, saya ingin melihat berapa yang harus saya sisihkan per bulan untuk mengejar target, agar tahu apakah realistis.
21. Sebagai calon pengantin, saya ingin mendaftar kandidat vendor beserta penawaran dan kontaknya, agar bisa membandingkan berdampingan.
22. Sebagai calon pengantin, saya ingin menandai vendor yang saya pilih, agar penawarannya masuk ke anggaran tanpa saya ketik ulang.
23. Sebagai calon pengantin, saya ingin mengurutkan ulang baris di daftar mana pun, agar urutannya sesuai cara saya berpikir.
24. Sebagai calon pengantin, saya ingin mengunduh perencana saya, agar datanya tetap milik saya.
25. Sebagai calon pengantin yang sudah memakai perencana, saya ingin ditawari undangan website di saat yang tepat, agar tidak perlu mencari produk itu sendiri.

### Undangan Website — sebelum membeli

26. Sebagai calon pembeli, saya ingin membuka contoh undangan jadi secara penuh, agar yakin hasilnya sebelum bayar.
27. Sebagai calon pembeli, saya ingin melihat harga langsung tanpa harus chat admin, agar bisa memutuskan sendiri.
28. Sebagai calon pembeli, saya ingin melihat galeri template dengan pratinjau sungguhan, agar tahu persis yang saya beli.
29. Sebagai calon pembeli, saya ingin tahu masa aktif undangan sebelum bayar, agar tidak kaget saat link mati.
30. Sebagai calon pembeli yang ragu, saya ingin tombol tanya-WhatsApp di setiap halaman, agar bisa bertanya tanpa kehilangan konteks.
31. Sebagai calon pembeli, saya ingin mulai mengisi data dulu dan membayar belakangan, agar saya sudah terlanjur berinvestasi waktu sebelum diminta uang.

### Pembayaran & akun

32. Sebagai pembeli, saya ingin membayar dengan QRIS, agar tidak perlu rekening bank tertentu.
33. Sebagai pembeli, saya ingin membayar dengan Virtual Account atau e-wallet, agar bisa pakai metode yang biasa saya pakai.
34. Sebagai pembeli, saya ingin akses terbuka otomatis begitu pembayaran lunas, agar tidak menunggu aktivasi manual.
35. Sebagai pembeli, saya ingin masuk cukup dengan email atau Google, agar tidak perlu mengingat password baru.
36. Sebagai pembeli, saya ingin menerima bukti bayar di email, agar punya catatan transaksi.
37. Sebagai pembeli yang pembayarannya kedaluwarsa, saya ingin mengulang checkout tanpa kehilangan data yang sudah saya isi.
38. Sebagai pembeli, saya ingin membeli buku tamu digital terpisah kapan saja, agar tidak dipaksa membeli paket besar di awal.
39. Sebagai pembeli, saya ingin melihat apa saja yang sudah saya beli dan sampai kapan aktif, agar tidak salah kira.

### Undangan Website — editor

40. Sebagai pengantin, saya ingin mengisi nama lengkap, nama panggilan, nama orang tua, dan foto kami, agar undangan terasa personal.
41. Sebagai pengantin, saya ingin menambahkan lebih dari satu acara (akad dan resepsi), agar tamu tahu keduanya.
42. Sebagai pengantin, saya ingin mengisi tanggal, jam mulai–selesai, nama gedung, dan alamat tiap acara, agar tamu tidak salah datang.
43. Sebagai pengantin, saya ingin menempelkan link Google Maps, agar tamu bisa langsung navigasi.
44. Sebagai pengantin, saya ingin memilih warna dan font dari preset, agar cocok dengan konsep pernikahan kami.
45. Sebagai pengantin, saya ingin mengganti template tanpa kehilangan data yang sudah diisi, agar bisa bereksperimen.
46. Sebagai pengantin, saya ingin menulis love story dengan beberapa milestone bertanggal, agar tamu tahu perjalanan kami.
47. Sebagai pengantin, saya ingin mengunggah foto prewedding ke galeri, agar undangan tidak polos.
48. Sebagai pengantin, saya ingin menempelkan link video YouTube, agar bisa memasang video prewedding.
49. Sebagai pengantin, saya ingin menambahkan rekening dan e-wallet untuk amplop digital, agar tamu jauh tetap bisa memberi hadiah.
50. Sebagai pengantin, saya ingin menambahkan alamat pengiriman kado, agar tamu yang mengirim barang tidak perlu bertanya.
51. Sebagai pengantin, saya ingin menempelkan link live streaming, agar tamu yang tidak hadir tetap ikut.
52. Sebagai pengantin, saya ingin memilih lagu latar dari daftar yang disediakan, agar tidak berurusan dengan hak cipta.
53. Sebagai pengantin, saya ingin menentukan slug URL saya sendiri, agar linknya mudah diingat.
54. Sebagai pengantin, saya ingin melihat pratinjau persis seperti tampilan tamu sebelum terbit, agar tidak ada salah ketik yang tersebar.
55. Sebagai pengantin, saya ingin mengedit undangan kapan saja setelah terbit, agar perubahan jam atau lokasi langsung berlaku.
56. Sebagai pengantin, saya ingin menetapkan batas akhir pengisian RSVP, agar data final sebelum saya setor ke katering.

### Kelola tamu & penyebaran

57. Sebagai pengantin, saya ingin satu daftar tamu yang dipakai untuk undangan sekaligus buku tamu, agar tidak mengetik ulang.
58. Sebagai pengantin, saya ingin menambahkan tamu satu per satu, agar bisa menyisipkan tamu dadakan.
59. Sebagai pengantin, saya ingin menempelkan daftar tamu massal dari catatan saya sekaligus, agar tidak mengetik ratusan baris.
60. Sebagai pengantin, saya ingin mengelompokkan tamu (keluarga, kantor, teman kampus), agar bisa menyapa dan memilah dengan tepat.
61. Sebagai pengantin, saya ingin menetapkan jatah pax per tamu, agar tidak ada yang mengonfirmasi melebihi jatahnya.
62. Sebagai pengantin, saya ingin menandai tamu untuk sesi acara tertentu, agar tamu sesi kedua tidak datang di sesi pertama.
63. Sebagai pengantin, saya ingin setiap tamu punya link personal, agar undangan menyapa mereka dengan nama.
64. Sebagai pengantin, saya ingin mengirim undangan ke WhatsApp tamu dengan pesan yang sudah terisi, agar cukup satu klik lalu kirim.
65. Sebagai pengantin, saya ingin menandai tamu yang sudah saya kirimi, agar tidak dobel kirim atau ada yang terlewat.
66. Sebagai pengantin, saya ingin menyunting nama atau nomor tamu yang salah, agar link personalnya tetap benar.
67. Sebagai pengantin, saya ingin satu link umum tanpa nama, agar bisa saya sebar di grup atau story.
68. Sebagai pengantin, saya ingin mencari tamu dengan cepat di daftar yang panjang, agar tidak menggulir ratusan baris.

### Pengalaman tamu

69. Sebagai tamu, saya ingin undangan terbuka cepat di HP dengan sinyal seadanya, agar saya tidak menutupnya sebelum sempat membaca.
70. Sebagai tamu, saya ingin melihat nama saya disapa di sampul, agar merasa benar-benar diundang.
71. Sebagai tamu, saya ingin melihat hitung mundur ke hari-H.
72. Sebagai tamu, saya ingin menyimpan acara ke kalender ponsel saya, agar tidak lupa.
73. Sebagai tamu, saya ingin membuka lokasi di aplikasi peta saya, agar bisa langsung berangkat.
74. Sebagai tamu, saya ingin mengonfirmasi kehadiran dengan jumlah orang yang saya bawa, agar tuan rumah bisa menyiapkan tempat.
75. Sebagai tamu, saya ingin diberi tahu kalau jatah pax saya terbatas, agar tidak salah isi.
76. Sebagai tamu, saya ingin mengubah jawaban RSVP saya, agar rencana yang berubah tetap tercatat benar.
77. Sebagai tamu, saya ingin menulis ucapan dan melihat ucapan tamu lain, agar terasa seperti buku tamu.
78. Sebagai tamu jauh, saya ingin menyalin nomor rekening satu ketukan, agar mudah mengirim hadiah.
79. Sebagai tamu, saya ingin membuka undangan saya lagi di hari-H dan menemukan QR saya di situ, agar tidak perlu menyimpan gambar apa pun.
80. Sebagai tamu, saya ingin QR saya tetap tampil walau sinyal di gedung buruk, agar tidak menahan antrean.
81. Sebagai tamu yang membuka setelah batas RSVP, saya ingin melihat pesan yang jelas bahwa RSVP ditutup.

### Buku Tamu Digital & QR — hari-H

82. Sebagai penerima tamu, saya ingin memindai QR tamu dari HP saya tanpa memasang aplikasi, agar tidak perlu menyewa perangkat khusus.
83. Sebagai penerima tamu, saya ingin melihat nama, kelompok, dan jatah pax tamu langsung setelah dipindai, agar bisa mengarahkan mereka.
84. Sebagai penerima tamu, saya ingin mengoreksi jumlah orang yang benar-benar datang saat check-in, agar data kehadiran akurat, bukan sekadar salinan RSVP.
85. Sebagai penerima tamu, saya ingin diberi tahu kalau QR ini sudah pernah dipindai beserta jamnya, agar tahu ini tamu yang sama kembali, bukan menolak mentah-mentah.
86. Sebagai penerima tamu, saya ingin mencari tamu berdasarkan nama dan meng-check-in-kan manual, agar tamu yang HP-nya mati tetap terlayani.
87. Sebagai penerima tamu, saya ingin mendaftarkan tamu yang tidak ada di daftar sama sekali, agar tamu dadakan tetap tercatat.
88. Sebagai penerima tamu, saya ingin check-in tetap berfungsi saat wifi gedung putus dan tersinkron sendiri saat tersambung lagi, agar tidak ada tamu yang hilang dari catatan.
89. Sebagai penerima tamu, saya ingin melihat berapa check-in yang masih menunggu terkirim, agar tahu apakah aman meninggalkan meja.
90. Sebagai penerima tamu, saya ingin membatalkan check-in yang salah pindai, agar angkanya tidak melenceng.
91. Sebagai penerima tamu, saya ingin beberapa meja memindai bersamaan, agar antrean terpecah.
92. Sebagai tamu, saya ingin difoto saat check-in, agar kehadiran saya terkenang.
93. Sebagai tamu, saya ingin melihat sapaan terima kasih dengan nama saya di layar setelah dipindai, agar terasa disambut.
94. Sebagai pengantin, saya ingin memasang layar yang menampilkan foto check-in tamu secara langsung, agar suasana acara lebih hidup.
95. Sebagai pengantin, saya ingin memantau jumlah yang sudah hadir secara real-time dari HP saya, agar tahu kapan acara ramai.
96. Sebagai pengantin, saya ingin foto check-in bisa dimatikan, agar tetap sopan untuk acara yang tidak menginginkannya.

### Rekap & dashboard

97. Sebagai pengantin, saya ingin melihat total diundang, menjawab hadir, tidak hadir, belum menjawab, dan total pax dalam satu layar, agar bisa lapor ke vendor tanpa menghitung manual.
98. Sebagai pengantin, saya ingin membandingkan jumlah RSVP hadir dengan jumlah yang benar-benar check-in, agar tahu selisih nyatanya.
99. Sebagai pengantin, saya ingin memfilter daftar per kelompok tamu, agar tahu siapa dari kantor yang datang.
100. Sebagai pengantin, saya ingin mengunduh data tamu, RSVP, dan check-in sebagai CSV, agar bisa saya olah di spreadsheet.
101. Sebagai pengantin, saya ingin melihat siapa yang sudah membuka undangannya, agar tahu siapa yang perlu diingatkan.
102. Sebagai pengantin, saya ingin memoderasi ucapan yang tidak pantas, agar tidak tampil di undangan.
103. Sebagai pengantin, saya ingin melihat sisa masa aktif tiap produk yang saya beli.
104. Sebagai pengantin, saya ingin mengunduh semua data saya setelah acara selesai, agar tetap punya arsipnya.

### Operasional (kami)

105. Sebagai pemilik bisnis, saya ingin melihat daftar pesanan dan statusnya, agar bisa menangani komplain pembayaran.
106. Sebagai pemilik bisnis, saya ingin memberi atau memperpanjang akses satu pernikahan secara manual, agar bisa memberi kompensasi tanpa deploy.
107. Sebagai pemilik bisnis, saya ingin halaman marketing terindeks Google untuk kata kunci "undangan digital", agar dapat pembeli tanpa iklan.
108. Sebagai pemilik bisnis, saya ingin tahu berapa pengguna perencana gratis yang berubah jadi pembeli undangan, agar tahu pintu masuknya bekerja.

## Implementation Decisions

**Bentuk aplikasi**

- Satu aplikasi Next.js (App Router), satu deployment. Tiga produk, bukan tiga service — tidak ada konsumen API kedua dan tidak ada bagian yang perlu diskalakan terpisah.
- Satu Postgres (18) diakses lewat `postgres.js`, tanpa ORM. Aplikasi terhubung sebagai role `ourday_app` yang tidak memiliki satu pun tabel, sehingga Row Level Security benar-benar mengikat padanya. Tidak ada BaaS: auth, storage, dan realtime masing-masing diselesaikan oleh hal yang paling dekat dengan nol dependensi — lihat empat poin di bawah.
- Mutasi lewat Server Actions. Route handler hanya untuk webhook pembayaran, karena itu satu-satunya yang butuh endpoint publik untuk pihak ketiga.

**Akar data adalah pernikahan, bukan undangan**

Inilah keputusan yang membuat tiga produk menjadi satu produk. `weddings` adalah agregat akar; undangan, tamu, dan perencana semuanya menggantung padanya. Daftar tamu **tidak** dimiliki oleh undangan — kalau ia dimiliki undangan, buku tamu akan butuh daftar keduanya, dan seluruh nilai integrasi hilang.

Tabel:

- `weddings` — owner, nama mempelai, tanggal acara. Dibuat gratis saat pengguna pertama kali memakai perencana.
- `wedding_members` — akses pasangan ke pernikahan yang sama. Dua peran saja: pemilik dan editor.
- `invitations` — wedding_id, slug unik, template_id, `theme` (jsonb), `content` (jsonb), status, `rsvp_deadline`.
- `guests` — wedding_id, nama, telepon, kelompok, sesi, `pax_allowed`, `token` unik, `sent_at`, `first_opened_at`, `checked_in_at`, `checked_in_pax`, `checkin_photo_path`.
- `rsvps` — guest_id (nullable untuk link umum), nama, `attending`, `pax`, waktu ubah.
- `wishes` — wedding_id, guest_id nullable, nama, pesan, `hidden_at`.
- `planner_items` — wedding_id, `kind`, `parent_id`, judul, `amount_planned`, `amount_actual`, `due_at`, `done_at`, `position`, `meta` (jsonb).
- `orders` — wedding_id, `product`, jumlah, order_id provider, status, payload mentah, `paid_at`, `expires_at`.

**Tujuh fitur perencana adalah satu tabel**

Budget, to-do, rundown, seserahan, seragam, tabungan, dan vendor tampak seperti tujuh modul. Bentuknya sama: daftar baris berjudul, punya urutan, sebagian punya uang, sebagian punya waktu, sebagian punya status selesai. Menulis tujuh tabel dan tujuh CRUD untuk itu adalah tujuh kali pekerjaan yang sama.

Satu tabel `planner_items` dengan diskriminator `kind`, dan tujuh tampilan yang mengonfigurasi kolom mana yang terlihat dan bagaimana totalnya dihitung. Field khusus per jenis (ukuran seragam, PIC rundown, kontak vendor, link toko seserahan) masuk ke `meta`.

`parent_id` menangani dua kasus sekaligus: sub-pos di dalam pos anggaran, dan setoran di bawah target tabungan. Target tabungan adalah baris dengan `amount_planned` = target; tiap setoran adalah anak dengan `amount_actual`.

`// ponytail: satu tabel, validasi per-kind hanya di lapisan aplikasi. Pecah jadi tabel terpisah kalau suatu kind tumbuh punya lebih dari tiga field khusus.`

Vendor terpilih menyalin nilai penawarannya ke baris anggaran saat ditandai — penyalinan sekali, bukan tautan hidup. Tautan hidup berarti mengelola sinkronisasi dua arah untuk keuntungan yang tidak diminta siapa pun.

**Perencana gratis, dan itu keputusan bisnis, bukan kelalaian**

Perencana tidak dijual. Ia dipakai 6–12 bulan sebelum hari-H, saat pasangan belum siap membeli apa pun, dan ia yang membawa mereka masuk. Undangan dan buku tamu yang dijual, dan keduanya ditawarkan di dalam perencana pada momen yang relevan (undangan saat daftar tamu mulai diisi; buku tamu saat rundown mulai disusun). Konsekuensinya: tidak ada checkout untuk perencana, tidak ada batas kuota, tidak ada tier — nol kode monetisasi di seluruh modul perencana.

**Undangan publik**

- Satu route dinamis `/[slug]` yang me-render komponen template berdasarkan `template_id`. Template adalah komponen React yang membaca `content` dan `theme`. Bukan page builder, bukan drag-and-drop. Menambah desain = menambah satu komponen.
- Warna dan font diterapkan sebagai CSS custom properties dari `theme`. Tidak ada CSS yang di-generate lalu disimpan.
- Halaman di-render statis dan di-revalidate saat penerbitan/pengeditan, supaya tamu bersinyal buruk tetap dapat halaman cepat. Bagian yang harus segar (ucapan, hitungan RSVP) di-fetch di klien.
- Isi undangan disimpan sebagai satu dokumen `jsonb`, bukan dinormalisasi ke belasan tabel. Undangan adalah dokumen yang selalu dibaca utuh dan tidak pernah di-query per bagian.

Bentuk `content` yang mengunci keputusan bahwa acara adalah daftar, bukan pasangan tetap akad/resepsi:

```
content: {
  couple:  { groom: Person, bride: Person, coverPhoto?: string }
  events:  Array<{ name, startsAt, endsAt?, venue, address, mapsUrl? }>
  story?:  Array<{ date, title, body }>
  gallery?: string[]
  video?:  string
  gifts?:  { banks: Array<{ bank, number, holder }>, ewallets: [...], shippingAddress? }
  stream?: string
  music?:  string
}
```

**Token tamu adalah tulang punggung ketiga produk**

Satu nilai acak per tamu, 8 karakter base32, tidak berurutan. Dipakai untuk tiga hal:

1. Personalisasi undangan lewat `?to=<token>` — sapaan nama, pra-isi RSVP, penegakan batas pax.
2. Identitas RSVP, sehingga jawaban terikat pada orang, bisa diubah, dan tidak bisa digandakan.
3. Isi QR check-in.

Karena token sudah ada di tangan tamu sejak undangan dikirim, **tidak ada QR yang perlu dibuat, dicetak, atau dikirim ulang**. Halaman QR tamu adalah bagian dari undangannya sendiri.

Token adalah rahasia lemah dengan konsekuensi rendah: paling jauh, orang yang mendapat link itu bisa mengubah RSVP tamu tersebut atau check-in atas namanya. Ia bukan kredensial dan tidak memberi akses ke apa pun di luar satu pernikahan itu. Karena itu ia tidak butuh rotasi, kedaluwarsa, atau penandatanganan.

**QR dan pemindai**

- QR dirender sebagai SVG di halaman tamu, bukan gambar yang disimpan. Tidak ada file yang perlu dibuat, disimpan, atau dibersihkan.
- Halaman QR tamu disajikan sebagai halaman yang bisa dibuka offline setelah sekali dimuat, karena sinyal di dalam gedung sering hilang justru saat antre.
- Pemindai adalah halaman web yang dibuka penerima tamu di HP-nya sendiri, memakai kamera lewat `getUserMedia`. Tidak ada aplikasi yang dipasang dan tidak ada perangkat yang disewa.
- Dekode QR memakai satu pustaka pemindai untuk semua platform, bukan `BarcodeDetector` bawaan browser dengan fallback. `BarcodeDetector` tidak ada di Safari iOS, dan penerima tamu sering memakai iPhone; dua jalur kode untuk hasil yang sama lebih mahal daripada satu pustaka yang jalan di mana-mana.

**Check-in tidak boleh kehilangan data — ini batas yang tidak dimalaskan**

Wifi gedung buruk, dan sebuah pernikahan tidak punya kesempatan kedua. Check-in yang gagal berarti tamu tidak dapat souvenir dan tidak ada di catatan selamanya.

- Setiap pemindaian langsung ditulis ke antrean lokal di perangkat pemindai, lalu dikirim ke server. Antrean bertahan menembus refresh dan hilangnya koneksi, dan dikirim ulang otomatis saat tersambung.
- Aksi check-in idempoten terhadap `(guest_id, client_event_id)`, karena pengiriman ulang pasti terjadi.
- Jumlah antrean yang belum terkirim ditampilkan permanen di layar pemindai. Penerima tamu harus bisa melihat sendiri kapan aman meninggalkan meja.
- Pemindaian ulang QR yang sama **tidak** ditolak. Ia menampilkan "sudah check-in pukul X" beserta data tamunya, karena tamu memang wajar kembali ke meja, dan menolak mentah-mentah membuat penerima tamu bingung di depan antrean.
- Beberapa meja memindai bersamaan tanpa koordinasi; penulisan terakhir untuk tamu yang sama tidak menggandakan hitungan karena kehadiran adalah kolom pada baris tamu, bukan baris baru.

`// ponytail: kehadiran disimpan sebagai kolom di baris tamu, bukan tabel event check-in. Konsekuensinya tidak ada riwayat pemindaian. Pecah jadi tabel event kalau nanti butuh audit siapa memindai apa dan kapan.`

**Foto check-in**

- Diambil di perangkat pemindai, dikompres di browser, lalu diunggah lewat route handler milik sendiri yang menulis ke `UPLOAD_DIR` di disk, dengan batas ukuran dan allowlist mime ditegakkan di server. Object storage terkelola menyusul kalau volumenya menuntut; sampai saat itu ia dependensi untuk sesuatu yang sudah dikerjakan filesystem.
- Bisa dimatikan per pernikahan. Foto orang adalah data pribadi; defaultnya mati sampai pemilik menyalakannya.
- Layar tampilan berlangganan lewat `LISTEN/NOTIFY` Postgres yang dijembatani ke SSE. Trigger pada `guests` mengirim `pg_notify('checkin', wedding_id)` saat kolom check-in berubah, dan pelanggan membaca ulang. Payload sengaja hanya berisi id pernikahan: nama tamu tidak perlu berkeliaran di channel broadcast. Tidak ada pustaka websocket dan tidak ada polling.

**Ucapan terima kasih**

Setelah dipindai, layar pemindai menampilkan sapaan terima kasih bernama untuk tamu. Itu ucapan terima kasihnya. Tidak ada pesan WhatsApp otomatis pasca-check-in, karena itu menuntut WhatsApp Business API — verifikasi Meta, template pesan yang harus disetujui, dan biaya per percakapan. Jalur peningkatannya jelas kalau nanti diminta pelanggan.

**Penyebaran undangan ke WhatsApp**

- Memakai deep link `wa.me/<nomor>?text=<pesan + link personal>` yang dibuka satu per satu dari dashboard, bukan WhatsApp Business API. Untuk volume awal, WABA adalah biaya tanpa manfaat.
- Nomor telepon dinormalkan ke E.164 Indonesia saat disimpan (`08...` → `628...`), karena `wa.me` menolak format lokal. Normalisasi di titik masuk, bukan di titik pakai.
- `sent_at` ditandai saat tombol ditekan dan bisa dibatalkan manual. Kita tidak bisa tahu pesan benar-benar terkirim; kolom ini catatan niat, bukan bukti. UI harus menyebutnya "sudah dikirim", bukan "diterima".

**Pembayaran & entitlement**

- Satu penyedia: Midtrans Snap (QRIS, VA, e-wallet dalam satu popup). Tidak ada abstraksi `PaymentProvider` untuk satu implementasi.
- Dua SKU sekali bayar: undangan dan buku tamu. Bukan langganan. Tidak ada mesin billing, proration, atau kartu tersimpan.
- Entitlement tidak punya tabel sendiri. Akses ke sebuah produk = ada baris `orders` yang lunas untuk `(wedding_id, product)` dan belum lewat `expires_at`. Pemberian manual adalah baris order bernilai nol — dan justru karena itu ia terekam dan bisa diaudit.
- Status lunas **hanya** ditetapkan oleh webhook yang tanda tangannya diverifikasi di server. Redirect sukses dari browser tidak pernah mengubah status apa pun. Ini batas kepercayaan; tidak ada versi malas di sini.
- Webhook idempoten terhadap `order_id`; Midtrans mengirim ulang notifikasi.
- `expires_at` dihitung saat lunas dari satu konstanta masa aktif per produk, di satu tempat. Ini tombol kalibrasi: promo dan perpanjangan mengubah data, bukan kode.
- Setelah kedaluwarsa, halaman publik menampilkan "undangan berakhir" dan pemindai berhenti menerima, tapi dashboard tetap bisa diakses untuk mengunduh data. Data tidak dihapus.

**Otentikasi & otorisasi**

- Magic link yang ditulis sendiri: token 32 byte acak, hanya sha256-nya yang disimpan, sekali pakai, berlaku 15 menit, dan sesi berupa cookie HttpOnly bertanda tangan HMAC-SHA256 dari `node:crypto`. Tidak ada password — karena itu tidak ada penyimpanan hash, tidak ada alur reset, dan tidak ada pilihan algoritma yang bisa salah. Ini satu-satunya bagian keamanan yang ditulis tangan, dan ia dipilih justru karena bentuk auth ini yang paling kecil kemungkinannya salah. Pengiriman email saat ini masuk ke tabel `email_outbox`; menyambungkannya ke SMTP adalah satu fungsi, bukan satu perubahan desain.
- Row Level Security di semua tabel adalah penjaga kepemilikan yang sesungguhnya; kode aplikasi tidak boleh jadi satu-satunya lapisan yang memeriksa kepemilikan. Kepemilikan diturunkan dari `wedding_members`, jadi pasangan otomatis mendapat akses yang sama.
- Pemindai dijalankan oleh penerima tamu yang biasanya bukan pemilik akun. Aksesnya lewat link pemindai berbatas waktu yang diterbitkan pemilik dan bisa dicabut, bukan lewat berbagi akun. Link ini hanya boleh membaca tamu dan menulis check-in untuk satu pernikahan — bukan membaca perencana, anggaran, atau data pembayaran.
- Rute publik (undangan, RSVP, ucapan) memakai kunci anon dengan policy eksplisit: insert diizinkan, ucapan yang tersembunyi tidak terbaca, dan `guests` hanya terbaca pada baris yang tokennya cocok.
- Submit RSVP dan ucapan dibatasi rate per IP dan per pernikahan. Form publik tanpa login adalah target spam.

**Media**

- Unggahan langsung dari browser ke storage dengan signed URL. Kompresi di browser sebelum unggah. Batas ukuran dan jumlah ditegakkan di server saat penerbitan.
- Video hanya lewat embed pihak ketiga. Kami tidak menghosting video.

**Halaman marketing**

Statis, bahasa Indonesia, server-rendered untuk SEO, metadata dan Open Graph per halaman. Halaman demo template adalah undangan sungguhan berisi data contoh — bukan tangkapan layar — supaya tidak ada dua sumber kebenaran untuk tampilan template.

- **Satu bagian bergerak, dan pinning-nya bukan pekerjaan GSAP.** Hero sudah menjanjikan tiga momen — "setahun merencanakan, satu malam mengundang, satu pagi menyambut di pintu" — dan halaman itu tidak menunjukkan satu pun. Tiga pita terpisah tidak bisa membawa argumennya, karena tokennya akan tergambar tiga kali, dan tiga gambar dari satu benda persis kebalikan dari klaimnya. Jadi satu panggung lengket, token diam di tempat, harinya berganti di belakangnya. Yang menahan panggung adalah `position: sticky` — native, tanpa elemen spacer, dan tidak berkelahi dengan bilah URL ponsel yang mengubah tinggi viewport di tengah gulir, yang justru saat pinned section melompat. GSAP hanya mengerjakan bagian yang memang tidak punya jawaban native: scrub.
- **Framer Motion tidak dipasang, dan alasannya bukan selera.** Monopoli aslinya adalah animasi layout FLIP; galeri `/desain` adalah dua seksi statis tanpa tab dan tanpa filter, jadi tidak ada yang di-FLIP. Sisanya sudah ditutup CSS. Dua pustaka animasi untuk menjual tiga belas template adalah bloat yang akan ditagih pukul 3 pagi.
- **Ongkosnya dikurung di satu halaman.** GSAP menambah 55 kB pada `/`, dan `/u/[slug]` — jalur yang dibuka 400 tamu di ponsel — tetap 107 kB, angka yang sama persis seperti sebelum pustakanya masuk. Itu diverifikasi dari keluaran build, bukan diasumsikan dari code splitting.
- **Reveal marketing tetap `.rise`, bukan pustaka.** Ia sudah ada, nol byte, dan sengaja tidak scroll-linked: ia menganimasi transform saja, tanpa opacity dan tanpa fill mode, sehingga tidak ada jalan di mana teks etalase gagal tampil. Menggantinya dengan JavaScript adalah menukar sesuatu yang tidak bisa gagal dengan sesuatu yang bisa.
- **`Motion()` dihapus; aturannya dikirim sekali.** Keyframes undangan hidup di dalam `<style>` yang dirender ulang oleh tiap template, padahal `globals.css` sudah dimuat dari layout akar dan menjangkau setiap halaman. Itu byte yang sama dikirim lagi, di halaman yang paling tidak mampu membayarnya. Pindah ke `globals.css` menghapus komponennya, enam pemanggilnya, dan sekaligus memberi marketing akses yang ternyata tidak dipakainya.
- **Foto ada karena kalimatnya, bukan karena halaman butuh gambar.** Tiga foto adalah tiga momen yang sudah disebut hero. Foto keempat akan jadi foto tanpa argumen. Ketiganya disusun dengan subjek di sepertiga kanan dan udara sepi di kiri, karena headline duduk di kiri — dan itu tepat salah untuk crop potret, yang membuang kanan; `object-position` digeser ke 66% di bawah `sm` supaya ponsel tidak mendapat dinding kosong.
- **Kontras scrim diukur terhadap foto putih polos, bukan terhadap ketiga foto yang dikirim.** Fotonya adalah bagian yang akan ditukar orang non-teknis, dan caption yang diam-diam jadi tak terbaca bukan kegagalan yang akan tertangkap hal lain. Titik ukurnya tepi kanan teks, bukan tengah bingkai: headline `max-w-2xl` di dalam kontainer `max-w-6xl` berakhir di 58% lebar, sementara gradien secara bawaan memudar di 50% — sebelum diperbaiki, sepertiga terakhir tiap headline berdiri di luar lindungannya.

## Testing Decisions

**Apa yang disebut tes yang baik di sini:** tes yang gagal kalau perilaku yang dilihat pengguna berubah, dan tidak gagal kalau kita mengganti nama fungsi, memindahkan file, atau menukar template. Tes tidak menyentuh tabel langsung untuk memverifikasi hasil kalau perilaku itu bisa diamati lewat jalur yang sama dengan yang dipakai pengguna.

**Satu seam untuk ketiga produk.** Semua tes otomatis masuk lewat lapisan Server Action + route handler, dengan Postgres asli dan penyedia pembayaran yang di-stub di batas HTTP. Tidak ada unit test untuk fungsi internal, tidak ada mock repository, tidak ada tes komponen.

Alasan memilih seam ini: ia titik tertinggi yang masih bisa dijalankan tanpa browser, dan satu-satunya kontrak yang benar-benar dipakai UI. Menambah produk kedua dan ketiga tidak menambah seam — check-in dan perencana masuk lewat pintu yang sama dengan RSVP.

Dua hal berada di luar seam dan diverifikasi dengan mata, bukan dengan tes otomatis:

- Tampilan dan animasi template. Snapshot template adalah tes yang selalu gagal karena alasan yang salah.
- Kamera dan dekode QR. Yang diuji otomatis adalah aksi check-in setelah token terbaca, bukan pembacaan kameranya. Pemindaian sungguhan diuji manual sekali di Android dan sekali di iOS sebelum rilis, karena di situlah kegagalannya benar-benar terjadi.

**Yang wajib punya tes:**

1. Alur undangan: buat pernikahan → bayar (webhook lunas) → terbit → buka `/[slug]?to=token` → kirim RSVP → muncul di rekap dengan pax benar.
2. Batas pax: RSVP melebihi `pax_allowed` ditolak; RSVP tanpa token tidak terikat batas.
3. Batas waktu RSVP: submit setelah `rsvp_deadline` ditolak server, bukan sekadar disembunyikan di UI.
4. Alur check-in: tamu yang sama diundang, RSVP, lalu check-in — rekap menunjukkan ketiga kejadian pada satu baris tamu, dan selisih RSVP-versus-hadir benar.
5. Idempotensi check-in: aksi yang sama dikirim dua kali dengan `client_event_id` sama tidak menggandakan kehadiran; dengan id berbeda ia memperbarui, bukan menduplikasi.
6. Pemindaian ulang: token yang sudah check-in mengembalikan status "sudah check-in" beserta waktunya, bukan galat.
7. Pembatalan check-in mengembalikan hitungan ke keadaan sebelumnya.
8. Kewenangan pemindai: link pemindai bisa menulis check-in tapi tidak bisa membaca perencana, anggaran, atau pesanan; link yang dicabut ditolak.
9. Webhook pembayaran: tanda tangan salah ditolak; notifikasi ganda dengan `order_id` sama tidak menggandakan masa aktif.
10. Entitlement: buku tamu yang belum dibayar menolak check-in; undangan lewat `expires_at` tidak lagi menyajikan halaman publik, tapi datanya tetap terunduh.
11. Isolasi kepemilikan: pengguna A tidak bisa membaca atau mengubah data pernikahan B — diuji lewat RLS, bukan lewat pengecekan di kode aplikasi. Anggota `wedding_members` mendapat akses yang sama dengan pemilik.
12. Normalisasi telepon: `08xx`, `+62xx`, `62xx`, dan yang bertanda hubung menghasilkan link `wa.me` yang sama.
13. Perencana: total anggaran menjumlahkan pos beserta anaknya tanpa menghitung ganda; menandai vendor terpilih menyalin nilainya ke anggaran sekali dan tidak berubah lagi setelahnya.
14. Perencana: baris satu jenis tidak pernah bocor ke tampilan jenis lain — satu tabel, jadi ini justru yang paling mungkin salah.

**Prior art:** tidak ada, repo greenfield. Tes pertama menjadi pola untuk sisanya, jadi ia ditulis hati-hati: satu helper untuk menyemai pernikahan berbayar, satu helper untuk memanggil action sebagai pengguna atau sebagai pemindai. Tidak ada framework fixture di luar itu.

## Out of Scope

- **Program Mitra/afiliasi.** Butuh trafik dulu. Sebelum ada penjualan, sistem komisi adalah pembukuan untuk uang yang tidak ada.
- **WhatsApp Business API**, blast otomatis, dan ucapan terima kasih otomatis pasca-check-in. Deep link manual menutup kebutuhan penyebaran; WABA menuntut verifikasi Meta, persetujuan template, dan biaya per percakapan.
- **Impor tamu dari file Excel/CSV.** Tempel-massal dari clipboard menutup kebutuhan yang sama tanpa parser file dan tanpa urusan encoding.
- **Tier Premium, kustomisasi font/warna bebas, dan layanan desain custom.** Satu harga per produk, preset terbatas.
- **Perangkat pemindai khusus, cetak QR fisik, cetak label souvenir.** Semua bertumpu pada HP yang sudah ada di tangan orang.
- **Riwayat pemindaian dan audit trail check-in.** Kehadiran adalah kolom, bukan aliran kejadian.
- **Undangan non-pernikahan (event), multi-bahasa, filter Instagram, aplikasi mobile.**
- **Panel admin lengkap.** Operasional awal dijalankan lewat SQL langsung dan baris order bernilai nol.

## Further Notes

- **Urutan pembangunan mengikuti urutan pemakaian pelanggan, bukan urutan nilai jual.** Perencana lebih dulu karena ia yang membuat `weddings` dan menarik pengguna; undangan kedua karena ia yang menghasilkan uang dan membuat `guests`; buku tamu terakhir karena ia menumpang penuh pada keduanya. Membalik urutan ini memaksa menulis daftar tamu dua kali.
- **Keputusan bisnis yang menempel pada spec ini:** perencana gratis, undangan dan buku tamu bayar sekali, masa aktif tetap per produk. Semuanya hidup sebagai konstanta tunggal dan kolom, bukan tersebar di kode, supaya eksperimen harga tidak butuh deploy.
- **Yang menentukan menang atau kalah adalah kualitas template, bukan jumlah fitur** — dan yang paling menentukan adalah apakah templatenya cocok selera lokal. Pesaing punya 59 desain termasuk satu kategori Adat penuh; kita berangkat dengan lima desain minimalis Barat, yang berarti pasangan yang menikah adat Jawa tidak punya satu pun alasan melihat kita.
- **Delapan desain Adat adalah satu komponen dan delapan paket data**, bukan delapan komponen. Yang berbeda antar-adat hanya motif, palet, dan kosakata acara; struktur halamannya sama. Menambah adat kesembilan adalah satu file data. Ini trade yang sama dengan `planner_items`: tujuh fitur, satu tabel.
- **Warna pada desain Adat dimiliki paketnya, bukan pemilih tema.** Poleng Bali hitam-putih-merah karena itulah arti poleng; songket Minang emas di atas merah tua. Membiarkan pasangan mengubahnya jadi pastel menghapus justru hal yang membuat mereka memilihnya. Konsekuensinya "ubah warna" tidak berlaku untuk Adat, dan itu disengaja.
- **Paket adat memuat arsitektur, bukan cuma token.** Versi pertama hanya memvariasikan motif, palet, dan kosakata — dan hasilnya delapan desain yang sama dalam delapan warna, karena memang itu yang dibangun. Yang memisahkan undangan Jawa dari undangan Batak bukan warnanya: Jawa memasang gunungan, Minang gonjong yang menyapu ke atas, Bali candi bentar yang terbelah, Tionghoa moon gate, Bugis sulapa' eppa. Sekarang paket membawa crest, rule, bentuk kartu, dan sumbu baca. Adat kesembilan tetap satu file data — pelajarannya adalah tabelnya harus memuat apa yang sungguh berbeda.
- **Crest dan ground tiap adat harus mengatakan dua hal.** Sunda pada awalnya memakai mega mendung untuk keduanya, dan itu satu-satunya yang gagal: covernya mengulang kata yang sama, dan crest jadi derau di atas motif yang lebih terbaca darinya. Sekarang awan tinggal di kain dan atap julang ngapak mengambil cover. Tujuh pak lain memang sudah mengadu arsitektur dengan tekstilnya.
- **Bobot crest dihitung, bukan ditabelkan.** Crest lima kali lebih berat dari ground dan garisnya melintasi nama pasangan. Emas cerah Tionghoa pada 0.22 di atas merah tua mengangkat latar sampai teks krem tinggal 4.28:1 — di bawah AA, pada satu-satunya baris yang tidak boleh dipicingkan. `crestAlpha` menurunkan bobot dari plafon sampai lolos 5:1; hanya Tionghoa yang turun (ke 0.16), tujuh sisanya tetap di 0.22. Palet yang berubah menyelesaikan dirinya sendiri.
- **Setiap desain berdiri di atas sesuatu, bukan di atas bidang warna kosong.** Motif adat dulunya cuma pita 24px di puncak sampul dan wash tipis di footer; di antara keduanya halamannya kertas polos, dan itulah yang membuat semua template terasa datar dibanding pesaing yang tiap desainnya berlatar penuh. Sekarang motifnya jadi ground yang menutup seluruh halaman, `fixed` supaya tenunannya diam dan undangan bergerak melewatinya — itu yang dilakukan kain cetak, dan biayanya satu paint.
- **Warna benang diturunkan dari kainnya, bobotnya dari tintanya.** `deep` adalah pilihan yang jelas dan salah untuk separuh katalog: Minang, Tionghoa, dan Bugis berkain gelap dengan `deep` yang lebih gelap lagi, jadi groundnya hitam di atas hitam. Kain gelap ditenun benang terang — persis songket. Bobotnya per-tile karena parang itu garis rambut sementara poleng itu isian 50%; satu angka bersama mustahil. Tes menghitung ulang kontras di bawah tenunan untuk kedelapan pak dan menolak pak baru yang tidak punya ruang.
- **Poleng tidak dijadikan latar, dan itu bukan kompromi.** Poleng adalah kain pembalut tiang — pada opacity berapa pun ia terbaca sebagai papan catur di belakang teks. Bali membanding dengan poleng dan beralas patra punggel, ukiran yang memang menutupi dinding Bali. Satu-satunya pak yang butuh dua gambar, dan alasannya ada di gambarnya.
- **Klasik, Modern, dan Monokrom sengaja tetap tanpa latar.** Blurb mereka menjanjikan "tanpa ornamen" dan "nol dekorasi"; menambahkan tenunan akan membatalkan justru hal yang dipilih pembelinya. Katalog yang punya tiga desain benar-benar sunyi adalah katalog, bukan kekurangan.
- **Kartu galeri adalah demonya, bukan tiruan demonya.** Sebelumnya `/desain` menggambar satu kartu buatan tangan yang diwarnai ulang per palet, dengan alasan "satu sumber kebenaran, demo cuma satu klik". Alasan itu gagal pada satu-satunya tugas galeri: orang yang memilih di antara tiga belas desain membandingkannya berdampingan, dan tiga belas pewarnaan ulang berkata "tiga belas palet". Sekarang kartunya iframe demo sungguhan — tidak ada tangkapan layar untuk diregenerasi dan tidak ada yang bisa basi. Diukur: 29 request, 26 kB, load 575 ms, karena bundle-nya dipakai bersama antar-iframe.
- **Rundown muncul di undangan karena ia sudah ada di `planner_items`, bukan karena disalin ke sana.** Pesaing menjual rundown dua kali — sekali di dalam perencana, sekali sebagai tambahan di undangan — karena keduanya dibangun tim berbeda di tahun berbeda, dan angka mereka sendiri membuktikannya: rundown muncul dua kali di halaman produk mereka. Di sini satu tabel dibaca dua kali, jadi pasangan yang menggeser akad menggesernya di semua tempat. Ini keuntungan struktural yang tidak bisa mereka tiru tanpa migrasi data.
- **Yang internal tetap internal.** Run-of-show berisi bongkar muat vendor dan nama MC. Hanya baris yang dicentang pasangan (`meta.guest`) yang menyeberang, lewat definer function yang tidak pernah mengembalikan `meta` sama sekali — jadi "MC Yudha" dan token bagi-pakai tidak punya jalan ke halaman publik. Tanpa satu pun dicentang, seksinya tidak muncul, bukan muncul kosong.
- **Satu tempat yang membatalkan cache tamu setelah edit perencana.** Semua mutasi perencana lewat `refresh()` di satu Server Action; di situlah tag undangan dibatalkan bila jenisnya `rundown`. Menaruhnya di tiap aksi berarti mutasi berikutnya bisa lupa.
- **Risiko terbesar ada di hari-H, dan sekarang ada dua.** Trafik undangan menumpuk beberapa jam di akhir pekan, dan meja check-in berjalan di wifi gedung yang buruk. Karena itu halaman publik statis dan tidak menyentuh database saat dibaca, dan pemindai menyimpan antrean lokal. Keduanya bukan optimasi — keduanya menutup kegagalan yang tidak punya kesempatan kedua.
- **Rute rundown publik adalah `/rundown/[token]`, bukan di bawah `/rencana`.** Dua alasan, keduanya fatal untuk bentuk yang semula direncanakan: segmen statis `rundown` menutupi `[kind]` yang menggerakkan ketujuh daftar perencana, dan segala hal di bawah `/rencana` berada di dalam layout yang me-redirect pengunjung tanpa sesi — sementara MC tidak punya akun.
- **Menjalankan dari nol:** pastikan Postgres hidup di `localhost:5432`, lalu `npm install`, `npm run db:migrate`, `npm run build`, `npm start`. `npm test` menjalankan 228 tes terhadap Postgres sungguhan. `npm run db:migrate` juga menanam tiga belas undangan demo — satu per desain — sehingga galeri `/desain` tidak pernah mengirim link mati. `scripts/seed-demo.ts` membangun satu pernikahan lengkap dan mencetak semua URL untuk menelusuri produk dari ujung ke ujung. `scripts/generate-marketing.ts` dan `scripts/generate-covers.ts` membuat ulang fotonya lewat RunComfy dan butuh `RUNCOMFY_TOKEN`; keduanya opsional, hasilnya sudah ikut di repo.
- **Yang belum tersambung ke dunia luar, dan butuh kredensial alih-alih kode:** SMTP untuk mengirim magic link (kini mendarat di tabel `email_outbox`), dan kunci Midtrans produksi (webhook, verifikasi tanda tangan, dan idempotensinya sudah lengkap dan teruji tanpa jaringan). Yang masih harus diputuskan: nama domain, dan apakah harga buku tamu Rp 150.000 bertahan.
- Spec ini tidak diterbitkan ke issue tracker karena belum ada tracker yang terkonfigurasi untuk repo ini.
