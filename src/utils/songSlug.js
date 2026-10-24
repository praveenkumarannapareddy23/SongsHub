/**
 * getEnglishSlug — Returns a URL-safe slug built from a song's English
 * subtitle (`titleEnglish`). Used for share links so the URL shows the
 * English song name instead of the Telugu one.
 *
 * Returns "" when the song has no English subtitle, so callers can fall
 * back to the existing Telugu-based slug.
 *
 * @param {Object|string} song — Song object with a `titleEnglish` property, or the raw title string.
 * @returns {string} — e.g. "attractive-beloved"
 */
export function getEnglishSlug(song) {
  const englishTitle =
    (typeof song === "string" ? song : song && song.titleEnglish) || "";
  const trimmed = englishTitle.trim();
  if (!trimmed) return "";
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}
