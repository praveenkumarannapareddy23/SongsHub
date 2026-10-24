/**
 * Update Durations Script
 *
 * Fetches every song from Firebase youworship_songs, detects the actual
 * duration from YouTube videos or direct audio files, and updates the
 * Firestore document with the correct duration in seconds.
 *
 * Run: node scripts/update-durations.mjs
 *
 * Prerequisites:
 *   1. Update SongHub/.env.local or SongHub/.env with real Firebase credentials
 *   2. music-metadata & ytdl-core packages installed
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { setTimeout as sleep } from "timers/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({
  path: path.resolve(__dirname, "../.env.local"),
  override: true,
});

const { initializeApp } = await import("firebase/app");
const { getFirestore, collection, getDocs, doc, updateDoc } =
  await import("firebase/firestore");
const { parseFile } = await import("music-metadata");
const ytdlCore = await import("ytdl-core");
const ytdl = ytdlCore.default || ytdlCore;

// ─── Firebase Config ───────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v || v.startsWith("AIzaSyDummy"))
  .map(([k]) => k);
if (missing.length > 0) {
  console.error(
    "❌ Firebase credentials not configured.\nMissing:",
    missing.join(", "),
  );
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || seconds <= 0) return null;
  const secs = Math.round(seconds);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return {
    duration: secs,
    durationFormatted: `${m}:${s.toString().padStart(2, "0")}`,
  };
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

async function getYouTubeDuration(videoUrl) {
  try {
    const info = await ytdl.getInfo(videoUrl);
    const seconds = Number(info.videoDetails.lengthSeconds);
    if (seconds && seconds > 0) {
      return formatDuration(seconds);
    }
  } catch (err) {
    console.warn(`  ⚠️  YouTube fetch failed: ${err.message.slice(0, 80)}`);
  }
  return null;
}

async function getAudioDuration(audioUrl) {
  try {
    // music-metadata can read from a URL
    const metadata = await parseFile(audioUrl);
    const seconds = metadata.format.duration;
    if (seconds && seconds > 0) {
      return formatDuration(seconds);
    }
  } catch (err) {
    // Some audio URLs may not support direct metadata reading
    // Try fetching as a stream instead
    try {
      const response = await fetch(audioUrl, {
        method: "GET",
        headers: { Range: "bytes=0-65535" },
      });
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        const metadata = await parseFile(
          buffer,
          path.extname(audioUrl) || ".mp3",
        );
        const seconds = metadata.format.duration;
        if (seconds && seconds > 0) {
          return formatDuration(seconds);
        }
      }
    } catch (streamErr) {
      console.warn(
        `  ⚠️  Audio metadata failed: ${streamErr.message.slice(0, 80)}`,
      );
    }
  }
  return null;
}

// ─── Main Script ──────────────────────────────────────────────────────────

async function updateDurations() {
  console.log("⏱️  Updating song durations from media files...\n");

  // Fetch all songs
  const songsRef = collection(db, "youworship_songs");
  const snapshot = await getDocs(songsRef);
  const songs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  console.log(`📥 Found ${songs.length} song(s) in youworship_songs.\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    const rawAudio = song.media?.audio || song.audioUrl || "";
    const rawVideo =
      song.media?.video || song.videoUrl || song.youtubeUrl || "";

    // Skip if already has a valid duration (number or formatted string)
    const existingDuration = song.duration;
    const hasValidDuration =
      (typeof existingDuration === "number" && existingDuration > 0) ||
      (typeof existingDuration === "string" &&
        existingDuration.includes(":") &&
        existingDuration !== "0:00");

    if (hasValidDuration) {
      console.log(
        `  ⏭️  [${i + 1}/${songs.length}] ${song.title || song.id} — already has duration (${existingDuration})`,
      );
      skipped++;
      continue;
    }

    const youtubeId = extractYouTubeId(rawAudio) || extractYouTubeId(rawVideo);
    const mediaUrl = rawAudio || rawVideo;

    if (!mediaUrl) {
      console.log(
        `  ⏭️  [${i + 1}/${songs.length}] ${song.title || song.id} — no media URL`,
      );
      skipped++;
      continue;
    }

    process.stdout.write(
      `  🔍 [${i + 1}/${songs.length}] ${song.title || song.id}... `,
    );

    let result = null;

    if (youtubeId) {
      result = await getYouTubeDuration(mediaUrl);
      if (result) {
        process.stdout.write(`YouTube → ${result.durationFormatted}\n`);
      } else {
        process.stdout.write("YouTube fetch failed\n");
      }
    } else {
      result = await getAudioDuration(mediaUrl);
      if (result) {
        process.stdout.write(`Audio → ${result.durationFormatted}\n`);
      } else {
        process.stdout.write("Audio metadata failed\n");
      }
    }

    if (result) {
      try {
        const songRef = doc(db, "youworship_songs", song.id);
        await updateDoc(songRef, {
          duration: result.duration,
          updatedAt: new Date().toISOString(),
        });
        updated++;
        console.log(`     ✅ Updated: ${result.durationFormatted}`);
      } catch (err) {
        console.error(`     ❌ Firestore update error: ${err.message}`);
        errors++;
      }
    } else {
      errors++;
    }

    // Small delay to avoid rate limiting
    await sleep(500);
  }

  console.log("\n" + "─".repeat(50));
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors:  ${errors}`);
  console.log(`   📝 Total:   ${songs.length}\n`);

  if (errors > 0) {
    console.log(
      "⚠️  Some songs could not be processed. Check the logs above for details.\n",
    );
    process.exit(1);
  }

  console.log("🎉 All songs processed successfully!\n");
  process.exit(0);
}

updateDurations();
