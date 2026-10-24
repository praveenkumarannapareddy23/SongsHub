/**
 * Firestore youworship_songs Schema Migration Script
 *
 * Migrates documents in 'youworship_songs' (or from 'songs')
 * to the NEW structured schema format.
 *
 * Usage:
 *   node scripts/migrate-songs.mjs
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  writeBatch,
} from "firebase/firestore";

// Load environment variables from .env and .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({
  path: path.resolve(__dirname, "../.env.local"),
  override: true,
});

// ─── Firebase Configuration ──────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ─── Helper Utilities ───────────────────────────────────────────────────────

function generateSlug(title, artistName, fallbackId) {
  const str = `${title || ""} ${artistName || ""}`.trim();
  const clean = str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return clean || fallbackId.replace(/_/g, "-");
}

function parseDurationToSeconds(duration) {
  if (typeof duration === "number") return duration;
  if (!duration || typeof duration !== "string") return 0;
  const parts = duration.split(":").map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  const parsed = parseInt(duration, 10);
  return isNaN(parsed) ? 0 : parsed;
}

function transformLyrics(rawTeluguLyrics, rawEnglishLyrics) {
  const lyricsArr = [];

  if (typeof rawTeluguLyrics === "string" && rawTeluguLyrics.trim()) {
    lyricsArr.push({
      language: "te",
      format: "original",
      title: "తెలుగు",
      content: rawTeluguLyrics.trim(),
      isDefault: true,
    });
  }

  if (typeof rawEnglishLyrics === "string" && rawEnglishLyrics.trim()) {
    lyricsArr.push({
      language: "en",
      format: "transliteration",
      title: "Romanized",
      content: rawEnglishLyrics.trim(),
      isDefault: lyricsArr.length === 0,
    });
  }

  if (lyricsArr.length === 0) {
    lyricsArr.push({
      language: "te",
      format: "original",
      title: "తెలుగు",
      content: "",
      isDefault: true,
    });
  }

  return lyricsArr;
}

/**
 * Transforms old document data into the NEW structured schema format.
 */
function transformToNewStructuredSchema(docId, oldData) {
  const now = new Date().toISOString();

  const artistName =
    typeof oldData.artist === "object"
      ? oldData.artist?.name || "Unknown Artist"
      : oldData.artist || "Unknown Artist";

  const title = oldData.title || "";
  const slug = oldData.slug || generateSlug(title, artistName, docId);

  // Category array
  let categoryArr = [];
  if (Array.isArray(oldData.category)) {
    categoryArr = oldData.category;
  } else if (oldData.category && typeof oldData.category === "string") {
    categoryArr = [oldData.category];
  } else {
    categoryArr = ["Praise & Worship"];
  }

  // Tags array
  let tagsArr = [];
  if (Array.isArray(oldData.tags)) {
    tagsArr = oldData.tags;
  } else if (typeof oldData.tags === "string") {
    tagsArr = oldData.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  } else {
    tagsArr = ["Worship", "Devotional"];
  }

  // Language ISO code
  let langCode = "te";
  if (oldData.language) {
    const l = oldData.language.toLowerCase();
    if (l === "english" || l === "en") langCode = "en";
    else if (l === "telugu" || l === "te") langCode = "te";
    else langCode = oldData.language;
  }

  // Media object
  const mediaObj = {
    image: oldData.media?.image || oldData.imageUrl || oldData.coverUrl || "",
    audio: oldData.media?.audio || oldData.audioUrl || "",
    video: oldData.media?.video || oldData.videoUrl || oldData.youtubeUrl || "",
  };

  // Year
  const year =
    oldData.year !== undefined && oldData.year !== null
      ? Number(oldData.year)
      : 2026;

  // Duration in seconds
  const durationSec = parseDurationToSeconds(oldData.duration);

  // Lyrics array
  let lyricsArr = [];
  if (Array.isArray(oldData.lyrics) && oldData.lyrics.length > 0) {
    lyricsArr = oldData.lyrics;
  } else {
    const rawTe = typeof oldData.lyrics === "string" ? oldData.lyrics : "";
    const rawEn =
      typeof oldData.englishLyrics === "string" ? oldData.englishLyrics : "";
    lyricsArr = transformLyrics(rawTe, rawEn);
  }

  return {
    id: docId,
    title,
    slug,
    artist: {
      id: oldData.artist?.id || null,
      name: artistName,
    },
    language: langCode,
    category: categoryArr,
    album: oldData.album || null,
    year,
    duration: durationSec,
    tags: tagsArr,
    lyrics: lyricsArr,
    media: mediaObj,
    createdAt: oldData.createdAt || now,
    updatedAt: now,
  };
}

// ─── Main Migration Function ─────────────────────────────────────────────────

async function updateCollectionToNewSchema() {
  console.log(
    "🚀 Updating 'youworship_songs' to the NEW Structured Schema...\n"
  );

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Fetch all documents from youworship_songs
    console.log("📥 Reading documents from 'youworship_songs'...");
    const songsRef = collection(db, "youworship_songs");
    const snapshot = await getDocs(songsRef);

    if (snapshot.empty) {
      console.log(
        "⚠️ Collection 'youworship_songs' is empty. Trying fallback 'songs' collection...",
      );
      const oldSnap = await getDocs(collection(db, "songs"));
      if (oldSnap.empty) {
        console.log("⚠️ No documents found in 'songs' either.");
        return;
      }
      snapshot.docs.push(...oldSnap.docs);
    }

    const totalDocs = snapshot.docs.length;
    console.log(`📦 Found ${totalDocs} document(s) to process.\n`);

    const BATCH_SIZE = 400;
    let batch = writeBatch(db);
    let operationCount = 0;
    let successCount = 0;

    for (let i = 0; i < totalDocs; i++) {
      const docSnap = snapshot.docs[i];
      const oldData = docSnap.data();

      const targetDocId = oldData.id || docSnap.id;
      const newSchemaData = transformToNewStructuredSchema(
        targetDocId,
        oldData,
      );

      const targetRef = doc(db, "youworship_songs", targetDocId);
      batch.set(targetRef, newSchemaData, { merge: false });

      operationCount++;
      successCount++;

      console.log(
        `[${i + 1}/${totalDocs}] Updated schema for: "${targetDocId}"`,
      );

      if (operationCount === BATCH_SIZE) {
        console.log(`\n💾 Committing batch of ${operationCount} documents...`);
        await batch.commit();
        console.log("✅ Batch commit successful.\n");
        batch = writeBatch(db);
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      console.log(
        `\n💾 Committing final batch of ${operationCount} documents...`,
      );
      await batch.commit();
      console.log("✅ Final batch commit successful.\n");
    }

    console.log("==================================================");
    console.log(
      `🎉 SUCCESS: Updated ${successCount} document(s) to NEW Schema in 'youworship_songs'!`,
    );
    console.log("==================================================");
  } catch (error) {
    console.error("\n❌ Schema update failed with error:", error);
    process.exit(1);
  }
}

updateCollectionToNewSchema();
