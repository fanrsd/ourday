// Scratch: seeds a wedding and prints a session cookie so the /tamu pages can
// be driven in a real browser. Deleted after the smoke test.
import { randomUUID } from "node:crypto";
import { sql, withCtx } from "./lib/db.ts";
import { signSession } from "./lib/session.ts";
import { requestLogin, consumeLogin } from "./lib/login.ts";
import { ensureWedding } from "./lib/wedding.ts";
import { addGuest, bulkAddGuests, markSent, markInvitationOpened } from "./lib/guests.ts";
import { submitRsvp, submitWish } from "./lib/rsvp.ts";
import { PRODUCTS } from "./lib/products.ts";

const email = `smoke-${randomUUID()}@example.test`;
const token = new URL(await requestLogin(email)).searchParams.get("token")!;
const userId = (await consumeLogin(token))!;
const wedding = await ensureWedding(userId);

const slug = "smoke-" + randomUUID().slice(0, 8);
await withCtx({ userId }, async (tx) => {
  await tx`update weddings set groom_name = 'Rangga', bride_name = 'Cinta',
             event_date = current_date + 40 where id = ${wedding.id}`;
  await tx`insert into orders (wedding_id, product, amount, provider_order_id,
                              status, paid_at, expires_at)
           values (${wedding.id}, 'invitation', 0, ${"smoke-" + randomUUID()}, 'paid',
                   now(), now() + ${PRODUCTS.invitation.activeDays + " days"}::interval)`;
  await tx`insert into invitations (wedding_id, slug, status, rsvp_deadline)
           values (${wedding.id}, ${slug}, 'published', now() + interval '20 days')`;
});

await bulkAddGuests(userId, wedding.id, [
  "Ibu Sri Wahyuni, 081234567890, Keluarga",
  "Pak Hendra Gunawan, 081298765432, Keluarga",
  "Dewi Lestari\t081211112222",
  "Agus Salim, 081233334444, Kantor",
  "Rina Wijaya, 081255556666, Kantor",
  "Bagas Pratama",
].join("\n"));

const g = await addGuest(userId, wedding.id, {
  name: 'Ibu "Tante" Sari, S.H.', phone: "0812-7777-8888",
  guest_group: "Keluarga", session_label: "Resepsi", pax_allowed: 4,
});

const rows = await withCtx({ userId }, (tx) =>
  tx<{ id: string; name: string; token: string }[]>`
    select id, name, token from guests where wedding_id = ${wedding.id} order by name`);

await markSent(userId, rows.slice(0, 4).map((r) => r.id));
await markInvitationOpened(rows[0]!.token);
await markInvitationOpened(g.token);

const rsvp = (t: string, attending: "yes" | "no", pax: number, name: string) =>
  submitRsvp({ weddingId: wedding.id, guestToken: t, name, attending, pax });

await rsvp(g.token, "yes", 4, 'Ibu "Tante" Sari, S.H.');
await rsvp(rows[0]!.token, "yes", 2, rows[0]!.name);
await rsvp(rows[1]!.token, "no", 0, rows[1]!.name);
await rsvp(rows[2]!.token, "yes", 2, rows[2]!.name);
await submitRsvp({
  weddingId: wedding.id, guestToken: null, name: "Tetangga sebelah",
  attending: "yes", pax: 3,
});

// Check-in is the Guestbook slice's write; seeded here so the recap has data.
await withCtx({ userId }, (tx) => tx`
  update guests set checked_in_at = now(), checked_in_pax = 2
   where id = ${rows[0]!.id}`);

await submitWish({
  weddingId: wedding.id, guestToken: rows[0]!.token, name: rows[0]!.name,
  message: "Selamat menempuh hidup baru. Semoga menjadi keluarga yang sakinah.",
});
await submitWish({
  weddingId: wedding.id, guestToken: null, name: "Tetangga sebelah",
  message: "ucapan yang perlu dimoderasi",
});

console.log(JSON.stringify({
  cookie: signSession(userId), slug, weddingId: wedding.id,
  personal: `/u/${slug}?to=${g.token}`, guestToken: g.token,
  paxAllowed: 4,
}));
await sql.end();
