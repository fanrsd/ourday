// Builds one complete wedding and prints every URL needed to walk the product
// end to end. Used for the integration smoke test; not part of the app.
import { createHash, randomUUID } from "node:crypto";
import { loadEnv } from "../lib/env.ts";
import { sql, withCtx } from "../lib/db.ts";
import { requestLogin, consumeLogin } from "../lib/login.ts";
import { signSession } from "../lib/session.ts";
import { ensureWedding } from "../lib/wedding.ts";
import { PRODUCTS } from "../lib/products.ts";
import { getOrCreateInvitation, updateInvitation, publishInvitation } from "../lib/invitations.ts";
import { addGuest } from "../lib/guests.ts";
import { seedDefaultTodos, createItem, dueFromDateTime } from "../lib/planner.ts";
import { createScannerLink } from "../lib/checkin.ts";

loadEnv();

const email = `demo-${randomUUID().slice(0, 8)}@example.test`;
const userId = (await consumeLogin(
  new URL(await requestLogin(email)).searchParams.get("token")!,
))!;
const wedding = await ensureWedding(userId);

const day = new Date(Date.now() + 45 * 864e5);
const ymd = day.toISOString().slice(0, 10);
// Wall clock, exactly what <input type="datetime-local"> produces. An invitation
// prints the hour the couple typed; converting to an instant here would shift it.
const at = (h: number) => `${ymd}T${String(h).padStart(2, "0")}:00`;

await withCtx({ userId }, async (tx) => {
  await tx`update weddings set groom_name = 'Bagas', bride_name = 'Nadia',
             event_date = ${ymd}, checkin_photo_enabled = true
           where id = ${wedding.id}`;
  for (const product of ["invitation", "guestbook"] as const) {
    await tx`insert into orders (wedding_id, product, amount, provider_order_id,
                                 status, paid_at, expires_at)
             values (${wedding.id}, ${product}, 0, ${"seed-" + randomUUID()}, 'paid', now(),
                     now() + ${PRODUCTS[product].activeDays + " days"}::interval)`;
  }
});

const inv = await getOrCreateInvitation(userId, wedding.id);
const slug = `bagas-nadia-${randomUUID().slice(0, 6)}`;
await updateInvitation(userId, inv.id, {
  slug,
  templateId: "senja",
  theme: { palette: "rose", display: "serif" },
  rsvpDeadline: new Date(Date.now() + 30 * 864e5).toISOString(),
  content: {
    couple: {
      groom: { fullName: "Bagas Prasetyo", nickName: "Bagas", parents: "Bpk. Slamet & Ibu Retno" },
      bride: { fullName: "Nadia Rahmawati", nickName: "Nadia", parents: "Bpk. Hadi & Ibu Sri" },
    },
    events: [
      { name: "Akad Nikah", startsAt: at(8), endsAt: at(10), venue: "Masjid Al-Falah", address: "Jl. Diponegoro 12, Surabaya", mapsUrl: "https://maps.google.com/?q=Masjid+Al-Falah+Surabaya" },
      { name: "Resepsi", startsAt: at(18), endsAt: at(21), venue: "Gedung Wanita Candra Kencana", address: "Jl. Kalibokor Selatan 2, Surabaya" },
    ],
    story: [
      { date: "2019-03-11", title: "Pertama bertemu", body: "Satu kelompok KKN di Trenggalek, dan tidak saling suka." },
      { date: "2024-12-24", title: "Melamar", body: "Di teras rumah, disaksikan dua keluarga." },
    ],
    gallery: [],
    gifts: { banks: [{ bank: "BCA", number: "1234567890", holder: "Nadia Rahmawati" }], ewallets: [] },
  },
});
await publishInvitation(userId, inv.id);

await seedDefaultTodos(userId, wedding.id);
await createItem(userId, wedding.id, "budget", { title: "Gedung", amountPlanned: 45_000_000, amountActual: 45_000_000 });
await createItem(userId, wedding.id, "budget", { title: "Katering", amountPlanned: 60_000_000 });

// A run of the day with both halves in it: the sessions guests should see, and
// the internal ones they should not. The invitation must print exactly the four.
const sesi = (h: number, title: string, guest: boolean, note = "", pic = "") =>
  createItem(userId, wedding.id, "rundown", {
    title,
    dueAt: dueFromDateTime(at(h)),
    note,
    meta: { guest, ...(pic ? { pic } : {}) },
  });

await sesi(6, "Vendor bongkar muat", false, "", "Koordinator Rian");
await sesi(7, "Briefing MC dan tim", false, "", "MC Yudha");
await sesi(8, "Akad nikah", true, "Tamu sudah duduk pukul 07.45");
await sesi(10, "Sesi foto keluarga", true, "Keluarga inti dan besan");
await sesi(11, "Resepsi", true, "Ramah tamah dan santap siang");
await sesi(14, "Sungkeman dan penutup", true);

const guests = [
  { name: "Pak Hartono", phone: "081234567890", guest_group: "Keluarga", pax_allowed: 4 },
  { name: "Rina & Doni", phone: "08561112222", guest_group: "Kantor", pax_allowed: 2 },
  { name: "Yusuf", phone: "087700001111", guest_group: "Teman Kampus", pax_allowed: 1 },
];
const tokens: string[] = [];
for (const g of guests) tokens.push((await addGuest(userId, wedding.id, g)).token);

const scanner = await createScannerLink(userId, wedding.id, "Meja Depan", 48);

const base = process.env.APP_URL ?? "http://localhost:3000";
console.log(JSON.stringify({
  email,
  cookie: signSession(userId),
  weddingId: wedding.id,
  invitation: `${base}/u/${slug}`,
  personal: `${base}/u/${slug}?to=${tokens[0]}`,
  tokens,
  scanner: `${base}/pindai/${scanner.token}`,
  screen: `${base}/layar/${scanner.token}`,
}, null, 2));

await sql.end();
