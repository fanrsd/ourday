import { randomBytes } from "node:crypto";

// Crockford base32 minus vowels and look-alikes: a token is read aloud over a
// noisy reception desk often enough that 0/O and 1/I/L must not both exist.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * The guest token. It personalises the invitation, identifies the RSVP, and is
 * the payload of the check-in QR — one value doing all three, which is why no QR
 * ever has to be generated, printed or re-sent.
 *
 * It is a weak secret with low consequence: the worst a holder can do is alter
 * that one guest's RSVP. It is not a credential and grants nothing else.
 */
export function guestToken(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

export function urlToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}
