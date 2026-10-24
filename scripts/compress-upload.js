/**
 * PraiseHub / SongHub — In-Memory Image Processing & Supabase Pipeline
 * 
 * Workflow:
 * 1. Read images from photos/ (.jpg, .jpeg, .png, .webp).
 * 2. Compress each image in memory using Sharp to WebP Buffer (quality: 80, effort: 4).
 * 3. Upload Buffer directly to Supabase Storage bucket (`song-images`) with upsert: true.
 * 4. Retrieve Supabase public URL for every image.
 * 5. Update Firebase Firestore collection (`songImages`) if credentials present.
 * 6. Generate and save `image-metadata.json` in the project root.
 * 
 * Run with:
 *   node scripts/compress-upload.js
 */

require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local", override: true });

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");
const adminModule = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const admin = adminModule.getApps ? adminModule : (adminModule.apps ? adminModule : (adminModule.default || adminModule));

// ─── Configuration & Directories ──────────────────────────────────────────────
const inputFolder = "./photos";
const BUCKET_NAME = "song-images";
const METADATA_FILE = "image-metadata.json";
const FIRESTORE_COLLECTION = "songImages";
const SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

// WebP Compression Settings
const WEBP_QUALITY = 80;
const WEBP_EFFORT = 4;

// ─── Supabase Client Initialization ──────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseSecretKey) {
  supabase = createClient(supabaseUrl, supabaseSecretKey);
}

// ─── Firebase Admin Initialization ───────────────────────────────────────────
let db = null;
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;
if (firebasePrivateKey) {
  firebasePrivateKey = firebasePrivateKey.trim();
  // Remove wrapping quotes/commas from copy-paste
  firebasePrivateKey = firebasePrivateKey.replace(/^[^a-zA-Z0-9+\/=_-]+|[^a-zA-Z0-9+\/=_-]+$/g, '');
  
  // Fix leftover 'n' from '\n' if header was removed
  if (firebasePrivateKey.startsWith('nMII')) {
    firebasePrivateKey = '-----BEGIN PRIVATE KEY-----\n' + firebasePrivateKey.substring(1);
  }
  
  // Ensure BEGIN/END headers exist
  if (!firebasePrivateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    firebasePrivateKey = '-----BEGIN PRIVATE KEY-----\n' + firebasePrivateKey;
  }
  if (!firebasePrivateKey.endsWith('-----END PRIVATE KEY-----')) {
    firebasePrivateKey = firebasePrivateKey + '\n-----END PRIVATE KEY-----';
  }
  
  firebasePrivateKey = firebasePrivateKey.replace(/\\n/g, "\n");
}

const apps = admin.getApps ? admin.getApps() : (admin.apps || []);
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
      console.warn(`⚠️  Firebase Admin initialization warning: ${err.message}`);
    }
  } else if (firebaseProjectId) {
    try {
      admin.initializeApp({ projectId: firebaseProjectId });
      db = getFirestore();
    } catch (err) {
      // Fallback
    }
  }
} else {
  db = getFirestore();
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes === 0 || isNaN(bytes)) return "0 Bytes";
  const isNegative = bytes < 0;
  const absBytes = Math.abs(bytes);
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(absBytes) / Math.log(k));
  const formatted = parseFloat((absBytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  return (isNegative ? "-" : "") + formatted + ` (${bytes} bytes)`;
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

function getFilesRecursively(dirPath, baseDir = dirPath) {
  let results = [];
  if (!fs.existsSync(dirPath)) return results;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, baseDir));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        const relativePath = path.relative(baseDir, fullPath);
        results.push(relativePath);
      } else {
        console.log(`Skipping unsupported file: ${entry.name}`);
      }
    }
  }
  return results;
}

// ─── Step 1 & 2: Compress Image to Memory Buffer ─────────────────────────────
async function compressToBuffer(inputPath) {
  const originalBuffer = fs.readFileSync(inputPath);
  const originalSize = originalBuffer.length;

  const compressedBuffer = await sharp(originalBuffer)
    .webp({
      quality: WEBP_QUALITY,
      effort: WEBP_EFFORT,
    })
    .toBuffer();

  const compressedSize = compressedBuffer.length;
  const savedBytes = originalSize - compressedSize;
  const compressionPercentage = originalSize > 0 
    ? Math.max(0, Math.round((savedBytes / originalSize) * 100))
    : 0;

  return {
    buffer: compressedBuffer,
    originalSize,
    compressedSize,
    compressionPercentage,
  };
}

