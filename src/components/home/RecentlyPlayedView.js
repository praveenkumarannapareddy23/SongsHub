"use client";

import React from "react";
import Link from "next/link";
import {
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  Heart,
  FileText,
  X,
  Compass,
} from "lucide-react";
import { useAudio } from "@/context/audio-context";
import SongArtwork from "@/components/ui/SongArtwork";
import ProtectedAction from "@/components/auth/ProtectedAction";
import SongOptionsMenu from "@/components/song/SongOptionsMenu";

export default function RecentlyPlayedView() {
  const {
    songs,
    recentlyPlayed,
    currentSong,
    isPlaying,
    playSong,
    removeFromRecentlyPlayed,
    clearRecentlyPlayed,
    favorites,
    toggleFavorite,
    setAddToPlaylistSong,
    setActiveTab,
  } = useAudio();

  const safeRecentIds = Array.isArray(recentlyPlayed) ? recentlyPlayed : [];
  const recentlyPlayedList = safeRecentIds
    .map((id) => songs.find((s) => s.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line/20 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-title tracking-tight flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-[#D4A32A]" />
            Recently Played
          </h1>
          <p className="text-xs md:text-sm text-muted font-medium mt-1">
            Your recent listening history across all devices.
          </p>
        </div>

        {recentlyPlayedList.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm("Clear your entire recently played history?")) {
                clearRecentlyPlayed();
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card-hover hover:bg-red-500/15 border border-line hover:border-red-500/30 text-xs font-bold text-muted hover:text-red-400 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* List or Empty State */}
      {recentlyPlayedList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 md:p-16 border border-line/40 rounded-3xl bg-card-hover/20 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-card-hover border border-line flex items-center justify-center text-muted shadow-inner">
            <Clock className="w-8 h-8 opacity-70" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-title">No Recently Played Songs</h3>
            <p className="text-xs text-muted leading-relaxed font-medium">
              Songs you listen to will appear here.
            </p>
          </div>
          <button
            onClick={() => setActiveTab("discover")}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#D4A32A] hover:bg-[#c49527] active:scale-95 text-black font-extrabold text-xs shadow-lg transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Songs</span>
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {recentlyPlayedList.map((song, index) => {
            const isSongActive = currentSong?.id === song.id;
            const isSongPlaying = isSongActive && isPlaying;
            const isFav = favorites.includes(song.id);

            return (
              <div
                key={`recent-row-${song.id}`}
                className={`group flex items-center justify-between p-3 md:p-3.5 rounded-2xl border transition-all ${
                  isSongActive
                    ? "bg-card-hover/80 border-[#D4A32A]/40 shadow-sm"
                    : "bg-card/40 border-line/40 hover:bg-card-hover hover:border-line"
                }`}
              >
                {/* Left: Index, Play & Metadata */}
                <div
                  onClick={() => playSong(song, "recently-played", index, recentlyPlayedList)}
                  className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                >
                  {/* Track Number / Play Indicator */}
                  <span className="w-6 text-center text-xs font-bold text-muted tabular-nums shrink-0 group-hover:hidden">
                    {index + 1}
                  </span>
                  <div className="w-6 text-center shrink-0 hidden group-hover:block text-title">
                    {isSongPlaying ? (
                      <Pause className="w-4 h-4 mx-auto fill-current text-[#D4A32A]" />
                    ) : (
                      <Play className="w-4 h-4 mx-auto fill-current" />
                    )}
                  </div>

                  {/* Artwork */}
                  <div className="w-11 h-11 rounded-xl overflow-hidden border border-line/40 shrink-0 bg-card-hover">
                    <SongArtwork song={song} className="w-full h-full object-cover" iconSize="w-5 h-5" />
                  </div>

                  {/* Title & Artist */}
                  <div className="min-w-0 flex-1 pr-2">
                    <span
                      className={`text-xs md:text-sm font-bold truncate block transition-colors ${
                        isSongActive ? "text-[#D4A32A]" : "text-title"
                      } ${song.teluguTitle ? "font-telugu" : ""}`}
                    >
                      {song.teluguTitle || song.title}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-muted truncate mt-0.5 font-medium">
                      <span>{song.titleEnglish || song.title}</span>
                      {song.duration && (
                        <>
                          <span className="text-dim">•</span>
                          <span>{song.duration}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                  {/* Favorite button */}
                  <ProtectedAction action={`favorite_${song.id}`}>
                    <button
                      onClick={() => toggleFavorite(song.id)}
                      className="p-2 rounded-lg hover:bg-card text-muted hover:text-red-400 transition-colors cursor-pointer"
                      title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                    </button>
                  </ProtectedAction>

                  {/* Add to playlist */}
                  <button
                    onClick={() => setAddToPlaylistSong(song)}
                    className="p-2 rounded-lg hover:bg-card text-muted hover:text-[#D4A32A] transition-colors cursor-pointer"
                    title="Add to playlist"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {/* View Lyrics */}
                  <Link
                    href={`/song/${encodeURIComponent(song.slug || song.id)}?view=lyrics`}
                    className="p-2 rounded-lg hover:bg-card text-muted hover:text-title transition-colors hidden sm:block"
                    title="View Lyrics"
                  >
                    <FileText className="w-4 h-4" />
                  </Link>

                  {/* More Options (Play Next, Add to Queue, etc.) */}
                  <SongOptionsMenu song={song} />

                  {/* Remove from recently played */}
                  <button
                    onClick={() => removeFromRecentlyPlayed(song.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors cursor-pointer"
                    title="Remove from history"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
