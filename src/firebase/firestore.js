import { db } from "./config";
import { collection, doc } from "firebase/firestore";

/**
 * Collection Name Constants
 */
export const COLLECTIONS = {
  YOUWORSHIP_SONGS: process.env.NEXT_PUBLIC_COLLECTION_SONGS || "youworship_songs",
  YOUWORSHIP_USERS: process.env.NEXT_PUBLIC_COLLECTION_USERS || "Youworship_users",
  BIBLE_CHAPTERS: process.env.NEXT_PUBLIC_COLLECTION_BIBLE || "bible_chapters",
};

/**
 * Helper to get reference to youworship_songs collection
 */
export const getSongsCollectionRef = () =>
  collection(db, COLLECTIONS.YOUWORSHIP_SONGS);

/**
 * Helper to get reference to a specific song document
 */
export const getSongDocRef = (songId) =>
  doc(db, COLLECTIONS.YOUWORSHIP_SONGS, songId);

/**
 * Helper to get reference to bible_chapters collection
 */
export const getBibleChaptersRef = () =>
  collection(db, COLLECTIONS.BIBLE_CHAPTERS);

/**
 * Helper to get reference to a specific bible chapter document by verse ID
 */
export const getBibleChapterDocRef = (verseId) =>
  doc(db, COLLECTIONS.BIBLE_CHAPTERS, verseId);

export { db };
