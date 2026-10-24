import { NextResponse } from "next/server";
import { getFirebaseAdmin, verifyAdminAuth, COLLECTION_NAME, generateSongId, FieldValue } from "@/lib/admin-firebase";
import { songService } from "@/services/songService";

// firebase-admin requires Node.js APIs (crypto, net) and must NOT run on the
// Edge runtime. Explicitly opt into the Node.js runtime.
export const runtime = "nodejs";

export const dynamic = "force-dynamic";

/**
 * PUT /api/admin/songs/[id]
 * Update an existing song by document ID.
 */
export async function PUT(request, { params }) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id: rawId } = await params;
    if (!rawId) {
      return NextResponse.json({ error: "Song ID is required." }, { status: 400 });
    }

    let id = rawId;
    try {
      id = decodeURIComponent(rawId);
    } catch (e) {
      id = rawId;
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
    if (body.titleEnglish !== undefined) updateData.titleEnglish = body.titleEnglish.trim();

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
      updateData.artist = { id: artistId, name: artistName, nameEnglish: artistNameEnglish };
    }

    if (body.language !== undefined) updateData.language = body.language;
    if (body.category !== undefined) {
      updateData.category = Array.isArray(body.category)
        ? body.category
        : (body.category ? [body.category] : []);
    }
    if (body.album !== undefined) updateData.album = body.album;
    if (body.year !== undefined) updateData.year = body.year;
    if (body.duration !== undefined) {
      updateData.duration = typeof body.duration === "number" ? body.duration : null;
    }
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.lyrics !== undefined) {
      let finalLyrics = [];
      if (Array.isArray(body.lyrics)) {
        finalLyrics = body.lyrics;
      } else if (typeof body.lyrics === "string" && body.lyrics.trim()) {
        finalLyrics = [
          { language: "te", format: "original", title: "తెలుగు", content: body.lyrics.trim(), isDefault: true }
        ];
        if (body.englishLyrics && typeof body.englishLyrics === "string" && body.englishLyrics.trim()) {
          finalLyrics.push({
            language: "en",
            format: "transliteration",
            title: "Romanized",
            content: body.englishLyrics.trim()
          });
        }
      }
      updateData.lyrics = finalLyrics;
    }
    if (body.media !== undefined) updateData.media = body.media;


    // Regenerate slug/id if title or artist name changed
    const title = updateData.title ?? existingData.title;
    const artistName = updateData.artist?.name ?? existingData.artist?.name ?? "Unknown Artist";
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
          { status: 400 }
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
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/songs/[id]
 * Delete a song by document ID.
 */
export async function DELETE(request, { params }) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id: rawId } = await params;
    if (!rawId) {
      return NextResponse.json({ error: "Song ID is required." }, { status: 400 });
    }

    let id = rawId;
    try {
      id = decodeURIComponent(rawId);
    } catch (e) {
      id = rawId;
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
    console.error("Error deleting song:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete song." },
      { status: 500 }
    );
  }
}
