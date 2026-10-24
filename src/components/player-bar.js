"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useAudio } from "@/context/audio-context";
import ProtectedAction from "@/components/auth/ProtectedAction";
import SongArtwork from "@/components/ui/SongArtwork";
import { extractDominantColor } from "@/utils/extract-color";
import YouTubeIcon from "@/components/ui/YouTubeIcon";
import { getShareableSongUrl, getShareableSongText, getShareableSongTitle } from "@/utils/share";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  Share2,
  Check,
  Maximize2,
  ListMusic,
  ChevronDown,
  Music,
  X
} from "lucide-react";

// Inline MicVocal SVG to bypass Turbopack / lucide caching errors
function MicIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 .314.087L15.09 12" />
      <path d="M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2-2.072-.356-2.775-3.369-1.5-4.5" />
      <circle cx="16" cy="7" r="5" />
    </svg>
  );
}

// Inline Picture in Picture SVG component
function PipIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
      <rect width="10" height="7" x="12" y="13" rx="1" fill="currentColor" />
    </svg>
  );
}

function getVideoEmbedUrl(song) {
  if (!song) return "";
  if (song.youtubeId) {
    return `https://www.youtube.com/embed/${song.youtubeId}?autoplay=1&enablejsapi=1`;
  }
  const rawUrl = song.media?.video || song.videoUrl || song.youtubeUrl || "";
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (trimmed.includes("youtube.com/embed/")) {
    return trimmed.includes("?") ? `${trimmed}&autoplay=1` : `${trimmed}?autoplay=1`;
  }
  if (trimmed.includes("youtube.com/watch")) {
    const match = trimmed.match(/[?&]v=([^&]+)/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
    }
  }
  if (trimmed.includes("youtu.be/")) {
    const parts = trimmed.split("youtu.be/");
    if (parts[1]) {
      const id = parts[1].split("?")[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
  }
  return trimmed;
}

export default function PlayerBar() {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    isLooping,
    isShuffled,
    playSong,
    togglePlay,
    nextSong,
    prevSong,
    seekTo,
    adjustVolume,
    toggleMute,
    setIsLooping,
    setIsShuffled,
    favorites,
    toggleFavorite,
    isMiniPlayerActive,
    setIsMiniPlayerActive,
    lyricsLanguage,
    queue,
    isQueueOpen,
    setIsQueueOpen,
    currentSectionLetter,
  } = useAudio();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeLetterVal = currentSectionLetter || currentSong?.teluguFirstLetter || currentSong?.firstLetter;
  const songLetterQuery = activeLetterVal ? `&letter=${encodeURIComponent(activeLetterVal)}` : "";
  const songLetterFirstQuery = activeLetterVal ? `?letter=${encodeURIComponent(activeLetterVal)}` : "";

  const [sliderVal, setSliderVal] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [ambientColor, setAmbientColor] = useState({ r: 18, g: 18, b: 18 });
  const [toastMessage, setToastMessage] = useState("");
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const volumeBtnRef = useRef(null);
  const volumePopoverRef = useRef(null);

  const hasAudio = !!(currentSong && (currentSong.audioUrl || currentSong.media?.audio || currentSong.youtubeId));
  const hasVideo = !!(currentSong && (currentSong.youtubeId || currentSong.media?.video || currentSong.videoUrl || currentSong.youtubeUrl));

  const isLyricsPage = isClient && currentSong && (pathname === `/song/${currentSong.id}` || (currentSong.slug && pathname === `/song/${encodeURIComponent(currentSong.slug)}`) || (currentSong.slug && decodeURIComponent(pathname) === `/song/${currentSong.slug}`)) && searchParams?.get("view") === "lyrics";

  useEffect(() => {
    setTimeout(() => {
      setIsClient(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (!isDragging) {
      setSliderVal(progress);
    }
  }, [progress, isDragging]);

  useEffect(() => {
    if (currentSong?.coverUrl) {
      extractDominantColor(currentSong.coverUrl).then((color) => {
        setTimeout(() => {
          setAmbientColor(color);
        }, 0);
      });
    } else {
      setTimeout(() => {
        setAmbientColor({ r: 18, g: 18, b: 18 });
      }, 0);
    }
  }, [currentSong]);

  // Close the volume popover when tapping outside, pressing Escape,
  // switching songs, or navigating to another page.
  useEffect(() => {
    if (!isVolumeOpen) return;

    const handlePointerDown = (e) => {
      if (
        volumePopoverRef.current?.contains(e.target) ||
        volumeBtnRef.current?.contains(e.target)
      ) {
        return;
      }
      setIsVolumeOpen(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsVolumeOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVolumeOpen]);

  useEffect(() => {
    setIsVolumeOpen(false);
  }, [currentSong?.id, pathname]);

  if (!isClient) return null;

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleProgressInput = (e) => {
    const newProgress = parseFloat(e.target.value);
    setSliderVal(newProgress);
  };

  const handleProgressChange = (e) => {
    const newProgress = parseFloat(e.target.value);
    setSliderVal(newProgress);
    seekTo(newProgress);
    setIsDragging(false);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleContainerClick = (e) => {
    // Prevent expansion when clicking action buttons
    if (e.target.closest("button") || e.target.closest("a")) return;
    if (!currentSong) return; // nothing to expand when no track is selected
    setIsExpanded(true);
    setIsVolumeOpen(false);
  };

  const toggleVolumePopover = (e) => {
    e.stopPropagation();
    setIsVolumeOpen((prev) => !prev);
  };

  const isFavorited = currentSong && favorites.includes(currentSong.id);
  const { r, g, b } = ambientColor;

  return (
    <>
      {/* ─── MOBILE MINI PLAYER — fixed firmly above MobileNav ─── */}
      {!isExpanded && currentSong && (
        <div
          id="tour-player-bar-mobile"
          className="lg:hidden fixed left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-line shadow-[0_-8px_30px_rgba(0,0,0,0.4)] select-none pointer-events-auto transform translate-z-0 transition-all duration-300 animate-in slide-in-from-bottom-2"
          style={{ bottom: `calc(56px + env(safe-area-inset-bottom, 0px))` }}
        >
          {/* Seek Bar */}
          {hasAudio && (
            <div
              className="shrink-0 h-1.5 group cursor-pointer touch-pan-y"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const pct = x / rect.width;
                const targetTime = pct * (duration || 100);
                setSliderVal(targetTime);
                seekTo(targetTime);
              }}
            >
              <div className="relative w-full h-full bg-line/80">
                <div
                  className="absolute inset-y-0 left-0 bg-[#D4A32A] group-active:bg-amber-400 transition-all duration-75"
                  style={{ width: `${(sliderVal / (duration || 100)) * 100}%` }}
                />
                {/* Moving cursor/thumb — follows the playhead position */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md transition-opacity duration-75 ${
                    sliderVal > 0 && duration > 0
                      ? "opacity-80 group-active:opacity-100 group-hover:opacity-100"
                      : "opacity-0"
                  }`}
                  style={{
                    left: `calc(${(sliderVal / (duration || 100)) * 100}% - 6px)`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Content row */}
          <div
            onClick={handleContainerClick}
            className="flex items-center justify-between px-3.5 py-2 min-h-[52px] cursor-pointer"
          >
            {/* Left: Artwork + Titles */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <SongArtwork
                song={currentSong}
                className="w-10 h-10 object-cover rounded-lg border border-line/60 shrink-0"
                iconSize="w-5 h-5"
              />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-title block truncate leading-tight font-song-title">
                  {lyricsLanguage === "english" ? (currentSong.titleEnglish || currentSong.title) : (currentSong.teluguTitle || currentSong.title)}
                </span>
                <span className="text-[10px] text-muted block truncate leading-tight mt-0.5">
                  {lyricsLanguage === "english"
                    ? (currentSong.artistNameEnglish || currentSong.artist)
                    : (currentSong.artist === "Unknown Artist" ? "తెలియని కళాకారుడు" : (currentSong.artistName || currentSong.artist))}
                </span>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                id="tour-mobile-lyrics-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentSong?.id) {
                    router.push(`/song/${encodeURIComponent(currentSong.slug || currentSong.id)}?view=lyrics${songLetterQuery}`);
                  }
                }}
                className="p-1.5 hover:bg-card-hover rounded-full active:scale-90 transition-transform cursor-pointer text-[#D4A32A] hover:text-amber-300"
                aria-label="View Lyrics"
                title="View Lyrics"
              >
                <MicIcon className="w-4.5 h-4.5" />
              </button>
              <ProtectedAction action={() => toggleFavorite(currentSong.id)}>
                <button
                  className="p-1.5 hover:bg-white/5 rounded-full active:scale-90 transition-transform cursor-pointer"
                  aria-label="Add to favorites"
                >
                  <Heart
                    className={`w-4.5 h-4.5 ${
                      isFavorited
                        ? "fill-red-500 text-red-500"
                        : "text-dim hover:text-title"
                    }`}
                  />
                </button>
              </ProtectedAction>

              {hasAudio && (
                <button
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center active:scale-90 transition-transform shadow-md cursor-pointer shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

        {/* ─── DESKTOP PLAYER BAR (lg+) — floating over content ─── */}
        <div id="tour-player-bar" className="hidden lg:flex fixed bottom-0 left-0 right-0 z-40 items-center justify-between w-full h-20 px-8 border-t border-line-muted bg-canvas/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.25)]">
          {/* Left section: Song Details */}
          <div className="flex items-center gap-3 w-[30%] min-w-0">
            {currentSong ? (
              <>
                <Link
                  href={`/song/${currentSong.slug || currentSong.id}${songLetterFirstQuery}`}
                  className="group relative block overflow-hidden rounded-md border border-line flex-shrink-0 cursor-pointer"
                >
                  <SongArtwork
                    song={currentSong}
                    className="w-12 h-12 object-cover transition-transform duration-500 group-hover:scale-105"
                    iconSize="w-5 h-5"
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-3.5 h-3.5 text-white" />
                  </div>
                </Link>
                <div className="overflow-hidden min-w-0">
                  <Link
                    href={`/song/${currentSong.slug || currentSong.id}${songLetterFirstQuery}`}
                    className="font-bold text-sm text-title hover:text-handle block truncate hover:underline text-left cursor-pointer font-song-title"
                  >
                    {lyricsLanguage === "english" ? (currentSong.titleEnglish || currentSong.title) : (currentSong.teluguTitle || currentSong.title)}
                  </Link>
                  <span className="text-xs font-bold text-muted block truncate font-song-title">
                    {lyricsLanguage === "english" ? (currentSong.teluguTitle || currentSong.title) : currentSong.titleEnglish}
                  </span>
                </div>
                <ProtectedAction action={() => toggleFavorite(currentSong.id)}>
                  <button
                    className="p-1 hover:bg-card-hover rounded-full group transition-colors flex-shrink-0 cursor-pointer"
                    aria-label="Add to favorites"
                  >
                    <Heart
                      className={`w-4 h-4 transition-transform group-active:scale-90 ${
                        isFavorited
                          ? "fill-red-500 text-red-500"
                          : "text-dim hover:text-handle"
                      }`}
                    />
                  </button>
                </ProtectedAction>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-md bg-card-hover border border-line flex items-center justify-center text-dim">
                  <ListMusic className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-medium text-dim block">
                    No Track Selected
                  </span>
                  <span className="text-xs text-dim block">
                    Select a song to start
                  </span>
                </div>
              </div>
            )}
          </div>

        {/* Middle section: Playback Controls */}
        <div className="flex flex-col items-center gap-1 w-[40%] max-w-[500px]">
          {hasAudio && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsShuffled(!isShuffled)}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  isShuffled
                    ? "text-title bg-card-hover font-semibold"
                    : "text-dim hover:text-handle"
                }`}
                title="Shuffle"
                disabled={!currentSong}
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={prevSong}
                className="p-1.5 rounded-full text-muted hover:text-copy hover:bg-card-hover transition-colors active:scale-95 cursor-pointer"
                title="Previous Song"
                disabled={!currentSong}
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer ${
                  isPlaying
                    ? "bg-card text-title hover:bg-card-hover"
                    : "bg-card-hover text-title hover:bg-line border border-line"
                }`}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={nextSong}
                className="p-1.5 rounded-full text-muted hover:text-copy hover:bg-card-hover transition-colors active:scale-95 cursor-pointer"
                title="Next Song"
                disabled={!currentSong}
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  isLooping
                    ? "text-title bg-card-hover font-semibold"
                    : "text-dim hover:text-handle"
                }`}
                title="Loop"
                disabled={!currentSong}
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Timeline Slider */}
          {hasAudio && (
            <div className="w-full flex items-center gap-2">
              <span className="text-[10px] text-muted tabular-nums w-8 text-right">
                {formatTime(sliderVal)}
              </span>
              <div className="relative flex-1 group py-1.5 cursor-pointer">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={sliderVal}
                  onInput={handleProgressInput}
                  onChange={handleProgressChange}
                  onMouseDown={() => setIsDragging(true)}
                  onTouchStart={() => setIsDragging(true)}
                  disabled={!currentSong}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="h-1 w-full bg-line rounded-full overflow-hidden">
                  <div
                    className="h-full bg-dim group-hover:bg-handle rounded-full transition-all duration-75"
                    style={{
                      width: `${(sliderVal / (duration || 100)) * 100}%`,
                    }}
                  />
                </div>
                <div
                  className={`absolute w-2.5 h-2.5 bg-handle border border-canvas rounded-full top-1/2 -mt-1.25 transition-opacity duration-75 z-20 ${
                    sliderVal > 0 && duration > 0
                      ? "opacity-60 group-hover:opacity-100"
                      : "opacity-0"
                  }`}
                  style={{
                    left: `calc(${(sliderVal / (duration || 100)) * 100}% - 5px)`,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted tabular-nums w-8">
                {formatTime(duration)}
              </span>
            </div>
          )}
        </div>

          {/* Right section: Volume & Options */}
          <div className="flex items-center gap-2 w-[30%] justify-end min-w-0">
            {hasVideo && (
              <button
                onClick={() => router.push(`/song/${encodeURIComponent(currentSong.slug || currentSong.id)}?view=video${songLetterQuery}`)}
                className="p-1.5 rounded-full transition-all cursor-pointer text-muted hover:text-title hover:bg-card-hover"
                title="Watch Video"
              >
                <YouTubeIcon className="w-4 h-4 text-[#FF0000]" />
              </button>
            )}

            <div id="tour-lyrics-btn" className="inline-flex">
              {currentSong ? (
                isLyricsPage ? (
                  <Link
                    href={`/song/${currentSong.slug || currentSong.id}${songLetterFirstQuery}`}
                    className="p-1.5 rounded-full transition-all duration-200 cursor-pointer text-amber-400 bg-card-hover font-semibold shadow-[0_0_15px_rgba(212,163,42,0.2)] scale-105"
                    title="Close Lyrics"
                  >
                    <MicIcon className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    onClick={() => router.push(`/song/${encodeURIComponent(currentSong.slug || currentSong.id)}?view=lyrics${songLetterQuery}`)}
                    className="p-1.5 rounded-full transition-all duration-200 cursor-pointer text-dim hover:text-amber-400 hover:bg-card-hover active:scale-95"
                    title="View Lyrics"
                  >
                    <MicIcon className="w-4 h-4" />
                  </button>
                )
              ) : (
                <button
                  onClick={() => router.push("/?tab=discover")}
                  className="p-1.5 text-dim hover:text-amber-400 rounded-full hover:bg-card-hover cursor-pointer transition-all duration-200 active:scale-95"
                  title="Lyrics"
                >
                  <MicIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {hasAudio && (
              <button
                onClick={toggleMute}
                className="p-1.5 text-muted hover:text-copy rounded-full hover:bg-card-hover cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            )}

            {hasAudio && (
              <div className="relative group w-16 lg:w-20 py-2 cursor-pointer">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => adjustVolume(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="h-1 w-full bg-line rounded-full overflow-hidden">
                  <div
                    className="h-full bg-muted group-hover:bg-handle rounded-full"
                    style={{
                      width: `${(isMuted ? 0 : volume) * 100}%`
                    }}
                  />
                </div>
                <div
                  className="absolute w-2.5 h-2.5 bg-handle border border-canvas rounded-full top-1/2 -mt-1.25 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  style={{
                    left: `calc(${(isMuted ? 0 : volume) * 100}% - 5px)`
                  }}
                />
              </div>
            )}

            {/* Open Mini Player Button */}
            {hasVideo && (
              <button
                onClick={() => setIsMiniPlayerActive(!isMiniPlayerActive)}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  isMiniPlayerActive
                    ? "text-amber-500 bg-card-hover scale-105 shadow-sm"
                    : "text-muted hover:text-copy hover:bg-card-hover"
                }`}
                title={isMiniPlayerActive ? "Close Mini Player" : "Open Mini Player"}
              >
                <PipIcon className="w-4 h-4" />
              </button>
            )}

            {/* Play Queue Button */}
            <button
              id="tour-queue-btn"
              onClick={() => setIsQueueOpen(!isQueueOpen)}
              className={`p-1.5 rounded-full transition-all cursor-pointer relative ${
                isQueueOpen
                  ? "text-[#D4A32A] bg-card-hover scale-105 shadow-sm"
                  : "text-muted hover:text-copy hover:bg-card-hover"
              }`}
              title="Play Queue"
            >
              <ListMusic className="w-4 h-4" />
              {queue?.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#D4A32A] text-black text-[8px] font-black flex items-center justify-center pointer-events-none">
                  {queue.length > 9 ? "9+" : queue.length}
                </span>
              )}
            </button>

            {/* Full Screen Button */}
            <button
              onClick={toggleFullScreen}
              className="p-1.5 text-muted hover:text-copy rounded-full hover:bg-card-hover cursor-pointer"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* ─── FULL-SCREEN MOBILE IMMERSIVE EXPANDED PLAYER ─── */}
      {/* ──────────────────────────────────────────────────────── */}
      {currentSong && isExpanded && (
        <div
          className="fixed inset-0 z-50 bg-canvas flex flex-col justify-between p-6 select-none animate-in slide-in-from-bottom duration-300"
          style={{
            backgroundColor: "#070707",
            backgroundImage: `radial-gradient(130% 100% at 50% 0%, rgba(${r},${g},${b},0.3) 0%, rgba(${Math.max(0, r - 35)},${Math.max(0, g - 35)},${Math.max(0, b - 35)},0.08) 50%, #070707 100%)`,
          }}
        >
          {/* Top Navigation Row */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 -ml-2 text-white/70 hover:text-white active:scale-90 transition-transform cursor-pointer"
              title="Close player"
            >
              <ChevronDown className="w-7 h-7" />
            </button>
            <div className="text-center">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest block">
                Playing From
              </span>
              <span className="text-xs font-bold text-white block mt-0.5 truncate max-w-[200px]">
                {pathname === "/" || pathname === "/home" ? "Home Catalog" : "Details Page"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {/* Play Queue Button */}
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setIsQueueOpen(true);
                }}
                className="p-2 text-white/70 hover:text-white active:scale-90 transition-transform cursor-pointer relative"
                title="Play Queue"
              >
                <ListMusic className="w-5.5 h-5.5" />
                {queue?.length > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#D4A32A] text-black text-[8px] font-black flex items-center justify-center pointer-events-none">
                    {queue.length > 9 ? "9+" : queue.length}
                  </span>
                )}
              </button>

              {/* Share Button */}
              <button
                onClick={() => {
                  const shareUrl = getShareableSongUrl(currentSong);
                  const shareText = getShareableSongText(currentSong);
                  const shareTitle = getShareableSongTitle(currentSong);
                  if (typeof navigator !== "undefined" && navigator.share) {
                    navigator.share({ title: shareTitle, text: shareText, url: shareUrl }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareUrl).then(() => {
                      setToastMessage("Link copied!");
                      setTimeout(() => setToastMessage(""), 2000);
                    }).catch(() => {});
                  }
                }}
                className="p-2 text-white/70 hover:text-white active:scale-90 transition-transform cursor-pointer"
                title="Share song"
              >
                <Share2 className="w-5.5 h-5.5" />
              </button>
              <button
                onClick={() => {
                  setIsExpanded(false);
                  if (currentSong) {
                    router.push(`/song/${encodeURIComponent(currentSong.slug || currentSong.id)}?view=lyrics${songLetterQuery}`);
                  }
                }}
                className="p-2 -mr-2 text-white/70 hover:text-white active:scale-90 transition-transform cursor-pointer"
                title="View lyrics"
              >
                <MicIcon className="w-5.5 h-5.5" />
              </button>
              {hasVideo ? (
                <button
                  onClick={() => {
                    setIsExpanded(false);
                    router.push(`/song/${encodeURIComponent(currentSong.slug || currentSong.id)}?view=video${songLetterQuery}`);
                  }}
                  className="p-2 -mr-2 text-white/70 hover:text-white active:scale-90 transition-transform cursor-pointer"
                  title="Watch Video"
                >
                  <YouTubeIcon className="w-5.5 h-5.5 text-[#FF0000]" />
                </button>
              ) : (
                <div className="w-10 h-10" />
              )}
            </div>
          </div>

          {/* Album Artwork Section */}
          <div className="my-auto flex items-center justify-center">
            <div
              className={`w-72 h-72 rounded-2xl overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.7)] border border-white/10 transition-transform duration-500 ease-out ${
                isPlaying ? "scale-100" : "scale-[0.93] opacity-80"
              }`}
            >
              <SongArtwork
                song={currentSong}
                className="w-full h-full object-cover"
                iconSize="w-16 h-16"
              />
            </div>
          </div>

          {/* Details & Controls Stack */}
          <div className="space-y-6 pb-4">
            {/* Title, Artist, & Favorite Button */}
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2
                  className="text-2xl font-bold text-white truncate text-left tracking-tight font-song-title"
                >
                  {lyricsLanguage === "english" ? (currentSong.titleEnglish || currentSong.title) : (currentSong.teluguTitle || currentSong.title)}
                </h2>
                <span className="text-sm font-bold text-muted block text-left mt-1 truncate font-song-title">
                  {lyricsLanguage === "english" ? (currentSong.teluguTitle || currentSong.title) : currentSong.titleEnglish}
                </span>
              </div>
              <ProtectedAction action={() => toggleFavorite(currentSong.id)}>
                <button
                  className="p-2 rounded-full hover:bg-white/5 shrink-0 cursor-pointer active:scale-95 transition-transform"
                >
                  <Heart
                    className={`w-6.5 h-6.5 ${
                      isFavorited
                        ? "fill-red-500 text-red-500 animate-in zoom-in duration-200"
                        : "text-dim hover:text-white"
                    }`}
                  />
                </button>
              </ProtectedAction>
            </div>

            {/* Timeline Progress Scrubber */}
            {hasAudio && (
              <div className="space-y-2">
                <div className="relative group py-1.5 cursor-pointer">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={sliderVal}
                    onChange={handleProgressChange}
                    className="w-full h-1 bg-line rounded-full appearance-none cursor-pointer accent-white focus:outline-none"
                    style={{
                      background: `linear-gradient(to right, #fff 0%, #fff ${(sliderVal / (duration || 100)) * 100}%, rgba(255,255,255,0.1) ${(sliderVal / (duration || 100)) * 100}%, rgba(255,255,255,0.1) 100%)`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-semibold text-muted/80 tabular-nums">
                  <span>{formatTime(sliderVal)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}

            {/* Core Media Transport Controls */}
            {hasAudio && (
              <div className="flex items-center justify-between px-2">
                <button
                  onClick={() => setIsShuffled(!isShuffled)}
                  className={`p-2.5 rounded-full transition-colors cursor-pointer active:scale-90 ${
                    isShuffled ? "text-accent" : "text-white/40 hover:text-white"
                  }`}
                  title="Shuffle"
                >
                  <Shuffle className="w-5 h-5" />
                </button>

                <button
                  onClick={prevSong}
                  className="p-2.5 rounded-full text-white/80 hover:text-white active:scale-90 transition-colors cursor-pointer"
                  title="Previous track"
                >
                  <SkipBack className="w-6 h-6 fill-current" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center active:scale-90 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.25)] cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current text-black" />
                  ) : (
                    <Play className="w-6 h-6 fill-current text-black ml-1" />
                  )}
                </button>

                <button
                  onClick={nextSong}
                  className="p-2.5 rounded-full text-white/80 hover:text-white active:scale-90 transition-colors cursor-pointer"
                  title="Next track"
                >
                  <SkipForward className="w-6 h-6 fill-current" />
                </button>

                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-2.5 rounded-full transition-colors cursor-pointer active:scale-90 ${
                    isLooping ? "text-accent" : "text-white/40 hover:text-white"
                  }`}
                  title="Repeat"
                >
                  <Repeat className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Volume Control Slider */}
            {hasAudio && (
              <div className="flex items-center gap-3 px-1.5 pt-2">
                <button
                  onClick={toggleMute}
                  className="text-white/40 hover:text-white cursor-pointer active:scale-90 transition-transform"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4.5 h-4.5" />
                  ) : (
                    <Volume2 className="w-4.5 h-4.5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => adjustVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-line rounded-full appearance-none cursor-pointer accent-white focus:outline-none"
                  style={{
                    background: `linear-gradient(to right, #b3b3b3 0%, #b3b3b3 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share/Copy Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-[#D4A32A] text-black px-4 py-2.5 rounded-xl text-xs font-black shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── FLOATING MINI-PLAYER VIDEO WINDOW (PiP) ─── */}
      {isMiniPlayerActive && currentSong && hasVideo && (
        <div
          className="fixed bottom-[96px] sm:bottom-[104px] right-3 sm:right-6 z-[9999] w-[290px] sm:w-[350px] md:w-[390px] bg-card/95 backdrop-blur-xl border border-line rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Miniplayer Header Bar with Song Title & 'X' (into mark) close button */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-black/80 border-b border-white/10 select-none">
            <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-xs font-bold text-title truncate font-song-title">
                {lyricsLanguage === "english"
                  ? (currentSong.titleEnglish || currentSong.title)
                  : (currentSong.teluguTitle || currentSong.title)}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() =>
                  router.push(
                    `/song/${encodeURIComponent(currentSong.slug || currentSong.id)}?view=video${songLetterQuery}`
                  )
                }
                className="p-1 hover:bg-white/10 rounded-full text-dim hover:text-white transition-colors cursor-pointer"
                title="Full Video View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              {/* Into Mark / Close X button */}
              <button
                onClick={() => setIsMiniPlayerActive(false)}
                className="p-1 hover:bg-white/20 rounded-full text-dim hover:text-red-400 transition-colors cursor-pointer active:scale-90"
                title="Close Mini Player"
                aria-label="Close Mini Player"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Video Player Container */}
          <div className="relative aspect-video w-full bg-black">
            {getVideoEmbedUrl(currentSong) ? (
              <iframe
                src={getVideoEmbedUrl(currentSong)}
                title={currentSong.title || "Song Video"}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-2">
                <Music className="w-8 h-8 text-dim" />
                <span className="text-xs font-medium">Video not available</span>
              </div>
            )}
            {/* Direct Close "X" Button overlay on top-right of the video */}
            <button
              onClick={() => setIsMiniPlayerActive(false)}
              className="absolute top-2 right-2 z-30 p-1.5 bg-black/80 hover:bg-red-600/90 text-white rounded-full backdrop-blur-md border border-white/20 shadow-lg cursor-pointer transition-all hover:scale-110 active:scale-95"
              title="Close Video"
              aria-label="Close Video"
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </div>
      )}



    </>
  );
}
