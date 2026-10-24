"use client";

import React from "react";
import Link from "next/link";
import {
  Heart,
  Play,
  Pause,
  Shuffle,
  Trash2,
  Plus,
  FileText,
  Compass,
} from "lucide-react";
import { useAudio } from "@/context/audio-context";
import SongArtwork from "@/components/ui/SongArtwork";
import SongOptionsMenu from "@/components/song/SongOptionsMenu";

export default function LikedSongsView() {
  const {
    songs,
    favorites,
    currentSong,
    isPlaying,
    playSong,
    toggleFavorite,
    setAddToPlaylistSong,
    setActiveTab,
  } = useAudio();

  const safeFavoriteIds = Array.isArray(favorites) ? favorites : [];
  const likedSongsList = safeFavoriteIds
    .map((id) => songs.find((s) => s.id === id))
    .filter(Boolean);

  const handlePlayAll = () => {
    if (likedSongsList.length === 0) return;
    playSong(likedSongsList[0], "favorites", 0, likedSongsList);
  };

  const handleShuffle = () => {
    if (likedSongsList.length === 0) return;
    const shuffled = [...likedSongsList].sort(() => Math.random() - 0.5);
    playSong(shuffled[0], "favorites-shuffle", 0, shuffled);
  };

  const handleClearAll = () => {
    if (likedSongsList.length === 0) return;
    if (window.confirm("Remove all songs from your Liked Songs collection?")) {
      safeFavoriteIds.forEach((id) => toggleFavorite(id));
    }
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* Visual Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600/90 via-purple-900 to-slate-950 p-6 md:p-8 shadow-2xl border border-line">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-start md:items-center gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-xl border border-white/20 shrink-0">
              <Heart className="w-8 h-8 md:w-10 md:h-10 text-white fill-white" />
            </div>
            <div>
              <span className="text-[11px] font-black text-rose-300 uppercase tracking-widest block">
                Playlist
              </span>
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight mt-0.5">
                Liked Songs
              </h1>
              <p className="text-xs md:text-sm text-white/80 font-medium mt-1">
                {likedSongsList.length} song{likedSongsList.length !== 1 ? "s" : ""} liked by you
              </p>
            </div>
          </div>

          {/* Banner Controls */}
          {likedSongsList.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handlePlayAll}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 active:scale-95 text-black font-extrabold text-xs shadow-lg transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play All</span>
              </button>
              <button
                onClick={handleShuffle}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs border border-white/20 backdrop-blur-sm transition-all cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
                <span>Shuffle</span>
              </button>
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-2 px-3 py-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 active:scale-95 text-red-300 hover:text-red-200 font-bold text-xs border border-red-500/30 transition-all cursor-pointer"
                title="Clear all liked songs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* List or Empty State */}
      {likedSongsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 md:p-16 border border-line/40 rounded-3xl bg-card-hover/20 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-card-hover border border-line flex items-center justify-center text-rose-400 shadow-inner">
            <Heart className="w-8 h-8 opacity-70" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-title">No Liked Songs Yet</h3>
            <p className="text-xs text-muted leading-relaxed font-medium">
              Tap the heart icon on any song to save it here in your Liked Songs collection.
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
          {likedSongsList.map((song, index) => {
            const isSongActive = currentSong?.id === song.id;
            const isSongPlaying = isSongActive && isPlaying;

            return (
              <div
                key={`liked-row-${song.id}`}
                className={`group flex items-center justify-between p-3 md:p-3.5 rounded-2xl border transition-all ${
                  isSongActive
                    ? "border-[#D4A32A]/50 bg-[#D4A32A]/10 shadow-sm"
                    : "border-line/40 bg-card hover:bg-card-hover hover:border-line"
                }`}
              >
                {/* Left: Index / Play & Artwork & Title */}
                <div
                  onClick={() => playSong(song, "favorites", index, likedSongsList)}
                  className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                >
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

                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-line shrink-0 shadow-sm bg-card-hover">
                    <SongArtwork
                      song={song}
                      className="w-full h-full object-cover"
                      iconSize="w-5 h-5"
                    />
                  </div>

                  <div className="flex-1 min-w-0 pr-3">
                    <span
                      className={`text-sm font-bold block truncate ${
                        isSongActive ? "text-[#D4A32A]" : "text-title"
                      } ${song.teluguTitle ? "font-telugu" : ""}`}
                    >
                      {song.teluguTitle || song.title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted truncate font-medium">
                      <span>{song.titleEnglish || song.title}</span>
                      {song.album && (
                        <>
                          <span>•</span>
                          <span className="truncate">{song.album}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Unlike / Remove Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(song.id);
                    }}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Remove from Liked Songs"
                  >
                    <Heart className="w-4.5 h-4.5 fill-current" />
                  </button>

                  {/* Add to Playlist button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddToPlaylistSong(song);
                    }}
                    className="p-2 rounded-xl text-dim hover:text-[#D4A32A] hover:bg-card-hover transition-colors cursor-pointer"
                    title="Add to Playlist"
                  >
                    <Plus className="w-4.5 h-4.5" />
                  </button>

                  {/* View Lyrics Details */}
                  <Link
                    href={`/song/${encodeURIComponent(song.slug || song.id)}?view=lyrics`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-xl text-dim hover:text-title hover:bg-card-hover transition-colors cursor-pointer"
                    title="View Lyrics"
                  >
                    <FileText className="w-4.5 h-4.5" />
                  </Link>

                  {/* More Options (Play Next, Add to Queue, etc.) */}
                  <SongOptionsMenu song={song} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
