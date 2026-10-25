import type { MetadataRoute } from "next";

const BASE = process.env.APP_URL ?? "http://localhost:3000";

/**
 * Marketing and the template demos are the only things worth crawling. The
 * signed-in app, the scanner, the live screen and the webhook are all per-couple
 * or per-device and have nothing to index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/rencana",
          "/undangan",
          "/tamu",
          "/kehadiran",
          "/tagihan",
          "/pindai",
          "/layar",
          "/masuk",
          "/keluar",
          "/api",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
