import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
  arrayUnion,
} from "firebase/firestore";

/**
 * Get user document from Firestore, creating one if it doesn't exist.
 * Also saves/updates the user's auth profile (email, displayName, photoURL).
 */
async function getUserDoc(uid, userProfile = null) {
  const ref = doc(db, "Youworship_users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // Create a brand new document with defaults + profile info
    const defaultData = {
      uid: uid,
      role: "user",
      favorites: [],
      playlists: [],
      recentlyPlayed: [],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      ...(userProfile
        ? {
            email: userProfile.email || null,
            displayName: userProfile.displayName || null,
            photoURL: userProfile.photoURL || null,
            provider: userProfile.provider || null,
          }
        : {}),
    };
    await setDoc(ref, defaultData);
    return defaultData;
  }

  // Document already exists — still sync the latest profile info
  if (userProfile) {
    await setDoc(
      ref,
      {
        email: userProfile.email || null,
        displayName: userProfile.displayName || null,
        photoURL: userProfile.photoURL || null,
        lastLogin: new Date().toISOString(),
      },
      { merge: true }
    );
    // Re-read so returned data includes the freshly-saved profile
    const updatedSnap = await getDoc(ref);
    return updatedSnap.data();
  }

  return snap.data();
}

/**
 * Fetch all user data from Firestore.
 * Optionally pass userProfile { email, displayName, photoURL } to save auth info.
 */
