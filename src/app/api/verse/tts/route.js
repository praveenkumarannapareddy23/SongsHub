import { NextResponse } from "next/server";

function splitTextIntoChunks(text, maxLength = 180) {
  if (!text || text.length <= maxLength) return [text];

  const chunks = [];
  // Split on sentence boundaries and punctuation: . ; , \n — ? !
  const parts = text.split(/([.;,\n—?!]+)/);
  let current = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if ((current + part).length <= maxLength) {
      current += part;
    } else {
      if (current.trim()) chunks.push(current.trim());
      current = part;
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.filter(Boolean);
}

async function fetchGoogleTTS(chunk, lang = "te") {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Google TTS status ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text") || "";
    const lang = searchParams.get("lang") || "te";

    if (!text.trim()) {
      return NextResponse.json({ error: "Missing text parameter" }, { status: 400 });
    }

    const chunks = splitTextIntoChunks(text, 180);
    const audioBuffers = await Promise.all(
      chunks.map((chunk) => fetchGoogleTTS(chunk, lang))
    );

    const combinedBuffer = Buffer.concat(audioBuffers);

    return new Response(combinedBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": combinedBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
      },
    });
  } catch (err) {
    console.error("Verse TTS API Error:", err.message);
    return NextResponse.json({ error: "Failed to generate TTS audio" }, { status: 500 });
  }
}
