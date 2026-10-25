// Check-in selfies. The browser compresses before it uploads, so the server
// only has to refuse everything that is not a small JPEG — and it refuses on
// the bytes, not on the content-type header, which the client controls.
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { resolveScannerLink } from "@/lib/checkin.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 1_500_000;
// ponytail: JPEG only, because that is the single format the scanner produces.
// Add a case here if a second capture path ever appears.
const isJpeg = (b: Buffer) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;

const root = () => process.env.UPLOAD_DIR ?? "./uploads";
const SAFE = /^checkin\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/;

export async function POST(req: Request) {
  const url = new URL(req.url);
  const link = await resolveScannerLink(url.searchParams.get("token"));
  if (!link) return Response.json({ error: "Link pemindai tidak berlaku." }, { status: 403 });

  if (!(req.headers.get("content-type") ?? "").startsWith("image/jpeg")) {
    return Response.json({ error: "Hanya JPEG." }, { status: 415 });
  }

  const bytes = Buffer.from(await req.arrayBuffer());
  if (bytes.length > MAX_BYTES) {
    return Response.json({ error: "Foto terlalu besar." }, { status: 413 });
  }
  if (!isJpeg(bytes)) {
    return Response.json({ error: "Berkas itu bukan JPEG." }, { status: 415 });
  }

  const rel = `checkin/${link.weddingId}/${randomUUID()}.jpg`;
  const abs = join(root(), rel);
  await mkdir(join(root(), "checkin", link.weddingId), { recursive: true });
  await writeFile(abs, bytes);

  return Response.json({ path: rel });
}

/** Serves a stored selfie back to the projector screen, which holds the same link. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const link = await resolveScannerLink(url.searchParams.get("token"));
  const path = url.searchParams.get("p") ?? "";
  // The shape check is also the traversal guard: no dots, no slashes beyond the
  // two the pattern allows, and the wedding id must be the caller's own.
  if (!link || !SAFE.test(path) || !path.startsWith(`checkin/${link.weddingId}/`)) {
    return new Response("tidak berlaku", { status: 403 });
  }

  try {
    const bytes = await readFile(join(root(), path));
    return new Response(new Uint8Array(bytes), {
      headers: { "content-type": "image/jpeg", "cache-control": "private, max-age=3600" },
    });
  } catch {
    return new Response("tidak ada", { status: 404 });
  }
}
