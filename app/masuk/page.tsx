import Link from "next/link";
import { requestLoginAction } from "./actions.ts";
import { LoginForm } from "./login-form.tsx";

export const metadata = { title: "Masuk" };

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="min-h-dvh grid place-items-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-2xl">OurDay</Link>
        <h1 className="mt-8 text-xl font-semibold">Masuk atau daftar</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Kami kirim link masuk ke emailmu. Tidak ada password yang perlu diingat.
        </p>
        {error ? (
          <p className="mt-4 rounded-lg bg-rose-soft px-3 py-2 text-sm text-rose">
            Link itu sudah dipakai atau kedaluwarsa. Minta link baru.
          </p>
        ) : null}
        <LoginForm action={requestLoginAction} />
      </div>
    </main>
  );
}
