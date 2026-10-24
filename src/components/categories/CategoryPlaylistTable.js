"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Play, Pause, Heart, Share2, Download, MoreHorizontal, Check, Clock, Plus, FileText } from "lucide-react";
import { useAudio } from "@/context/audio-context";
import ProtectedAction from "@/components/auth/ProtectedAction";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { getShareableSongUrl } from "@/utils/share";

export default function CategoryPlaylistTable({ category, songs, language }) {
  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    toggleFavorite,
    favorites,
    setAddToPlaylistSong,
    lastViewedSongId,
    recordSongNavigation,
  } = useAudio();
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [sharedSongId, setSharedSongId] = useState(null);
  const [activeMenuSongId, setActiveMenuSongId] = useState(null);

  const categoryName = category.nameEn;

  // Auto-close options dropdown on outside clicks
  useEffect(() => {
    const handleCloseMenu = () => {
      setActiveMenuSongId(null);
    };
    window.addEventListener("click", handleCloseMenu);
    return () => window.removeEventListener("click", handleCloseMenu);
  }, []);

  if (songs.length === 0) {
    return (
      <div className="p-12 text-center text-muted border border-line rounded-xl bg-card-hover/20">
        <span className="font-semibold block text-title text-lg">No songs available</span>
        <span className="text-xs block mt-1">Try another language or search for a different theme.</span>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  const handleShare = async (e, song) => {
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
    setSharedSongId(song.id);
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (err) {
      console.error("Clipboard write failed:", err);
    }
    setTimeout(() => setSharedSongId(null), 2000);
  };

  const handleDownload = (e, songTitle) => {
    e.stopPropagation();
    alert(`Downloading "${songTitle}"...`);
  };

  return (
    <div className="w-full flex flex-col select-none">
      {/* Sticky Table Header */}
      <div className="sticky top-0 z-30 bg-canvas/95 backdrop-blur-md py-3 border-b border-line grid grid-cols-[40px_1fr_80px] md:grid-cols-[40px_2.5fr_1.5fr_120px] lg:grid-cols-[40px_2.5fr_1.5fr_1.2fr_120px] gap-4 px-4 text-[11px] font-bold text-muted uppercase tracking-wider items-center select-none mb-3">
        <div className="text-center">#</div>
        <div>Title</div>
        <div className="hidden md:block">Album</div>
        <div className="hidden lg:block">Date Added</div>
        <div className="flex justify-end pr-4">
          <Clock className="w-4 h-4 text-muted" />
        </div>
      </div>

      {/* Table Body */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-1 mt-1"
      >
        {songs.map((song, index) => {
          const isCurrent = currentSong?.id === song.id;
          const isSongPlaying = isCurrent && isPlaying;
          const isFav = favorites.includes(song.id);
          const isHovered = hoveredRowId === song.id;
          const isLastViewed = Boolean(
            lastViewedSongId && (lastViewedSongId === song.id || lastViewedSongId === song.slug)
          );

          const displayTitle = language !== "english" && song.teluguTitle ? song.teluguTitle : (song.titleEnglish || song.title);
          const subtitle =
            language !== "english"
              ? (song.titleEnglish && song.titleEnglish !== song.teluguTitle ? song.titleEnglish : null)
              : (song.teluguTitle && song.teluguTitle !== (song.titleEnglish || song.title) ? song.teluguTitle : null);

          // Mock date added based on releaseYear or ID
          const year = song.releaseYear || 2024;
          const dateAdded = `Jan 15, ${year}`;

          const handleNavigateLyrics = () => {
            const scrollEl = document.querySelector(".overflow-y-auto");
            const currentScrollPos = scrollEl ? scrollEl.scrollTop : 0;
            const letterKey = category?.id?.startsWith('letter-') ? category.id.replace('letter-', '') : null;
            if (recordSongNavigation) {
              recordSongNavigation(song.id, letterKey, currentScrollPos, language, 'playlist');
            }
          };

          const rowBgClass = isLastViewed
            ? `border-l-4 border-l-[#D4A32A] ${isCurrent ? "bg-amber-500/20 text-white" : "bg-amber-500/10 dark:bg-amber-500/15 text-title"} shadow-xs`
            : isCurrent
            ? "bg-card-hover/60 text-white"
            : "bg-transparent hover:bg-card-hover/40";

          return (
            <motion.div
              key={song.id}
              aria-current={isLastViewed ? "true" : undefined}
              data-last-viewed={isLastViewed ? "true" : undefined}
              onClick={() => {
                if (isCurrent) {
                  togglePlay();
                } else {
                  const letterKey = category?.id?.startsWith('letter-') ? category.id.replace('letter-', '') : null;
                  playSong(song, letterKey, index, songs);
                }
              }}
              variants={itemVariants}
              onMouseEnter={() => setHoveredRowId(song.id)}
              onMouseLeave={() => setHoveredRowId(null)}
              className={`grid grid-cols-[40px_1fr_80px] md:grid-cols-[40px_2.5fr_1.5fr_120px] lg:grid-cols-[40px_2.5fr_1.5fr_1.2fr_120px] gap-4 items-center px-4 py-3 rounded-lg cursor-pointer transition-colors duration-150 select-none ${rowBgClass}`}
            >
              {/* Index / Play Button */}
              <div className="w-10 flex items-center justify-center">
                {isHovered ? (
                  <button className="text-title hover:scale-110 active:scale-95 transition-transform cursor-pointer">
                    {isSongPlaying ? (
                      <Pause className="w-4 h-4 fill-current text-title" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5 text-title" />
                    )}
                  </button>
                ) : isCurrent ? (
                  /* Animated Visualizer using white styling */
                  <div className="flex items-end gap-[2px] w-4 h-4 text-title">
                    <div className="w-[3px] bg-current rounded-full animate-music-bar-1" style={{ height: '30%' }}></div>
                    <div className="w-[3px] bg-current rounded-full animate-music-bar-2" style={{ height: '60%' }}></div>
                    <div className="w-[3px] bg-white rounded-full animate-music-bar-3" style={{ height: '40%' }}></div>
                  </div>
                ) : (
                  <span className="text-xs font-semibold tabular-nums text-muted">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Title, Artist and Transliteration */}
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  href={`/song/${encodeURIComponent(song.slug || song.id)}?view=lyrics${category?.id?.startsWith('letter-') ? `&letter=${encodeURIComponent(category.id.replace('letter-', ''))}` : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigateLyrics();
                  }}
                  className="shrink-0"
                >
                  <ImageWithFallback
                    src={song.coverUrl}
                    alt={song.title}
                    width={40}
                    height={40}
                    className={`w-10 h-10 object-cover rounded-lg border transition-transform hover:scale-105 shrink-0 ${
                      isLastViewed ? "border-[#D4A32A]" : "border-line"
                    }`}
                    sizes="40px"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <Link
                      href={`/song/${encodeURIComponent(song.slug || song.id)}?view=lyrics${category?.id?.startsWith('letter-') ? `&letter=${encodeURIComponent(category.id.replace('letter-', ''))}` : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigateLyrics();
                      }}
                      className={`font-bold text-sm truncate transition-colors hover:underline ${
                        isCurrent ? "text-title font-extrabold" : "text-title"
                      }`}
                    >
                      {displayTitle}
                    </Link>
                    {isLastViewed && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 select-none shrink-0 shadow-xs">
                        Last viewed
                      </span>
                    )}
                    {!(song.audioUrl || song.media?.audio || song.youtubeId) && (
                      <span title="Audio not available" className="text-xs select-none shrink-0">🔇</span>
                    )}
                    {!(song.youtubeId || song.media?.video) && (
                      <span title="Video not available" className="text-xs select-none shrink-0">🚫🎥</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs text-muted truncate">
                      {song.artist}
                    </span>
                    {subtitle && (
                      <>
                        <span className="text-[10px] text-muted/40">&bull;</span>
                        <span className="text-[11px] text-muted/60 truncate italic font-medium">
                          {subtitle}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Album (Category name) */}
              <div className="hidden md:block text-xs text-muted truncate">
                {categoryName}
              </div>

              {/* Date Added */}
              <div className="hidden lg:block text-xs text-muted/80">
                {dateAdded}
              </div>

              {/* Duration & Hover actions */}
              <div className="text-right pr-4 text-xs font-semibold text-muted tabular-nums flex items-center justify-end relative h-10">
                <span className={`transition-opacity duration-200 ${isHovered ? "opacity-0 invisible" : "opacity-100"}`}>
                  {song.duration}
                </span>

                <div className={`absolute right-4 flex items-center gap-3 transition-all duration-200 ${isHovered ? "opacity-100 visible translate-x-0" : "opacity-0 invisible translate-x-2"}`}>
                  <ProtectedAction action={() => toggleFavorite(song.id)}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className={`p-1.5 rounded-full hover:bg-card-hover transition-colors cursor-pointer ${isFav ? "text-red-500" : "text-muted hover:text-title"}`}
                      title={isFav ? "Remove Favorite" : "Favorite"}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
                    </button>
                  </ProtectedAction>

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuSongId(activeMenuSongId === song.id ? null : song.id);
                      }}
                      className={`p-1.5 rounded-full hover:bg-card-hover text-muted hover:text-title transition-colors cursor-pointer ${activeMenuSongId === song.id ? "text-white animate-pulse" : ""}`}
                      title="More options"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>

                    {activeMenuSongId === song.id && (
                      <div className="absolute right-0 top-[110%] bg-dropdown border border-line rounded-xl shadow-2xl z-50 py-1 w-40 select-none animate-in fade-in slide-in-from-top-1 duration-150">
                        <Link
                          href={`/song/${encodeURIComponent(song.slug || song.id)}?view=lyrics${category?.id?.startsWith('letter-') ? `&letter=${encodeURIComponent(category.id.replace('letter-', ''))}` : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuSongId(null);
                            handleNavigateLyrics();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-title hover:bg-card-hover transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#D4A32A]" />
                          <span>View Lyrics</span>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddToPlaylistSong(song);
                            setActiveMenuSongId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-title hover:bg-card-hover transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Playlist</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(e, song);
                            setActiveMenuSongId(null);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-card-hover transition-colors cursor-pointer flex items-center gap-2 ${
                            sharedSongId === song.id ? "text-title" : "text-title"
                          }`}
                        >
                          {sharedSongId === song.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                          <span>{sharedSongId === song.id ? "Copied" : "Share"}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(e, song.title);
                            setActiveMenuSongId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-title hover:bg-card-hover transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
