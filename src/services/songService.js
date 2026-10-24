import { db, COLLECTIONS } from "../firebase/firestore";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { getEnglishSlug } from "@/utils/songSlug";
// Import normalized song ranking utility
import { filterAndRankSongs } from "@/utils/songSearch";

const TAMIL_CHAR_REGEXP = /[\u0B80-\u0BFF]/;

function removeWatermarkFromTitle(text) {
  if (typeof text !== "string") return text;
  return text
    .replace(/desiworship\.com/gi, "")
    .replace(/www\.desiworship\.com/gi, "")
    .replace(/desiworship/gi, "")
    .trim();
}

function removeWatermark(text) {
  if (typeof text !== "string") return text;
  return text
    .replace(/^(?:lyrics\s*[:-]\s*)?www\.desiworship\.com\s*$/gim, "")
    .replace(/^(?:lyrics\s*[:-]\s*)?desiworship\.com\s*$/gim, "")
    .replace(/^(?:lyrics\s*[:-]\s*)?desiworship\s*$/gim, "")
    .replace(/desiworship\.com/gi, "")
    .replace(/www\.desiworship\.com/gi, "")
    .replace(/desiworship/gi, "")
    .split("\n")
    .map(line => line.trim())
    .map(line => {
      const trimmed = line.trim();
      if (trimmed === "-" || trimmed === ":" || trimmed === "- :" || trimmed === ": -") {
        return "";
      }
      return line;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Server-side in-memory cache ──────────────────────────────────────
// Avoids hitting Firestore on every /api/songs request. TTL: 24 hours.
const _songsCache = { data: null, ts: 0 };
const _songsSummaryCache = { data: null, ts: 0 };
const CACHE_TTL_MS = 86_400_000; // 24 hours in milliseconds

function _getCachedSongs() {
  if (_songsCache.data && Date.now() - _songsCache.ts < CACHE_TTL_MS) {
    return _songsCache.data;
  }
  return null;
}

function _setCachedSongs(data) {
  _songsCache.data = data;
  _songsCache.ts = Date.now();
}

function _getCachedSongSummaries() {
  if (_songsSummaryCache.data && Date.now() - _songsSummaryCache.ts < CACHE_TTL_MS) {
    return _songsSummaryCache.data;
  }
  return null;
}

function _setCachedSongSummaries(data) {
  _songsSummaryCache.data = data;
  _songsSummaryCache.ts = Date.now();
}

/**
 * Lightweight song summary — strips heavy fields (lyrics, chords)
 * used only by the listing API so the payload stays small.
 */
function toSongSummary(song) {
  if (!song) return null;
  return {
    id: song.id,
    title: song.title,
    titleEnglish: song.titleEnglish,
    slug: song.slug,
    slugEnglish: song.slugEnglish,
    artist: song.artist,
    artistObj: song.artistObj,
    artistName: song.artistName,
    artistNameEnglish: song.artistNameEnglish,
    language: song.language,
    category: song.category,
    categoryArr: song.categoryArr,
    genre: song.genre,
    duration: song.duration,
    durationSec: song.durationSec,
    imageUrl: song.imageUrl,
    audioUrl: song.audioUrl,
    videoUrl: song.videoUrl,
    youtubeUrl: song.youtubeUrl,
    youtubeId: song.youtubeId,
    teluguTitle: song.teluguTitle,
    firstLetter: song.firstLetter,
    // Has-chords flag so client knows the tab should appear
    hasChords: Array.isArray(song.chords) && song.chords.length > 0,
    tags: song.tags,
    year: song.year,
  };
}

/**
 * Parses raw lyrics text into an array of verse lines/paragraphs
 * Splits by double newlines or single newlines if needed
 */
function parseLyrics(lyrics) {
  if (!lyrics) return "";
  if (typeof lyrics === "string") return lyrics.trim();
  if (Array.isArray(lyrics)) return lyrics;
  return "";
}

function formatSecondsToDisplay(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function extractYouTubeId(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (trimmed.includes("youtu.be/")) {
    const parts = trimmed.split("youtu.be/");
    return parts[1] ? parts[1].split("?")[0].split("&")[0] : null;
  }
  if (trimmed.includes("youtube.com")) {
    const match = trimmed.match(/[?&]v=([^&]+)/);
    if (match && match[1]) return match[1];
    if (trimmed.includes("/embed/")) {
      const parts = trimmed.split("/embed/");
      return parts[1] ? parts[1].split("?")[0].split("&")[0] : null;
    }
  }
  return null;
}

/**
 * Transforms a raw Firestore document snapshot into a standardized Song object.
 * Supports the NEW structured schema while preserving UI backwards-compatibility.
 *
 * @param {import("firebase/firestore").DocumentSnapshot} docSnap
 * @returns {Object} Standardized song object
 */
export function transformSongDoc(docSnap) {
  if (!docSnap.exists()) return null;

  const data = docSnap.data() || {};
  const docId = docSnap.id;

  // 1. Core Fields
  const title = removeWatermarkFromTitle((data.title || "").replace(/-/g, " "));
  const slug = data.slug || docId;

  // 2. Artist Object
  let rawArtistName = "";
  let rawArtistNameEnglish = "";
  let artistId = null;
  if (typeof data.artist === "object" && data.artist !== null) {
    rawArtistName = data.artist.name || "";
    rawArtistNameEnglish = data.artist.nameEnglish || "";
    artistId = data.artist.id || null;
  } else if (typeof data.artist === "string") {
    rawArtistName = data.artist;
  } else if (typeof data.artistName === "string") {
    rawArtistName = data.artistName;
  }

  if (typeof data.artistNameEnglish === "string") {
    rawArtistNameEnglish = data.artistNameEnglish;
  }

  const cleanArtist = rawArtistName.trim();
  const invalidArtistValues = [
    "na",
    "n/a",
    "unknown",
    "none",
    "null",
    "undefined",
    "",
  ];
  const artistName =
    !cleanArtist || invalidArtistValues.includes(cleanArtist.toLowerCase())
      ? "Unknown Artist"
      : cleanArtist;

  const cleanArtistEnglish = rawArtistNameEnglish.trim();
  const artistNameEnglish =
    !cleanArtistEnglish ||
    invalidArtistValues.includes(cleanArtistEnglish.toLowerCase())
      ? "Unknown Artist"
      : cleanArtistEnglish;

  const artistObj = {
    id: artistId,
    name: artistName,
    nameEnglish: artistNameEnglish,
  };

  // 3. Categories & Tags
  const categoryArr = Array.isArray(data.category)
    ? data.category
    : data.category
      ? [data.category]
      : ["Praise & Worship"];
  const categoryPrimary = categoryArr[0] || "Praise & Worship";

  const tagsArr = Array.isArray(data.tags)
    ? data.tags
    : typeof data.tags === "string"
      ? data.tags.split(",").map((t) => t.trim())
      : [];

  // 4. Duration
  const durationSec =
    typeof data.duration === "number"
      ? data.duration
      : typeof data.duration === "string" && data.duration.includes(":")
        ? data.duration.split(":").reduce((acc, time) => 60 * acc + +time, 0)
        : Number(data.duration) || 0;
  const durationDisplay = formatSecondsToDisplay(durationSec);

  // 5. Media Object
  const rawAudio = data.media?.audio || data.audioUrl || "";
  const rawVideo = data.media?.video || data.videoUrl || data.youtubeUrl || "";

  const youtubeId = extractYouTubeId(rawAudio) || extractYouTubeId(rawVideo);

  let audioUrl = rawAudio;
  let videoUrl = rawVideo;

  // If audio field contains a YouTube URL or fake placeholder with YouTube video present, route to video & clear audioUrl
  if (
    rawAudio.includes("youtube.com") ||
    rawAudio.includes("youtu.be") ||
    (youtubeId && rawAudio.includes("soundhelix.com"))
  ) {
    if (!videoUrl) videoUrl = rawAudio;
    audioUrl = "";
  }

  const mediaObj = {
    image: data.media?.image || data.imageUrl || data.coverUrl || "",
    audio: audioUrl ? audioUrl.trim() : "",
    video: videoUrl ? videoUrl.trim() : "",
    youtubeId: youtubeId || null,
  };

  // 6. Multilingual Lyrics Array
  let lyricsArray = [];
  let teluguLyricsText = "";
  let englishLyricsText = "";

  if (Array.isArray(data.lyrics) && data.lyrics.length > 0) {
    lyricsArray = data.lyrics.map(block => ({
      ...block,
      content: removeWatermark(block.content || "")
    }));
    const teBlock = lyricsArray.find((l) => l.language === "te" || l.isDefault);
    const enBlock = lyricsArray.find((l) => l.language === "en");
    teluguLyricsText = teBlock?.content || lyricsArray[0]?.content || "";
    englishLyricsText = enBlock?.content || "";
  } else if (typeof data.lyrics === "string") {
    teluguLyricsText = removeWatermark(data.lyrics);
    englishLyricsText = removeWatermark(data.englishLyrics || "");
    lyricsArray = [
      {
        language: "te",
        format: "original",
        title: "తెలుగు",
        content: teluguLyricsText,
        isDefault: true,
      },
      {
        language: "en",
        format: "transliteration",
        title: "Romanized",
        content: englishLyricsText,
      },
    ];
  }

  const firstLetter = title ? title.charAt(0).toUpperCase() : "";
  let titleEnglish = removeWatermarkFromTitle((data.titleEnglish || "").replace(/-/g, " "));

  // If the language is Tamil and titleEnglish is empty or contains Tamil characters,
  // extract the English transliteration from the first line of the English lyrics block.
  const isTamil = (data.language || "").toLowerCase() === "ta" || (data.language || "").toLowerCase() === "tamil" || TAMIL_CHAR_REGEXP.test(title);
  if (isTamil && (!titleEnglish || TAMIL_CHAR_REGEXP.test(titleEnglish))) {
    let enContent = "";
    if (Array.isArray(data.lyrics) && data.lyrics.length > 0) {
      const enBlock = data.lyrics.find((l) => l.language === "en");
      enContent = enBlock?.content || "";
    } else if (typeof data.englishLyrics === "string") {
      enContent = data.englishLyrics;
    } else if (typeof data.lyrics === "string") {
      enContent = data.englishLyrics || "";
    }
    if (enContent) {
      const firstLine = enContent.split("\n").map(line => line.trim()).filter(Boolean)[0];
      if (firstLine && !TAMIL_CHAR_REGEXP.test(firstLine)) {
        titleEnglish = firstLine;
      }
    }
  }

  return {
    id: docId,
    title,
    titleEnglish,
    slug: slug || docId,
    slugEnglish: getEnglishSlug(titleEnglish),
    artist: artistName,
    artistObj: artistObj,
    artistName: artistName,
    artistNameEnglish: artistNameEnglish,
    language: data.language || "te",
    category: categoryPrimary,
    categoryArr: categoryArr,
    categoryPrimary: categoryPrimary,
    genre: categoryPrimary,
    album: data.album || null,
    year:
      data.year !== undefined && data.year !== null ? Number(data.year) : 2026,
    releaseYear: data.year || 2026,
    duration: durationDisplay,
    durationSec,
    tags: tagsArr,
    lyrics: lyricsArray,
    lyricsTelugu: parseLyrics(teluguLyricsText),
    lyricsEnglish: parseLyrics(englishLyricsText),
    media: mediaObj,
    imageUrl: mediaObj.image,
    coverUrl: mediaObj.image,
    audioUrl: mediaObj.audio,
    videoUrl: mediaObj.video,
    youtubeUrl: mediaObj.video,
    youtubeId: youtubeId || null,
    teluguTitle: title,
    firstLetter,
    teluguFirstLetter: firstLetter,
    chords: Array.isArray(data.chords)
      ? data.chords.map(removeWatermark)
      : typeof data.chords === "string" && data.chords.trim()
        ? data.chords.split("\n").map(removeWatermark)
        : [],
    chordCredits: data.chordCredits || "",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

/**
 * True when a song is Tamil. Tamil songs are temporarily excluded from the
 * app (the owner will re-add Tamil content later); remove this filter once
 * Tamil songs are ready.
 */
function isTamilSong(song) {
  if (!song) return false;
  const lang = (song.language || "").toLowerCase();
  return (
    lang === "ta" ||
    lang === "tamil" ||
    TAMIL_CHAR_REGEXP.test(song.title || "")
  );
}

/**
 * Song Service — Manages Firestore operations for youworship_songs
 */
export const songService = {
  /**
   * Clear the server-side in-memory cache.
   */
  invalidateCache() {
    _songsCache.data = null;
    _songsCache.ts = 0;
    console.log("🍟 [songService] In-memory cache invalidated.");
  },

  /**
   * Fetch all songs from 'youworship_songs' collection sorted alphabetically by title.
   * Uses client-side fallback sorting to handle mixed language characters smoothly.
   *
   * @returns {Promise<Array>} List of transformed song objects with document IDs
   */
  async getAllSongs() {
    // Return cached data if still fresh
    const cached = _getCachedSongs();
    if (cached) {
      console.log(`🍟 [songService] Returning ${cached.length} songs from cache.`);
      return cached;
    }

    // Server-side filesystem cache fallback
    if (typeof window === "undefined") {
      try {
        const fs = eval('require("fs")');
        const path = eval('require("path")');
        const filePath = path.join(process.cwd(), "src", "data", "songs-full.json");
        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath, "utf8");
          const songs = JSON.parse(fileData);
          if (Array.isArray(songs) && songs.length > 0) {
            console.log(`🍟 [songService] Loaded ${songs.length} songs from filesystem cache (instant).`);
            _setCachedSongs(songs);
            return songs;
          }
        }
      } catch (err) {
        console.warn("⚠️ Failed to read full songs from filesystem:", err);
      }
    }

    try {
      const songsRef = collection(db, COLLECTIONS.YOUWORSHIP_SONGS);
      const snapshot = await getDocs(songsRef);

      if (snapshot.empty) {
        console.warn("⚠️ No songs found in 'youworship_songs' collection.");
        return [];
      }

      const songs = snapshot.docs
        .map((docSnap) => transformSongDoc(docSnap))
        .filter((song) => song && !isTamilSong(song)); // exclude Tamil songs for now

      // Sort alphabetically by title
      songs.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", undefined, {
          sensitivity: "base",
        }),
      );

      // Store in cache for subsequent requests
      _setCachedSongs(songs);

      console.log(
        `🍟 [songService] Loaded ${songs.length} songs from youworship_songs.`,
      );

      // Save to filesystem in dev / server-side environment for future fast loads
      if (typeof window === "undefined") {
        try {
          const fs = eval('require("fs")');
          const path = eval('require("path")');
          const dirPath = path.join(process.cwd(), "src", "data");
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          const filePath = path.join(dirPath, "songs-full.json");
          fs.writeFileSync(filePath, JSON.stringify(songs), "utf8");
          console.log(`🍟 [songService] Saved ${songs.length} songs to filesystem cache.`);
        } catch (err) {
          console.warn("⚠️ Failed to write full songs to filesystem:", err);
        }
      }

      return songs;
    } catch (error) {
      console.error(
        "❌ [songService.getAllSongs] Error fetching songs:",
        error,
      );
      throw error;
    }
  },

  /**
   * Lightweight version of getAllSongs — strips lyrics/chords for fast listing.
   * Cached alongside getAllSongs for minimal payload.
   */
  async getAllSongsSummary() {
    const cached = _getCachedSongSummaries();
    if (cached) return cached;

    // Server-side filesystem cache fallback
    if (typeof window === "undefined") {
      try {
        const fs = eval('require("fs")');
        const path = eval('require("path")');
        const filePath = path.join(process.cwd(), "src", "data", "songs-summary.json");
        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath, "utf8");
          const summaries = JSON.parse(fileData);
          if (Array.isArray(summaries) && summaries.length > 0) {
            console.log(`🍟 [songService] Loaded ${summaries.length} songs from filesystem cache (instant).`);
            _setCachedSongSummaries(summaries);
            return summaries;
          }
        }
      } catch (err) {
        console.warn("⚠️ Failed to read songs summary from filesystem:", err);
      }
    }

    const snapshot = await getDocs(collection(db, COLLECTIONS.YOUWORSHIP_SONGS));
    const summaries = snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data() || {};
        const title = removeWatermarkFromTitle(String(data.title || data.teluguTitle || "").replace(/-/g, " "));
        const rawArtist = data.artist && typeof data.artist === "object" ? data.artist : {};
        const artist = typeof data.artist === "string"
          ? data.artist
          : data.artistName || rawArtist.name || "Unknown Artist";
        const artistName = artist.trim() || "Unknown Artist";
        const categoryArr = Array.isArray(data.category)
          ? data.category
          : data.category
            ? [data.category]
            : ["Praise & Worship"];
        const rawAudio = data.media?.audio || data.audioUrl || "";
        const rawVideo = data.media?.video || data.videoUrl || data.youtubeUrl || "";
        const youtubeId = extractYouTubeId(rawAudio) || extractYouTubeId(rawVideo);
        const audioUrl = youtubeId && (rawAudio.includes("youtube.com") || rawAudio.includes("youtu.be")) ? "" : rawAudio;
        const videoUrl = rawVideo || (youtubeId && !audioUrl ? rawAudio : "");
        const duration = typeof data.duration === "number"
          ? data.duration
          : typeof data.duration === "string" && data.duration.includes(":")
            ? data.duration.split(":").reduce((total, part) => 60 * total + +part, 0)
            : Number(data.duration) || 0;

        return {
          id: docSnap.id,
          title,
          titleEnglish: removeWatermarkFromTitle(String(data.titleEnglish || "").replace(/-/g, " ")),
          slug: data.slug || docSnap.id,
          slugEnglish: getEnglishSlug(data.titleEnglish || ""),
          artist: artistName,
          artistName: artistName,
          artistNameEnglish: rawArtist.nameEnglish || data.artistNameEnglish || "Unknown Artist",
          artistObj: { id: rawArtist.id || null, name: artistName },
          language: data.language || "te",
          category: categoryArr[0] || "Praise & Worship",
          categoryArr,
          genre: categoryArr[0] || "Praise & Worship",
          duration: formatSecondsToDisplay(duration),
          durationSec: duration,
          imageUrl: data.media?.image || data.imageUrl || data.coverUrl || "",
          audioUrl,
          videoUrl,
          youtubeUrl: videoUrl,
          youtubeId,
          teluguTitle: title,
          firstLetter: data.firstLetter || title.charAt(0).toUpperCase(),
          hasChords: Array.isArray(data.chords) ? data.chords.length > 0 : Boolean(data.chords),
          tags: Array.isArray(data.tags) ? data.tags : typeof data.tags === "string" ? data.tags.split(",").map((tag) => tag.trim()) : [],
          year: data.year !== undefined && data.year !== null ? Number(data.year) : 2026,
        };
      })
      .filter((song) => song && !isTamilSong(song));

    summaries.sort((a, b) => (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" }));
    _setCachedSongSummaries(summaries);

    // Save to filesystem in dev / server-side environment for future fast loads
    if (typeof window === "undefined") {
      try {
        const fs = eval('require("fs")');
        const path = eval('require("path")');
        const dirPath = path.join(process.cwd(), "src", "data");
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        const filePath = path.join(dirPath, "songs-summary.json");
        fs.writeFileSync(filePath, JSON.stringify(summaries), "utf8");
        console.log(`🍟 [songService] Saved ${summaries.length} songs to filesystem cache.`);
      } catch (err) {
        console.warn("⚠️ Failed to write songs summary to filesystem:", err);
      }
    }

    return summaries;
  },

  /**
   * Fetch a single song by its Firestore Document ID.
   *
   * @param {string} songId - Document ID
   * @returns {Promise<Object|null>} Song object or null if not found
   */
  async getSongById(songId) {
    if (!songId) return null;
    let targetId = songId;
    try {
      targetId = decodeURIComponent(songId);
    } catch (e) {
      targetId = songId;
    }

    try {
      // 1. Check in-memory cached 'allSongs' list first for instant lookup
      const allSongs = await this.getAllSongs();
      const targetNFC = (targetId || "").normalize("NFC");
      const songNFC = (songId || "").normalize("NFC");
      const targetLower = targetNFC.toLowerCase();
      const songLower = songNFC.toLowerCase();

      const match = allSongs.find((s) => {
        const sIdNFC = (s.id || "").normalize("NFC");
        const sSlugNFC = (s.slug || "").normalize("NFC");
        const sSlugEnglishNFC = (s.slugEnglish || "").normalize("NFC");
        const sTitleNFC = (s.title || "").normalize("NFC");
        const sTeluguTitleNFC = (s.teluguTitle || "").normalize("NFC");
        const sTitleEngNFC = (s.titleEnglish || "").normalize("NFC");

        return (
          sIdNFC === targetNFC ||
          sIdNFC === songNFC ||
          sSlugNFC === targetNFC ||
          sSlugNFC === songNFC ||
          sSlugEnglishNFC === targetNFC ||
          sSlugEnglishNFC === songNFC ||
          sTitleNFC === targetNFC ||
          sTitleNFC === songNFC ||
          sTeluguTitleNFC === targetNFC ||
          sTeluguTitleNFC === songNFC ||
          sTitleEngNFC === targetNFC ||
          sTitleEngNFC === songNFC ||
          sSlugNFC.toLowerCase() === targetLower ||
          sSlugEnglishNFC.toLowerCase() === targetLower ||
          sTitleNFC.toLowerCase() === targetLower ||
          sTitleEngNFC.toLowerCase() === targetLower ||
          decodeURIComponent(sIdNFC) === targetNFC ||
          decodeURIComponent(sSlugNFC) === targetNFC
        );
      });

      if (match) return match;

      // 2. Direct lookup by decoded targetId
      const songRef = doc(db, COLLECTIONS.YOUWORSHIP_SONGS, targetId);
      const docSnap = await getDoc(songRef);
      if (docSnap.exists()) {
        const song = transformSongDoc(docSnap);
        return song && !isTamilSong(song) ? song : null;
      }

      // 3. Lookup by raw songId
      if (targetId !== songId) {
        const rawRef = doc(db, COLLECTIONS.YOUWORSHIP_SONGS, songId);
        const rawSnap = await getDoc(rawRef);
        if (rawSnap.exists()) {
          const song = transformSongDoc(rawSnap);
          return song && !isTamilSong(song) ? song : null;
        }
      }

      // 4. Firestore Query Fallback: Search by 'slug' or 'slugEnglish' or 'title'
      try {
        const slugQuery = query(
          collection(db, COLLECTIONS.YOUWORSHIP_SONGS),
          where("slug", "==", targetId),
          limit(1)
        );
        const slugSnap = await getDocs(slugQuery);
        if (!slugSnap.empty) {
          const song = transformSongDoc(slugSnap.docs[0]);
          return song && !isTamilSong(song) ? song : null;
        }
      } catch (queryErr) {
        console.warn("⚠️ Slug query fallback notice:", queryErr?.message);
      }

      console.warn(`⚠️ Song document with ID/Slug '${songId}' not found.`);
      return null;
    } catch (error) {
      console.error(
        `❌ [songService.getSongById] Error fetching song '${songId}':`,
        error,
      );
      throw error;
    }
  },

  /**
   * Fetch songs filtered by category.
   *
   * @param {string} category - Category name
   * @returns {Promise<Array>} List of matching songs
   */
  async getSongsByCategory(category) {
    if (!category) return this.getAllSongs();
    try {
      const allSongs = await this.getAllSongs();
      const lowerCat = category.trim().toLowerCase();
      const songs = allSongs.filter((s) => {
        if (Array.isArray(s.categoryArr)) {
          return s.categoryArr.some((c) => c.trim().toLowerCase() === lowerCat);
        }
        if (typeof s.category === "string") {
          return s.category.trim().toLowerCase() === lowerCat;
        }
        return false;
      });
      return songs.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } catch (error) {
      console.error(`❌ [songService.getSongsByCategory] Error:`, error);
      throw error;
    }
  },

  /**
   * Fetch songs starting with a specific first letter.
   *
   * @param {string} letter - Character/Letter
   * @returns {Promise<Array>} List of matching songs
   */
  async getSongsByFirstLetter(letter) {
    if (!letter) return this.getAllSongs();
    try {
      const allSongs = await this.getAllSongs();
      const targetLetter = letter.trim().toLowerCase();
      return allSongs.filter(
        (s) =>
          (s.firstLetter && s.firstLetter.toLowerCase() === targetLetter) ||
          (s.title && s.title.trim().startsWith(letter)),
      );
    } catch (error) {
      console.error(`❌ [songService.getSongsByFirstLetter] Error:`, error);
      throw error;
    }
  },

  /**
   * Client-side search across title, artist, and lyrics.
   *
   * @param {string} searchQuery - Query string
   * @returns {Promise<Array>} List of matching songs
   */
  async searchSongs(searchQuery) {
    if (!searchQuery || !searchQuery.trim()) return this.getAllSongs();
    const allSongs = await this.getAllSongs();
    // Use unified ranking and normalization
    return filterAndRankSongs(allSongs, searchQuery, 200);
  },

  /**
   * Resolve a cursor ID into a Firestore DocumentSnapshot.
   * Returns null if the document doesn't exist.
   */
  async _resolveCursor(cursorId) {
    if (!cursorId) return null;
    const cursorRef = doc(db, COLLECTIONS.YOUWORSHIP_SONGS, cursorId);
    const cursorSnap = await getDoc(cursorRef);
    return cursorSnap.exists() ? cursorSnap : null;
  },

  /**
   * Transform + filter a Firestore snapshot into a page result.
   */
  _buildPage(snapshot, pageSize) {
    const songs = snapshot.docs
      .map((docSnap) => transformSongDoc(docSnap))
      .filter((song) => song && !isTamilSong(song))
      .slice(0, pageSize);

    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    const cursor = lastDoc ? lastDoc.id : null;
    const hasMore = snapshot.docs.length === pageSize;

    return { songs, cursor, hasMore };
  },

  /**
   * Keyset pagination: first page of songs.
   * Over-fetches to compensate for Tamil song filtering.
   */
  async getSongsPage(pageSize = 20) {
    const overFetch = Math.ceil(pageSize * 1.5);
    try {
      const songsRef = collection(db, COLLECTIONS.YOUWORSHIP_SONGS);
      const q = query(songsRef, orderBy("title"), limit(overFetch));
      const snapshot = await getDocs(q);
      return this._buildPage(snapshot, pageSize);
    } catch (error) {
      console.error("❌ [songService.getSongsPage] Error:", error);
      throw error;
    }
  },

  /**
   * Keyset pagination: next page after a cursor.
   */
  async getSongsPageAfter(cursorId, pageSize = 20) {
    if (!cursorId) return this.getSongsPage(pageSize);
    try {
      const cursorSnap = await this._resolveCursor(cursorId);
      if (!cursorSnap) return this.getSongsPage(pageSize);

      const overFetch = Math.ceil(pageSize * 1.5);
      const songsRef = collection(db, COLLECTIONS.YOUWORSHIP_SONGS);
      const q = query(songsRef, orderBy("title"), startAfter(cursorSnap), limit(overFetch));
      const snapshot = await getDocs(q);
      return this._buildPage(snapshot, pageSize);
    } catch (error) {
      console.error("❌ [songService.getSongsPageAfter] Error:", error);
      throw error;
    }
  },

  // ── Category pagination ───────────────────────────────────────────

  /**
   * Keyset pagination: first page of songs filtered by category.
   * Uses Firestore array-contains query on the category field.
   */
  async getCategorySongsPage(category, pageSize = 20) {
    if (!category) return this.getSongsPage(pageSize);
    const overFetch = Math.ceil(pageSize * 1.5);
    try {
      const songsRef = collection(db, COLLECTIONS.YOUWORSHIP_SONGS);
      const q = query(
        songsRef,
        where("category", "array-contains", category),
        orderBy("title"),
        limit(overFetch),
      );
      const snapshot = await getDocs(q);
      return this._buildPage(snapshot, pageSize);
    } catch (error) {
      console.error("❌ [songService.getCategorySongsPage] Error:", error);
      throw error;
    }
  },

  /**
   * Keyset pagination: next page of category-filtered songs after a cursor.
   */
  async getCategorySongsPageAfter(category, cursorId, pageSize = 20) {
    if (!category) return this.getSongsPageAfter(cursorId, pageSize);
    if (!cursorId) return this.getCategorySongsPage(category, pageSize);
    try {
      const cursorSnap = await this._resolveCursor(cursorId);
      if (!cursorSnap) return this.getCategorySongsPage(category, pageSize);

      const overFetch = Math.ceil(pageSize * 1.5);
      const songsRef = collection(db, COLLECTIONS.YOUWORSHIP_SONGS);
      const q = query(
        songsRef,
        where("category", "array-contains", category),
        orderBy("title"),
        startAfter(cursorSnap),
        limit(overFetch),
      );
      const snapshot = await getDocs(q);
      return this._buildPage(snapshot, pageSize);
    } catch (error) {
      console.error("❌ [songService.getCategorySongsPageAfter] Error:", error);
      throw error;
    }
  },

  // ── Letter pagination ─────────────────────────────────────────────

  /**
   * Keyset pagination: first page of songs filtered by first letter.
   * Uses Firestore where + orderBy with composite index.
   */
  async getLetterSongsPage(letter, pageSize = 20) {
    if (!letter) return this.getSongsPage(pageSize);
    const overFetch = Math.ceil(pageSize * 1.5);
    try {
      const songsRef = collection(db, COLLECTIONS.YOUWORSHIP_SONGS);
      const q = query(
        songsRef,
        where("firstLetter", "==", letter.toUpperCase()),
        orderBy("title"),
        limit(overFetch),
      );
      const snapshot = await getDocs(q);
      return this._buildPage(snapshot, pageSize);
    } catch (error) {
      console.error("❌ [songService.getLetterSongsPage] Error:", error);
      throw error;
    }
  },

  /**
   * Keyset pagination: next page of letter-filtered songs after a cursor.
   */
  async getLetterSongsPageAfter(letter, cursorId, pageSize = 20) {
    if (!letter) return this.getSongsPageAfter(cursorId, pageSize);
    if (!cursorId) return this.getLetterSongsPage(letter, pageSize);
    try {
      const cursorSnap = await this._resolveCursor(cursorId);
      if (!cursorSnap) return this.getLetterSongsPage(letter, pageSize);

      const overFetch = Math.ceil(pageSize * 1.5);
      const songsRef = collection(db, COLLECTIONS.YOUWORSHIP_SONGS);
      const q = query(
        songsRef,
        where("firstLetter", "==", letter.toUpperCase()),
        orderBy("title"),
        startAfter(cursorSnap),
        limit(overFetch),
      );
      const snapshot = await getDocs(q);
      return this._buildPage(snapshot, pageSize);
    } catch (error) {
      console.error("❌ [songService.getLetterSongsPageAfter] Error:", error);
      throw error;
    }
  },

  /**
   * Fetch the first 20 songs starting with the specified letter from Firestore.
   */
  async fetchInitialSongsForLetter(letter) {
    try {
      const songsRef = collection(db, COLLECTIONS.YOUWORSHIP_SONGS);
      const q = query(
        songsRef,
        where("firstLetter", "==", letter.toUpperCase()),
        orderBy("title"),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const songs = snapshot.docs.map((docSnap) => transformSongDoc(docSnap)).filter(Boolean);
      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      return { songs, lastDoc, hasMore: snapshot.docs.length === 20 };
    } catch (error) {
      console.error(`Error fetching initial songs for letter ${letter}:`, error);
      throw error;
    }
  },

  /**
   * Fetch all remaining songs starting with the specified letter from Firestore.
   */
  async fetchRemainingSongsForLetter(letter, lastDoc) {
    if (!lastDoc) return { songs: [], lastDoc: null, hasMore: false };
    try {
      const songsRef = collection(db, COLLECTIONS.YOUWORSHIP_SONGS);
      const q = query(
        songsRef,
        where("firstLetter", "==", letter.toUpperCase()),
        orderBy("title"),
        startAfter(lastDoc)
      );
      const snapshot = await getDocs(q);
      const songs = snapshot.docs.map((docSnap) => transformSongDoc(docSnap)).filter(Boolean);
      const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      return { songs, lastDoc: newLastDoc, hasMore: false };
    } catch (error) {
      console.error(`Error fetching remaining songs for letter ${letter}:`, error);
      throw error;
    }
  },

  /**
   * Fetch the next batch (limitCount) of songs starting with the specified letter from Firestore.
   */
  async fetchNextBatchForLetter(letter, lastDoc, limitCount = 20) {
    if (!lastDoc) return { songs: [], lastDoc: null, hasMore: false };
    try {
      const songsRef = collection(db, COLLECTIONS.YOUWORSHIP_SONGS);
      const q = query(
        songsRef,
        where("firstLetter", "==", letter.toUpperCase()),
        orderBy("title"),
        startAfter(lastDoc),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      const songs = snapshot.docs.map((docSnap) => transformSongDoc(docSnap)).filter(Boolean);
      const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      return { songs, lastDoc: newLastDoc, hasMore: snapshot.docs.length === limitCount };
    } catch (error) {
      console.error(`Error fetching next batch for letter ${letter}:`, error);
      throw error;
    }
  }
};
