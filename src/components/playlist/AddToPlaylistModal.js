"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Plus, FolderPlus, Music2, ListMusic } from "lucide-react";
import { useAudio } from "@/context/audio-context";
import { useAuth } from "@/context/auth-context";
import SongArtwork from "@/components/ui/SongArtwork";

export default function AddToPlaylistModal({ song, isOpen, onClose }) {
  const { user } = useAuth();
  const {
    playlists,
    addSongToPlaylist,
    removeSongFromPlaylist,
    createPlaylist,
  } = useAudio();

  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [inlineError, setInlineError] = useState("");

  if (!isOpen || !song) return null;

  const currentUserId = user?.uid;
  const writablePlaylists = playlists.filter((pl) => {
    if (!pl.ownerId || pl.ownerId === currentUserId || !currentUserId) return true;
    const role =
      typeof pl.collaborators?.[currentUserId] === "object"
        ? pl.collaborators[currentUserId].role
        : pl.collaborators?.[currentUserId];
    return role === "editor";
  });

  const handleToggle = (playlist) => {
    const isInPlaylist = playlist.songIds?.includes(song.id);
    if (isInPlaylist) {
      removeSongFromPlaylist(playlist.id, song.id);
    } else {
      addSongToPlaylist(playlist.id, song.id);
    }
  };

  const handleCreateAndAdd = (e) => {
    e.preventDefault();
    const trimmed = newPlaylistName.trim();
    if (!trimmed) {
      setInlineError("Please enter a playlist name.");
      return;
    }

    const isDuplicate = playlists.some(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setInlineError("A playlist with this name already exists.");
      return;
    }

    const created = createPlaylist(trimmed);
    if (created?.id) {
      addSongToPlaylist(created.id, song.id);
    }
    setNewPlaylistName("");
    setIsCreatingInline(false);
    setInlineError("");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 select-none overflow-y-auto">
        {/* Backdrop Scrim */}
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-to-playlist-title"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full max-w-[420px] my-auto bg-card border border-line rounded-3xl p-6 md:p-7 shadow-2xl backdrop-blur-2xl overflow-hidden focus:outline-none"
        >
          {/* Close X Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-card-hover text-muted hover:text-title hover:bg-line transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header & Target Song Preview */}
          <div className="flex items-center gap-3.5 mb-5 pr-6">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-line shrink-0 bg-card-hover">
              <SongArtwork song={song} className="w-full h-full object-cover" iconSize="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="add-to-playlist-title" className="text-base font-black text-title tracking-tight truncate">
                Add to Playlist
              </h2>
              <p className="text-xs text-muted truncate mt-0.5">
                {song.title || song.teluguTitle}
              </p>
            </div>
          </div>

          {/* Playlists Checklist */}
          <div className="space-y-1.5 max-h-[260px] overflow-y-auto no-scrollbar py-1 mb-4">
            {writablePlaylists.length === 0 && !isCreatingInline ? (
              <div className="p-6 text-center rounded-2xl bg-card-hover/40 border border-line/40">
                <ListMusic className="w-8 h-8 text-dim mx-auto mb-2" />
                <p className="text-xs font-bold text-title">No playlists created yet</p>
                <p className="text-[11px] text-muted mt-0.5">Create your first playlist below.</p>
              </div>
            ) : (
              writablePlaylists.map((pl) => {
                const isInPlaylist = pl.songIds?.includes(song.id);
                const isShared = Object.keys(pl.collaborators || {}).length > 0;

                return (
                  <button
                    key={pl.id}
                    onClick={() => handleToggle(pl)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-card-hover/60 active:bg-card-hover transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isInPlaylist
                            ? "bg-[#D4A32A] border-[#D4A32A] text-black"
                            : "border-line group-hover:border-white/40 bg-input"
                        }`}
                      >
                        {isInPlaylist && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-title block truncate">
                          {pl.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-muted truncate">
                          <span>
                            {pl.songIds?.length || 0} song{pl.songIds?.length !== 1 ? "s" : ""}
                          </span>
                          {isShared && (
                            <>
                              <span>•</span>
                              <span className="text-[#D4A32A]">👥 Shared</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Inline Playlist Creation */}
          {isCreatingInline ? (
            <form onSubmit={handleCreateAndAdd} className="p-3 rounded-2xl bg-card-hover/40 border border-line/40 space-y-2.5 mb-4 animate-in fade-in zoom-in-95 duration-150">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => {
                  setNewPlaylistName(e.target.value);
                  if (inlineError) setInlineError("");
                }}
                placeholder="New playlist name..."
                maxLength={60}
                autoFocus
                className="w-full px-3.5 py-2 text-xs bg-input border border-line rounded-xl text-copy placeholder-muted/60 focus:outline-none focus:border-[#D4A32A]"
              />
              {inlineError && (
                <p className="text-[11px] font-semibold text-red-400">{inlineError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingInline(false);
                    setInlineError("");
                  }}
                  className="px-3 py-1.5 text-xs text-muted hover:text-title cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#D4A32A] hover:bg-[#c49527] text-black font-extrabold text-xs cursor-pointer shadow-sm"
                >
                  Create & Add
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreatingInline(true)}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl border border-dashed border-line hover:border-[#D4A32A]/50 hover:bg-[#D4A32A]/5 text-xs font-bold text-muted hover:text-[#D4A32A] transition-all mb-4 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Playlist</span>
            </button>
          )}

          {/* Done Action Button */}
          <div className="flex justify-end pt-2 border-t border-line/30">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-card-hover hover:bg-line border border-line text-xs font-bold text-title transition-colors cursor-pointer text-center"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
