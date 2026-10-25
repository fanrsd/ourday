import type { MetadataRoute } from "next";
import { TEMPLATES } from "@/lib/templates/registry.ts";

const BASE = process.env.APP_URL ?? "http://localhost:3000";

/**
 * Only the marketing pages and the template demos. Everything behind the login
 * is per-couple and must not be indexed, and a real couple's invitation is
 * theirs to share — we never list it here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/fitur`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/desain`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/harga`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    ...TEMPLATES.map((t) => ({
      url: `${BASE}/u/demo-${t.id}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    { url: `${BASE}/ketentuan`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/privasi`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
