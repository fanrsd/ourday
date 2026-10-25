import type { Kind } from "@/lib/planner.ts";

/**
 * The seven planner features differ only in which columns show, what the total
 * means, and what the empty page says. That difference is data, so it lives
 * here and one page renders all of it. Adding an eighth list is an entry here.
 */
export type Field =
  | { type: "title"; label: string; placeholder?: string }
  | { type: "note"; label: string; placeholder?: string }
  | { type: "planned"; label: string }
  | { type: "actual"; label: string }
  | { type: "date"; label: string }
  | { type: "datetime"; label: string }
  | { type: "text"; key: string; label: string; placeholder?: string }
  | { type: "url"; key: string; label: string; placeholder?: string }
  | { type: "flag"; key: string; label: string };

export type View = {
  label: string;
  blurb: string;
  /** Shown instead of a table when there is nothing yet. */
  empty: string;
  addLabel: string;
  fields: Field[];
  /** Label for the done checkbox; absent means this list has no done state. */
  doneLabel?: string;
  /** Up/down buttons. Off where the list has an inherent order of its own. */
  reorder: boolean;
  nested?: { label: string; addLabel: string; fields: Field[] };
  /** Which footer to draw under the list. */
  footer?: "budget" | "planned" | "savings";
  overdue?: boolean;
  weekFilter?: boolean;
  chooseVendor?: boolean;
  share?: boolean;
  seed?: boolean;
};

export const VIEWS: Record<Kind, View> = {
  budget: {
    label: "Anggaran",
    blurb:
      "Estimasi dan realisasi dicatat terpisah, jadi terlihat di mana kamu membengkak. Pos yang punya sub-pos dihitung dari sub-posnya.",
    empty: "Belum ada pos anggaran. Mulai dari yang paling besar: gedung dan katering.",
    addLabel: "Tambah pos",
    fields: [
      { type: "title", label: "Pos", placeholder: "Gedung" },
      { type: "planned", label: "Estimasi" },
      { type: "actual", label: "Realisasi" },
      { type: "flag", key: "paid", label: "Lunas" },
    ],
    reorder: true,
    nested: {
      label: "Sub-pos",
      addLabel: "Tambah sub-pos",
      fields: [
        { type: "title", label: "Sub-pos", placeholder: "Sewa gedung" },
        { type: "planned", label: "Estimasi" },
        { type: "actual", label: "Realisasi" },
        { type: "flag", key: "paid", label: "Lunas" },
      ],
    },
    footer: "budget",
  },

  todo: {
    label: "To-do",
    blurb: "Setiap tenggat dihitung mundur dari tanggal pernikahan kamu.",
    empty: "Belum ada tugas. Pakai daftar bawaan supaya tidak menatap halaman kosong.",
    addLabel: "Tambah tugas",
    fields: [
      { type: "title", label: "Tugas", placeholder: "Tes makanan katering" },
      { type: "date", label: "Tenggat" },
      { type: "text", key: "assignee", label: "Penanggung jawab", placeholder: "Rizky" },
    ],
    doneLabel: "Selesai",
    reorder: true,
    overdue: true,
    weekFilter: true,
    seed: true,
  },

  rundown: {
    label: "Rundown",
    blurb:
      "Tersusun otomatis menurut jam, jadi sesi yang kamu tambahkan belakangan tetap masuk di urutan yang benar.",
    empty: "Belum ada sesi. Mulai dari akad, lalu resepsi.",
    addLabel: "Tambah sesi",
    fields: [
      { type: "datetime", label: "Waktu" },
      { type: "title", label: "Acara", placeholder: "Akad nikah" },
      { type: "text", key: "pic", label: "Penanggung jawab", placeholder: "MC Yudha" },
      { type: "note", label: "Keterangan", placeholder: "Keluarga inti sudah duduk" },
      // The run-of-show is mostly internal — vendor load-in, MC briefing. This
      // marks the handful of sessions guests should actually see, and those are
      // the only rows the invitation ever reads.
      { type: "flag", key: "guest", label: "Tampilkan di undangan" },
    ],
    // The clock is the order. Manual reordering would only fight it.
    reorder: false,
    share: true,
  },

  seserahan: {
    label: "Seserahan",
    blurb: "Kisaran harga dan tempat belinya, supaya tidak bolak-balik mencari.",
    empty: "Belum ada daftar seserahan.",
    addLabel: "Tambah barang",
    fields: [
      { type: "title", label: "Barang", placeholder: "Kain batik" },
      { type: "planned", label: "Perkiraan harga" },
      { type: "url", key: "source", label: "Tempat beli", placeholder: "https://..." },
    ],
    doneLabel: "Sudah dibeli",
    reorder: true,
    footer: "planned",
  },

  seragam: {
    label: "Seragam",
    blurb: "Ukuran per orang, supaya pesanan ke penjahit tidak salah.",
    empty: "Belum ada yang didata.",
    addLabel: "Tambah orang",
    fields: [
      { type: "title", label: "Nama", placeholder: "Bu Sri" },
      { type: "text", key: "role", label: "Peran", placeholder: "Penerima tamu" },
      { type: "text", key: "size", label: "Ukuran", placeholder: "L" },
    ],
    doneLabel: "Sudah jadi",
    reorder: true,
  },

  tabungan: {
    label: "Tabungan",
    blurb: "Target beserta tenggatnya, lalu setoran dicatat satu per satu di bawahnya.",
    empty: "Belum ada target tabungan.",
    addLabel: "Tambah target",
    fields: [
      { type: "title", label: "Target", placeholder: "Tabungan resepsi" },
      { type: "planned", label: "Nominal target" },
      { type: "date", label: "Tenggat" },
    ],
    reorder: true,
    nested: {
      label: "Setoran",
      addLabel: "Catat setoran",
      fields: [
        { type: "title", label: "Keterangan", placeholder: "Setoran Januari" },
        { type: "actual", label: "Jumlah" },
        { type: "date", label: "Tanggal" },
      ],
    },
    footer: "savings",
  },

  vendor: {
    label: "Vendor",
    blurb:
      "Bandingkan penawaran berdampingan. Vendor yang kamu pilih penawarannya masuk ke anggaran tanpa diketik ulang.",
    empty: "Belum ada kandidat vendor.",
    addLabel: "Tambah vendor",
    fields: [
      { type: "title", label: "Nama vendor", placeholder: "Dapur Bu Ani" },
      { type: "text", key: "category", label: "Kategori", placeholder: "Katering" },
      { type: "planned", label: "Penawaran" },
      { type: "text", key: "contact", label: "Kontak", placeholder: "0812 3456 7890" },
    ],
    reorder: true,
    chooseVendor: true,
  },
};

export const fieldsFor = (view: View, isChild: boolean): Field[] =>
  isChild && view.nested ? view.nested.fields : view.fields;
