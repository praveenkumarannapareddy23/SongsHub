/**
/**
 * PraiseHub / SongHub — Song Pictures Pipeline to Supabase & Firestore
 * 
 * Workflow:
 * 1. Read images from public/song pictures/ (.png, .jpg, .jpeg, .webp).
 * 2. If not already uploaded (not in image-metadata.json):
 *    a. Compress using Sharp to WebP Buffer (quality: 80, effort: 4).
 *    b. Upload to Supabase Storage bucket (`song-images`) with upsert: true.
 *    c. Retrieve public URL.
 *    d. Append to image-metadata.json.
 * 3. Sync public URLs back to Firestore collection `youworship_songs`:
 *    a. Query all documents in `youworship_songs`.
 *    b. Normalize titles for accurate matching.
 *    c. Update `imageUrl` and `media.image` for matched songs in Firestore.
 */

require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local", override: true });

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");
const adminModule = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const admin = adminModule.getApps
  ? adminModule
  : adminModule.apps
    ? adminModule
    : adminModule.default || adminModule;

// ─── Configuration & Directories ──────────────────────────────────────────────
const inputFolder = "./public/song pictures";
const BUCKET_NAME = "song-images";
const METADATA_FILE = "image-metadata.json";
const FIRESTORE_COLLECTION = "youworship_songs";

// WebP Compression Settings
const WEBP_QUALITY = 80;
const WEBP_EFFORT = 4;

// ─── Supabase Client Initialization ──────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error("❌ Supabase credentials missing in env files!");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseSecretKey);

// ─── Firebase Admin Initialization ───────────────────────────────────────────
let db = null;
const firebaseProjectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;

if (firebasePrivateKey) {
  firebasePrivateKey = firebasePrivateKey.trim();
  firebasePrivateKey = firebasePrivateKey.replace(
    /^[^a-zA-Z0-9+\/=_-]+|[^a-zA-Z0-9+\/=_-]+$/g,
    "",
  );
  if (firebasePrivateKey.startsWith("nMII")) {
    firebasePrivateKey =
      "-----BEGIN PRIVATE KEY-----\n" + firebasePrivateKey.substring(1);
  }
  if (!firebasePrivateKey.startsWith("-----BEGIN PRIVATE KEY-----")) {
    firebasePrivateKey = "-----BEGIN PRIVATE KEY-----\n" + firebasePrivateKey;
  }
  if (!firebasePrivateKey.endsWith("-----END PRIVATE KEY-----")) {
    firebasePrivateKey = firebasePrivateKey + "\n-----END PRIVATE KEY-----";
  }
  firebasePrivateKey = firebasePrivateKey.replace(/\\n/g, "\n");
}

