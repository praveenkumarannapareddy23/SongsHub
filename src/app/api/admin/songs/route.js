import { NextResponse } from "next/server";
import {
  getFirebaseAdmin,
  verifyAdminAuth,
  COLLECTION_NAME,
  generateSongId,
  FieldValue,
} from "@/lib/admin-firebase";
import { songService } from "@/services/songService";

// firebase-admin requires Node.js APIs (crypto, net) and must NOT run on the
// Edge runtime. Explicitly opt into the Node.js runtime.
export const runtime = "nodejs";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/songs
 * List all songs from the youworship_songs collection.
 */
export async function GET(request) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const db = getFirebaseAdmin();
    const songsRef = db.collection(COLLECTION_NAME);
    const snapshot = await songsRef.get();

    const songs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort alphabetically in-memory to avoid needing a composite Firestore index
    songs.sort((a, b) =>
      (a.title || "").localeCompare(b.title || "", undefined, {
        sensitivity: "base",
      }),
    );

    return NextResponse.json({ songs });
  } catch (error) {
    console.error("Error listing songs:", error);
    return NextResponse.json(
      { error: error.stack || error.message || "Failed to list songs." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/songs
 * Create a new song in the youworship_songs collection.
 * Document ID is auto-generated as title-artistName.
 */
export async function POST(request) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();

    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { error: "Song title is required." },
        { status: 400 },
      );
    }

    const db = getFirebaseAdmin();

    let artistName = "Unknown Artist";
    let artistNameEnglish = "";
    let artistId = null;
    if (typeof body.artist === "object" && body.artist !== null) {
      artistName = body.artist.name?.trim() || "Unknown Artist";
      artistNameEnglish = body.artist.nameEnglish?.trim() || "";
      artistId = body.artist.id || null;
    } else if (typeof body.artist === "string" && body.artist.trim()) {
      artistName = body.artist.trim();
    }

    // Generate custom document ID: title-artistName
    const customId = generateSongId(body.title, artistName);

    // Convert lyrics if it is a string
    let inputLyrics = [];
    if (Array.isArray(body.lyrics)) {
      inputLyrics = body.lyrics;
    } else if (typeof body.lyrics === "string" && body.lyrics.trim()) {
      inputLyrics = [
        {
          language: "te",
          format: "original",
          title: "తెలుగు",
          content: body.lyrics.trim(),
          isDefault: true,
        },
      ];
      if (
        body.englishLyrics &&
        typeof body.englishLyrics === "string" &&
        body.englishLyrics.trim()
      ) {
        inputLyrics.push({
          language: "en",
          format: "transliteration",
          title: "Romanized",
          content: body.englishLyrics.trim(),
        });
      }
    }

    const songsRef = db.collection(COLLECTION_NAME);

    // Check if a song with this ID already exists
    const existingDoc = await songsRef.doc(customId).get();
    if (existingDoc.exists) {
      const existingData = existingDoc.data() || {};
      const existingLyrics = Array.isArray(existingData.lyrics)
        ? existingData.lyrics
        : [];

      // Merge lyrics arrays by matching language
      const lyricsMap = {};
      existingLyrics.forEach((l) => {
        if (l && l.language) lyricsMap[l.language] = l;
      });
      inputLyrics.forEach((l) => {
        if (l && l.language) lyricsMap[l.language] = l;
      });
      const mergedLyrics = Object.values(lyricsMap);

      // Ensure that at least one lyric block is set as default
      if (mergedLyrics.length > 0 && !mergedLyrics.some((l) => l.isDefault)) {
        mergedLyrics[0].isDefault = true;
      }

      // Merge categories, tags, and media
      const mergedCategories = Array.from(
        new Set([
          ...(Array.isArray(body.category)
            ? body.category
            : body.category
              ? [body.category]
              : []),
          ...(Array.isArray(existingData.category)
            ? existingData.category
            : existingData.category
              ? [existingData.category]
              : []),
        ]),
      );

      const mergedTags = Array.from(
        new Set([
          ...(Array.isArray(body.tags) ? body.tags : []),
          ...(Array.isArray(existingData.tags) ? existingData.tags : []),
        ]),
      );

      const updateData = {
        title: body.title.trim(),
        titleEnglish: body.titleEnglish
          ? body.titleEnglish.trim()
          : existingData.titleEnglish || "",
        artist: {
          id: artistId,
          name: artistName,
          nameEnglish:
            artistNameEnglish || existingData.artist?.nameEnglish || "",
        },
        language: body.language || existingData.language || "te",
        category: mergedCategories,
        album:
          body.album !== undefined ? body.album : existingData.album || null,
        year:
          typeof body.year === "number"
            ? body.year
            : existingData.year || new Date().getFullYear(),
        duration:
          typeof body.duration === "number"
            ? body.duration
            : existingData.duration || null,
        tags: mergedTags,
        lyrics: mergedLyrics,
        media: {
          image:
            body.media?.image ||
            body.imageUrl ||
            existingData.media?.image ||
            existingData.imageUrl ||
            "",
          audio:
            body.media?.audio ||
            body.audioUrl ||
            existingData.media?.audio ||
            existingData.audioUrl ||
            "",
          video:
            body.media?.video ||
            body.videoUrl ||
            existingData.media?.video ||
            existingData.videoUrl ||
            "",
        },
        updatedBy: auth.uid,
        updatedAt: FieldValue.serverTimestamp(),
      };

      await songsRef.doc(customId).update(updateData);

      return NextResponse.json(
        { success: true, id: customId, message: "Song updated successfully." },
        { status: 200 },
      );
    }

    const songData = {
      id: customId,
      title: body.title.trim(),
      titleEnglish: body.titleEnglish ? body.titleEnglish.trim() : "",
      slug: customId,
      artist: {
        id: artistId,
        name: artistName,
        nameEnglish: artistNameEnglish,
      },
      language: body.language || "te",
      category: Array.isArray(body.category)
        ? body.category
        : body.category
          ? [body.category]
          : [],
      album: body.album || null,
      year:
        typeof body.year === "number" ? body.year : new Date().getFullYear(),
      duration: typeof body.duration === "number" ? body.duration : null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      lyrics: inputLyrics,
      media: body.media || { image: "", audio: "", video: "" },
      createdBy: auth.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await songsRef.doc(customId).set(songData);

    songService.invalidateCache();

    return NextResponse.json(
      { success: true, id: customId, message: "Song added successfully." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error adding song:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add song." },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/admin/songs
 * Update an existing song. The document ID must be passed via the `id` query parameter.
 */
export async function PUT(request) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Song ID is required." },
        { status: 400 },
      );
    }

    const body = await request.json();

    const db = getFirebaseAdmin();
    const songRef = db.collection(COLLECTION_NAME).doc(id);

    const existing = await songRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Song not found." }, { status: 404 });
    }

    const existingData = existing.data();
    const updateData = {};

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.titleEnglish !== undefined)
      updateData.titleEnglish = body.titleEnglish.trim();

    // Update artist info
    if (body.artist !== undefined) {
      let artistName = "Unknown Artist";
      let artistNameEnglish = "";
      let artistId = null;
      if (typeof body.artist === "object" && body.artist !== null) {
        artistName = body.artist.name?.trim() || "Unknown Artist";
        artistNameEnglish = body.artist.nameEnglish?.trim() || "";
        artistId = body.artist.id || null;
      } else if (typeof body.artist === "string" && body.artist.trim()) {
        artistName = body.artist.trim();
      }
      updateData.artist = {
        id: artistId,
        name: artistName,
        nameEnglish: artistNameEnglish,
      };
    }

    if (body.language !== undefined) updateData.language = body.language;
    if (body.category !== undefined) {
      updateData.category = Array.isArray(body.category)
        ? body.category
        : body.category
          ? [body.category]
          : [];
    }
    if (body.album !== undefined) updateData.album = body.album;
    if (body.year !== undefined) updateData.year = body.year;
    if (body.duration !== undefined) {
      updateData.duration =
        typeof body.duration === "number" ? body.duration : null;
    }
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.lyrics !== undefined) {
      let finalLyrics = [];
      if (Array.isArray(body.lyrics)) {
        finalLyrics = body.lyrics;
      } else if (typeof body.lyrics === "string" && body.lyrics.trim()) {
        finalLyrics = [
          {
            language: "te",
            format: "original",
            title: "తెలుగు",
            content: body.lyrics.trim(),
            isDefault: true,
          },
        ];
        if (
          body.englishLyrics &&
          typeof body.englishLyrics === "string" &&
          body.englishLyrics.trim()
        ) {
          finalLyrics.push({
            language: "en",
            format: "transliteration",
            title: "Romanized",
            content: body.englishLyrics.trim(),
          });
        }
      }
      updateData.lyrics = finalLyrics;
    }
    if (body.media !== undefined) updateData.media = body.media;

    // Regenerate slug/id if title or artist name changed
    const title = updateData.title ?? existingData.title;
    const artistName =
      updateData.artist?.name ?? existingData.artist?.name ?? "Unknown Artist";
    const newId = generateSongId(title, artistName);
    updateData.id = newId;
    updateData.slug = newId;

    updateData.updatedBy = auth.uid;
    updateData.updatedAt = FieldValue.serverTimestamp();

    if (newId !== id) {
      // Check if new document already exists to avoid conflict
      const newDocRef = db.collection(COLLECTION_NAME).doc(newId);
      const newDoc = await newDocRef.get();
      if (newDoc.exists) {
        return NextResponse.json(
          { error: "A song with this title and artist name already exists." },
          { status: 400 },
        );
      }

      // Merge and write new document, then delete old document
      const fullData = {
        ...existingData,
        ...updateData,
      };
      await newDocRef.set(fullData);
      await songRef.delete();
    } else {
      await songRef.update(updateData);
    }

    songService.invalidateCache();

    return NextResponse.json({
      success: true,
      id: newId,
      message: "Song updated successfully.",
    });
  } catch (error) {
    console.error("Error updating song:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to update song.",
        code: error.code || "unknown",
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/songs
 * Delete a song. The document ID must be passed via the `id` query parameter.
 */
export async function DELETE(request) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Song ID is required." },
        { status: 400 },
      );
    }

    const db = getFirebaseAdmin();
    const songRef = db.collection(COLLECTION_NAME).doc(id);

    const existing = await songRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Song not found." }, { status: 404 });
    }

    await songRef.delete();

    songService.invalidateCache();

    return NextResponse.json({
      success: true,
      id,
      message: "Song deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting song:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to delete song.",
        code: error.code || "unknown",
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}
