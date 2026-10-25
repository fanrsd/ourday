import Link from "next/link";
import { currentContext } from "@/lib/current.ts";
import { findOrder } from "@/lib/orders.ts";
import { PRODUCTS } from "@/lib/products.ts";

export const metadata = { title: "Status pembayaran" };

const tanggal = (at: Date) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(at);

/**
 * Where Midtrans sends the browser back. It only reads: a redirect that a buyer
 * could type by hand must never grant anything, so nothing here writes and
 * nothing here marks an order paid. The webhook already did, or has not yet.
 */
export default async function SelesaiPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; order_id?: string }>;
}) {
  const params = await searchParams;
  const { userId } = await currentContext();
  const providerOrderId = params.order_id ?? params.order ?? "";
  const order = providerOrderId ? await findOrder(userId, providerOrderId) : null;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-3xl">Status pembayaran</h1>

      {!order ? (
        <p className="mt-4 text-sm text-ink-soft">
          Pesanan itu tidak kami temukan. Buka halaman pembelian untuk melihat status
          terbaru.
        </p>
      ) : (
        <div className="card mt-4 space-y-3 p-5">
          <p className="font-display text-xl">{PRODUCTS[order.product].label}</p>

          {order.status === "paid" ? (
            <>
              <p className="text-sm">
                Pembayaran sudah kami terima dan aksesnya langsung terbuka.
              </p>
              {order.expires_at ? (
                <p className="text-sm text-ink-soft">
                  Aktif sampai {tanggal(order.expires_at)}.
                </p>
              ) : null}
            </>
          ) : order.status === "pending" ? (
            <>
              <p className="text-sm">Pembayaran belum kami terima.</p>
              <p className="text-sm text-ink-soft">
                Kalau kamu baru saja menyelesaikan pembayaran, konfirmasi resmi dari
                Midtrans biasanya masuk dalam beberapa detik. Kami tidak menandai lunas
                dari halaman ini — hanya konfirmasi server yang menentukan. Muat ulang
                sebentar lagi.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm">
                Pembayaran ini{" "}
                {order.status === "expired" ? "kedaluwarsa" : "tidak berhasil"}.
              </p>
              <p className="text-sm text-ink-soft">
                Data yang sudah kamu isi tetap tersimpan. Kamu bisa mengulang checkout.
              </p>
            </>
          )}
        </div>
      )}

      <Link href="/tagihan" className="btn btn-ghost mt-5">
        Ke halaman pembelian
      </Link>
    </div>
  );
}
