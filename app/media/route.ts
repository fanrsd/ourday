import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { currentUserId } from "@/lib/auth.ts";
import { MAX_BYTES, MEDIA_TYPES, mediaDir } from "./store.ts";

/**
 * Upload. A route handler rather than a server action because this is a file
 * body, and because the editor wants a URL back before it saves the document.
 *
 * Every limit is enforced here. The browser also downscales photographs before
 * posting them, but that is a courtesy to the guest's data plan, not a check.
 */
export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) {
    return Response.json({ error: "Kamu perlu masuk dulu." }, { status: 401 });
  }

  // Cheap rejection before reading the body at all, when the client declares it.
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES) {
    return Response.json({ error: "Ukuran file maksimal 8 MB." }, { status: 413 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Tidak ada file yang dikirim." }, { status: 400 });
  }

  const ext = MEDIA_TYPES[file.type];
  if (!ext) {
    return Response.json(
      { error: "Format tidak didukung. Pakai JPG, PNG, WebP, AVIF, atau MP3." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES || file.size === 0) {
    return Response.json({ error: "Ukuran file maksimal 8 MB." }, { status: 413 });
  }

  // The client's filename is never used: it is the one field an attacker
  // controls completely, and we have no need of it.
  const name = `${randomUUID()}.${ext}`;
  const dir = mediaDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  return Response.json({ url: `/media/${name}` }, { status: 201 });
}
