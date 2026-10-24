import { songService } from "@/services/songService";

export const revalidate = 86400; // Cache for 24 hours

export default async function sitemap() {
  const baseUrl = "https://youworship.world";

  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/songs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  try {
    const songs = await songService.getAllSongsSummary();
    if (Array.isArray(songs) && songs.length > 0) {
      const songRoutes = songs.map((song) => ({
        url: `${baseUrl}/song/${encodeURIComponent(song.slug || song.id)}`,
        lastModified: song.updatedAt ? new Date(song.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
      return [...staticRoutes, ...songRoutes];
    }
  } catch (err) {
    console.warn("⚠️ [sitemap] Fallback to static routes due to:", err?.message || err);
  }

  return staticRoutes;
}