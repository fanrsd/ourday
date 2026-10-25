import Script from "next/script";
import { currentContext } from "@/lib/current.ts";
import { listOrders, type Order } from "@/lib/orders.ts";
import { PRODUCTS, type Product } from "@/lib/products.ts";
import { snapClientKey, snapScriptUrl } from "@/lib/midtrans.ts";
import { startCheckoutAction } from "./actions.ts";
import { BuyButton } from "./buy-button.tsx";

export const metadata = { title: "Pembelian" };

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const tanggal = (at: Date) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(at);

const STATUS: Record<Order["status"], string> = {
  pending: "Menunggu pembayaran",
  paid: "Lunas",
  failed: "Gagal",
  expired: "Kedaluwarsa",
};

export default async function TagihanPage() {
  const { userId, wedding } = await currentContext();
  const orders = await listOrders(userId, wedding.id);
  const now = Date.now();

  const activeOrder = (product: Product) =>
    orders.find(
      (o) =>
        o.product === product &&
        o.status === "paid" &&
        (!o.expires_at || o.expires_at.getTime() > now),
    );

  return (
    <div className="space-y-8">
      <Script src={snapScriptUrl()} data-client-key={snapClientKey()} strategy="afterInteractive" />

      <header>
        <h1 className="font-display text-3xl">Pembelian</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
          Perencana gratis selamanya. Undangan Website dan Buku Tamu Digital dibeli sekali,
          masing-masing punya masa aktif sendiri.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(PRODUCTS) as Product[]).map((product) => {
          const item = PRODUCTS[product];
          const active = activeOrder(product);
          return (
            <section key={product} className="card flex flex-col gap-4 p-5">
              <div>
                <h2 className="font-display text-xl">{item.label}</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Aktif {item.activeDays} hari sejak pembayaran diterima.
                </p>
              </div>

              <p className="tabular text-2xl">{rupiah(item.price)}</p>

              {active ? (
                <p className="rounded-lg bg-paper-deep px-3 py-2 text-sm">
                  Sudah aktif
                  {active.expires_at ? <> sampai {tanggal(active.expires_at)}</> : null}.
                </p>
              ) : (
                <BuyButton
                  product={product}
                  price={rupiah(item.price)}
                  start={startCheckoutAction}
                />
              )}
            </section>
          );
        })}
      </div>

      <p className="max-w-2xl text-sm text-ink-soft">
        Setelah membayar, layar pembayaran mungkin langsung bilang berhasil. Status di
        halaman ini baru berubah setelah server kami menerima konfirmasi resmi dari
        Midtrans — biasanya beberapa detik. Selama itu, apa yang tampil di browser masih
        sementara. Kalau statusnya belum berubah, muat ulang halaman ini.
      </p>

      <section>
        <h2 className="text-sm font-medium text-ink-soft">Riwayat pesanan</h2>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Belum ada pesanan.</p>
        ) : (
          <div className="card mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-xs text-ink-soft">
                <tr>
                  <th className="px-4 py-2 font-medium">Tanggal</th>
                  <th className="px-4 py-2 font-medium">Produk</th>
                  <th className="px-4 py-2 font-medium">Jumlah</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Aktif sampai</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-line last:border-0">
                    <td className="tabular px-4 py-2 whitespace-nowrap">{tanggal(o.created_at)}</td>
                    <td className="px-4 py-2">{PRODUCTS[o.product].label}</td>
                    <td className="tabular px-4 py-2 whitespace-nowrap">{rupiah(o.amount)}</td>
                    <td className="px-4 py-2">{STATUS[o.status]}</td>
                    <td className="tabular px-4 py-2 whitespace-nowrap">
                      {o.expires_at ? tanggal(o.expires_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
