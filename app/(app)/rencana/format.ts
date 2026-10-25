// Rupiah has no cents, and every date in this product is read by someone
// standing in Indonesia, so WIB is the only timezone that ever renders.
const TZ = "Asia/Jakarta";

export const rupiah = (n: number | null | undefined) =>
  n == null ? "—" : `Rp ${Math.round(n).toLocaleString("id-ID")}`;

/** Signed, for the gap between estimate and reality. */
export const selisih = (n: number) =>
  `${n < 0 ? "−" : "+"}Rp ${Math.abs(Math.round(n)).toLocaleString("id-ID")}`;

export const tanggal = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: TZ,
      })
    : "—";

export const tanggalSingkat = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: TZ,
      })
    : "—";

export const jam = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: TZ,
      })
    : "—";

// Form values. sv-SE is the shortest way to an ISO-shaped local string, which is
// exactly what <input type="date"> and type="datetime-local" expect.
export const inputDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("sv-SE", { timeZone: TZ }) : "";

export const inputDateTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("sv-SE", { timeZone: TZ }).replace(" ", "T").slice(0, 16)
    : "";

export const isOverdue = (iso: string | null | undefined, done: string | null) =>
  Boolean(iso && !done && new Date(iso).getTime() < Date.now());
