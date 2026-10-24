"use client";

import { useEffect } from "react";

/**
 * Invisible component placed on the landing page.
 * Kicks off a background fetch for /api/songs so the browser cache
 * is warm and the data is available globally by the time the visitor
 * clicks "Explore Songs".
 */
export default function SongsPrefetcher() {
  useEffect(() => {
    // Only prefetch if not already cached in this session
    if (window.__SONGHUB_SONGS_PREFETCHED) return;
    window.__SONGHUB_SONGS_PREFETCHED = true;

    fetch("/api/songs?all=true", { cache: "default" })
      .then((res) => {
        if (!res.ok) return;
        return res.json();
      })
      .then((data) => {
        if (data?.songs) {
          // Store globally so audio-context can pick it up instantly
          window.__SONGHUB_PREFETCHED_SONGS = data.songs;
          console.log(
            "✓ Prefetched songs ready:",
            data.songs.length,
            "songs",
          );
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
