"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Plus,
  Check,
  Music,
  ListMusic,
  ExternalLink,
} from "lucide-react";
import { useAudio } from "@/context/audio-context";
import SongArtwork from "@/components/ui/SongArtwork";
import { useRouter } from "next/navigation";

const searchableText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "number") return String(value).toLowerCase();
  if (typeof value === "object" && typeof value.name === "string")
    return value.name.toLowerCase();
  return "";
};

export default function AddSongsToPlaylistModal({
  playlist,
  isOpen,
  onClose,
}) {
  const router = useRouter();
  const { songs, addSongToPlaylist, removeSongFromPlaylist } = useAudio();
  const [searchQuery, setSearchQuery] = useState("");

  const playlistSongIds = useMemo(() => {
    return new Set(playlist?.songIds || []);
  }, [playlist?.songIds]);

  const filteredSongs = useMemo(() => {
    const safeSongs = Array.isArray(songs) ? songs : [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return safeSongs;

    return safeSongs.filter(
      (s) =>
        searchableText(s.teluguTitle || s.title).includes(q) ||
        searchableText(s.titleEnglish).includes(q) ||
        searchableText(s.title).includes(q) ||
        searchableText(s.artist || s.artistName || s.artistObj).includes(q) ||
        searchableText(s.album).includes(q),
    );
  }, [songs, searchQuery]);

  if (!isOpen || !playlist) return null;

  const handleToggleSong = (songId) => {
    if (playlistSongIds.has(songId)) {
      removeSongFromPlaylist(playlist.id, songId);
    } else {
      addSongToPlaylist(playlist.id, songId);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[270] flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-songs-modal-title"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full max-w-[560px] my-auto bg-card border border-line rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-2xl flex flex-col max-h-[85vh] overflow-hidden focus:outline-none"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-card-hover text-muted hover:text-title hover:bg-line transition-colors cursor-pointer z-10"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="mb-4 pr-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-[#D4A32A] uppercase tracking-wider bg-[#D4A32A]/10 px-2.5 py-0.5 rounded-full border border-[#D4A32A]/25">
                Playlist
              </span>
              <span className="text-xs text-muted">
                {playlist.songIds?.length || 0} track
                {(playlist.songIds?.length || 0) !== 1 ? "s" : ""}
              </span>
            </div>
            <h2
              id="add-songs-modal-title"
              className="text-lg sm:text-xl font-black text-title tracking-tight truncate"
            >
              Add Songs to &ldquo;{playlist.name}&rdquo;
            </h2>
          </div>

          {/* Search Input */}
          <div className="relative mb-3.5">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder="Search songs, artists, lyrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-10 text-xs sm:text-sm bg-input border border-line rounded-2xl text-copy placeholder-muted/60 focus:outline-none focus:border-[#D4A32A] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted hover:text-title hover:bg-card-hover transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Songs List */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 pr-1 min-h-[220px]">
            {filteredSongs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <Music className="w-8 h-8 text-dim mb-2" />
                <p className="text-xs font-bold text-title">No songs match your search</p>
                <p className="text-[11px] text-muted mt-0.5">Try searching with a different keyword.</p>
              </div>
            ) : (
              filteredSongs.map((song) => {
                const isAdded = playlistSongIds.has(song.id);
                return (
                  <div
                    key={song.id}
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all ${
                      isAdded
                        ? "bg-[#D4A32A]/5 border-[#D4A32A]/30"
                        : "bg-card-hover/40 border-line/40 hover:bg-card-hover hover:border-line"
                    }`}
                  >
                    {/* Artwork + Title */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-line shrink-0 bg-card-hover">
                        <SongArtwork
                          song={song}
                          className="w-full h-full object-cover"
                          iconSize="w-4 h-4"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-xs sm:text-sm font-bold block truncate leading-tight ${
                            isAdded ? "text-[#D4A32A]" : "text-title"
                          } ${song.teluguTitle ? "font-telugu" : ""}`}
                        >
                          {song.teluguTitle || song.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted truncate mt-0.5 font-medium">
                          <span>{song.titleEnglish || song.title}</span>
                          {song.artist && song.artist !== "Unknown Artist" && (
                            <>
                              <span className="text-dim">•</span>
                              <span className="truncate">{song.artist}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Add / Added Button */}
                    <button
                      onClick={() => handleToggleSong(song.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm ${
                        isAdded
                          ? "bg-[#D4A32A] text-black hover:bg-[#c49527]"
                          : "bg-card-hover hover:bg-line border border-line text-title hover:border-white/30"
                      }`}
                      title={isAdded ? "Click to remove" : "Click to add"}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-[#D4A32A]" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between gap-3 pt-3.5 mt-2 border-t border-line/40">
            <button
              onClick={() => {
                onClose();
                router.push("/?tab=discover");
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-[#D4A32A] transition-colors cursor-pointer"
            >
              <span>Explore full catalog</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-[#D4A32A] hover:bg-[#c49527] text-black font-black text-xs transition-all active:scale-95 shadow-md cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
