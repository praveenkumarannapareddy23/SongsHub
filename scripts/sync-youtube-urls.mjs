/**
 * Sync YouTube URLs from legacy 'songs' collection to active 'youworship_songs'
 *
 * For each song in youworship_songs missing a YouTube URL, looks up the
 * matching song in the legacy 'songs' collection and copies it over.
 *
 * Matching strategy:
 *   1. By document ID / `id` field
 *   2. Fallback: by normalized `title + artist.name`
 *
 * Usage:
 *   node scripts/sync-youtube-urls.mjs
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

function extractYoutubeUrl(data) {
  return data.media?.video || data.videoUrl || data.youtubeUrl || "";
}

function normalize(str) {
  return (str || "").toLowerCase().trim().replace(/\s+/g, " ");
}

function getArtistName(data) {
  if (typeof data.artist === "object" && data.artist !== null) {
    return data.artist.name || "";
  }
  return data.artist || "";
}

async function syncYoutubeUrls() {
  console.log(
    "🎵 Syncing YouTube URLs from legacy 'songs' → 'youworship_songs'\n",
  );

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // ── 1. Read legacy 'songs' collection ──────────────────────────────
    console.log("📥 Reading legacy 'songs' collection...");
    const legacySnap = await getDocs(collection(db, "songs"));
    console.log(`   Found ${legacySnap.docs.length} legacy documents.\n`);

    const legacyById = new Map();
    const legacyByTitleArtist = new Map();

    for (const docSnap of legacySnap.docs) {
      const data = docSnap.data();
      const legacyId = data.id || docSnap.id;
      const youtubeUrl = extractYoutubeUrl(data);
      if (!youtubeUrl) continue;

      legacyById.set(String(legacyId), youtubeUrl);

      const title = normalize(data.title);
      const artist = normalize(getArtistName(data));
      if (title) {
        const key = `${title}||${artist}`;
        if (!legacyByTitleArtist.has(key)) {
          legacyByTitleArtist.set(key, youtubeUrl);
        }
      }
    }

    console.log(
      `   Legacy lookup built: ${legacyById.size} by ID, ${legacyByTitleArtist.size} by title+artist\n`,
    );

    // ── 2. Read active 'youworship_songs' collection ────────────
    console.log("📥 Reading active 'youworship_songs' collection...");
    const activeSnap = await getDocs(collection(db, "youworship_songs"));
    console.log(`   Found ${activeSnap.docs.length} active documents.\n`);

    // ── 3. Find songs that need a YouTube URL and have a legacy match ──
    const needsSync = [];
    let alreadyHasYoutube = 0;
    let noMatch = 0;

    for (const docSnap of activeSnap.docs) {
      const data = docSnap.data();
      const activeYoutube = extractYoutubeUrl(data);
      if (activeYoutube) {
        alreadyHasYoutube++;
        continue;
      }

      const activeId = String(data.id || docSnap.id);
      const activeKey = `${normalize(data.title)}||${normalize(getArtistName(data))}`;

      let matchUrl = legacyById.get(activeId);
      let matchMethod = "id";

      if (!matchUrl) {
        matchUrl = legacyByTitleArtist.get(activeKey);
        matchMethod = "title+artist";
      }

      if (matchUrl) {
        needsSync.push({
          id: activeId,
          url: matchUrl,
          data,
          method: matchMethod,
        });
      } else {
        console.log(
          `   ❌ No legacy match: "${data.title}" — ${getArtistName(data)}`,
        );
        noMatch++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total active songs:        ${activeSnap.docs.length}`);
    console.log(`   Already has YouTube:       ${alreadyHasYoutube}`);
    console.log(
      `   Missing YouTube URL:       ${activeSnap.docs.length - alreadyHasYoutube}`,
    );
    console.log(`   Matched in legacy:         ${needsSync.length}`);
    console.log(`   No legacy match:           ${noMatch}\n`);

    if (needsSync.length === 0) {
      console.log("✅ Nothing to sync.");
      return;
    }

    // ── 4. Write matched YouTube URLs ─────────────────────────────────
    const BATCH_SIZE = 400;
    let batch = writeBatch(db);
    let ops = 0;

    for (let i = 0; i < needsSync.length; i++) {
      const { id, url, data, method } = needsSync[i];
      const ref = doc(db, "youworship_songs", id);

      batch.update(ref, {
        "media.video": url,
        updatedAt: new Date().toISOString(),
      });

      ops++;
      console.log(
        `   [${i + 1}/${needsSync.length}] ✅ "${data.title}" ← ${url}  (via ${method})`,
      );

      if (ops >= BATCH_SIZE) {
        console.log(`\n💾 Committing batch of ${ops}...`);
        await batch.commit();
        console.log("✅ Batch committed.\n");
        batch = writeBatch(db);
        ops = 0;
      }
    }

    if (ops > 0) {
      console.log(`\n💾 Committing final batch of ${ops}...`);
      await batch.commit();
      console.log("✅ Final batch committed.\n");
    }

    console.log("======================================================");
    console.log(`🎉 Done! Synced ${needsSync.length} YouTube URL(s).`);
    console.log("======================================================");
  } catch (error) {
    console.error("\n❌ Sync failed:", error);
    process.exit(1);
  }
}

syncYoutubeUrls();
