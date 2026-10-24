"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Music,
  Play,
  Loader2,
  AlertCircle,
  ChevronDown,
  Mic2,
  Plus,
} from "lucide-react";
import SongArtwork from "@/components/ui/SongArtwork";
import { useAudio } from "@/context/audio-context";

/**
 * Highlight matched characters within a lyric line using Fuse.js indices.
 */
function HighlightedLine({ text, indices }) {
  if (!indices || indices.length === 0) {
    return <span>{text}</span>;
  }

  const parts = [];
  let lastIndex = 0;

  // Merge overlapping indices
  const merged = [];
  for (const [start, end] of indices) {
    if (merged.length > 0 && start <= merged[merged.length - 1][1] + 1) {
      merged[merged.length - 1][1] = Math.max(
        merged[merged.length - 1][1],
        end
      );
    } else {
      merged.push([start, end]);
    }
  }

  for (const [start, end] of merged) {
    if (start > lastIndex) {
      parts.push(
        <span key={`pre-${lastIndex}`}>{text.slice(lastIndex, start)}</span>
      );
    }
    parts.push(
      <span
        key={`hl-${start}`}
        className="text-amber-400 font-bold bg-amber-400/10 rounded px-0.5"
      >
        {text.slice(start, end + 1)}
      </span>
    );
    lastIndex = end + 1;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`post-${lastIndex}`}>{text.slice(lastIndex)}</span>
    );
  }

  return <span>{parts}</span>;
}

/**
 * LyricsSearchResults — Displays fuzzy-matched lyrics search results
 * with highlighted matching lines per song.
 */
export default function LyricsSearchResults({
  results,
  total,
  query,
  loading,
  error,
  hasMore,
  onLoadMore,
}) {
  const router = useRouter();
  const { playSong, currentSong, isPlaying, setAddToPlaylistSong } = useAudio();

  if (loading && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-4" />
        <p className="text-sm text-muted font-medium">
          Searching lyrics for &ldquo;{query}&rdquo;...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm text-muted font-medium mb-1">
          Search failed
        </p>
        <p className="text-xs text-dim">{error}</p>
      </div>
    );
  }

  if (!query || !query.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-card-hover border border-line flex items-center justify-center mb-5">
          <Mic2 className="w-6 h-6 text-dim" />
        </div>
        <h2 className="text-lg font-semibold text-title tracking-tight">
          Search by Lyrics
        </h2>
        <p className="text-sm text-muted mt-1.5 max-w-xs leading-relaxed">
          Type a phrase from any song — in Telugu, English, or transliterated —
          and find the song you&apos;re looking for.
        </p>
      </div>
    );
  }

  if (results.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-card-hover border border-line flex items-center justify-center mb-5">
          <Search className="w-6 h-6 text-dim" />
        </div>
        <h2 className="text-lg font-semibold text-title tracking-tight">
          No lyrics found
        </h2>
        <p className="text-sm text-muted mt-1.5 max-w-xs leading-relaxed">
          We couldn&apos;t find any lyrics matching &ldquo;{query}&rdquo;. Try
          a different phrase or spelling.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-4 px-1 pb-4 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Mic2 className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-title tracking-tight">
            Lyrics Match
          </h1>
          <p className="text-xs text-muted mt-0.5">
            {total} song{total !== 1 && "s"} with lyrics matching
            &ldquo;{query}&rdquo;
          </p>
        </div>
      </div>

      {/* Scrollable Results */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
        {results.map((song) => {
          const isCurrent = currentSong?.id === song.songId;
          return (
            <div
              key={song.songId}
              className="bg-card-hover/40 border border-line/40 rounded-xl p-4 hover:border-line/60 transition-all group"
            >
              {/* Song Info Row */}
              <div
                onClick={() => {
                  playSong({
                    id: song.songId,
                    title: song.title,
                    teluguTitle: song.teluguTitle,
                    titleEnglish: song.titleEnglish,
                    artist: song.artist,
                    imageUrl: song.imageUrl,
                    slug: song.slug,
                  });
                  router.push(
                    `/song/${encodeURIComponent(song.slug || song.songId)}`
                  );
                }}
                className="flex items-center gap-3.5 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-lg overflow-hidden border border-line shrink-0 bg-card-hover relative">
                  <SongArtwork
                    song={{
                      imageUrl: song.imageUrl,
                      title: song.title,
                      teluguTitle: song.teluguTitle,
                    }}
                    className="w-full h-full object-cover"
                    iconSize="w-4 h-4"
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm font-semibold block truncate ${
                      isCurrent ? "text-amber-400" : "text-title"
                    }`}
                  >
                    {song.teluguTitle || song.title}
                  </span>
                  <span className="text-xs text-muted block truncate mt-0.5">
                    {song.titleEnglish} &middot; {song.artist}
                  </span>
                </div>

                {isCurrent && isPlaying && (
                  <div className="flex items-end gap-[2px] h-3 shrink-0">
                    <span className="w-[2px] bg-amber-400 rounded-full h-3 animate-music-bar-1" />
                    <span className="w-[2px] bg-amber-400 rounded-full h-2 animate-music-bar-2" />
                    <span className="w-[2px] bg-amber-400 rounded-full h-2.5 animate-music-bar-3" />
                  </div>
                )}

                {/* Add to Playlist (+) button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddToPlaylistSong({
                      id: song.songId,
                      title: song.title,
                      teluguTitle: song.teluguTitle,
                      titleEnglish: song.titleEnglish,
                      artist: song.artist,
                      imageUrl: song.imageUrl,
                      slug: song.slug,
                    });
                  }}
                  className="p-2 rounded-lg hover:bg-card-hover text-muted hover:text-[#D4A32A] transition-colors cursor-pointer shrink-0"
                  title="Add to Playlist"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Matched Lyric Lines */}
              {song.matchedLines.length > 0 && (
                <div className="mt-3 pl-[59px] space-y-1.5">
                  {song.matchedLines.map((match, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs leading-relaxed"
                    >
                      <span className="text-dim shrink-0 mt-0.5">♪</span>
                      <span
                        className={`text-muted ${
                          match.language === "te" || match.language === "hi"
                            ? "font-telugu"
                            : ""
                        }`}
                      >
                        <HighlightedLine
                          text={match.text}
                          indices={match.indices}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Load More */}
        {hasMore && (
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="w-full py-3 text-center text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading more...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1">
                Load more results
                <ChevronDown className="w-3.5 h-3.5" />
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
