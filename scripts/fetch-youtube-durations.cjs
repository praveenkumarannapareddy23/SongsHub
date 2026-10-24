/**
 * Fetch YouTube durations in concurrent batches and write to Firestore.
 *
 * Process: divides songs into small batches → fetches all durations in
 * each batch concurrently → immediately commits to Firestore → next batch.
 *
 * Usage:
 *   node scripts/fetch-youtube-durations.cjs
 */

const dotenv = require("dotenv");
const path = require("path");
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  getDocs,
  doc,
  writeBatch,
} = require("firebase/firestore");
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

const CONCURRENT_BATCH = 10;

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

async function fetchDuration(youtubeId) {
  const info = await ytdl.getInfo(
    `https://www.youtube.com/watch?v=${youtubeId}`,
  );
  const seconds = Number(info.videoDetails.lengthSeconds);
  return seconds && seconds > 0 ? seconds : null;
}

async function fetchDurations() {
  console.log("⏱️  Fetching YouTube durations for youworship_songs...\n");

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const snap = await getDocs(collection(db, "youworship_songs"));
    console.log(`📦 Found ${snap.docs.length} documents.`);

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

      needsDuration.push({
        id: docSnap.id,
        title: (data.title || docSnap.id).slice(0, 40),
        youtubeId,
      });
    }

    const total = needsDuration.length;
    console.log(`🎯 Songs missing duration with YouTube ID: ${total}\n`);

    if (total === 0) {
      console.log("✅ All songs already have durations.");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    const batchCount = Math.ceil(total / CONCURRENT_BATCH);

    for (let b = 0; b < batchCount; b++) {
      const start = b * CONCURRENT_BATCH;
      const chunk = needsDuration.slice(start, start + CONCURRENT_BATCH);

      console.log(
        `─── Batch ${b + 1}/${batchCount} (${chunk.length} songs) ───`,
      );

      const results = await Promise.allSettled(
        chunk.map((song) =>
          fetchDuration(song.youtubeId).then((seconds) => ({
            ...song,
            seconds,
          })),
        ),
      );

      const fbBatch = writeBatch(db);
      let batchOps = 0;

      for (const result of results) {
        if (result.status === "fulfilled" && result.value.seconds) {
          const { id, title, seconds } = result.value;
          const ref = doc(db, "youworship_songs", id);
          fbBatch.update(ref, {
            duration: seconds,
            updatedAt: new Date().toISOString(),
          });
          batchOps++;
          successCount++;
          const mins = Math.floor(seconds / 60);
          const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
          console.log(`   ✅ "${title}" → ${mins}:${secs}`);
        } else if (result.status === "fulfilled") {
          failCount++;
          const title = result.value.title;
          console.log(`   ⚠️ "${title}" → could not get duration`);
        } else {
          failCount++;
          const song = chunk[results.indexOf(result)];
          const msg = (result.reason?.message || "").slice(0, 80);
          console.log(`   ❌ "${song.title}" → ${msg}`);
        }
      }

      if (batchOps > 0) {
        await fbBatch.commit();
        console.log(`   💾 Committed ${batchOps} duration(s) to Firestore.\n`);
      } else {
        console.log(`   💤 No durations to commit.\n`);
      }
    }

    console.log("======================================================");
    console.log(`🎉 Complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed:  ${failCount}`);
    console.log(`   Total:   ${total}`);
    console.log("======================================================");
  } catch (error) {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  }
}

fetchDurations();
