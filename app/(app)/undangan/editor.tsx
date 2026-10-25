"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  EMPTY_PERSON,
  PALETTES,
  type BankAccount,
  type InvitationContent,
  type InvitationTheme,
  type Milestone,
  type Person,
  type WeddingEvent,
} from "@/lib/invitation-content.ts";
import { TEMPLATES, type TemplateId } from "@/lib/templates/registry.ts";
import { TEMPLATE_COMPONENTS } from "@/lib/templates/index.ts";
import type { Invitation } from "@/lib/invitations.ts";
import { publishInvitationAction, saveInvitationAction } from "./actions.ts";

/**
 * One long form and a live preview of the real template — not an approximation
 * of it. The couple is about to send this link to four hundred people, so the
 * only preview worth having is the component the guest will actually get.
 */

const EMPTY_EVENT: WeddingEvent = { name: "", startsAt: "", endsAt: "", venue: "", address: "" };
const EMPTY_MILESTONE: Milestone = { date: "", title: "", body: "" };
const EMPTY_BANK: BankAccount = { bank: "", number: "", holder: "" };

const PALETTE_LABEL: Record<keyof typeof PALETTES, string> = {
  sand: "Pasir",
  rose: "Mawar",
  sage: "Sage",
  ink: "Tinta",
};

/** Used by every list in the form, which is why it is a function and not a
 *  hand-rolled splice at six call sites. */
function move<T>(items: T[], from: number, delta: number): T[] {
  const to = from + delta;
  if (to < 0 || to >= items.length) return items;
  const next = items.slice();
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row!);
  return next;
}

/**
 * A phone photograph is three to six megabytes and would be served to every
 * guest on the invitation. Downscaling here is the single biggest thing that
 * keeps the public page fast, so it happens before the bytes ever leave.
 */
async function shrink(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 900_000) {
      bmp.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.82),
    );
    return blob ?? file;
  } catch {
    // Unsupported codec: let the server decide, it has the real allowlist.
    return file;
  }
}

async function uploadFile(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", await shrink(file), file.name);
  const res = await fetch("/media", { method: "POST", body });
  const json = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!res.ok || !json?.url) throw new Error(json?.error ?? "Gagal mengunggah file.");
  return json.url;
}

