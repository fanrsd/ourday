import Link from "next/link";
import { currentContext } from "@/lib/current.ts";
import { withCtx } from "@/lib/db.ts";
import { listGroups, listGuests, type GuestRow } from "@/lib/guests.ts";
import { waLink } from "@/lib/phone.ts";
import { removeGuestAction } from "./actions.ts";
import { GuestForm } from "./guest-form.tsx";
import { PasteBox } from "./paste-box.tsx";
import { ConfirmSubmit, CopyLink, SendWhatsApp } from "./row-actions.tsx";

export const metadata = { title: "Tamu — OurDay" };

type Search = { q?: string; group?: string; edit?: string };

export default async function TamuPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { q = "", group = "", edit = "" } = await searchParams;
  const { userId, wedding, owns } = await currentContext();

  const [guests, groups, invitation] = await Promise.all([
    listGuests(userId, wedding.id, { q, group }),
    listGroups(userId, wedding.id),
    withCtx({ userId }, async (tx) => {
      const [row] = await tx<[{ slug: string; status: string }]>`
        select slug, status from invitations where wedding_id = ${wedding.id}`;
      return row ?? null;
    }),
  ]);

  const base = process.env.APP_URL ?? "";
  const publicUrl = invitation ? `${base}/u/${invitation.slug}` : null;
  const couple = [wedding.groom_name, wedding.bride_name].filter(Boolean).join(" & ");
  const filtered = q !== "" || group !== "";

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Daftar tamu</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Satu daftar untuk undangan dan buku tamu. Kamu tidak perlu
            mengetiknya dua kali.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/tamu/rekap" className="btn btn-ghost">Rekap</Link>
          <Link href="/tamu/ucapan" className="btn btn-ghost">Ucapan</Link>
          <a href="/tamu/csv" className="btn btn-ghost" download>Unduh CSV</a>
        </div>
      </header>

      {!owns.invitation ? (
        <p className="card bg-rose-soft/60 px-4 py-3 text-sm">
          Undangan Website belum dibeli, jadi link personal belum bisa dibuka
          tamu. Daftar tamu di bawah tetap tersimpan — susun sekarang, beli
          kapan kamu siap.{" "}
          <Link href="/tagihan" className="underline underline-offset-2">
            Lihat harga
          </Link>
        </p>
      ) : null}

      {/* Story 67: one link with no name in it, for stories and group chats. */}
      <section className="card p-5">
        <h2 className="text-sm font-medium">Link umum tanpa nama</h2>
        <p className="mb-3 mt-1 text-xs text-ink-soft">
          Sebar di story atau grup. Tamu yang mengisi RSVP dari link ini tidak
          terikat jatah pax siapa pun, dan tercatat terpisah di rekap.
        </p>
        {publicUrl && invitation?.status === "published" ? (
          <CopyLink url={publicUrl} />
        ) : (
          <p className="text-sm text-ink-soft">
            Belum ada undangan yang terbit.{" "}
            <Link href="/undangan" className="underline underline-offset-2">
              Buat undangan dulu
            </Link>
            , lalu link umum dan link personal tiap tamu muncul di sini.
          </p>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-medium">Tambah satu tamu</h2>
        <GuestForm />
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-medium">Tempel daftar sekaligus</h2>
        <PasteBox />
      </section>

      <section>
        <form className="mb-4 flex flex-wrap items-end gap-3">
          <div className="grow sm:max-w-xs">
            <label className="label" htmlFor="q">Cari nama</label>
            <input id="q" name="q" defaultValue={q} className="input"
                   placeholder="Ketik sebagian nama" />
          </div>
          <div>
            <label className="label" htmlFor="group">Kelompok</label>
            <select id="group" name="group" defaultValue={group} className="input">
              <option value="">Semua kelompok</option>
              {groups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <button className="btn btn-ghost">Terapkan</button>
          {filtered ? (
            <Link href="/tamu" className="text-sm text-ink-soft underline underline-offset-2">
              Bersihkan
            </Link>
          ) : null}
        </form>

        <p className="mb-3 text-sm text-ink-soft">
          <span className="tabular font-medium text-ink">{guests.length}</span> tamu
          {filtered ? " cocok dengan filter" : " di daftar"}
        </p>

        {guests.length === 0 ? (
          <p className="card px-4 py-8 text-center text-sm text-ink-soft">
            {filtered
              ? "Tidak ada tamu yang cocok. Coba kata lain atau bersihkan filter."
              : "Belum ada tamu. Tempel daftarmu di kotak di atas — nama saja sudah cukup."}
          </p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-xs text-ink-soft">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Pax</th>
                  <th className="px-4 py-3 font-medium">Undangan</th>
                  <th className="px-4 py-3 font-medium">RSVP</th>
                  <th className="px-4 py-3 font-medium">Hadir</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g) =>
                  g.id === edit ? (
                    <tr key={g.id} className="border-b border-line bg-paper-deep/50">
                      <td colSpan={6} className="px-4 py-4">
                        <GuestForm guest={g} />
                      </td>
                    </tr>
                  ) : (
                    <Row
                      key={g.id}
                      guest={g}
                      couple={couple}
                      slug={invitation?.slug ?? null}
                      base={base}
                    />
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Row({
  guest: g,
  couple,
  slug,
  base,
}: {
  guest: GuestRow;
  couple: string;
  slug: string | null;
  base: string;
}) {
  const personal = slug ? `${base}/u/${slug}?to=${g.token}` : null;
  const waHref = personal ? waLink(g.phone, message(g.name, couple, personal)) : null;

  return (
    <tr className="border-b border-line last:border-0 align-top">
      <td className="px-4 py-3">
        <div className="font-medium">{g.name}</div>
        <div className="text-xs text-ink-soft">
          {[g.guest_group, g.session_label, g.phone].filter(Boolean).join(" · ") || "—"}
        </div>
      </td>
      <td className="tabular px-4 py-3">{g.pax_allowed}</td>
      <td className="px-4 py-3">
        <SendWhatsApp
          guestId={g.id}
          waHref={waHref}
          sentAt={g.sent_at}
          openedAt={g.first_opened_at}
        />
      </td>
      <td className="px-4 py-3">
        {g.attending === "yes" ? (
          <span className="text-leaf">Hadir · <span className="tabular">{g.rsvp_pax}</span></span>
        ) : g.attending === "no" ? (
          <span className="text-ink-soft">Tidak hadir</span>
        ) : (
          <span className="text-ink-soft">Belum menjawab</span>
        )}
      </td>
      <td className="px-4 py-3">
        {g.checked_in_at ? (
          <span className="text-leaf">Datang · <span className="tabular">{g.checked_in_pax}</span></span>
        ) : (
          <span className="text-ink-soft">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Link href={`/tamu?edit=${g.id}`} className="btn btn-ghost text-xs">Ubah</Link>
          <form action={removeGuestAction}>
            <input type="hidden" name="id" value={g.id} />
            <ConfirmSubmit
              className="btn btn-danger text-xs"
              confirm={`Hapus ${g.name} dari daftar tamu? Jawaban RSVP-nya ikut terhapus.`}
            >
              Hapus
            </ConfirmSubmit>
          </form>
        </div>
      </td>
    </tr>
  );
}

/** One template, no settings screen. Changing it is changing this string. */
const message = (name: string, couple: string, url: string) =>
  `Dengan penuh rasa syukur, kami mengundang ${name} untuk hadir di pernikahan kami.

${couple || "Kami"}

Undangan lengkap, lokasi acara, dan konfirmasi kehadiran ada di tautan berikut:
${url}

Merupakan kehormatan bagi kami apabila Anda berkenan hadir.`;
