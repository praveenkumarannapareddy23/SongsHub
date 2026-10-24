/**
 * Song Search Utility
 * Provides normalized, ranked, case-insensitive, and punctuation-agnostic search
 * for Telugu and English song titles and metadata.
 */

/**
 * Normalizes input text by converting to lowercase NFC Unicode,
 * replacing punctuation/symbols with spaces, collapsing whitespace, and trimming.
 *
 * @param {any} text - The input string or value to normalize
 * @returns {string} Normalized clean string
 */
export function normalizeSearchText(text) {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .normalize("NFC")
    .replace(/[\-_'"`\(\)\[\]\{\},:;\.!?\/\\+*~@#$^&=|<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks if a string contains any Telugu Unicode characters (U+0C00 - U+0C7F).
 *
 * @param {string} text
 * @returns {boolean}
 */
export function isTeluguText(text) {
  return /[\u0C00-\u0C7F]/.test(text || "");
}

/**
 * Safely extracts the display artist name from a song object.
 *
 * @param {Object} song
 * @returns {string}
 */
export function getSongArtistName(song) {
  if (!song) return "";
  if (typeof song.artist === "string" && song.artist.trim()) {
    return song.artist.trim();
  }
  if (typeof song.artistName === "string" && song.artistName.trim()) {
    return song.artistName.trim();
  }
  if (typeof song.artistObj?.name === "string" && song.artistObj.name.trim()) {
    return song.artistObj.name.trim();
  }
  if (typeof song.artist?.name === "string" && song.artist.name.trim()) {
    return song.artist.name.trim();
  }
  return "";
}

/**
 * Searches and ranks songs based on query relevance.
 * Prioritizes prefix matches on titles, word-boundary matches, and substring matches.
 *
 * @param {Array} songList - Array of standardized song objects
 * @param {string} rawQuery - Search query typed by user
 * @param {number} [maxResults=100] - Maximum number of results to return
 * @returns {Array} Sorted list of matching songs
 */
export function filterAndRankSongs(songList, rawQuery, maxResults = 100) {
  if (!Array.isArray(songList) || !rawQuery) return [];
  const cleanQuery = normalizeSearchText(rawQuery);
  if (!cleanQuery) return [];

  const isTeluguQuery = isTeluguText(cleanQuery);
  const queryTokens = cleanQuery.split(" ").filter(Boolean);
  const resultsWithScore = [];
  const seenIds = new Set();

  for (const song of songList) {
    if (!song) continue;
    const songId = song.id || song.slug;
    if (songId && seenIds.has(songId)) continue;

    // Use lazy memoization on song objects to avoid redundant regex normalization on every keystroke
    const titleNorm = song._normTitle !== undefined ? song._normTitle : (song._normTitle = normalizeSearchText(song.title));
    const teluguTitleNorm = song._normTelugu !== undefined ? song._normTelugu : (song._normTelugu = normalizeSearchText(song.teluguTitle));
    const englishTitleNorm = song._normEnglish !== undefined ? song._normEnglish : (song._normEnglish = normalizeSearchText(song.titleEnglish));
    const artistNorm = song._normArtist !== undefined ? song._normArtist : (song._normArtist = normalizeSearchText(getSongArtistName(song)));
    const albumNorm = song._normAlbum !== undefined ? song._normAlbum : (song._normAlbum = normalizeSearchText(song.album));

    let score = 0;

    if (isTeluguQuery) {
      // Telugu search branch: match against Telugu title fields
      const targetTelugu = teluguTitleNorm || titleNorm;

      if (targetTelugu === cleanQuery) {
        score = 120; // Exact match
      } else if (targetTelugu.startsWith(cleanQuery)) {
        score = 100; // Prefix match (e.g. "నీ" starts "నీ పిలుపు")
      } else if (targetTelugu.split(" ").some((w) => w.startsWith(cleanQuery))) {
        score = 80; // Word-boundary match
      } else if (targetTelugu.includes(cleanQuery)) {
        score = 60; // Substring match
      } else if (titleNorm.includes(cleanQuery)) {
        score = 50;
      } else if (artistNorm.includes(cleanQuery)) {
        score = 30; // Artist match
      }
    } else {
      // English / Romanized search branch: match titleEnglish, English title, artist
      const primaryEnglish = englishTitleNorm || (titleNorm && !isTeluguText(titleNorm) ? titleNorm : "");
      const secondaryTitle = titleNorm;

      if (primaryEnglish === cleanQuery || secondaryTitle === cleanQuery) {
        score = 120; // Exact full match
      } else if (primaryEnglish.startsWith(cleanQuery) || secondaryTitle.startsWith(cleanQuery)) {
        score = 100; // Title starts with query (e.g., "Am" -> "Amazing Grace")
      } else if (
        primaryEnglish.split(" ").some((w) => w.startsWith(cleanQuery)) ||
        secondaryTitle.split(" ").some((w) => w.startsWith(cleanQuery))
      ) {
        score = 80; // Word-boundary match (e.g., "Grace" -> "Amazing Grace")
      } else if (
        queryTokens.length > 1 &&
        queryTokens.every(
          (token) =>
            primaryEnglish.includes(token) ||
            secondaryTitle.includes(token) ||
            artistNorm.includes(token)
        )
      ) {
        score = 75; // All query words match across title & artist
      } else if (primaryEnglish.includes(cleanQuery) || secondaryTitle.includes(cleanQuery)) {
        score = 60; // Substring match
      } else if (artistNorm.startsWith(cleanQuery)) {
        score = 40; // Artist starts with query
      } else if (artistNorm.includes(cleanQuery) || albumNorm.includes(cleanQuery)) {
        score = 25; // Artist / album substring match
      }
    }

    if (score > 0) {
      if (songId) seenIds.add(songId);
      const titleLen = (song.titleEnglish || song.title || "").length;
      resultsWithScore.push({ song, score, titleLen });
    }
  }

  // Rank by score DESC, then shorter title length ASC, then alphabetical title
  resultsWithScore.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.titleLen !== b.titleLen) return a.titleLen - b.titleLen;
    const titleA = a.song.titleEnglish || a.song.title || "";
    const titleB = b.song.titleEnglish || b.song.title || "";
    return titleA.localeCompare(titleB);
  });

  return resultsWithScore.slice(0, maxResults).map((item) => item.song);
}