export async function fetchUserData(uid, userProfile = null) {
  if (!uid) return null;
  try {
    return await getUserDoc(uid, userProfile);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

/**
 * Save user login data to Firestore (provider, timestamps).
 */
export async function saveUserLoginData(uid, loginData) {
  if (!uid) return;
  try {
    const ref = doc(db, "Youworship_users", uid);
    await setDoc(
      ref,
      {
        email: loginData.email || null,
        displayName: loginData.displayName || null,
        photoURL: loginData.photoURL || null,
        provider: loginData.provider || "unknown",
        lastLogin: loginData.lastLogin || new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error saving login data:", error);
  }
}

/**
 * Update favorites list in Firestore.
 */
export async function updateFavorites(uid, favorites) {
  if (!uid) return;
  try {
    await setDoc(doc(db, "Youworship_users", uid), { favorites }, { merge: true });
  } catch (error) {
    console.error("Error updating favorites:", error);
  }
}

/**
 * Update legacy playlists in user doc in Firestore (backward compatibility).
 */
export async function updatePlaylists(uid, playlists) {
  if (!uid) return;
  try {
    await setDoc(doc(db, "Youworship_users", uid), { playlists }, { merge: true });
  } catch (error) {
    console.error("Error updating playlists:", error);
  }
}

/**
 * Update recently played list in Firestore.
 */
export async function updateRecentlyPlayed(uid, recentlyPlayed) {
  if (!uid) return;
  try {
    await setDoc(doc(db, "Youworship_users", uid), { recentlyPlayed }, { merge: true });
  } catch (error) {
    console.error("Error updating recently played:", error);
  }
}

/**
 * Batch save all user data at once (favorites + playlists + recently).
 */
export async function saveUserData(uid, { favorites, playlists, recentlyPlayed }) {
  if (!uid) return;
  try {
    await setDoc(
      doc(db, "Youworship_users", uid),
      {
        favorites,
        playlists,
        recentlyPlayed,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error saving user data:", error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Collaborative Playlists (Top-Level Collection: /playlists/{id})
// ═══════════════════════════════════════════════════════════════════

/**
 * Fetch all playlists owned by user or where user is a collaborator.
 */
export async function fetchUserPlaylists(uid) {
  if (!uid) return [];
  try {
    const playlistsRef = collection(db, "playlists");
    
    // 1. Playlists owned by user
    const ownerQuery = query(playlistsRef, where("ownerId", "==", uid));
    const ownerSnap = await getDocs(ownerQuery);

    // 2. Playlists where user is listed in collaboratorUids
    const collabQuery = query(playlistsRef, where("collaboratorUids", "array-contains", uid));
    const collabSnap = await getDocs(collabQuery);

    const playlistMap = new Map();

    ownerSnap.forEach((docSnap) => {
      playlistMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
    });

    collabSnap.forEach((docSnap) => {
      playlistMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
    });

    return Array.from(playlistMap.values());
  } catch (error) {
    console.error("Error fetching user playlists:", error);
    return [];
  }
}

/**
 * Fetch a single playlist document by ID.
 */
export async function getPlaylistById(playlistId) {
  if (!playlistId) return null;
  try {
    const ref = doc(db, "playlists", playlistId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error("Error getting playlist by ID:", error);
    return null;
  }
}

/**
 * Create a new collaborative playlist in top-level collection.
 */
export async function createPlaylistDoc(playlistData) {
  try {
    const playlistId = playlistData.id || `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ref = doc(db, "playlists", playlistId);
    const docData = {
      id: playlistId,
      ownerId: playlistData.ownerId,
      ownerName: playlistData.ownerName || "Anonymous",
      name: playlistData.name || "Untitled Playlist",
      description: playlistData.description || "",
      songIds: playlistData.songIds || [],
      songAddedBy: playlistData.songAddedBy || {},
      collaborators: playlistData.collaborators || {},
      collaboratorUids: playlistData.collaboratorUids || [],
      linkDefaultRole: playlistData.linkDefaultRole || "editor",
      createdAt: playlistData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(ref, docData);
    return docData;
  } catch (error) {
    console.error("Error creating playlist doc:", error);
    throw error;
  }
}

/**
 * Update an existing collaborative playlist.
 */
export async function updatePlaylistDoc(playlistId, updates) {
  if (!playlistId) return;
  try {
    const ref = doc(db, "playlists", playlistId);
    await setDoc(
      ref,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating playlist doc:", error);
    throw error;
  }
}

/**
 * Delete a collaborative playlist doc.
 */
export async function deletePlaylistDoc(playlistId) {
  if (!playlistId) return;
  try {
    const ref = doc(db, "playlists", playlistId);
    await deleteDoc(ref);
  } catch (error) {
    console.error("Error deleting playlist doc:", error);
    throw error;
  }
}

/**
 * Join a collaborative playlist as a collaborator.
 */
export async function joinPlaylistDoc(playlistId, user, role = "editor") {
  if (!playlistId || !user?.uid) return null;
  try {
    const ref = doc(db, "playlists", playlistId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const currentData = snap.data();
    if (currentData.ownerId === user.uid) {
      return { id: snap.id, ...currentData };
    }

    const assignedRole = currentData.linkDefaultRole || role || "editor";
    const collaboratorEntry = {
      role: assignedRole,
      name: user.displayName || user.email?.split("@")[0] || "Team Member",
      email: user.email || null,
      photoURL: user.photoURL || null,
      joinedAt: new Date().toISOString(),
    };

    await updateDoc(ref, {
      [`collaborators.${user.uid}`]: collaboratorEntry,
      collaboratorUids: arrayUnion(user.uid),
      updatedAt: new Date().toISOString(),
    });

    const updatedSnap = await getDoc(ref);
    return { id: updatedSnap.id, ...updatedSnap.data() };
  } catch (error) {
    console.error("Error joining playlist:", error);
    throw error;
  }
}

/**
 * Real-time subscription to a single playlist document.
 */
export function subscribeToPlaylist(playlistId, onUpdate, onError) {
  if (!playlistId) return () => {};
  const ref = doc(db, "playlists", playlistId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
      } else {
        onUpdate({ id: snap.id, ...snap.data() });
      }
    },
    (err) => {
      console.debug("Playlist subscription error:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Migrate legacy single-user playlists to top-level collection.
 */
export async function migrateLegacyPlaylists(uid, legacyPlaylists, userProfile = null) {
  if (!uid || !Array.isArray(legacyPlaylists) || legacyPlaylists.length === 0) return [];
  try {
    const migrated = [];
    for (const pl of legacyPlaylists) {
      if (!pl.id) continue;
      const ref = doc(db, "playlists", pl.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        const ownerName = userProfile?.displayName || userProfile?.email?.split("@")[0] || "You";
        const songAddedBy = {};
        (pl.songIds || []).forEach((songId) => {
          songAddedBy[songId] = {
            userId: uid,
            name: ownerName,
            addedAt: pl.createdAt || new Date().toISOString(),
          };
        });

        const docData = {
          id: pl.id,
          ownerId: uid,
          ownerName: ownerName,
          name: pl.name || "Untitled Playlist",
          description: pl.description || "",
          songIds: pl.songIds || [],
          songAddedBy: songAddedBy,
          collaborators: {},
          collaboratorUids: [],
          linkDefaultRole: "editor",
          createdAt: pl.createdAt || new Date().toISOString(),
          updatedAt: pl.updatedAt || new Date().toISOString(),
        };
        await setDoc(ref, docData);
        migrated.push(docData);
      } else {
        migrated.push({ id: snap.id, ...snap.data() });
      }
    }
    return migrated;
  } catch (error) {
    console.error("Error migrating legacy playlists:", error);
    return [];
  }
}

/**
 * Save song request to Firestore.
 */
export async function saveSongRequest(requestData) {
  try {
    const ref = collection(db, "Youworship_requests");
    await addDoc(ref, {
      ...requestData,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error saving song request:", error);
    throw error;
  }
}

/**
 * Save user feedback to Firestore.
 */
export async function saveFeedback(feedbackData) {
  try {
    const ref = collection(db, "Youworship_feedback");
    await addDoc(ref, {
      ...feedbackData,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error saving feedback:", error);
    throw error;
  }
}
