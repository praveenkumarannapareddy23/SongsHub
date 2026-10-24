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

async function fixImageUrls() {
  console.log("🔍 Scanning and repairing youworship_songs image URLs...\n");

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const colRef = collection(db, "youworship_songs");
    const querySnapshot = await getDocs(colRef);

    const batch = writeBatch(db);
    let updateCount = 0;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docRef = doc(db, "youworship_songs", docSnap.id);
      let needsUpdate = false;
      const updatedFields = {};

      // 1. Check and fix missing .webp extension in Supabase image URLs
      if (
        data.media &&
        typeof data.media === "object" &&
        typeof data.media.image === "string"
      ) {
        const img = data.media.image;
        if (
          img.includes("supabase.co") &&
          !img.endsWith(".webp") &&
          !img.endsWith(".png") &&
          !img.endsWith(".jpg")
        ) {
          const fixedImg = img + ".webp";
          updatedFields["media.image"] = fixedImg;
          needsUpdate = true;
          console.log(`🛠️ Fixing Supabase URL for "${data.title}":`);
          console.log(`   Before: ${img}`);
          console.log(`   After:  ${fixedImg}`);
        }
      }

      // 2. Check and clear Unsplash 404 images
      if (
        data.media &&
        typeof data.media === "object" &&
        typeof data.media.image === "string"
      ) {
        const img = data.media.image;
        if (
          img.includes("unsplash.com") &&
          (img.includes("photo-1594979222473") ||
            img.includes("photo-1593011378399"))
        ) {
          updatedFields["media.image"] = "";
          needsUpdate = true;
          console.log(`🧹 Clearing 404 Unsplash image for "${data.title}":`);
          console.log(`   Cleared: ${img}`);
        }
      }

      if (needsUpdate) {
        batch.update(docRef, updatedFields);
        updateCount++;
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(
        `\n✅ Successfully committed ${updateCount} document updates to Firestore.`,
      );
    } else {
      console.log(
        "\n✨ No malformed image URLs were found. Everything is clean!",
      );
    }
  } catch (error) {
    console.error("❌ Error running repair script:", error);
  }
}

fixImageUrls();
