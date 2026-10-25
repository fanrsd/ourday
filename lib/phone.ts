/**
 * wa.me rejects local Indonesian formats, so numbers are normalised once on the
 * way in rather than at every place they are used.
 * "0812-3456-7890", "+62 812 3456 7890" and "62 8123456790" must all land on the
 * same digits, or the same guest gets two different links.
 */
export function normalisePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  if (!/^62\d{8,13}$/.test(d)) return null;
  return d;
}

export function waLink(phone: string | null, message: string): string | null {
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
