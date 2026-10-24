/**
 * Seed Script — Youworship_users Firestore Collection
 *
 * Run: node scripts/seed-firestore.mjs
 *
 * This creates 3 test users in the Youworship_users collection
 * with realistic favorites, playlists, and recently played data.
 *
 * Prerequisites:
 *   1. Update SongHub/.env.local or SongHub/.env with real Firebase credentials
 *   2. Enable Email/Password auth in Firebase Console (optional, for login)
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

// ─── Test Data ─────────────────────────────────────────────────────────────
const now = new Date().toISOString();

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ─── Test Users ────────────────────────────────────────────────────────────
const testUsers = [
  {
    uid: "test-user-praveen",
    email: "praveen@test.com",
    displayName: "Praveen Kumar",
    photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=praveen",
    data: {
      favorites: [
        "9",
        "10",
        "60",
        "108",
        "162",
        "200",
        "208",
        "adavi-chetla-naduma",
      ],
      playlists: [
        {
          id: "pl-morning",
          name: "🌅 Morning Worship",
          songIds: ["200", "203", "208", "209", "210"],
        },
        {
          id: "pl-evening",
          name: "🌙 Evening Praises",
          songIds: ["192", "193", "194", "195", "162"],
        },
        {
          id: "pl-telugu-classics",
          name: "📜 Telugu Classics",
          songIds: ["adavi-chetla-naduma", "9", "10", "60", "108"],
        },
      ],
      recentlyPlayed: [
        { songId: "200", playedAt: daysAgo(0) },
        { songId: "208", playedAt: daysAgo(0) },
        { songId: "10", playedAt: daysAgo(1) },
        { songId: "162", playedAt: daysAgo(1) },
        { songId: "192", playedAt: daysAgo(2) },
        { songId: "60", playedAt: daysAgo(2) },
        { songId: "9", playedAt: daysAgo(3) },
        { songId: "adavi-chetla-naduma", playedAt: daysAgo(3) },
        { songId: "203", playedAt: daysAgo(4) },
        { songId: "108", playedAt: daysAgo(5) },
      ],
      createdAt: daysAgo(30),
      updatedAt: now,
    },
  },
  {
    uid: "test-user-sunitha",
    email: "sunitha@test.com",
    displayName: "Sunitha Rao",
    photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=sunitha",
    data: {
      favorites: ["33", "34", "82", "192", "193", "194", "195", "213"],
      playlists: [
        {
          id: "pl-healing",
          name: "🕊️ Healing & Peace",
          songIds: ["82", "194", "195", "200", "203"],
        },
        {
          id: "pl-choir",
          name: "🎵 Choir Favorites",
          songIds: ["33", "34", "192", "193", "195"],
        },
      ],
      recentlyPlayed: [
        { songId: "82", playedAt: daysAgo(0) },
        { songId: "34", playedAt: daysAgo(0) },
        { songId: "195", playedAt: daysAgo(1) },
        { songId: "192", playedAt: daysAgo(1) },
        { songId: "33", playedAt: daysAgo(2) },
        { songId: "194", playedAt: daysAgo(3) },
        { songId: "213", playedAt: daysAgo(3) },
        { songId: "193", playedAt: daysAgo(4) },
      ],
      createdAt: daysAgo(60),
      updatedAt: now,
    },
  },
  {
    uid: "test-user-david",
    email: "david@test.com",
    displayName: "David Raj",
    photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
    data: {
      favorites: ["216", "217", "218", "219", "220", "60", "108", "162"],
      playlists: [
        {
          id: "pl-praise-party",
          name: "🔥 Praise Party",
          songIds: ["162", "108", "192", "193", "218"],
        },
        {
          id: "pl-lullabies",
          name: "🌟 Peaceful Nights",
          songIds: ["216", "217", "82", "200", "203"],
        },
      ],
      recentlyPlayed: [
        { songId: "218", playedAt: daysAgo(0) },
        { songId: "216", playedAt: daysAgo(0) },
        { songId: "219", playedAt: daysAgo(1) },
        { songId: "162", playedAt: daysAgo(1) },
        { songId: "108", playedAt: daysAgo(2) },
        { songId: "220", playedAt: daysAgo(2) },
        { songId: "217", playedAt: daysAgo(3) },
        { songId: "60", playedAt: daysAgo(4) },
        { songId: "192", playedAt: daysAgo(5) },
        { songId: "193", playedAt: daysAgo(6) },
      ],
      createdAt: daysAgo(90),
      updatedAt: now,
    },
  },
];

// ─── Seed Function ─────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Seeding Youworship_users collection...\n");

  let successCount = 0;
  let errorCount = 0;

  for (const user of testUsers) {
    try {
      const ref = doc(db, "Youworship_users", user.uid);
      await setDoc(ref, {
        ...user.data,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      console.log(
        `  ✅ ${user.displayName.padEnd(16)} (${user.email}) — ` +
          `${user.data.favorites.length} favorites, ` +
          `${user.data.playlists.length} playlists, ` +
          `${user.data.recentlyPlayed.length} recently played`,
      );
      successCount++;
    } catch (error) {
      console.error(`  ❌ ${user.displayName} — ${error.message}`);
      errorCount++;
    }
  }

  console.log("\n" + "─".repeat(50));
  if (errorCount === 0) {
    console.log(
      `\n🎉 Success! ${successCount} user(s) seeded into Youworship_users.\n`,
    );
  } else {
    console.log(
      `\n⚠️  ${successCount} user(s) seeded, ${errorCount} error(s).\n`,
    );
  }

  console.log("📋 To create Firebase Auth users for testing, use:");
  console.log("   1. Go to Firebase Console → Authentication → Users");
  console.log("   2. Click 'Add User' for each test email:");
  testUsers.forEach((u) => {
    console.log(`      - ${u.email} (password: Test123!)`);
  });
  console.log(
    "   3. Or enable Email/Password sign-in and use the Sign Up flow instead.\n",
  );

  process.exit(0);
}

seed();
