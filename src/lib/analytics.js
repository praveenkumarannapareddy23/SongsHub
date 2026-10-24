export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-Z165Z8BMBX";

export const GA_STREAM_ID =
  process.env.NEXT_PUBLIC_GA_STREAM_ID || "15714687470";

export const GA_STREAM_URL = "https://youworship.world";
export const GA_STREAM_NAME = "YouWorship";

/**
 * Log custom analytics event to Google Analytics
 */
export function trackEvent(action, params = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", action, params);
  }
}

/**
 * Track song play event
 */
export function trackSongPlay(song) {
  if (!song) return;
  trackEvent("play_song", {
    song_id: song.id,
    song_title: song.title || song.teluguTitle,
    song_artist: song.artist,
    language: song.language,
  });
}

/**
 * Track search queries
 */
export function trackSearch(searchTerm) {
  if (!searchTerm) return;
  trackEvent("search", {
    search_term: searchTerm,
  });
}

