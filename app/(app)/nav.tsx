"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/rencana", label: "Rencana" },
  { href: "/undangan", label: "Undangan" },
  { href: "/tamu", label: "Tamu" },
  { href: "/kehadiran", label: "Kehadiran" },
  { href: "/tagihan", label: "Pembelian" },
];

export function Nav({ owns }: { owns: Record<string, boolean> }) {
  const path = usePathname();
  return (
    <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-1">
      {LINKS.map((l) => {
        const active = path === l.href || path.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            className={
              "whitespace-nowrap rounded-t-lg px-3 py-2 text-sm transition-colors " +
              (active
                ? "border-b-2 border-ink font-medium text-ink"
                : "border-b-2 border-transparent text-ink-soft hover:text-ink")
            }
          >
            {l.label}
            {l.href === "/kehadiran" && !owns.guestbook ? (
              <span className="ml-1.5 rounded bg-paper-deep px-1 py-0.5 text-[10px] text-ink-soft">beli</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