// ─── Step 3: Upload Buffer Directly to Supabase Storage ──────────────────────
async function uploadBufferToSupabase(buffer, storagePath) {
  if (!supabase) {
    throw new Error("Supabase client is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in your env files");
  }

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

// ─── Step 4: Get Public URL from Supabase ────────────────────────────────────
function getPublicUrl(storagePath) {
  const safeKey = getSafeStorageKey(storagePath);
  if (!supabase) {
    return `${supabaseUrl || "https://YOUR_PROJECT.supabase.co"}/storage/v1/object/public/${BUCKET_NAME}/${safeKey}`;
  }

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(safeKey);

  return data.publicUrl;
}

// ─── Save Document in Firebase Firestore ─────────────────────────────────────
async function saveToFirestore(docId, data) {
  if (!db) return false;
  try {
    const docRef = db.collection(FIRESTORE_COLLECTION).doc(docId);
    const payload = {
      ...data,
      uploadedAt: FieldValue.serverTimestamp(),
    };
    await docRef.set(payload, { merge: true });
    return true;
  } catch (err) {
    return false;
  }
}

// ─── Main Pipeline Loop ──────────────────────────────────────────────────────
async function processImages() {
  const startTime = Date.now();

  console.log("==================================================");
  console.log("🚀 Starting In-Memory Image Pipeline & Metadata Generator");
  console.log("==================================================\n");

  if (!fs.existsSync(inputFolder)) {
    console.error(`❌ Input folder "${inputFolder}" does not exist.`);
    console.log("Please create the photos/ folder and add images to process.");
    process.exit(1);
  }

  if (!supabase) {
    console.warn("⚠️  Supabase credentials missing in env files. Uploads will be simulated.");
  }

  const relativeFilePaths = getFilesRecursively(inputFolder);
  const totalFound = relativeFilePaths.length;

  console.log(`📁 Found ${totalFound} image(s) in "${inputFolder}"\n`);
  console.log("--------------------------------------------------\n");

  let metadataList = [];
  const metadataPath = path.resolve(process.cwd(), METADATA_FILE);
  if (fs.existsSync(metadataPath)) {
    try {
      metadataList = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
      console.log(`Loaded ${metadataList.length} existing metadata items from ${METADATA_FILE}`);
    } catch (err) {
      console.warn(`⚠️ Error reading existing metadata file: ${err.message}. Starting fresh.`);
    }
  }

  let stats = {
    totalFound,
    compressedSuccess: 0,
    compressedFailed: 0,
    uploadSuccess: 0,
    uploadFailed: 0,
    totalOriginalSize: 0,
    totalCompressedSize: 0,
  };

  let nextId = metadataList.length > 0 ? Math.max(...metadataList.map(item => item.id)) + 1 : 1;

  for (let i = 0; i < relativeFilePaths.length; i++) {
    const relPath = relativeFilePaths[i];
    const inputPath = path.join(inputFolder, relPath);
    const ext = path.extname(relPath);
    const originalFileName = path.basename(relPath);
    
    // Check if already processed
    const isAlreadyProcessed = metadataList.some(item => item.originalFileName === originalFileName);
    if (isAlreadyProcessed) {
      console.log(`Skipping already processed file [${i + 1}/${totalFound}]: ${originalFileName}\n`);
      console.log("--------------------------------------------------\n");
      continue;
    }

    const title = path.basename(relPath, ext).replace(/\u00A0/g, " ").normalize("NFC");
    const uploadedFileName = title + ".webp";
    const targetRelPath = path.join(path.dirname(relPath), uploadedFileName);
    const docId = title;
    const itemId = nextId++;

    console.log(`Processing [${i + 1}/${totalFound}]:`);
    console.log(`${originalFileName} ➔ ${uploadedFileName}\n`);

    let compressionRes = null;
    let publicUrl = "";
    let isUploaded = false;

    // ─── 1. Compress in memory ──────────────────────────────────────────────
    try {
      compressionRes = await compressToBuffer(inputPath);
      stats.compressedSuccess++;
      stats.totalOriginalSize += compressionRes.originalSize;
      stats.totalCompressedSize += compressionRes.compressedSize;

      const savedBytes = compressionRes.originalSize - compressionRes.compressedSize;

      console.log(`Original Size:`);
      console.log(`${formatBytes(compressionRes.originalSize)}`);
      console.log(`Compressed Size (Memory Buffer):`);
      console.log(`${formatBytes(compressionRes.compressedSize)}`);
      console.log(`Compression Saved:`);
      console.log(`${compressionRes.compressionPercentage}% (${savedBytes} bytes)\n`);

    } catch (err) {
      stats.compressedFailed++;
      console.error(`❌ Compression Failed for ${originalFileName}: ${err.message}\n`);
      console.log("--------------------------------------------------\n");
      continue;
    }

    // ─── 2. Upload Buffer Directly to Supabase ──────────────────────────────
    try {
      await uploadBufferToSupabase(compressionRes.buffer, targetRelPath);
      publicUrl = getPublicUrl(targetRelPath);
      stats.uploadSuccess++;
      isUploaded = true;

      console.log(`Supabase Upload Status:`);
      console.log(`Success\n`);
      console.log(`Public URL:`);
      console.log(`${publicUrl}\n`);

    } catch (err) {
      stats.uploadFailed++;
      publicUrl = getPublicUrl(targetRelPath);
      console.log(`Supabase Upload Status:`);
      console.log(`Failed (${err.message})\n`);
    }

    // ─── 3. Save to Firestore Optional ──────────────────────────────────────
    await saveToFirestore(docId, {
      fileName: uploadedFileName,
      imageUrl: publicUrl,
      storageProvider: "Supabase",
      bucket: BUCKET_NAME,
      originalSize: compressionRes.originalSize,
      compressedSize: compressionRes.compressedSize,
      compressionPercentage: compressionRes.compressionPercentage,
    });

    // ─── 4. Build Metadata Item ─────────────────────────────────────────────
    const metadataItem = {
      id: itemId,
      title: title,
      originalFileName: originalFileName,
      uploadedFileName: uploadedFileName,
      bucket: BUCKET_NAME,
      path: targetRelPath.replace(/\\/g, "/"),
      publicUrl: publicUrl,
      uploaded: isUploaded,
    };

    metadataList.push(metadataItem);
    console.log("--------------------------------------------------\n");
  }

  // ─── Save image-metadata.json ──────────────────────────────────────────────
  fs.writeFileSync(metadataPath, JSON.stringify(metadataList, null, 2), "utf-8");
  console.log(`📄 Saved metadata JSON file to: ${metadataPath}\n`);

  // ─── Final Summary Report ──────────────────────────────────────────────────
  const durationMs = Date.now() - startTime;
  const durationSeconds = (durationMs / 1000).toFixed(2);
  const totalSavedBytes = stats.totalOriginalSize - stats.totalCompressedSize;
  const totalSavedPct = stats.totalOriginalSize > 0
    ? Math.round((totalSavedBytes / stats.totalOriginalSize) * 100)
    : 0;

  console.log("==================================================");
  console.log("📊 PIPELINE SUMMARY REPORT");
  console.log("==================================================");
  console.log(`• Total images found:       ${stats.totalFound}`);
  console.log(`• Successfully compressed:  ${stats.compressedSuccess}`);
  console.log(`• Successfully uploaded:    ${stats.uploadSuccess}`);
  console.log(`• Metadata records:        ${metadataList.length}`);
  console.log(`--------------------------------------------------`);
  console.log(`• Failed compressions:     ${stats.compressedFailed}`);
  console.log(`• Failed uploads:          ${stats.uploadFailed}`);
  console.log(`--------------------------------------------------`);
  console.log(`• Total Original Size:     ${formatBytes(stats.totalOriginalSize)}`);
  console.log(`• Total Compressed Size:   ${formatBytes(stats.totalCompressedSize)}`);
  console.log(`• Total Storage Saved:     ${formatBytes(totalSavedBytes)} (${totalSavedPct}%)`);
  console.log(`• Output JSON File:        ${METADATA_FILE}`);
  console.log(`• Total Execution Time:    ${durationSeconds} seconds (${durationMs} ms)`);
  console.log("==================================================\n");
}

processImages().catch((err) => {
  console.error("❌ Critical Pipeline Error:", err);
  process.exit(1);
});
