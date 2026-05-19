import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.operza.in";
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/#workflow`, lastModified: now, priority: 0.8 },
    { url: `${base}/#features`, lastModified: now, priority: 0.8 },
    { url: `${base}/#screenshots`, lastModified: now, priority: 0.7 },
    { url: `${base}/#faq`, lastModified: now, priority: 0.6 },
    { url: `${base}/#contact`, lastModified: now, priority: 0.9 },
  ];
}
