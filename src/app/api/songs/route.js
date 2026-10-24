import { songService } from "@/services/songService";

export const dynamic = "force-dynamic";

/**
 * GET /api/songs
 *
 * Supports cursor-based (keyset) pagination with optional filters:
 *   GET /api/songs                              → first page (20 songs)
 *   GET /api/songs?limit=30                     → first page with custom size
 *   GET /api/songs?cursor=<id>                  → next page after cursor
 *   GET /api/songs?category=Praise & Worship    → category-filtered first page
 *   GET /api/songs?letter=A                     → letter-filtered first page
 *
 * Response shape:
 *   { songs, count, cursor, hasMore, filter: { category?, letter? } }
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = Math.min(Math.max(parseInt(searchParams.get("limit")) || 20, 1), 100);
    const cursor = searchParams.get("cursor");
    const category = searchParams.get("category");
    const letter = searchParams.get("letter");
    const loadAll = searchParams.get("all") === "true";

    let result;

    if (loadAll && !category && !letter) {
      const songs = await songService.getAllSongsSummary();
      result = { songs, cursor: null, hasMore: false };
    } else if (category) {
      // Category-filtered pagination
      result = cursor
        ? await songService.getCategorySongsPageAfter(category, cursor, limitParam)
        : await songService.getCategorySongsPage(category, limitParam);
    } else if (letter) {
      // Letter-filtered pagination
      result = cursor
        ? await songService.getLetterSongsPageAfter(letter, cursor, limitParam)
        : await songService.getLetterSongsPage(letter, limitParam);
    } else {
      // All songs pagination
      result = cursor
        ? await songService.getSongsPageAfter(cursor, limitParam)
        : await songService.getSongsPage(limitParam);
    }

    return Response.json(
      {
        songs: result.songs,
        count: result.songs.length,
        cursor: result.cursor,
        hasMore: result.hasMore,
        filter: { category: category || null, letter: letter || null },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/songs error:", error);
    return Response.json(
      { error: error.message || "Failed to fetch songs from youworship_songs" },
      { status: 500 },
    );
  }
}
