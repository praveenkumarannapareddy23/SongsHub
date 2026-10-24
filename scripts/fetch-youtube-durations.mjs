/**
 * Fetch YouTube video durations for all songs missing a duration field.
 *
 * Uses ytdl-core to extract duration from YouTube video metadata,
 * then writes it to Firestore so song cards show correct times immediately.
 *
 * Usage:
 *   node scripts/fetch-youtube-durations.mjs
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { createRequire } from "module";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  writeBatch,
} from "firebase/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ytdl = require("@distube/ytdl-core");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({
  path: path.resolve(__dirname, "../.env.local"),
  override: true,
});

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function extractYoutubeId(url) {
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

function getYoutubeUrl(data) {
  return data.media?.video || data.videoUrl || data.youtubeUrl || "";
}

async function fetchDuration(youtubeId, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const info = await ytdl.getInfo(
        `https://www.youtube.com/watch?v=${youtubeId}`,
      );
      const seconds = Number(info.videoDetails.lengthSeconds);
      if (seconds && seconds > 0) return seconds;
    } catch (err) {
      if (attempt < retries) {
        const delay = (attempt + 1) * 1000;
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  return null;
}

async function fetchDurations() {
  console.log("⏱️  Fetching YouTube durations for youworship_songs...\n");

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const snap = await getDocs(collection(db, "youworship_songs"));
    console.log(`📦 Found ${snap.docs.length} documents.\n`);

    const needsDuration = [];

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const hasDuration =
        data.duration !== undefined &&
        data.duration !== null &&
        Number(data.duration) > 0;
      if (hasDuration) continue;

      const youtubeUrl = getYoutubeUrl(data);
      const youtubeId = extractYoutubeId(youtubeUrl) || data.youtubeId;
      if (!youtubeId) continue;

      needsDuration.push({ id: docSnap.id, title: data.title, youtubeId });
    }

    console.log(
      `🎯 Songs missing duration with YouTube ID: ${needsDuration.length}\n`,
    );

    if (needsDuration.length === 0) {
      console.log("✅ All songs already have durations.");
      return;
    }

    const BATCH_SIZE = 400;
    let batch = writeBatch(db);
    let ops = 0;
    let successCount = 0;
    let failCount = 0;
    const total = needsDuration.length;

    for (let i = 0; i < total; i++) {
      const { id, title, youtubeId } = needsDuration[i];

      try {
        const seconds = await fetchDuration(youtubeId);
        if (seconds) {
          const ref = doc(db, "youworship_songs", id);
          batch.update(ref, {
            duration: seconds,
            updatedAt: new Date().toISOString(),
          });
          ops++;
          successCount++;
          console.log(
            `   [${i + 1}/${total}] ✅ "${title}" → ${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")} (${seconds}s)`,
          );
        } else {
          failCount++;
          console.log(
            `   [${i + 1}/${total}] ⚠️ "${title}" → could not get duration`,
          );
        }
      } catch (err) {
        failCount++;
        console.log(`   [${i + 1}/${total}] ❌ "${title}" → ${err.message}`);
      }

      if (ops >= BATCH_SIZE) {
        await batch.commit();
        console.log(`\n💾 Batch committed.\n`);
        batch = writeBatch(db);
        ops = 0;
      }

      // Small delay between requests to avoid rate limiting
      await new Promise((r) => setTimeout(r, 300));
    }

    if (ops > 0) {
      await batch.commit();
      console.log(`\n💾 Final batch committed.\n`);
    }

    console.log("======================================================");
    console.log(`🎉 Done!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed:  ${failCount}`);
    console.log("======================================================");
  } catch (error) {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  }
}

fetchDurations();
