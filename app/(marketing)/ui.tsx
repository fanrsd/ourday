import Link from "next/link";
import { normalisePhone, waLink } from "@/lib/phone.ts";

/** The storefront is the only place prices appear in prose. IDR has no cents. */
export const rupiah = (n: number) => "Rp " + new Intl.NumberFormat("id-ID").format(n);

export const SITE = process.env.APP_URL ?? "http://localhost:3000";

/**
 * ponytail: satu nomor CS dari env, dinormalkan lewat helper yang sama dengan
 * nomor tamu supaya tidak ada aturan format kedua. Kalau nanti butuh rotasi
 * beberapa agen, itu tabel di database — bukan daftar env kedua.
 */
export const WA_NUMBER = normalisePhone(process.env.WA_NUMBER) ?? "6281100001111";

/** One number, one opening message. Pages that need a different one call waLink. */
export const WA_HREF = waLink(WA_NUMBER, "Halo OurDay, saya mau tanya soal produknya.")!;

/** Microscopic label that sets up a headline without competing with it. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-soft">
      {children}
    </p>
  );
}

const Arrow = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
    <path
      d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Primary call to action: pill, with the arrow nested in its own disc. */
export function Cta({
  href,
  children,
  tone = "ink",
}: {
  href: string;
  children: React.ReactNode;
  tone?: "ink" | "paper";
}) {
  const dark = tone === "ink";
  return (
    <Link
      href={href}
      className={
        "group mk-press inline-flex items-center gap-3 rounded-full py-2.5 pl-6 pr-2.5 text-sm font-medium " +
        (dark
          ? "bg-ink text-paper hover:bg-[#3a322d]"
          : "border border-line bg-white text-ink hover:bg-paper-deep")
      }
    >
      {children}
      <span
        className={
          "mk-disc grid h-8 w-8 place-items-center rounded-full " +
          (dark ? "bg-white/12" : "bg-ink/6")
        }
      >
        <Arrow />
      </span>
    </Link>
  );
}

/** Floating WhatsApp button. Marketing only — buyers who hesitate ask here. */
export function WaFab() {
  return (
    <a
      href={WA_HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Tanya lewat WhatsApp"
      className="mk-press fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center gap-2 rounded-full border border-line bg-white/90 text-sm font-medium shadow-[0_10px_30px_-12px_rgba(36,31,28,0.35)] backdrop-blur sm:h-auto sm:w-auto sm:px-4 sm:py-2.5"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 text-leaf sm:h-4 sm:w-4">
        <path
          d="M20 11.6a8 8 0 0 1-11.9 7L4 20l1.5-4A8 8 0 1 1 20 11.6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 9.6c0 3 2.4 5.4 5.4 5.4.6 0 1-.5 1-1l-1.5-.7-.9.8c-1-.4-1.8-1.2-2.2-2.2l.8-.9-.7-1.5c-.5 0-1 .4-1 1Z"
          fill="currentColor"
        />
      </svg>
      <span className="hidden sm:inline">Tanya lewat WhatsApp</span>
    </a>
  );
}

/** Section wrapper: one hairline, one eyebrow, macro breathing room. */
export function Section({
  eyebrow,
  id,
  children,
  className = "",
}: {
  eyebrow?: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={"scroll-mt-24 border-t border-line/70 py-20 sm:py-28 " + className}>
      <div className="mx-auto max-w-6xl px-5">
        {eyebrow ? (
          <div className="mb-10 sm:mb-14">
            <Eyebrow>{eyebrow}</Eyebrow>
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}

/** Numbered clause, shared by the two legal pages. */
export function Clause({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex gap-4 text-[1.05rem] font-medium text-ink">
        <span className="hd tabular text-rose">{n}</span>
        {title}
      </h2>
      <p className="mt-3 pl-8">{children}</p>
    </section>
  );
}
