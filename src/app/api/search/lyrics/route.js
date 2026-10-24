import { NextResponse } from "next/server";
import Fuse from "fuse.js";
import { songService } from "@/services/songService";

// In-memory search index cache
let _searchIndex = null;
let _indexSongsTs = 0;
const INDEX_TTL_MS = 60_000; // rebuild index every 60s

/**
 * Build a flat, searchable dataset from songs.
 * Each entry is one line of lyrics + metadata so Fuse can match individual lines.
 */
function buildSearchEntries(songs) {
  const entries = [];
  for (const song of songs) {
    // Extract all lyrics text from the lyrics array
    const lyricsBlocks = Array.isArray(song.lyrics) ? song.lyrics : [];
    for (const block of lyricsBlocks) {
      const content = block?.content || "";
      if (!content) continue;
      const lines = content.split("\n").filter((l) => l.trim());
      for (const line of lines) {
        entries.push({
          songId: song.id,
          songTitle: song.title,
          songTitleEnglish: song.titleEnglish || "",
          teluguTitle: song.teluguTitle || song.title,
          artist: song.artistName || song.artist || "Unknown Artist",
          artistEnglish: song.artistNameEnglish || "",
          language: block.language || song.language || "te",
          imageUrl: song.imageUrl || song.coverUrl || "",
          slug: song.slug || song.id,
          duration: song.duration || "0:00",
          line: line.trim(),
        });
      }
    }

    // Also index title and artist for title/artist fuzzy search
    entries.push({
      songId: song.id,
      songTitle: song.title,
      songTitleEnglish: song.titleEnglish || "",
      teluguTitle: song.teluguTitle || song.title,
      artist: song.artistName || song.artist || "Unknown Artist",
      artistEnglish: song.artistNameEnglish || "",
      language: song.language || "te",
      imageUrl: song.imageUrl || song.coverUrl || "",
      slug: song.slug || song.id,
      duration: song.duration || "0:00",
      line: `__TITLE__ ${song.title} ${song.titleEnglish || ""} ${song.teluguTitle || ""}`,
    });
    entries.push({
      songId: song.id,
      songTitle: song.title,
      songTitleEnglish: song.titleEnglish || "",
      teluguTitle: song.teluguTitle || song.title,
      artist: song.artistName || song.artist || "Unknown Artist",
      artistEnglish: song.artistNameEnglish || "",
      language: song.language || "te",
      imageUrl: song.imageUrl || song.coverUrl || "",
      slug: song.slug || song.id,
      duration: song.duration || "0:00",
      line: `__ARTIST__ ${song.artistName || song.artist || ""} ${song.artistNameEnglish || ""}`,
    });
  }
  return entries;
}

function getSearchIndex(songs) {
  if (_searchIndex && Date.now() - _indexSongsTs < INDEX_TTL_MS) {
    return _searchIndex;
  }

  const entries = buildSearchEntries(songs);
  _searchIndex = new Fuse(entries, {
    keys: [
      { name: "line", weight: 1.0 },
      { name: "songTitle", weight: 0.4 },
      { name: "songTitleEnglish", weight: 0.4 },
      { name: "artist", weight: 0.3 },
      { name: "artistEnglish", weight: 0.3 },
    ],
    threshold: 0.35, // fuzzy tolerance (0 = exact, 1 = match anything)
    distance: 200,
    includeMatches: true,
    minMatchCharLength: 2,
    ignoreLocation: true, // search the whole string, not just prefix
  });
  _indexSongsTs = Date.now();
  return _searchIndex;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const lang = searchParams.get("lang") || ""; // optional language filter
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "30", 10);

    if (!q.trim()) {
      return NextResponse.json({ results: [], total: 0, query: "" });
    }

    // Get full songs from cache (includes lyrics)
    const songs = await songService.getAllSongs();
    const index = getSearchIndex(songs);

    let fuseResults = index.search(q.trim());

    // Optional language filter
    if (lang) {
      const langLower = lang.toLowerCase();
      fuseResults = fuseResults.filter((r) => {
        const rLang = (r.item.language || "").toLowerCase();
        return rLang === langLower || rLang.startsWith(langLower);
      });
    }

    const total = fuseResults.length;

    // Deduplicate by songId — group all matching lines per song
    const songMap = new Map();
    for (const result of fuseResults) {
      const entry = result.item;
      const songId = entry.songId;

      if (!songMap.has(songId)) {
        songMap.set(songId, {
          songId,
          title: entry.songTitle,
          titleEnglish: entry.songTitleEnglish,
          teluguTitle: entry.teluguTitle,
          artist: entry.artist,
          artistEnglish: entry.artistEnglish,
          language: entry.language,
          imageUrl: entry.imageUrl,
          slug: entry.slug,
          duration: entry.duration,
          matchedLines: [],
          score: result.score ?? 1,
        });
      }

      const songEntry = songMap.get(songId);

      // Track the best (lowest) score per song
      if ((result.score ?? 1) < songEntry.score) {
        songEntry.score = result.score ?? 1;
      }

      // Add the matching line with highlight positions
      if (!entry.line.startsWith("__TITLE__") && !entry.line.startsWith("__ARTIST__")) {
        const matchData = result.matches?.find((m) => m.key === "line");
        songEntry.matchedLines.push({
          text: entry.line,
          indices: matchData?.indices || [],
          language: entry.language,
        });
      }
    }

    // Convert map to array, sort by score (best first), then limit matched lines per song
    const results = Array.from(songMap.values())
      .sort((a, b) => a.score - b.score)
      .slice((page - 1) * perPage, page * perPage)
      .map((song) => ({
        ...song,
        // Keep only top 3 matched lines per song to limit payload
        matchedLines: song.matchedLines.slice(0, 3),
      }));

    return NextResponse.json({
      results,
      total,
      query: q.trim(),
      page,
      perPage,
      hasMore: page * perPage < total,
    });
  } catch (error) {
    console.error("❌ [lyrics-search] Error:", error);
    return NextResponse.json(
      { error: "Search failed", results: [], total: 0 },
      { status: 500 }
    );
  }
}
