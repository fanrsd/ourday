import path from "node:path";

/**
 * Uploaded media, on disk, named by us.
 *
 * The allowlist is the whole security model and it is deliberately narrow:
 * raster images plus mp3, and specifically no SVG, because an SVG is a document
 * that can carry script. Since the extension can only ever come from this table,
 * the serve route can hand back a content type it chose itself rather than one
 * the uploader claimed — and with nosniff on top, a file that lies about what it
 * is simply fails to render instead of executing.
 */
export const MEDIA_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "audio/mpeg": "mp3",
};

export const CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  mp3: "audio/mpeg",
};

/** Photos are downscaled in the browser before they get here, so anything this
 *  large is a mistake or an attack rather than a wedding photograph. */
export const MAX_BYTES = 8 * 1024 * 1024;

/** Names are minted as `<uuid>.<ext>`, so matching that shape is both the
 *  validation and the entire defence against `../` in a request path. */
export const MEDIA_NAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif|mp3)$/;

export const mediaDir = () => path.resolve(process.env.UPLOAD_DIR ?? "uploads");
