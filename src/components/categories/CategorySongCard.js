"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Heart,
  Share2,
  Download,
  MoreVertical,
  Check,
  Plus,
} from "lucide-react";
import { useAudio } from "@/context/audio-context";
import ProtectedAction from "@/components/auth/ProtectedAction";
import { getShareableSongUrl } from "@/utils/share";
import SongOptionsMenu from "@/components/song/SongOptionsMenu";

export default function CategorySongCard({ song, language, onClick }) {
  const { toggleFavorite, favorites, currentSong, isPlaying, playSong, setAddToPlaylistSong } =
    useAudio();
  const [isShared, setIsShared] = useState(false);

  const handlePlayClick = () => {
    if (onClick) {
      onClick();
    } else {
      playSong(song);
    }
  };

  const isCurrent = currentSong?.id === song.id;
  const isSongPlaying = isCurrent && isPlaying;
  const isFav = favorites.includes(song.id);

  const isNative = language === "telugu" || language === "tamil" || language === "hindi";
  const displayTitle =
    isNative && song.teluguTitle
      ? song.teluguTitle
      : song.titleEnglish || song.title;
  const subtitle =
    isNative
      ? (song.titleEnglish && song.titleEnglish !== song.teluguTitle ? song.titleEnglish : null)
      : (song.teluguTitle && song.teluguTitle !== (song.titleEnglish || song.title) ? song.teluguTitle : null);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(song.id);
  };

  const handleShareClick = async (e) => {
    e.stopPropagation();
    const shareUrl = getShareableSongUrl(song);

    // Try native share first
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${song.teluguTitle || song.title} | YouWorship`,
          text: `Listen to "${song.teluguTitle || song.title}" by ${song.artist || "Unknown Artist"} on YouWorship.`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.debug("Web Share API error:", err);
        }
      }
    }

    // Fallback: copy to clipboard
    setIsShared(true);
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (err) {
      console.error("Clipboard write failed:", err);
    }
    setTimeout(() => setIsShared(false), 2000);
  };

  const handleDownloadClick = (e) => {
    e.stopPropagation();
    // Simulate download
    alert(`Downloading "${song.title}"...`);
  };

  const handleMoreClick = (e) => {
    e.stopPropagation();
  };

  return (
    <motion.div
      onClick={onClick}
      className="relative isolate rounded-2xl p-4 bg-card-hover/20 border border-line shadow-lg flex flex-col justify-between select-none cursor-pointer group transition-all duration-300"
      whileHover={{
        scale: 1.04,
        borderColor: "rgba(255, 255, 255, 0.25)",
        boxShadow:
          "0 0 20px rgba(255, 255, 255, 0.05), 0 8px 32px rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* Cover Image Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-4 border border-line">
        <motion.img
          src={song.coverUrl}
          alt={song.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src =
              "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMxZTFlMWUiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwYTBhMGEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNnKSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjE0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0zOCA1NSBMMzggODUgTDU1IDgwIEw1NSA1MFoiIGZpbGw9IiMzMzMiLz48L3N2Zz4=";
          }}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.4 }}
        />

        {/* Top Right: Add to Playlist (+) button */}
        <button
          id="tour-song-card-playlist-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setAddToPlaylistSong(song);
          }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/20 hover:border-white/50 text-white hover:text-[#D4A32A] flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer z-10"
          title="Add to Playlist"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Hover overlay with Play button — always visible on mobile, hover on desktop */}
        <div
          onClick={handlePlayClick}
          className="absolute inset-0 bg-black/45 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer z-[5]"
        >
          <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_15px_rgba(255, 255, 255, 0.2)] scale-90 group-hover:scale-100 transition-all duration-300">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Active Now Playing indicator */}
        {isSongPlaying && (
          <div className="absolute bottom-2 right-2 bg-white text-black px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase animate-pulse">
            Playing
          </div>
        )}
      </div>

      {/* Info and Titles */}
      <div className="flex-1 min-w-0 mb-3">
        <h4
          className={`text-sm font-black truncate leading-tight transition-colors ${isCurrent ? "text-white font-extrabold" : "text-title"}`}
        >
          {displayTitle}
        </h4>
        {subtitle && (
          <p className="text-[11px] text-muted/80 truncate mt-0.5 italic">
            {subtitle}
          </p>
        )}
        <p className="text-xs text-muted truncate mt-1">{song.artist}</p>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between pt-2.5 border-t border-line">
        <span className="text-[10px] font-bold text-muted">
          {song.duration}
        </span>

        <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          {/* Add to Playlist (+) button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAddToPlaylistSong(song);
            }}
            className="p-1 rounded-full hover:bg-card-hover text-muted hover:text-[#D4A32A] transition-colors cursor-pointer"
            title="Add to Playlist"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleFavoriteClick}
            className={`p-1 rounded-full hover:bg-card-hover transition-colors cursor-pointer ${isFav ? "text-red-400" : "text-muted hover:text-title"}`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
          </button>

          <button
            onClick={handleShareClick}
            className={`p-1 rounded-full hover:bg-card-hover transition-colors cursor-pointer ${isShared ? "text-title" : "text-muted hover:text-title"}`}
          >
            {isShared ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={handleDownloadClick}
            className="p-1 rounded-full hover:bg-card-hover text-muted hover:text-title transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <SongOptionsMenu song={song} iconSize="w-3.5 h-3.5" />
        </div>
      </div>
    </motion.div>
  );
}
