/**
 * Quick script to fetch 2-3 songs from Firebase `songs` collection.
 * Run: node scripts/fetch-songs.mjs
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({
  path: path.resolve(__dirname, "../.env.local"),
  override: true,
});

const { initializeApp } = await import("firebase/app");
const { getFirestore, collection, getDocs, query, limit } =
  await import("firebase/firestore");

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
  console.error("❌ Firestore credentials missing or dummy.\n");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  console.log(
    "🔍 Fetching up to 3 songs from Firebase 'songs' collection...\n",
  );

  const q = query(collection(db, "songs"), limit(3));
  const snap = await getDocs(q);

  if (snap.empty) {
    console.log("⚠️  No documents found in the 'songs' collection.");
    console.log("   Either the collection doesn't exist or it's empty.\n");
    process.exit(0);
  }

  console.log(`✅ Found ${snap.size} song(s):\n`);
  console.log("=".repeat(70));

  let index = 0;
  for (const doc of snap.docs) {
    index++;
    console.log(`\n📀 SONG #${index}  (ID: ${doc.id})`);
    console.log("─".repeat(50));

    const data = doc.data();

    // Print the full structure with types
    for (const [key, value] of Object.entries(data)) {
      const type = Array.isArray(value)
        ? `Array(${value.length})`
        : typeof value;
      const preview = Array.isArray(value)
        ? `[${value
            .slice(0, 2)
            .map((v) =>
              typeof v === "string"
                ? `"${v.substring(0, 30)}..."`
                : JSON.stringify(v),
            )
            .join(", ")}${value.length > 2 ? "..." : ""}]`
        : typeof value === "string"
          ? `"${value.substring(0, 60)}${value.length > 60 ? "..." : ""}"`
          : JSON.stringify(value);
      console.log(`  ${key.padEnd(20)} (${type})  ${preview}`);
    }
    console.log("─".repeat(50));
  }

  console.log("\n" + "=".repeat(70));
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
