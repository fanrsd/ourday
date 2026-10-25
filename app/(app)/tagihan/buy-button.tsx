"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CheckoutState } from "./actions.ts";

type Snap = {
  pay(token: string, handlers: Record<string, () => void>): void;
};

declare global {
  // eslint-disable-next-line no-var
  var snap: Snap | undefined;
}

export function BuyButton({
  product,
  price,
  start,
}: {
  product: string;
  price: string;
  start: (product: string) => Promise<CheckoutState>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setBusy(true);
    setError(null);
    const res = await start(product);
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }

    // Every exit from the popup is provisional — success, pending, error and a
    // plain close are all treated the same way: ask the server what happened.
    // The browser callback is a hint, never the source of truth.
    const done = () => {
      setBusy(false);
      router.refresh();
    };

    if (window.snap) {
      window.snap.pay(res.data!.token, {
        onSuccess: done,
        onPending: done,
        onError: done,
        onClose: done,
      });
    } else {
      // Popup script blocked or still loading: Midtrans's hosted page works too.
      window.location.href = res.data!.redirectUrl;
    }
  }

  return (
    <div>
      <button className="btn btn-primary w-full" onClick={buy} disabled={busy}>
        {busy ? "Membuka pembayaran…" : `Beli — ${price}`}
      </button>
      {error ? <p className="mt-2 text-sm text-rose">{error}</p> : null}
    </div>
  );
}
