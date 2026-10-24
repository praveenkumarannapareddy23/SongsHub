import { getEnglishSlug } from "@/utils/songSlug";

/**
 * getShareableSongUrl — Returns the clean canonical URL for sharing a song.
 *
 * The canonical domain is hardcoded to https://youworship.world so that
 * shared/copied links always use the production domain, regardless of
 * the current environment (localhost, staging, etc.).
 *
 * Both the native-share path and the copy-link path call this same function
 * so they can never produce different link formats.
 *
 * @param {Object} song — Must have a `slug` property. Falls back to `id` if no slug.
 * @returns {string} — e.g. "https://youworship.world/song/my-song-slug"
 */

export function getShareableSongUrl(song) {
  if (!song) return "";
  // Prefer a slug built from the English subtitle so shared links show the
  // English song name (e.g. /song/attractive-beloved) instead of the Telugu
  // one. Falls back to the existing slug, then to a slug from the title.
  const englishSlug = getEnglishSlug(song);
  let slug = englishSlug || song.slug;
  if (!slug) {
    const title = song.teluguTitle || song.title || "untitled";
    slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u0C00-\u0C7F]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 80);
  }
  const encodedSlug = encodeURIComponent(slug);
  return `https://youworship.world/song/${encodedSlug}`;
}

/**
 * getShareableSongText — Returns a formatted text string for sharing a song.
 *
 * @param {Object} song — Must have `title`, `artist` properties.
 * @returns {string} — e.g. 'Listen to "Song Title" by Artist on YouWorship.'
 */
export function getShareableSongText(song) {
  if (!song) return "";
  const title = song.teluguTitle || song.title || "this song";
  const artist = song.artist || "Unknown Artist";
  return `Listen to "${title}" by ${artist} on YouWorship.`;
}

/**
 * getShareableSongTitle — Returns a formatted title string for the share sheet.
 *
 * @param {Object} song — Must have a `title` property.
 * @returns {string} — e.g. "Song Title | YouWorship"
 */
export function getShareableSongTitle(song) {
  if (!song) return "YouWorship";
  const title = song.teluguTitle || song.title || "YouWorship";
  return `${title} | YouWorship`;
}
