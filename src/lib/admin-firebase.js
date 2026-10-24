/**
 * Shared Firebase Admin SDK initialization and admin auth verification.
 * Used by admin API routes to avoid code duplication.
 *
 * IMPORTANT:
 * - This file must only be imported from Node.js server code (app/api/admin/*).
 * - Keep "firebase-admin" listed in `serverExternalPackages` in next.config.mjs
 *   so Next.js does not bundle it. firebase-admin pulls in jose (via jwks-rsa),
 *   which is pure ESM; bundling it into a CJS serverless function causes
 *   ERR_REQUIRE_ESM at runtime. Externalizing it lets Node's native
 *   require()/import() handle the ESM boundary.
 * - Route handlers must declare `export const runtime = "nodejs"` (firebase-admin
 *   cannot run on the Edge runtime).
 */

import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import * as admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const COLLECTION_NAME = "youworship_songs";

// Singleton cache. globalThis survives hot reloads and repeated imports so the
// Admin SDK is never initialized more than once per serverless instance.
const globalRef = typeof globalThis !== "undefined" ? globalThis : {};

/**
 * Initialize Firebase Admin SDK (singleton pattern).
 * Returns the Firestore instance. Safe to call multiple times.
 */
export function getFirebaseAdmin() {
  if (globalRef.__firebaseAdminDb) return globalRef.__firebaseAdminDb;

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Vercel/most hosts store the key with literal "\n" sequences (backslash + n)
    // instead of real newlines. Convert those back into real newlines.
    // Also strip a single pair of wrapping double quotes, which some dashboards
    // add automatically when you paste a multi-line-looking value.
    privateKey = privateKey.trim();
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, "\n").trim();

    // Some env exports lose the PEM header/footer markers. Re-wrap the raw key
    // body so the Admin SDK still receives a valid PEM string.
    if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      privateKey = "-----BEGIN PRIVATE KEY-----\n" + privateKey;
    }
    if (!privateKey.includes("-----END PRIVATE KEY-----")) {
      privateKey = privateKey + "\n-----END PRIVATE KEY-----";
    }
  }

  // Singleton guard: never call initializeApp() more than once.
  if (admin.getApps().length === 0) {
    if (projectId && clientEmail && privateKey) {
      // Fail fast with a clear message if the key clearly isn't a real PEM key,
      // instead of letting OpenSSL throw an opaque ERR_OSSL_UNSUPPORTED later.
      if (
        !privateKey.includes("-----BEGIN PRIVATE KEY-----") ||
        !privateKey.includes("-----END PRIVATE KEY-----")
      ) {
        throw new Error(
          "FIREBASE_PRIVATE_KEY does not look like a valid PEM private key " +
            "(missing -----BEGIN/END PRIVATE KEY----- markers). " +
            "Re-copy the 'private_key' field from your Firebase service account JSON " +
            "exactly as-is into the environment variable.",
        );
      }

      try {
        admin.initializeApp({
          credential: admin.cert({ projectId, clientEmail, privateKey }),
        });
      } catch (certError) {
        console.error(
          "Firebase Admin initialization with cert failed:",
          certError,
        );
        throw new Error(
          `Firebase Admin cert initialization failed: ${certError.message}. ` +
            "Please verify your environment credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).",
        );
      }
    } else {
      const missing = [];
      if (!projectId)
        missing.push("FIREBASE_PROJECT_ID / NEXT_PUBLIC_FIREBASE_PROJECT_ID");
      if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
      if (!privateKey) missing.push("FIREBASE_PRIVATE_KEY");
      throw new Error(
        "Firebase Admin credentials are not fully configured. " +
          `Missing environment variables: ${missing.join(", ")}. ` +
          "Please check your hosting provider's dashboard and set these values.",
      );
    }
  }

  console.log(
    `[Firebase Admin] initialized (project: ${projectId || "default"}, ` +
      `cert: ${Boolean(projectId && clientEmail && privateKey)})`,
  );

  const db = getFirestore();
  db.settings({ preferRest: true });

  globalRef.__firebaseAdminDb = db;
  return db;
}

/**
 * Returns the cached Firebase Auth singleton (initialized exactly once).
 */
export function getAdminAuth() {
  if (!globalRef.__firebaseAdminAuth) {
    getFirebaseAdmin(); // ensure the app is initialized before accessing Auth
    globalRef.__firebaseAdminAuth = getAuth();
  }
  return globalRef.__firebaseAdminAuth;
}

/**
 * Verifies the Firebase ID token from the Authorization header
 * and checks if the user has admin privileges.
 */
export async function verifyAdminAuth(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      authorized: false,
      error: "Missing or invalid authorization header",
    };
  }

  try {
    const idToken = authHeader.split("Bearer ")[1];
    // Auth verification happens before any Firestore access; a failure here is
    // an auth problem (or token invalid), never a Firestore data problem.
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);

    const email = decodedToken.email || "";
    const db = getFirebaseAdmin();
    const userDocRef = db.collection("Youworship_users").doc(decodedToken.uid);
    const userDoc = await userDocRef.get();
    const userData = userDoc.exists ? userDoc.data() : null;

    const isAdmin =
      email === "alsaikumar22@gmail.com" ||
      email === "control@youworship.world" ||
      email.endsWith("@youworship.admin") ||
      userData?.role === "admin" ||
      decodedToken.admin === true;

    if (!isAdmin) {
      return {
        authorized: false,
        error: "User does not have admin privileges",
      };
    }

    return { authorized: true, uid: decodedToken.uid, email };
  } catch (error) {
    console.error("Auth verification error:", error);
    return { authorized: false, error: "Failed to verify authentication" };
  }
}

/**
 * Generate a consistent document ID: title-artistName
 * Spaces are replaced with hyphens, Unicode characters preserved.
 */
export function generateSongId(title, artistName) {
  // Use song title only, replace spaces and slashes with hyphens to ensure it is route-safe
  return (title || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[\/\\]/g, "-");
}

export { admin, COLLECTION_NAME, FieldValue };
