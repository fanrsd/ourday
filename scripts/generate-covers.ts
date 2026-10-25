/**
 * Generates the four demo cover photographs and wires them into the demo
 * invitations. Monokrom is excluded on purpose: it is a typographic design with
 * no photograph anywhere in it, so a cover for it would never be rendered.
 *
 * Talks to the RunComfy Model API over plain HTTPS rather than through
 * @runcomfy/cli, which declares os: ["darwin","linux"] and will not install on
 * Windows. The REST surface is the same one the CLI wraps, so there is nothing
 * to install and nothing to run under WSL.
 *
 *   $env:RUNCOMFY_TOKEN="..."   # PowerShell;  export RUNCOMFY_TOKEN=... on unix
 *   node --experimental-strip-types scripts/generate-covers.ts
 *
 * Re-running replaces the covers. Safe to run against a live database: it only
 * touches invitations whose slug starts with `demo-`.
 */
import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnv } from "../lib/env.ts";
import { sql, withCtx } from "../lib/db.ts";
import { normaliseContent } from "../lib/invitation-content.ts";
import { requestLogin, consumeLogin } from "../lib/login.ts";
import { MEDIA_TYPES, mediaDir } from "../app/media/store.ts";

loadEnv();

const TOKEN = process.env.RUNCOMFY_TOKEN;
const MODEL = "openai/gpt-image-2/text-to-image";
const BASE = "https://model-api.runcomfy.net/v1";

if (!TOKEN) {
  console.error(
    "RUNCOMFY_TOKEN is not set. Create a key at runcomfy.com (Profile > API Keys), then:\n" +
      '  PowerShell:  $env:RUNCOMFY_TOKEN="rc-..."\n' +
      "  bash:        export RUNCOMFY_TOKEN=rc-...\n" +
      "No CLI install is needed — this script calls the REST API directly.",
  );
  process.exit(1);
}

/**
 * GPT Image 2 is the layout-precise model, not the photoreal-portrait one — the
 * cheaper trade the brief asked for. Two consequences are baked into every
 * prompt below:
 *
 *  1. It renders in-image text eagerly and well, which is a liability here: a
 *     wedding cover with invented words baked into the pixels is unusable, and
 *     no amount of CSS removes it. Every prompt ends by forbidding text.
 *  2. It is weaker on close-up skin, so the couples are staged small in frame.
 *     That happens to be what these templates need anyway: all four lay type
 *     over the upper two thirds of the cover behind a scrim, so a face centred
 *     in the frame would sit under the headline.
 */
const NO_TEXT =
  "No text, no lettering, no words, no watermark, no signage, no calligraphy anywhere in the image.";

const COVERS: Record<string, string> = {
  klasik:
    "A wide vertical photograph of an Indonesian bride and groom standing far from the camera in a bright airy colonial hall, tall arched windows spilling soft diffused daylight, cream and ivory palette, the couple small in the lower third, the upper two thirds quiet empty air and pale wall, photorealistic, medium format film look, muted warm grade. " +
    NO_TEXT,
  modern:
    "A wide vertical photograph of an Indonesian couple in sharp minimalist formal wear seen from behind at a distance, walking through a vast empty concrete gallery, cool neutral grey palette, hard directional daylight raking across the floor, the figures small and low in the frame, the upper two thirds bare wall, editorial architectural photography, photorealistic. " +
    NO_TEXT,
  botani:
    "A wide vertical photograph looking up through dense tropical foliage in a Balinese garden, monstera and palm canopy filling the upper two thirds, dappled late-morning sunlight, deep sage and moss green palette, an Indonesian bride and groom small and centred far below in a clearing, photorealistic, natural light. " +
    NO_TEXT,
  senja:
    "A wide vertical photograph of an Indonesian couple in silhouette on an open terrace at golden hour, a vast dusty rose and amber sky filling the upper two thirds, low sun and soft haze behind them, the figures small in the lower third, photorealistic, cinematic warm grade. " +
    NO_TEXT,
};

const auth = { Authorization: `Bearer ${TOKEN}` };

async function generate(prompt: string): Promise<string> {
  const submit = await fetch(`${BASE}/models/${MODEL}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      aspect_ratio: "2:3",
      // 1k keeps this cheap; the cover sits behind a scrim so it does not need
      // to be sharp. Bump to "2k" if a demo ever ships as a full-bleed hero.
      resolution: "1k",
      quality: "medium",
      output_format: "webp",
    }),
  });
  if (!submit.ok) throw new Error(`submit ${submit.status}: ${await submit.text()}`);

  const { request_id } = (await submit.json()) as { request_id: string };

  // Poll rather than assume: the API is asynchronous and queues.
  for (let i = 0; i < 120; i++) {
    await sleep(2500);
    const res = await fetch(`${BASE}/requests/${request_id}/result`, { headers: auth });
    if (!res.ok) throw new Error(`result ${res.status}: ${await res.text()}`);

    const body = (await res.json()) as {
      status?: string;
      output?: { image?: string; images?: string[] };
      error?: unknown;
    };

    if (body.status === "cancelled" || body.error) {
      throw new Error(`generation failed: ${JSON.stringify(body.error ?? body.status)}`);
    }
    const url = body.output?.image ?? body.output?.images?.[0];
    if (url) return url;

    process.stdout.write(".");
  }
  throw new Error("timed out after 5 minutes");
}

const dir = mediaDir();
mkdirSync(dir, { recursive: true });

// The demos belong to the demo account, and RLS will only let that account
// rewrite them. Resolved through the real magic-link path because that is the
// only way to obtain a user id — `users` is not readable without one.
const ownerId = (await consumeLogin(
  new URL(await requestLogin("demo@ourday.id")).searchParams.get("token")!,
))!;

for (const [template, prompt] of Object.entries(COVERS)) {
  process.stdout.write(`${template} `);
  const url = await generate(prompt);

  const img = await fetch(url);
  if (!img.ok) throw new Error(`download ${img.status}`);
  const bytes = Buffer.from(await img.arrayBuffer());

  // The serve route only accepts `<uuid>.<ext>` and picks the content type from
  // the extension, so the name has to be minted, not chosen.
  const ext = MEDIA_TYPES[img.headers.get("content-type")?.split(";")[0]?.trim() ?? ""] ?? "webp";
  const name = `${randomUUID()}.${ext}`;
  writeFileSync(join(dir, name), bytes);

  const slug = `demo-${template}`;
  // As the owner, not anonymously. Under RLS an unauthorised UPDATE is not an
  // error — it simply matches no rows — so writing without an identity here
  // silently did nothing while still reporting success. Hence the rowcount check.
  await withCtx({ userId: ownerId }, async (tx) => {
    const [row] = await tx<{ id: string; content: unknown }[]>`
      select id, content from invitations where slug = ${slug}`;
    if (!row) throw new Error(`${slug} not found — run npm run db:migrate first`);

    const content = normaliseContent(row.content);
    content.couple.coverPhoto = `/media/${name}`;
    const done = await tx`update invitations set content = ${tx.json(content)}, updated_at = now()
                           where id = ${row.id} returning id`;
    if (!done.length) throw new Error(`${slug}: update touched no rows (RLS denied the write)`);
  });

  console.log(` -> /u/${slug}  (${Math.round(bytes.length / 1024)} kB)`);
}

console.log("\nRestart the server: invitation documents are read through a tagged cache.");
await sql.end();
