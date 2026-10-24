import React, { Suspense } from "react";
import { songService } from "@/services/songService";
import { SongPageSkeleton } from "@/components/ui/SongSkeleton";
import SongPageClient from "./SongPageClient";

export const revalidate = 86400; // Cache on server for 24 hours, regenerate in background

function formatDurationToIso(durationSec) {
  if (!durationSec || isNaN(durationSec)) return "PT4M00S";
  const m = Math.floor(durationSec / 60);
  const s = Math.floor(durationSec % 60);
  return `PT${m}M${s}S`;
}

function extractLyricsText(song) {
  if (!song) return "";
  let text = "";
  if (song.lyricsTelugu) {
    text += Array.isArray(song.lyricsTelugu) ? song.lyricsTelugu.join("\n") : song.lyricsTelugu;
  }
  if (song.lyricsEnglish) {
    text += "\n\n" + (Array.isArray(song.lyricsEnglish) ? song.lyricsEnglish.join("\n") : song.lyricsEnglish);
  }
  if (!text && Array.isArray(song.lyrics)) {
    text = song.lyrics.map(l => l.content || l.text || "").join("\n\n");
  }
  return text.trim();
}

/**
 * Dynamic SEO Metadata generation for Google Search & social cards
 */
export async function generateMetadata({ params }) {
  const unwrappedParams = await params;
  const rawId = unwrappedParams?.id || "";
  let decodedId = rawId;
  try {
    decodedId = decodeURIComponent(rawId);
  } catch (e) {
    decodedId = rawId;
  }

  let song = null;
  try {
    song = await songService.getSongById(decodedId);
  } catch (err) {
    console.error("Failed to load song metadata for SEO:", err);
  }

  if (!song) {
    return {
      title: "Christian Worship Songs & Lyrics | YouWorship",
      description: "Discover thousands of Telugu, English, and Hindi Christian worship songs with lyrics, chords, and audio.",
    };
  }

  const songTitle = song.teluguTitle || song.title || "Worship Song";
  const songTitleEnglish = song.titleEnglish && song.titleEnglish !== songTitle ? song.titleEnglish : "";
  const artistName = song.artistName || song.artist || "Unknown Artist";
  const songSlug = song.slug || song.id;

  const pageTitle = `Listen to ${songTitle}${songTitleEnglish ? ` (${songTitleEnglish})` : ""} | YouWorship`;
  const pageDescription = `Listen to "${songTitle}" by ${artistName} on YouWorship. Full Telugu lyrics, English romanized lyrics, audio stream, and chords for church and personal worship.`;
  const canonicalUrl = `https://youworship.world/song/${encodeURIComponent(songSlug)}`;
  const ogImage = song.imageUrl || song.coverUrl || "https://youworship.world/youworship-logo.png";

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      songTitle,
      songTitleEnglish,
      artistName,
      "YouWorship songs",
      "YouWorship",
      "Telugu Christian songs",
      "Christian worship songs",
      "Worship lyrics and chords",
      "Telugu worship songs audio",
      song.category || "Praise & Worship",
    ].filter(Boolean),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: "YouWorship",
      type: "music.song",
      images: [
        {
          url: ogImage,
          width: 512,
          height: 512,
          alt: `${songTitle} - YouWorship`,
        },
      ],
      audio: song.audioUrl || undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [ogImage],
    },
  };
}

export default async function SongPage({ params }) {
  const unwrappedParams = await params;
  const rawId = unwrappedParams?.id || "";
  let decodedId = rawId;
  try {
    decodedId = decodeURIComponent(rawId);
  } catch (e) {
    decodedId = rawId;
  }

  let song = null;
  try {
    song = await songService.getSongById(decodedId);
  } catch (err) {
    console.error("Failed to load song on server:", err);
  }

  const songTitle = song ? (song.teluguTitle || song.title) : "Worship Song";
  const songTitleEnglish = song?.titleEnglish && song?.titleEnglish !== songTitle ? song.titleEnglish : "";
  const artistName = song ? (song.artistName || song.artist || "Unknown Artist") : "Unknown Artist";
  const lyricsText = song ? extractLyricsText(song) : "";
  const durationIso = song ? formatDurationToIso(song.durationSec) : "PT4M00S";
  const songUrl = song ? `https://youworship.world/song/${encodeURIComponent(song.slug || song.id)}` : "https://youworship.world";

  // Google Schema.org JSON-LD Structured Data
  const jsonLd = song
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "MusicRecording",
            "@id": `${songUrl}#recording`,
            name: songTitle,
            alternateName: songTitleEnglish || undefined,
            url: songUrl,
            duration: durationIso,
            inLanguage: [song.language === "en" ? "en" : "te", "en"],
            genre: song.category || "Praise & Worship",
            image: song.imageUrl || "https://youworship.world/youworship-logo.png",
            byArtist: {
              "@type": "MusicGroup",
              name: artistName,
            },
            recordingOf: {
              "@type": "MusicComposition",
              name: songTitle,
              composer: {
                "@type": "Person",
                name: artistName,
              },
              lyrics: {
                "@type": "CreativeWork",
                text: lyricsText,
              },
            },
            ...(song.audioUrl
              ? {
                  audio: {
                    "@type": "AudioObject",
                    contentUrl: song.audioUrl,
                    encodingFormat: "audio/mpeg",
                  },
                }
              : {}),
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://youworship.world",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Catalog",
                item: "https://youworship.world/songs",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: songTitle,
                item: songUrl,
              },
            ],
          },
        ],
      }
    : null;

  return (
    <>
      {/* Schema.org JSON-LD Structured Data for Googlebot */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* Semantic Crawlable Content for Googlebot (Crawlers read full lyrics text even without executing JS) */}
      {song && (
        <article className="sr-only" aria-hidden="false">
          <h1>{songTitle} - YouWorship</h1>
          {songTitleEnglish && <h2>{songTitleEnglish}</h2>}
          <p>Artist: {artistName}</p>
          <p>Category: {song.category || "Praise & Worship"}</p>
          <section>
            <h3>Song Lyrics</h3>
            <pre>{lyricsText}</pre>
          </section>
        </article>
      )}

      {/* Interactive Client Player & Lyrics Viewer */}
      <Suspense fallback={<SongPageSkeleton />}>
        <SongPageClient params={params} initialSong={song} />
      </Suspense>
    </>
  );
}
