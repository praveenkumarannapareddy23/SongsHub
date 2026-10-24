/**
 * Remove the specific Unsplash fallback image from all youworship_songs docs.
 *
 * The URL to remove: https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4
 * (matched by the photo ID, ignoring query param differences)
 *
 * Usage:
 *   node scripts/remove-unsplash-image.mjs
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

const TARGET_PATTERN = /photo-1511671782779-c97d3d27a1d4/;

function hasUnsplash(value) {
  return typeof value === "string" && TARGET_PATTERN.test(value);
}

async function removeUnsplashImage() {
  console.log("🔍 Scanning youworship_songs for Unsplash fallback image...\n");

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const snap = await getDocs(collection(db, "youworship_songs"));
    console.log(`📦 Found ${snap.docs.length} documents.\n`);

    const updates = [];

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const updateFields = {};

      if (hasUnsplash(data.imageUrl)) updateFields.imageUrl = "";
      if (hasUnsplash(data.coverUrl)) updateFields.coverUrl = "";
      if (
        data.media &&
        typeof data.media === "object" &&
        hasUnsplash(data.media.image)
      ) {
        updateFields["media.image"] = "";
      }

      if (Object.keys(updateFields).length > 0) {
        updates.push({ id: docSnap.id, title: data.title, updateFields });
      }
    }

    console.log(`📊 Songs with Unsplash image: ${updates.length}\n`);

    if (updates.length === 0) {
      console.log("✅ Nothing to clean.");
      return;
    }

    const BATCH_SIZE = 400;
    let batch = writeBatch(db);
    let ops = 0;

    for (let i = 0; i < updates.length; i++) {
      const { id, title, updateFields } = updates[i];
      const ref = doc(db, "youworship_songs", id);

      batch.update(ref, {
        ...updateFields,
        updatedAt: new Date().toISOString(),
      });

      ops++;
      console.log(
        `   [${i + 1}/${updates.length}] 🧹 "${title}" → ${JSON.stringify(updateFields)}`,
      );

      if (ops >= BATCH_SIZE) {
        await batch.commit();
        console.log(`\n💾 Batch committed.\n`);
        batch = writeBatch(db);
        ops = 0;
      }
    }

    if (ops > 0) {
      await batch.commit();
      console.log(`\n💾 Final batch committed.\n`);
    }

    console.log("==================================================");
    console.log(`🎉 Done! Cleaned ${updates.length} song(s).`);
    console.log("==================================================");
  } catch (error) {
    console.error("\n❌ Failed:", error);
    process.exit(1);
  }
}

removeUnsplashImage();
