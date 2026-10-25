/**
 * Generates the three photographs the marketing homepage is built around, into
 * `public/marketing/`.
 *
 * The brief is not decoration — it is a line already in the hero: "Setahun
 * merencanakan, satu malam mengundang, satu pagi menyambut di pintu." The page
 * promises three moments and shows none of them, so these are those three, in
 * that order, and nothing else. A fourth photograph would be a photograph
 * without an argument behind it.
 *
 * Same REST path as `generate-covers.ts`: @runcomfy/cli declares
 * os: ["darwin","linux"] and will not install here, and the CLI only wraps this.
 *
 *   $env:RUNCOMFY_TOKEN="..."   # PowerShell;  export RUNCOMFY_TOKEN=... on unix
 *   node --experimental-strip-types scripts/generate-marketing.ts
 *
 * Re-running overwrites in place. These are committed static assets, not user
 * uploads, so they live in `public/` and never touch the database.
 */
import { setTimeout as sleep } from "node:timers/promises";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnv } from "../lib/env.ts";

loadEnv();

const TOKEN = process.env.RUNCOMFY_TOKEN;
const MODEL = "openai/gpt-image-2/text-to-image";
const BASE = "https://model-api.runcomfy.net/v1";

if (!TOKEN) {
  console.error(
    "RUNCOMFY_TOKEN is not set. Create a key at runcomfy.com (Profile > API Keys), then:\n" +
      '  PowerShell:  $env:RUNCOMFY_TOKEN="rc-..."\n' +
      "  bash:        export RUNCOMFY_TOKEN=rc-...",
  );
  process.exit(1);
}

/**
 * GPT Image 2 renders in-image text eagerly and well, which is a liability: a
 * wedding photograph with invented Indonesian words baked into the pixels is
 * unusable and no amount of CSS removes it.
 */
const NO_TEXT =
  "No text, no lettering, no words, no watermark, no signage, no calligraphy anywhere in the image.";

/**
 * Each of these carries the argument's headline across its middle, and the
 * guest-row card sits over the lower right. So every prompt keeps its subject
 * off-centre and low, and leaves the upper-left two thirds as quiet air —
 * the same discipline the demo covers were shot with, for the same reason.
 */
const SHOTS: Record<string, string> = {
  "01-merencanakan":
    "A wide horizontal photograph of an Indonesian couple sitting at a wooden dining table in a bright home in the late morning, planning quietly together over open notebooks and a laptop, warm daylight from a window on the right, cream and oatmeal palette, the couple small and low in the right third of the frame, the upper left two thirds soft empty wall and light, photorealistic, medium format film look, muted warm grade, shallow depth of field. " +
    NO_TEXT,
  "02-mengundang":
    "A wide horizontal photograph of a hand holding a smartphone at night in a softly lit Indonesian living room, the screen glowing warm but its contents not readable, deep ink blue and amber palette, bokeh of a lamp behind, the hand and phone small and low in the right third, the upper left two thirds dark quiet air, photorealistic, cinematic low light, muted grade. " +
    NO_TEXT,
  "03-menyambut":
    "A wide horizontal photograph of a wedding reception entrance in the morning, an Indonesian receiving table dressed with white flowers and a small tablet on a stand, two guests arriving from the left in soft focus, bright diffused daylight, pale ivory and sage palette, the table small and low in the right third, the upper left two thirds airy empty space and pale drapery, photorealistic, natural light, editorial. " +
    NO_TEXT,
};

const auth = { Authorization: `Bearer ${TOKEN}` };

async function generate(prompt: string): Promise<string> {
  const submit = await fetch(`${BASE}/models/${MODEL}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      aspect_ratio: "16:9",
      // 2k, unlike the demo covers: these run full-bleed behind nothing but a
      // scrim, at up to 1600px wide on a desktop hero.
      resolution: "2k",
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

const dir = join(process.cwd(), "public", "marketing");
mkdirSync(dir, { recursive: true });

for (const [name, prompt] of Object.entries(SHOTS)) {
  process.stdout.write(`${name} `);
  const url = await generate(prompt);

  const img = await fetch(url);
  if (!img.ok) throw new Error(`download ${img.status}`);
  const bytes = Buffer.from(await img.arrayBuffer());

  writeFileSync(join(dir, `${name}.webp`), bytes);
  console.log(` -> public/marketing/${name}.webp  (${Math.round(bytes.length / 1024)} kB)`);
}
