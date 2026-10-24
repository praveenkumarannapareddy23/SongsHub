/**
 * Seed Script — bible_chapters Firestore Collection
 *
 * Uploads all verses from src/data/verses.js to the bible_chapters collection
 * in Firebase Firestore. Each verse has both English (ESV) and Telugu text.
 *
 * Run: node scripts/seed-bible-chapters.mjs
 *
 * Prerequisites:
 *   1. Update SongHub/.env.local or SongHub/.env with real Firebase credentials
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Load .env and .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({
  path: path.resolve(__dirname, "../.env.local"),
  override: true,
});

const { initializeApp } = await import("firebase/app");
const { getFirestore, doc, setDoc } = await import("firebase/firestore");

// ─── Firebase Config ───────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate config
const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v || v.startsWith("AIzaSyDummy"))
  .map(([k]) => k);

if (missing.length > 0) {
  console.error(
    "❌ Firebase credentials not configured or still using dummy values.\n" +
      `  Missing/Invalid: ${missing.join(", ")}\n\n` +
      "👉 Update SongHub/.env.local or SongHub/.env with your real Firebase project credentials first.\n" +
      "   Get them from: https://console.firebase.google.com → Project Settings → Web App",
  );
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Import Verses Data ────────────────────────────────────────────────────
import VERSES from "../src/data/verses.js";

// ─── Seed Function ─────────────────────────────────────────────────────────
async function seed() {
  console.log("📖 Seeding bible_chapters collection...\n");
  console.log(`  Total verses to upload: ${VERSES.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < VERSES.length; i++) {
    const verse = VERSES[i];
    const verseId = `verse_${i + 1}`;

    try {
      const ref = doc(db, "bible_chapters", verseId);
      await setDoc(ref, {
        id: verse.id,
        book: verse.book,
        bookTelugu: verse.bookTelugu,
        chapter: verse.chapter,
        verse: verse.verse,
        textEnglish: verse.textEnglish,
        textTelugu: verse.textTelugu,
        uploadedAt: new Date().toISOString(),
      });

      // Show progress every 10 verses
      if ((i + 1) % 10 === 0 || i === 0 || i === VERSES.length - 1) {
        const refText = `${verse.book} ${verse.chapter}:${verse.verse}`;
        console.log(`  ✅ [${i + 1}/${VERSES.length}] ${verseId} — ${refText}`);
      }

      successCount++;
    } catch (error) {
      console.error(
        `  ❌ [${i + 1}/${VERSES.length}] ${verseId} — ${error.message}`,
      );
      errorCount++;
    }
  }

  console.log("\n" + "─".repeat(50));
  if (errorCount === 0) {
    console.log(
      `\n🎉 Success! ${successCount} verse(s) seeded into bible_chapters.\n`,
    );
  } else {
    console.log(
      `\n⚠️  ${successCount} verse(s) seeded, ${errorCount} error(s).\n`,
    );
  }

  // Save a metadata document with total count
  try {
    const metaRef = doc(db, "bible_chapters", "_meta");
    await setDoc(metaRef, {
      totalVerses: VERSES.length,
      lastUpdated: new Date().toISOString(),
    });
    console.log(`📝 Metadata saved: ${VERSES.length} total verses.\n`);
  } catch (error) {
    console.error(`⚠️  Could not save metadata: ${error.message}\n`);
  }

  process.exit(0);
}

seed();
