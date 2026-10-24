"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreVertical,
  Play,
  ListPlus,
  FastForward,
  Plus,
  Heart,
  Check,
  FileText,
} from "lucide-react";
import { useAudio } from "@/context/audio-context";
import ProtectedAction from "@/components/auth/ProtectedAction";

export default function SongOptionsMenu({
  song,
  triggerClassName = "",
  iconSize = "w-4 h-4",
  align = "right",
}) {
  const router = useRouter();
  const {
    currentSong,
    isPlaying,
    playSong,
    playNext,
    addToQueue,
    setAddToPlaylistSong,
    favorites,
    toggleFavorite,
    currentSectionLetter,
  } = useAudio();

  const [isOpen, setIsOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const menuRef = useRef(null);

  const isCurrentSong = currentSong?.id === song?.id;
  const isFav = favorites.includes(song?.id);

  // Close menu on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const showToast = (text) => {
    setFeedbackText(text);
    setTimeout(() => {
      setFeedbackText("");
      setIsOpen(false);
    }, 900);
  };

  const handlePlayNow = (e) => {
    e.stopPropagation();
    e.preventDefault();
    playSong(song);
    setIsOpen(false);
  };

  const handlePlayNext = (e) => {
    e.stopPropagation();
    e.preventDefault();
    playNext(song);
    showToast("Playing next");
  };

  const handleAddToQueue = (e) => {
    e.stopPropagation();
    e.preventDefault();
    addToQueue(song);
    showToast("Added to queue");
  };

  const handleAddToPlaylist = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setAddToPlaylistSong(song);
    setIsOpen(false);
  };

  const handleToggleFav = (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(song.id);
  };

  return (
    <div className="relative inline-block" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }}
        className={`p-1.5 rounded-full text-muted hover:text-title hover:bg-card-hover transition-colors cursor-pointer active:scale-95 ${triggerClassName}`}
        title="More options"
        aria-label="Song options"
        aria-expanded={isOpen}
      >
        <MoreVertical className={iconSize} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className={`absolute ${
              align === "left" ? "left-0" : "right-0"
            } bottom-full mb-1.5 md:bottom-auto md:top-full md:mt-1.5 w-48 bg-card/95 backdrop-blur-xl border border-line rounded-2xl shadow-2xl p-1.5 z-[100] select-none`}
          >
            {feedbackText ? (
              <div className="py-3 px-2 flex items-center justify-center gap-2 text-xs font-bold text-[#D4A32A]">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{feedbackText}</span>
              </div>
            ) : (
              <div className="space-y-0.5">
                {/* 1. View Lyrics */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (song) {
                      const letterParam = currentSectionLetter || song.teluguFirstLetter || song.firstLetter;
                      router.push(`/song/${encodeURIComponent(song.slug || song.id)}?view=lyrics${letterParam ? `&letter=${encodeURIComponent(letterParam)}` : ""}`);
                    }
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-title hover:bg-card-hover transition-colors text-left cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#D4A32A]" />
                  <span>View Lyrics</span>
                </button>

                {/* 2. Play Now */}
                <button
                  onClick={handlePlayNow}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-title hover:bg-card-hover transition-colors text-left cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-muted" />
                  <span>Play Now</span>
                </button>

                {/* 3. Play Next */}
                <button
                  onClick={handlePlayNext}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-title hover:bg-card-hover transition-colors text-left cursor-pointer"
                >
                  <FastForward className="w-3.5 h-3.5 text-muted" />
                  <span>Play Next</span>
                </button>

                {/* 4. Add to Queue */}
                <button
                  onClick={handleAddToQueue}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-title hover:bg-card-hover transition-colors text-left cursor-pointer"
                >
                  <ListPlus className="w-3.5 h-3.5 text-muted" />
                  <span>Add to Queue</span>
                </button>

                {/* 5. Add to Playlist */}
                <button
                  onClick={handleAddToPlaylist}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-title hover:bg-card-hover transition-colors text-left cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-muted" />
                  <span>Add to Playlist</span>
                </button>

                {/* 6. Favorite */}
                <ProtectedAction action={`favorite_${song.id}`}>
                  <button
                    onClick={handleToggleFav}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-title hover:bg-card-hover transition-colors text-left cursor-pointer"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isFav ? "fill-red-500 text-red-500" : "text-muted"
                      }`}
                    />
                    <span>{isFav ? "Remove Favorite" : "Favorite"}</span>
                  </button>
                </ProtectedAction>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
