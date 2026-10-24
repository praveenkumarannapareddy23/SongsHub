/**
 * Song Service — Fetch & transform songs from Firebase `youworship_songs` collection
 */
import { songService, transformSongDoc } from "@/services/songService";

/**
 * Legacy export wrapper pointing to the primary youworship_songs service
 */
export async function getAllSongs() {
  return await songService.getAllSongs();
}

/**
 * Fetch a single song by document ID from youworship_songs
 */
export async function getSongById(songId) {
  return await songService.getSongById(songId);
}

/**
 * Transform raw doc snapshot
 */
export function transformRawSong(docId, data) {
  return transformSongDoc({ id: docId, exists: () => true, data: () => data });
}

export { songService };
