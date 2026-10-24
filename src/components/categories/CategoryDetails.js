"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Grid, List, Play, Plus, Share2, Check } from "lucide-react";
import { useAudio } from "@/context/audio-context";
import CategoryHeroBanner from "./CategoryHeroBanner";
import SongCard from "../home/SongCard";
import CategoryPlaylistTable from "./CategoryPlaylistTable";
import { CategoryDetailsSkeleton } from "@/components/ui/SongSkeleton";

export default function CategoryDetails({ category, language, onBack }) {
  const { songs, songsLoading, playSong, currentSong, isPlaying, playlists, addSongToPlaylist } = useAudio();
  const [viewMode, setViewMode] = useState("playlist"); // "playlist" | "cards"
  const [isShared, setIsShared] = useState(false);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);

  const songIds = language === "telugu" ? category.songIdsTe : category.songIdsEn;
  
  // Filter songs based on category and language dynamically
  const categorySongs = (songs || []).filter((song) => {
    // Verify language matches the selected tab language strictly
    const songLanguage = (song.language || "").toLowerCase();
    let matchesLanguage = false;
    if (language === "telugu") {
      matchesLanguage = songLanguage === "te" || songLanguage === "telugu";
    } else if (language === "english") {
      matchesLanguage = songLanguage === "en" || songLanguage === "english";
    } else if (language === "hindi") {
      matchesLanguage = songLanguage === "hi" || songLanguage === "hindi";
    } else if (language === "tamil") {
      matchesLanguage = songLanguage === "ta" || songLanguage === "tamil";
    }

    if (!matchesLanguage) return false;

    // If active tab is telugu, ensure the song title contains Telugu script to hide duplicates with English titles
    if (language === "telugu") {
      const hasTeluguScript = /[\u0C00-\u0C7F]/.test(song.title) || /[\u0C00-\u0C7F]/.test(song.teluguTitle);
      if (!hasTeluguScript) return false;
    }

    // 1. Match by database category array or string
    const matchByCategoryField = Array.isArray(song.categoryArr)
      ? song.categoryArr.some(cat => 
          cat.toLowerCase() === category.nameEn.toLowerCase() || 
          cat.toLowerCase() === category.nameTe.toLowerCase() ||
          (Array.isArray(category.legacyNames) && category.legacyNames.some(ln => ln.toLowerCase() === cat.toLowerCase()))
        )
      : (typeof song.category === "string" && (
          song.category.toLowerCase() === category.nameEn.toLowerCase() || 
          song.category.toLowerCase() === category.nameTe.toLowerCase() ||
          (Array.isArray(category.legacyNames) && category.legacyNames.some(ln => ln.toLowerCase() === song.category.toLowerCase()))
        ));

    // 2. Fallback: match by the hardcoded list in categoryData.js
    const matchByHardcodedList = songIds.includes(song.id);

    return matchByCategoryField || matchByHardcodedList;
  });

  // Sort categorySongs alphabetically based on display title for the selected language
  categorySongs.sort((a, b) => {
    const showNative = language !== "english";
    const titleA = showNative && a.teluguTitle ? a.teluguTitle : (a.titleEnglish || a.title || "");
    const titleB = showNative && b.teluguTitle ? b.teluguTitle : (b.titleEnglish || b.title || "");
    return titleA.localeCompare(titleB, undefined, { sensitivity: "base" });
  });

  // Reset viewMode when category changes and scroll to top
  useEffect(() => {
    setViewMode("playlist");
    const scrollable = document.querySelector(".overflow-y-auto");
    if (scrollable) {
      scrollable.scrollTop = 0;
    }
  }, [category.id]);

  const handlePlayAll = () => {
    if (categorySongs.length > 0) {
      playSong(categorySongs[0]);
    }
  };

  const handleShare = () => {
    setIsShared(true);
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
    }
    setTimeout(() => setIsShared(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Headers and Breadcrumbs */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-title transition-all duration-150 cursor-pointer self-start select-none"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Categories
        </button>
      </div>

      {/* Hero Banner Component (Spotify-style) */}
      <CategoryHeroBanner
        category={category}
        language={language}
        songCount={categorySongs.length}
      />

      {/* Action Bar (Situated below colored banner per Spotify layout) */}
      {categorySongs.length > 0 && (
        <div className="flex items-center justify-between px-2 py-2 select-none">
          <div className="flex items-center gap-6">
            {/* Play Button (Spotify Round Play circle - Theme adaptive) */}
            <button
              onClick={handlePlayAll}
              className="w-14 h-14 rounded-full bg-title text-card flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
              title="Play All"
            >
              <Play className="w-6 h-6 fill-current text-card ml-0.5" />
            </button>

            {/* Add Category to Playlist Toggler */}
            <div className="relative">
              <button
                onClick={() => setShowPlaylistDropdown(!showPlaylistDropdown)}
                className={`p-2 rounded-full transition-colors cursor-pointer text-muted hover:text-title`}
                title="Add Category to Playlist"
              >
                <Plus className="w-6 h-6" />
              </button>

              {showPlaylistDropdown && (
                <div className="absolute left-0 top-[110%] bg-dropdown border border-line rounded-xl shadow-2xl z-50 py-2 w-48 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
                  <span className="text-[9px] font-bold text-muted uppercase tracking-wider px-4 py-1.5 block border-b border-line mb-1">
                    Add to Playlist
                  </span>
                  {playlists.length === 0 ? (
                    <span className="text-xs text-muted px-4 py-2 block">No playlists created</span>
                  ) : (
                    playlists.map((list) => (
                      <button
                        key={list.id}
                        onClick={() => {
                          categorySongs.forEach((song) => {
                            if (!list.songIds.includes(song.id)) {
                              addSongToPlaylist(list.id, song.id);
                            }
                          });
                          setShowPlaylistDropdown(false);
                          alert(`Added ${categorySongs.length} songs to "${list.name}"`);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-copy hover:bg-card-hover transition-colors cursor-pointer"
                      >
                        {list.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Share button */}
            <button
              onClick={handleShare}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isShared ? "text-title" : "text-muted hover:text-title"
              }`}
              title="Copy link"
            >
              {isShared ? <Check className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
            </button>
          </div>

          {/* Right layout toggler (styled as List mode bullet toggle) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "playlist" ? "cards" : "playlist")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-card-hover text-xs font-bold text-muted hover:text-title transition-colors cursor-pointer"
            >
              {viewMode === "playlist" ? (
                <>
                  <List className="w-4 h-4" />
                  <span>List</span>
                </>
              ) : (
                <>
                  <Grid className="w-4 h-4" />
                  <span>Grid</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area: Song Cards Grid or Playlist Table */}
      <div className="relative min-h-[300px]">
        {songsLoading ? (
          <CategoryDetailsSkeleton language={language} />
        ) : (
          <AnimatePresence>
            {categorySongs.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-12 text-center text-muted border border-line rounded-xl bg-card-hover/20 select-none"
              >
                <span className="font-semibold block text-white text-lg">No songs available</span>
                <span className="text-xs block mt-1">Try another language.</span>
              </motion.div>
            ) : viewMode === "cards" ? (
              <motion.div
                key="grid-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
              >
                {categorySongs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    currentSong={currentSong}
                    isPlaying={isPlaying}
                    playSong={playSong}
                    language={language}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="playlist-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <CategoryPlaylistTable
                  category={category}
                  songs={categorySongs}
                  language={language}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
