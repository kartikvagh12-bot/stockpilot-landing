import type { MetadataRoute } from "next";

// Real URLs only. The previous sitemap padded two pages with five homepage
// "#fragment" entries, which search engines resolve back to "/" and treat as
// duplicates of it.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.operza.in";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/health-check`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
