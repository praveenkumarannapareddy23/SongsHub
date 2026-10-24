"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ListPlus, Edit3, AlertCircle } from "lucide-react";
import { useAudio } from "@/context/audio-context";

export default function CreatePlaylistModal({
  isOpen,
  onClose,
  initialPlaylist = null,
  onCreated = null,
}) {
  const { playlists, createPlaylist, editPlaylist } = useAudio();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [linkDefaultRole, setLinkDefaultRole] = useState("editor");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const isEditing = !!initialPlaylist;

  useEffect(() => {
    if (isOpen) {
      if (initialPlaylist) {
        setName(initialPlaylist.name || "");
        setDescription(initialPlaylist.description || "");
        setLinkDefaultRole(initialPlaylist.linkDefaultRole || "editor");
      } else {
        setName("");
        setDescription("");
        setLinkDefaultRole("editor");
      }
      setError("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialPlaylist]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter a playlist name.");
      return;
    }

    // Check for duplicate name (excluding current playlist if editing)
    const isDuplicate = playlists.some(
      (p) =>
        p.name.toLowerCase() === trimmedName.toLowerCase() &&
        (!isEditing || p.id !== initialPlaylist.id)
    );

    if (isDuplicate) {
      setError("A playlist with this name already exists.");
      return;
    }

    if (isEditing) {
      editPlaylist(initialPlaylist.id, {
        name: trimmedName,
        description,
        linkDefaultRole,
      });
      onClose();
    } else {
      const created = createPlaylist(trimmedName, description, linkDefaultRole);
      onClose();
      if (onCreated && created) {
        onCreated(created);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 overflow-y-auto select-none">
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
          aria-labelledby="playlist-modal-title"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full max-w-[440px] my-auto bg-card border border-line rounded-3xl p-6 md:p-7 shadow-2xl backdrop-blur-2xl overflow-hidden focus:outline-none"
        >
          {/* Close X button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-card-hover text-muted hover:text-title hover:bg-line transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-[#D4A32A]/15 border border-[#D4A32A]/30 flex items-center justify-center text-[#D4A32A] shrink-0">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <ListPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 id="playlist-modal-title" className="text-lg font-black text-title tracking-tight">
                {isEditing ? "Edit Playlist" : "Create Playlist"}
              </h2>
              <p className="text-xs text-muted font-medium">
                {isEditing
                  ? "Update your playlist details."
                  : "Organize your favorite worship songs."}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Playlist Name */}
            <div>
              <label htmlFor="playlist-name" className="block text-xs font-bold text-title mb-1.5">
                Playlist Name <span className="text-[#D4A32A]">*</span>
              </label>
              <input
                id="playlist-name"
                ref={inputRef}
                type="text"
                value={name}
                maxLength={60}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Sunday Morning Worship"
                className="w-full px-4 py-2.5 bg-input border border-line/60 rounded-xl text-sm text-copy placeholder-muted/60 focus:outline-none focus:border-[#D4A32A] transition-colors"
              />
            </div>

            {/* Playlist Description */}
            <div>
              <label htmlFor="playlist-desc" className="block text-xs font-bold text-title mb-1.5">
                Description <span className="text-muted text-[10px] font-normal">(Optional)</span>
              </label>
              <textarea
                id="playlist-desc"
                rows={3}
                value={description}
                maxLength={200}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give your playlist a meaningful purpose or prayer theme..."
                className="w-full px-4 py-2.5 bg-input border border-line/60 rounded-xl text-sm text-copy placeholder-muted/60 focus:outline-none focus:border-[#D4A32A] transition-colors resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted hover:text-title hover:bg-card-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#D4A32A] hover:bg-[#c49527] text-black font-extrabold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                {isEditing ? "Save Changes" : "Create Playlist"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