const apps = admin.getApps ? admin.getApps() : admin.apps || [];
if (apps.length === 0) {
  if (firebaseProjectId && firebaseClientEmail && firebasePrivateKey) {
    try {
      admin.initializeApp({
        credential: admin.cert({
          projectId: firebaseProjectId,
          clientEmail: firebaseClientEmail,
          privateKey: firebasePrivateKey,
        }),
      });
      db = getFirestore();
    } catch (err) {
      console.error(`❌ Firebase Admin initialization failed: ${err.message}`);
      process.exit(1);
    }
  } else {
    console.error("❌ Firebase Admin credentials missing in env files!");
    process.exit(1);
  }
} else {
  db = getFirestore();
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes === 0 || isNaN(bytes)) return "0 Bytes";
  const absBytes = Math.abs(bytes);
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(absBytes) / Math.log(k));
  return parseFloat((absBytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getSafeStorageKey(storagePath) {
  const normalized = storagePath.replace(/\\/g, "/");
  const ext = path.extname(normalized);
  const dir = path.dirname(normalized);
  const baseName = path.basename(normalized, ext);

  const safeBaseName = encodeURIComponent(baseName).replace(/%/g, "_");
  const safeFileName = `${safeBaseName}${ext}`;

  return dir === "." ? safeFileName : `${dir}/${safeFileName}`;
}

async function compressToWebP(inputPath) {
  const originalBuffer = fs.readFileSync(inputPath);
  const originalSize = originalBuffer.length;

  const compressedBuffer = await sharp(originalBuffer)
    .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
    .toBuffer();

  return {
    buffer: compressedBuffer,
    originalSize,
    compressedSize: compressedBuffer.length,
  };
}

async function uploadToSupabase(buffer, storagePath) {
  const safeKey = getSafeStorageKey(storagePath);
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(safeKey, buffer, {
      contentType: "image/webp",
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }
  return data;
}

function getPublicUrl(storagePath) {
  const safeKey = getSafeStorageKey(storagePath);
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(safeKey);
  return data.publicUrl;
}

function normalizeTitle(title) {
  if (!title) return "";
  return title
    .trim()
    .normalize("NFC")
    .replace(/\s+/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'\[\]]/g, "")
    .toLowerCase();
}

// ─── Main Pipeline ───────────────────────────────────────────────────────────
async function run() {
  console.log("==================================================");
  console.log("🚀 Starting Song Pictures Pipeline");
  console.log("==================================================\n");

  if (!fs.existsSync(inputFolder)) {
    console.error(`❌ Input folder "${inputFolder}" does not exist.`);
    process.exit(1);
  }

  // Load existing metadata
  let metadataList = [];
  const metadataPath = path.resolve(process.cwd(), METADATA_FILE);
  if (fs.existsSync(metadataPath)) {
    try {
      metadataList = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
      console.log(`Loaded ${metadataList.length} existing metadata items.`);
    } catch (err) {
      console.warn(
        `⚠️ Error reading metadata file: ${err.message}. Starting fresh.`,
      );
    }
  }

  const files = fs
    .readdirSync(inputFolder)
    .filter(
      (f) =>
        f.endsWith(".png") ||
        f.endsWith(".jpg") ||
        f.endsWith(".jpeg") ||
        f.endsWith(".webp"),
    );

  console.log(`Found ${files.length} images in "${inputFolder}"`);

  let nextId =
    metadataList.length > 0
      ? Math.max(...metadataList.map((item) => item.id)) + 1
      : 1;
  const imageMap = {}; // original filename -> publicUrl

  // 1. Process local images
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const inputPath = path.join(inputFolder, file);
    const ext = path.extname(file);
    const title = path.basename(file, ext).trim().normalize("NFC");
    const uploadedFileName = title + ".webp";

    // Check if already in metadata
    let existingItem = metadataList.find(
      (item) => item.originalFileName === file,
    );

    if (existingItem && existingItem.uploaded && existingItem.publicUrl) {
      console.log(`[${i + 1}/${files.length}] Already processed: ${file}`);
      imageMap[file] = existingItem.publicUrl;
      continue;
    }

    console.log(`[${i + 1}/${files.length}] Processing: ${file}`);
    try {
      // Compress to WebP
      const compRes = await compressToWebP(inputPath);
      console.log(
        `  Compressed: ${formatBytes(compRes.originalSize)} -> ${formatBytes(compRes.compressedSize)}`,
      );

      // Upload to Supabase
      const storagePath = uploadedFileName;
      await uploadToSupabase(compRes.buffer, storagePath);
      const publicUrl = getPublicUrl(storagePath);
      console.log(`  Uploaded to Supabase. URL: ${publicUrl}`);

      // Add to metadata
      const metadataItem = {
        id: existingItem ? existingItem.id : nextId++,
        title: title,
        originalFileName: file,
        uploadedFileName: uploadedFileName,
        bucket: BUCKET_NAME,
        path: storagePath,
        publicUrl: publicUrl,
        uploaded: true,
      };

      if (existingItem) {
        // Update in place
        const index = metadataList.indexOf(existingItem);
        metadataList[index] = metadataItem;
      } else {
        metadataList.push(metadataItem);
      }

      imageMap[file] = publicUrl;

      // Save metadata JSON on every iteration to be safe
      fs.writeFileSync(
        metadataPath,
        JSON.stringify(metadataList, null, 2),
        "utf-8",
      );
    } catch (err) {
      console.error(`  ❌ Error processing ${file}: ${err.message}`);
    }
  }

  console.log("\n📄 Metadata JSON file saved.");

  // 2. Fetch all songs from youworship_songs and sync URLs
  console.log(
    "\n📥 Fetching all songs from Firestore collection 'youworship_songs'...",
  );
  const songsSnap = await db.collection(FIRESTORE_COLLECTION).get();
  console.log(`Loaded ${songsSnap.docs.length} song documents from Firestore.`);

  const dbSongs = songsSnap.docs.map((doc) => ({
    id: doc.id,
    ref: doc.ref,
    title: doc.data().title,
    media: doc.data().media || {},
  }));

  console.log("\n🔄 Syncing image URLs to Firestore documents...");
  let matchedCount = 0;
  let updatedCount = 0;

  for (const file of files) {
    const publicUrl = imageMap[file];
    if (!publicUrl) continue;

    const fileTitle = path.basename(file, path.extname(file));
    const normalizedFile = normalizeTitle(fileTitle);

    // Look for exact normalized title match
    const match = dbSongs.find(
      (s) => normalizeTitle(s.title) === normalizedFile,
    );

    if (match) {
      matchedCount++;
      // Check if document already has the same URL to avoid redundant writes
      if (match.media.image === publicUrl) {
        console.log(
          `✨ Song "${match.title}" (ID: ${match.id}) already has correct image URL in Firestore.`,
        );
        continue;
      }

      console.log(
        `🛠️ Updating Firestore for "${match.title}" (ID: ${match.id})`,
      );
      await match.ref.update({
        imageUrl: publicUrl,
        "media.image": publicUrl,
      });
      updatedCount++;
    } else {
      console.warn(
        `⚠️ No matching song found in youworship_songs for image file: "${fileTitle}"`,
      );
    }
  }

  console.log("\n==================================================");
  console.log("📊 PIPELINE SYNC COMPLETE");
  console.log("==================================================");
  console.log(`• Total images checked:      ${files.length}`);
  console.log(`• Matched with songs:        ${matchedCount}`);
  console.log(`• Firestore docs updated:    ${updatedCount}`);
  console.log("==================================================\n");
}

run().catch(console.error);
