import { songService } from "@/services/songService";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { id: rawId } = await params;

    let targetId = rawId;
    try {
      targetId = decodeURIComponent(rawId);
    } catch (e) {
      targetId = rawId;
    }

    let song = await songService.getSongById(targetId);
    if (!song && targetId !== rawId) {
      song = await songService.getSongById(rawId);
    }

    if (!song) {
      return Response.json({ error: "Song not found" }, { status: 404 });
    }

    return Response.json({ song });
  } catch (error) {
    console.error(`GET /api/songs error:`, error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
