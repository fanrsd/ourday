import Link from "next/link";
import { currentContext } from "@/lib/current.ts";
import { Nav } from "./nav.tsx";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { wedding, owns } = await currentContext();
  const couple = [wedding.groom_name, wedding.bride_name].filter(Boolean).join(" & ");

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
          <Link href="/rencana" className="font-display text-xl">OurDay</Link>
          <span className="hidden text-sm text-ink-soft sm:block">
            {couple || "Pernikahan kamu"}
          </span>
          <form action="/keluar" method="post" className="ml-auto">
            <button className="btn btn-ghost text-xs">Keluar</button>
          </form>
        </div>
        <Nav owns={owns} />
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
