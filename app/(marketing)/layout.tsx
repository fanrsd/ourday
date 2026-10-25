import Link from "next/link";
import { WA_HREF, WaFab } from "./ui.tsx";

/**
 * Marketing-only CSS. It lives here rather than in globals.css because nothing
 * behind the login uses grain, scroll reveals, or serif display leading.
 * Scroll reveals are pure CSS: `animation-timeline: view()` where supported,
 * and a plain play-on-load everywhere else. No observer, no client component.
 */
const CSS = `
.mk :is(a,button,summary):focus-visible{outline:2px solid var(--color-ink);outline-offset:3px;border-radius:6px}
.mk-grain{position:fixed;inset:0;z-index:40;pointer-events:none;opacity:.05;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E")}
.hd{font-family:var(--font-display);font-weight:400;line-height:.94;letter-spacing:-.015em}
.hd em{font-style:italic;color:var(--color-rose)}
.mk-press{transition:transform .45s cubic-bezier(.32,.72,0,1),background-color .45s cubic-bezier(.32,.72,0,1),border-color .45s cubic-bezier(.32,.72,0,1)}
.mk-press:active{transform:scale(.985)}
.mk-disc{transition:transform .45s cubic-bezier(.32,.72,0,1)}
.group:hover .mk-disc{transform:translate(2px,-1px) scale(1.06)}
.mk-lift{transition:transform .55s cubic-bezier(.32,.72,0,1),box-shadow .55s cubic-bezier(.32,.72,0,1)}
.mk-lift:hover{transform:translateY(-3px);box-shadow:0 24px 50px -30px rgba(36,31,28,.45)}
/* Entry motion that cannot hide anything. It animates transform only, never
   opacity, and carries no fill mode: whatever happens to the animation — reduced
   motion, a frozen document timeline, print, an engine that skips it — the text
   is on screen and readable. A storefront section that renders blank is a worse
   failure than one that does not move.
   ponytail: not scroll-linked. animation-timeline:view() looked better but ties
   visibility to a timeline that can fail to resolve. Upgrade path is an
   IntersectionObserver in a client component, if it ever earns the bytes. */
@keyframes mk-rise{from{transform:translateY(18px)}to{transform:none}}
.rise{animation:mk-rise .8s cubic-bezier(.22,.7,.14,1)}
`;

const NAV = [
  { href: "/fitur", label: "Fitur" },
  { href: "/desain", label: "Desain" },
  { href: "/harga", label: "Harga" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mk min-h-dvh bg-paper">
      <style href="ourday-marketing" precedence="high">
        {CSS}
      </style>
      <div className="mk-grain" aria-hidden="true" />

      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
      >
        Lompat ke konten
      </a>

      <header className="sticky top-0 z-50 px-4 pt-3 sm:pt-5">
        <div className="mx-auto flex max-w-6xl items-center gap-4 rounded-full border border-line/80 bg-paper/85 py-2 pl-5 pr-2 backdrop-blur-xl">
          <Link href="/" className="hd text-xl">
            OurDay
          </Link>
          <nav aria-label="Halaman utama" className="flex items-center gap-4 sm:gap-6">
            {NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[13px] text-ink-soft transition-colors hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/masuk" className="hidden text-[13px] text-ink-soft hover:text-ink sm:block">
              Masuk
            </Link>
            <Link
              href="/masuk"
              className="group mk-press flex items-center gap-2 rounded-full bg-ink py-1.5 pl-4 pr-1.5 text-[13px] font-medium text-paper hover:bg-[#3a322d]"
            >
              <span className="hidden sm:inline">Mulai gratis</span>
              <span className="sm:hidden">Mulai</span>
              <span className="mk-disc grid h-7 w-7 place-items-center rounded-full bg-white/12">
                <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3">
                  <path
                    d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main id="konten">{children}</main>

      <footer className="border-t border-line bg-paper-deep/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:pr-8">
            <p className="hd text-2xl">OurDay</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
              Satu daftar tamu untuk merencanakan, mengundang, dan menyambut. Dibuat di
              Indonesia.
            </p>
          </div>
          <FooterCol
            title="Produk"
            links={[
              { href: "/fitur#merencanakan", label: "Wedding Planner" },
              { href: "/fitur#mengundang", label: "Undangan Website" },
              { href: "/fitur#menyambut", label: "Buku Tamu Digital & QR" },
              { href: "/harga", label: "Harga" },
            ]}
          />
          <FooterCol
            title="Perusahaan"
            links={[
              { href: "/desain", label: "Galeri template" },
              { href: "/harga#tanya", label: "Pertanyaan umum" },
              { href: "/ketentuan", label: "Ketentuan layanan" },
              { href: "/privasi", label: "Kebijakan privasi" },
            ]}
          />
          <div>
            <h2 className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-soft">
              Kontak
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href={WA_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-soft transition-colors hover:text-ink"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="mailto:halo@ourday.id"
                  className="text-ink-soft transition-colors hover:text-ink"
                >
                  halo@ourday.id
                </a>
              </li>
              <li>
                {/* ponytail: handle Instagram masih placeholder. Ganti sebelum rilis
                    atau hapus barisnya — jangan biarkan link mati di footer. */}
                <a
                  href="https://instagram.com/ourday.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-soft transition-colors hover:text-ink"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-6xl border-t border-line/70 px-5 py-6">
          <p className="text-xs text-ink-soft">
            &copy; {new Date().getFullYear()} OurDay. Perencana gratis selamanya; undangan
            dan buku tamu dibayar sekali.
          </p>
        </div>
      </footer>

      <WaFab />
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-soft">
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="text-ink-soft transition-colors hover:text-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
