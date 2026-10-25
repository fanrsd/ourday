import { readFile } from "node:fs/promises";
import path from "node:path";
import { CONTENT_TYPE, MEDIA_NAME, mediaDir } from "../store.ts";

/**
 * Serve. Public, because these are the photographs on a published invitation —
 * the name is an unguessable uuid, which is the only access control a wedding
 * photo needs.
 *
 * The content type comes from our own extension table, never from the request,
 * and nosniff stops a browser from second-guessing it.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  if (!MEDIA_NAME.test(name)) return new Response("Tidak ditemukan", { status: 404 });

  const body = await readFile(path.join(mediaDir(), name)).catch(() => null);
  if (!body) return new Response("Tidak ditemukan", { status: 404 });

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": CONTENT_TYPE[name.split(".").pop()!]!,
      "X-Content-Type-Options": "nosniff",
      // The name contains a uuid, so the bytes behind it never change.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