// `datetime-local` speaks wall clock; the RSVP deadline is a real instant, so it
// is the one field that has to cross that line explicitly.
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function Editor({
  invitation,
  paid,
  appUrl,
}: {
  invitation: Invitation;
  paid: boolean;
  appUrl: string;
}) {
  const [content, setContent] = useState<InvitationContent>(invitation.content);
  const [theme, setTheme] = useState<InvitationTheme>(invitation.theme);
  const [templateId, setTemplateId] = useState<TemplateId>(invitation.templateId);
  const [slug, setSlug] = useState(invitation.slug);
  const [deadline, setDeadline] = useState(toLocalInput(invitation.rsvpDeadline));
  const [status, setStatus] = useState(invitation.status);
  const [dirty, setDirty] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [tab, setTab] = useState<"isi" | "pratinjau">("isi");
  const [pending, start] = useTransition();

  // Six months of planning does not deserve to be lost to a stray back gesture.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function edit(next: Partial<InvitationContent>) {
    setContent((c) => ({ ...c, ...next }));
    setDirty(true);
  }
  function editPerson(who: "groom" | "bride", next: Partial<Person>) {
    setContent((c) => ({
      ...c,
      couple: { ...c.couple, [who]: { ...c.couple[who], ...next } },
    }));
    setDirty(true);
  }

  const patch = () => ({
    content,
    theme,
    templateId,
    slug,
    rsvpDeadline: deadline ? new Date(deadline).toISOString() : null,
  });

  function run(action: "save" | "publish") {
    start(async () => {
      setNote(null);
      const res =
        action === "save"
          ? await saveInvitationAction(invitation.id, patch())
          : await publishInvitationAction(invitation.id, patch());

      if (!res.ok) {
        setNote({ ok: false, text: res.error });
        return;
      }
      const saved = res.data!;
      setSlug(saved.slug);
      setStatus(saved.status);
      setDirty(false);
      setNote({
        ok: true,
        text: action === "publish" ? "Undangan sudah terbit." : "Perubahan tersimpan.",
      });
    });
  }

  const Preview = TEMPLATE_COMPONENTS[templateId];
  const publicUrl = `${appUrl}/u/${slug}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
      {/* ------------------------------------------------------------ header */}
      <div className="lg:col-span-2">
        <div className="card flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
          <div className="mr-auto">
            <h1 className="font-display text-2xl leading-tight">Undangan Website</h1>
            <p className="mt-0.5 text-xs text-ink-soft">
              {status === "published" ? (
                <>
                  Terbit di{" "}
                  <a
                    href={`/u/${slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    /u/{slug}
                  </a>
                </>
              ) : (
                "Masih draf — belum bisa dibuka tamu."
              )}
            </p>
          </div>

          <button
            className="btn btn-ghost"
            disabled={pending || !dirty}
            onClick={() => run("save")}
          >
            {pending ? "Menyimpan…" : dirty ? "Simpan" : "Tersimpan"}
          </button>

          {paid ? (
            <button className="btn btn-primary" disabled={pending} onClick={() => run("publish")}>
              {status === "published" ? "Simpan & terbitkan ulang" : "Terbitkan"}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button className="btn btn-primary" disabled title="Undangan belum dibeli">
                Terbitkan
              </button>
              <Link href="/tagihan" className="text-xs text-rose underline underline-offset-2">
                Undangan belum dibeli — beli dulu
              </Link>
            </div>
          )}
        </div>

        {note ? (
          <p
            role="status"
            className={
              "mt-3 rounded-xl border px-4 py-2.5 text-sm " +
              (note.ok
                ? "border-line bg-white text-ink"
                : "border-rose/40 bg-rose-soft text-rose")
            }
          >
            {note.text}
          </p>
        ) : null}

        {/* One column on a phone, so the form and the preview take turns. */}
        <div className="mt-4 flex gap-1 lg:hidden">
          {(["isi", "pratinjau"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                "btn " + (tab === t ? "btn-primary" : "btn-ghost")
              }
            >
              {t === "isi" ? "Isi undangan" : "Pratinjau"}
            </button>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------------- form */}
      <div className={"grid gap-5 " + (tab === "isi" ? "" : "hidden lg:grid")}>
        <Card title="Mempelai">
          <FileField
            label="Foto sampul"
            accept="image/*"
            onUrls={([url]) => edit({ couple: { ...content.couple, coverPhoto: url } })}
          />
          {content.couple.coverPhoto ? (
            <Thumb
              src={content.couple.coverPhoto}
              onRemove={() => edit({ couple: { ...content.couple, coverPhoto: undefined } })}
            />
          ) : null}

          {(["groom", "bride"] as const).map((who) => {
            const p = content.couple[who] ?? EMPTY_PERSON;
            return (
              <fieldset key={who} className="grid gap-3 border-t border-line pt-4">
                <legend className="text-xs font-medium text-ink-soft">
                  {who === "groom" ? "Mempelai pria" : "Mempelai wanita"}
                </legend>
                <Text
                  label="Nama lengkap"
                  value={p.fullName}
                  set={(v) => editPerson(who, { fullName: v })}
                />
                <Text
                  label="Nama panggilan"
                  value={p.nickName}
                  set={(v) => editPerson(who, { nickName: v })}
                />
                <Text
                  label="Nama orang tua"
                  value={p.parents}
                  set={(v) => editPerson(who, { parents: v })}
                  placeholder="Bapak Ahmad & Ibu Siti"
                />
                <Text
                  label="Instagram (opsional)"
                  value={p.instagram ?? ""}
                  set={(v) => editPerson(who, { instagram: v })}
                  placeholder="@namamu"
                />
                <FileField
                  label="Foto"
                  accept="image/*"
                  onUrls={([url]) => editPerson(who, { photo: url })}
                />
                {p.photo ? (
                  <Thumb src={p.photo} onRemove={() => editPerson(who, { photo: undefined })} />
                ) : null}
              </fieldset>
            );
          })}
        </Card>

        <Card
          title="Acara"
          hint="Akad dan resepsi adalah dua acara. Tambahkan sebanyak yang kamu butuhkan."
          action={
            <button
              className="btn btn-ghost text-xs"
              onClick={() => edit({ events: [...content.events, { ...EMPTY_EVENT }] })}
            >
              Tambah acara
            </button>
          }
        >
          {content.events.length === 0 ? (
            <Empty>Belum ada acara. Undangan tidak bisa diterbitkan tanpa satu acara.</Empty>
          ) : null}
          {content.events.map((ev, i) => (
            <Row
              key={i}
              index={i}
              total={content.events.length}
              onMove={(d) => edit({ events: move(content.events, i, d) })}
              onRemove={() => edit({ events: content.events.filter((_, j) => j !== i) })}
            >
              <Text
                label="Nama acara"
                value={ev.name ?? ""}
                set={(v) => edit({ events: content.events.map((x, j) => (j === i ? { ...x, name: v } : x)) })}
                placeholder="Akad Nikah"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Text
                  label="Mulai"
                  type="datetime-local"
                  value={ev.startsAt ?? ""}
                  set={(v) => edit({ events: content.events.map((x, j) => (j === i ? { ...x, startsAt: v } : x)) })}
                />
                <Text
                  label="Selesai (opsional)"
                  type="datetime-local"
                  value={ev.endsAt ?? ""}
                  set={(v) => edit({ events: content.events.map((x, j) => (j === i ? { ...x, endsAt: v } : x)) })}
                />
              </div>
              <Text
                label="Nama gedung"
                value={ev.venue ?? ""}
                set={(v) => edit({ events: content.events.map((x, j) => (j === i ? { ...x, venue: v } : x)) })}
                placeholder="Gedung Serbaguna Bina Karya"
              />
              <Area
                label="Alamat"
                value={ev.address ?? ""}
                set={(v) => edit({ events: content.events.map((x, j) => (j === i ? { ...x, address: v } : x)) })}
              />
              <Text
                label="Link Google Maps (opsional)"
                value={ev.mapsUrl ?? ""}
                set={(v) => edit({ events: content.events.map((x, j) => (j === i ? { ...x, mapsUrl: v } : x)) })}
                placeholder="https://maps.app.goo.gl/…"
              />
            </Row>
          ))}
        </Card>

        <Card
          title="Cerita kami"
          action={
            <button
              className="btn btn-ghost text-xs"
              onClick={() => edit({ story: [...content.story, { ...EMPTY_MILESTONE }] })}
            >
              Tambah milestone
            </button>
          }
        >
          {content.story.map((m, i) => (
            <Row
              key={i}
              index={i}
              total={content.story.length}
              onMove={(d) => edit({ story: move(content.story, i, d) })}
              onRemove={() => edit({ story: content.story.filter((_, j) => j !== i) })}
            >
              <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
                <Text
                  label="Tanggal"
                  type="date"
                  value={m.date ?? ""}
                  set={(v) => edit({ story: content.story.map((x, j) => (j === i ? { ...x, date: v } : x)) })}
                />
                <Text
                  label="Judul"
                  value={m.title ?? ""}
                  set={(v) => edit({ story: content.story.map((x, j) => (j === i ? { ...x, title: v } : x)) })}
                  placeholder="Pertama bertemu"
                />
              </div>
              <Area
                label="Cerita"
                value={m.body ?? ""}
                set={(v) => edit({ story: content.story.map((x, j) => (j === i ? { ...x, body: v } : x)) })}
              />
            </Row>
          ))}
        </Card>

        <Card title="Galeri & video">
          <FileField
            label="Foto prewedding"
            accept="image/*"
            multiple
            onUrls={(urls) => edit({ gallery: [...content.gallery, ...urls] })}
          />
          {content.gallery.length ? (
            <ul className="grid grid-cols-3 gap-2">
              {content.gallery.map((src, i) => (
                <li key={i} className="relative">
                  <img
                    src={src}
                    alt=""
                    className="aspect-square w-full rounded-lg border border-line object-cover"
                  />
                  <div className="mt-1 flex gap-1">
                    <button
                      className="btn btn-ghost flex-1 px-1 py-0.5 text-[10px]"
                      disabled={i === 0}
                      onClick={() => edit({ gallery: move(content.gallery, i, -1) })}
                      aria-label="Geser kiri"
                    >
                      ←
                    </button>
                    <button
                      className="btn btn-ghost flex-1 px-1 py-0.5 text-[10px]"
                      disabled={i === content.gallery.length - 1}
                      onClick={() => edit({ gallery: move(content.gallery, i, 1) })}
                      aria-label="Geser kanan"
                    >
                      →
                    </button>
                    <button
                      className="btn btn-danger flex-1 px-1 py-0.5 text-[10px]"
                      onClick={() => edit({ gallery: content.gallery.filter((_, j) => j !== i) })}
                      aria-label="Hapus foto"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          <Text
            label="Link video YouTube (opsional)"
            value={content.video ?? ""}
            set={(v) => edit({ video: v })}
            placeholder="https://youtu.be/…"
          />
          <Text
            label="Link live streaming (opsional)"
            value={content.stream ?? ""}
            set={(v) => edit({ stream: v })}
            placeholder="https://youtube.com/live/…"
          />
          <div className="border-t border-line pt-4">
            <FileField
              label="Musik latar (MP3, opsional)"
              accept="audio/mpeg"
              onUrls={([url]) => edit({ music: url })}
            />
            <p className="mt-1 text-[11px] text-ink-soft">
              Pakai lagu yang kamu punya hak pakainya. Musik tidak pernah menyala
              sendiri — tamu yang memilih untuk memutarnya.
            </p>
            {content.music ? (
              <button
                className="btn btn-danger mt-2 text-xs"
                onClick={() => edit({ music: undefined })}
              >
                Hapus musik
              </button>
            ) : null}
          </div>
        </Card>

        <Card title="Amplop digital">
          {(["banks", "ewallets"] as const).map((kind) => (
            <fieldset key={kind} className="grid gap-3 border-t border-line pt-4 first:border-0 first:pt-0">
              <div className="flex items-center gap-3">
                <legend className="mr-auto text-xs font-medium text-ink-soft">
                  {kind === "banks" ? "Rekening bank" : "E-wallet"}
                </legend>
                <button
                  className="btn btn-ghost text-xs"
                  onClick={() =>
                    edit({
                      gifts: { ...content.gifts, [kind]: [...content.gifts[kind], { ...EMPTY_BANK }] },
                    })
                  }
                >
                  Tambah
                </button>
              </div>
              {content.gifts[kind].map((b, i) => (
                <div key={i} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-3">
                  <Text
                    label={kind === "banks" ? "Bank" : "Layanan"}
                    value={b.bank ?? ""}
                    set={(v) =>
                      edit({
                        gifts: {
                          ...content.gifts,
                          [kind]: content.gifts[kind].map((x, j) => (j === i ? { ...x, bank: v } : x)),
                        },
                      })
                    }
                    placeholder={kind === "banks" ? "BCA" : "GoPay"}
                  />
                  <Text
                    label="Nomor"
                    value={b.number ?? ""}
                    set={(v) =>
                      edit({
                        gifts: {
                          ...content.gifts,
                          [kind]: content.gifts[kind].map((x, j) => (j === i ? { ...x, number: v } : x)),
                        },
                      })
                    }
                  />
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Text
                        label="Atas nama"
                        value={b.holder ?? ""}
                        set={(v) =>
                          edit({
                            gifts: {
                              ...content.gifts,
                              [kind]: content.gifts[kind].map((x, j) =>
                                j === i ? { ...x, holder: v } : x,
                              ),
                            },
                          })
                        }
                      />
                    </div>
                    <button
                      className="btn btn-danger px-2.5 text-xs"
                      aria-label="Hapus"
                      onClick={() =>
                        edit({
                          gifts: {
                            ...content.gifts,
                            [kind]: content.gifts[kind].filter((_, j) => j !== i),
                          },
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </fieldset>
          ))}
          <Area
            label="Alamat pengiriman kado (opsional)"
            value={content.gifts.shippingAddress ?? ""}
            set={(v) => edit({ gifts: { ...content.gifts, shippingAddress: v } })}
          />
        </Card>

        <Card title="Desain" hint="Ganti template kapan saja — isian kamu tidak hilang.">
          <div className="grid gap-2 sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTemplateId(t.id);
                  setTheme((v) => ({ ...v, palette: t.suggestedPalette }));
                  setDirty(true);
                }}
                className={
                  "rounded-xl border p-3 text-left transition-colors " +
                  (templateId === t.id
                    ? "border-ink bg-paper-deep"
                    : "border-line bg-white hover:bg-paper-deep")
                }
              >
                <span className="font-display text-lg">{t.name}</span>
                <span className="mt-1 block text-[11px] leading-relaxed text-ink-soft">
                  {t.blurb}
                </span>
              </button>
            ))}
          </div>

          <div>
            <span className="label">Warna</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PALETTES) as (keyof typeof PALETTES)[]).map((key) => (
                <button
                  key={key}
                  aria-pressed={theme.palette === key}
                  onClick={() => {
                    setTheme((v) => ({ ...v, palette: key }));
                    setDirty(true);
                  }}
                  className={
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs " +
                    (theme.palette === key ? "border-ink" : "border-line")
                  }
                >
                  <span
                    className="h-4 w-4 rounded-full border border-line"
                    style={{ background: PALETTES[key].accent }}
                  />
                  {PALETTE_LABEL[key]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="label">Huruf</span>
            <div className="flex gap-2">
              {(["serif", "sans"] as const).map((d) => (
                <button
                  key={d}
                  aria-pressed={theme.display === d}
                  onClick={() => {
                    setTheme((v) => ({ ...v, display: d }));
                    setDirty(true);
                  }}
                  className={
                    "rounded-xl border px-4 py-2 text-sm " +
                    (theme.display === d ? "border-ink" : "border-line") +
                    (d === "serif" ? " font-display text-lg" : "")
                  }
                >
                  {d === "serif" ? "Klasik (serif)" : "Modern (sans)"}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Alamat & RSVP">
          <label className="block">
            <span className="label">Alamat undangan</span>
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-xs text-ink-soft">/u/</span>
              <input
                className="input"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setDirty(true);
                }}
                spellCheck={false}
              />
            </div>
            <span className="mt-1 block text-[11px] text-ink-soft">
              Huruf kecil, angka, dan tanda hubung. 3–50 karakter.
            </span>
          </label>

          <Text
            label="Batas akhir RSVP (opsional)"
            type="datetime-local"
            value={deadline}
            set={(v) => {
              setDeadline(v);
              setDirty(true);
            }}
          />
          <p className="text-[11px] leading-relaxed text-ink-soft">
            Setelah batas ini, tamu melihat pesan bahwa RSVP ditutup dan server
            menolak kiriman baru — jadi angka yang kamu setor ke katering final.
            Ucapan tamu bisa kamu moderasi di{" "}
            <Link href="/tamu/ucapan" className="underline underline-offset-2">
              Tamu › Ucapan
            </Link>
            .
          </p>

          {status === "published" ? (
            <div className="rounded-xl border border-line bg-paper-deep p-3">
              <span className="label">Link umum</span>
              <p className="break-all text-xs">{publicUrl}</p>
              <p className="mt-2 text-[11px] text-ink-soft">
                Link personal per tamu (dengan nama dan jatah pax) ada di{" "}
                <Link href="/tamu" className="underline underline-offset-2">
                  Tamu
                </Link>
                .
              </p>
            </div>
          ) : null}
        </Card>
      </div>

      {/* ----------------------------------------------------------- preview */}
      <div className={tab === "pratinjau" ? "" : "hidden lg:block"}>
        <div className="lg:sticky lg:top-28">
          <p className="label">Pratinjau — persis yang dilihat tamu</p>
          {/* transform-gpu makes this a containing block, so the template's
              fixed music button stays inside the preview instead of floating
              over the editor. */}
          <div className="transform-gpu overflow-hidden rounded-2xl border border-line">
            <div className="h-[72vh] overflow-y-auto">
              <Preview
                content={content}
                theme={theme}
                palette={PALETTES[theme.palette] ?? PALETTES.sand}
                guestName="Budi Santoso"
                slug={slug}
                rsvpSlot={null}
                wishSlot={null}
                qrSlot={null}
                rundownSlot={null}
              />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-ink-soft">
            Form RSVP, ucapan, dan QR check-in hanya muncul di halaman tamu.
          </p>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------- fields --

function Card({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card p-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="mr-auto font-display text-xl">{title}</h2>
        {action}
      </div>
      {hint ? <p className="mb-4 text-[11px] leading-relaxed text-ink-soft">{hint}</p> : null}
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Text({
  label,
  value,
  set,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className="input"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => set(e.target.value)}
      />
    </label>
  );
}

function Area({
  label,
  value,
  set,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <textarea
        className="input min-h-20"
        value={value}
        onChange={(e) => set(e.target.value)}
      />
    </label>
  );
}

function FileField({
  label,
  accept,
  multiple,
  onUrls,
}: {
  label: string;
  accept: string;
  multiple?: boolean;
  onUrls: (urls: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <span className="label">{label}</span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={busy}
        className="block w-full text-xs text-ink-soft file:mr-3 file:rounded-lg file:border file:border-line file:bg-white file:px-3 file:py-1.5 file:text-xs"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (!files.length) return;
          setBusy(true);
          setError(null);
          try {
            onUrls(await Promise.all(files.map(uploadFile)));
          } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal mengunggah file.");
          } finally {
            setBusy(false);
          }
        }}
      />
      {busy ? <p className="mt-1 text-[11px] text-ink-soft">Mengunggah…</p> : null}
      {error ? <p className="mt-1 text-[11px] text-rose">{error}</p> : null}
    </div>
  );
}

function Thumb({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <img src={src} alt="" className="h-16 w-16 rounded-lg border border-line object-cover" />
      <button className="btn btn-danger text-xs" onClick={onRemove}>
        Hapus foto
      </button>
    </div>
  );
}

function Row({
  index,
  total,
  onMove,
  onRemove,
  children,
}: {
  index: number;
  total: number;
  onMove: (delta: number) => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-line p-3">
      <div className="flex items-center gap-2">
        <span className="tabular mr-auto text-xs text-ink-soft">#{index + 1}</span>
        <button
          className="btn btn-ghost px-2 py-0.5 text-xs"
          disabled={index === 0}
          onClick={() => onMove(-1)}
          aria-label="Naikkan"
        >
          ↑
        </button>
        <button
          className="btn btn-ghost px-2 py-0.5 text-xs"
          disabled={index === total - 1}
          onClick={() => onMove(1)}
          aria-label="Turunkan"
        >
          ↓
        </button>
        <button className="btn btn-danger px-2 py-0.5 text-xs" onClick={onRemove}>
          Hapus
        </button>
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-xs text-ink-soft">
      {children}
    </p>
  );
}
