"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useAudio } from "@/context/audio-context";
import {
  Play,
  Pause,
  FileText,
  ChevronLeft,
  ChevronRight,
  Heart,
  Music,
  Clock,
  Volume2,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import useWeeklySongs from "@/hooks/useWeeklySongs";
import { HeroCarouselSkeleton } from "@/components/ui/SongSkeleton";
import ProtectedAction from "@/components/auth/ProtectedAction";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

const AUTO_PLAY_DURATION = 6000; // 6 seconds per slide

export default function HeroCarousel() {
  const router = useRouter();
  const { songs, playSong, currentSong, isPlaying, toggleFavorite, favorites, songsLoading, setAddToPlaylistSong } = useAudio();

  const teluguSongs = useMemo(() => {
    return (songs || []).filter((s) => {
      const l = (s.language || "").toLowerCase();
      if (l === "te" || l === "telugu") return true;
      if (l === "en" || l === "english" || l === "ta" || l === "tamil" || l === "hi" || l === "hindi") return false;
      return Boolean(s.teluguTitle) || /[\u0C00-\u0C7F]/.test(s.title || "");
    });
  }, [songs]);

  const { weeklySongs } = useWeeklySongs({ songs: teluguSongs, count: 7 });

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  // Touch swipe support
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [failedImages, setFailedImages] = useState(() => new Set());

  const carouselSlides = weeklySongs.map((song) => {
    const rawArtist = typeof song?.artist === "object" && song?.artist !== null ? song.artist.name : song?.artist;
    const cleanArtist = rawArtist && rawArtist !== "NA" && rawArtist.trim() !== "" ? rawArtist : "Unknown Artist";

    return {
      id: song.id,
      slug: song.slug,
      originalSong: song,
      title: song.teluguTitle || song.title,
      englishTitle: song.teluguTitle ? song.title : null,
      artist: cleanArtist,
      bgUrl: song.coverUrl || song.imageUrl || null,
      isTelugu: !!song.teluguTitle,
      duration: song.duration || "0:00",
    };
  });

  useEffect(() => {
    setCurrentSlide(0);
    setProgressKey((prev) => prev + 1);
  }, [carouselSlides.length]);

  // Auto-play timer
  useEffect(() => {
    if (carouselSlides.length === 0 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
      setProgressKey((prev) => prev + 1);
    }, AUTO_PLAY_DURATION);

    return () => clearInterval(timer);
  }, [carouselSlides.length, isPaused, currentSlide]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setProgressKey((prev) => prev + 1);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    setProgressKey((prev) => prev + 1);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? carouselSlides.length - 1 : prev - 1));
    setProgressKey((prev) => prev + 1);
  };

  if (songsLoading || carouselSlides.length === 0) {
    return <HeroCarouselSkeleton />;
  }

  const current = carouselSlides[currentSlide] || carouselSlides[0];
  const isCurrentPlaying = currentSong?.id === current.id && isPlaying;
  const isFavorited = favorites.includes(current.id);

  // Touch Swipe Handlers
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full min-h-[340px] sm:min-h-[400px] md:h-[450px] rounded-2xl sm:rounded-3xl overflow-hidden bg-card border border-line shadow-2xl flex flex-col justify-between p-4 sm:p-6 md:p-10 group select-none transition-all duration-500"
    >
      {/* 1. ATMOSPHERIC AMBIENT BLUR BACKDROP */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-ambient-${current.id}`}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.35, scale: 1.05 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-cover bg-center blur-3xl pointer-events-none transform"
          style={current.bgUrl ? { backgroundImage: `url(${current.bgUrl})` } : undefined}
        />
      </AnimatePresence>

      {/* 2. HIGH DEFINITION COVER ARTWORK — contained as a right-side banner within the card */}
      <AnimatePresence mode="wait">
        {current.bgUrl && (
          <motion.div
            key={`bg-cover-${current.id}`}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <Image
              src={current.bgUrl}
              alt={current.title}
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. GRADIENT OVERLAYS — strong left-side opacity so text stays readable */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-300 ${
          current.bgUrl
            ? "bg-gradient-to-r from-card via-card via-45% to-transparent"
            : "bg-gradient-to-r from-card via-card/85 via-45% to-transparent"
        }`}
      />
      <div
        className={`absolute inset-0 md:hidden pointer-events-none ${
          current.bgUrl
            ? "bg-gradient-to-r from-card via-card via-55% to-transparent"
            : "bg-gradient-to-t from-card via-card/50 via-30% to-transparent"
        }`}
      />

      {/* 4. TOP HEADER ROW: Badge & Progress */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        {/* Badge — whitespace-nowrap prevents wrapping */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-card/85 backdrop-blur-xl border border-line shadow-sm shrink-0">
          <span className="text-[9px] sm:text-[11px] font-extrabold text-title uppercase tracking-widest whitespace-nowrap">
            Song of the Week
          </span>
        </div>

        {/* Progress Bar + Counter */}
        <div className="flex items-center gap-2 bg-card/75 backdrop-blur-xl border border-line/60 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-2xl shadow-sm min-w-0">
          <div className="flex items-center gap-1 flex-1 min-w-[60px] sm:min-w-[112px]">
            {carouselSlides.map((slide, idx) => {
              const isActive = idx === currentSlide;
              const isPast = idx < currentSlide;
              return (
                <button
                  key={slide.id}
                  onClick={() => goToSlide(idx)}
                  className="relative flex-1 h-1 rounded-full bg-title/20 overflow-hidden cursor-pointer transition-all duration-200 hover:h-1.5"
                  title={`Go to track ${idx + 1}: ${slide.title}`}
                  aria-label={`Slide ${idx + 1}`}
                >
                  {isPast && <div className="h-full w-full bg-title rounded-full" />}
                  {isActive && (
                    <div
                      key={`progress-fill-${progressKey}-${isPaused}`}
                      className="h-full bg-title rounded-full"
                      style={{
                        animation: isPaused ? "none" : `slideProgress ${AUTO_PLAY_DURATION}ms linear forwards`,
                        width: isPaused ? "100%" : undefined,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="text-[10px] sm:text-xs font-extrabold text-title flex items-center gap-0.5 shrink-0 pl-2 border-l border-line/60">
            <span>0{currentSlide + 1}</span>
            <span className="text-dim font-normal">/</span>
            <span className="text-muted font-semibold">0{carouselSlides.length}</span>
          </div>
        </div>
      </div>

      {/* 5. MIDDLE HERO SECTION: Title & Metadata */}
      <div className="relative z-10 my-auto py-3">
        <div className="max-w-3xl space-y-3 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${current.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-3"
            >
              {/* Main Song Title */}
              <div className="py-1 pb-1 min-w-0">
                <h1
                  className={`text-title text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.3] ${
                    current.bgUrl
                      ? "drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] text-white"
                      : "drop-shadow-lg"
                  } ${current.isTelugu ? "font-telugu" : ""}`}
                >
                  {current.title}
                </h1>
              </div>

              {/* Metadata Chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted font-medium">
                {/* Artist Chip */}
                <div className="flex items-center gap-1.5 bg-card/85 backdrop-blur-xl px-2.5 py-1 rounded-full border border-line shadow-sm">
                  <Music className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="text-title font-semibold truncate max-w-[160px] sm:max-w-[220px] text-[11px] sm:text-xs">
                    By {current.artist}
                  </span>
                </div>

                {/* Duration Chip */}
                <div className="flex items-center gap-1 bg-card/85 backdrop-blur-xl px-2.5 py-1 rounded-full border border-line text-[11px] sm:text-xs font-semibold text-muted shadow-sm">
                  <Clock className="w-3 h-3 text-dim" />
                  <span>{current.duration}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 6. BOTTOM ACTION ROW */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        {/* Left: Play + Lyrics + Favorite */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Play / Pause Button */}
          <button
            id="tour-hero-play"
            onClick={() => playSong(current.originalSong, weeklySongs)}
            className="px-4 sm:px-7 h-10 sm:h-12 bg-title text-card font-black text-[11px] sm:text-sm rounded-full shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isCurrentPlaying ? (
              <>
                <Play className="hidden" />
                <Pause className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 fill-current text-card" />
                <span>Pause</span>
                <div className="flex items-end gap-[2px] h-3 ml-0.5">
                  <span className="w-[2px] bg-card rounded-full animate-music-bar-1" />
                  <span className="w-[2px] bg-card rounded-full animate-music-bar-2" />
                  <span className="w-[2px] bg-card rounded-full animate-music-bar-3" />
                </div>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 fill-current text-card ml-0.5" />
                <span>Play</span>
              </>
            )}
          </button>

          {/* Lyrics Link */}
          <button
            onClick={() => router.push(`/song/${encodeURIComponent(current.slug || current.id)}?view=lyrics`)}
            className="w-9 h-9 sm:w-auto sm:h-12 sm:px-5 bg-card/85 hover:bg-card border border-line text-title font-bold text-xs rounded-full flex items-center justify-center sm:gap-2 backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted" />
            <span className="hidden sm:inline">View Lyrics</span>
          </button>

          {/* Favorite Button */}
          <ProtectedAction action={() => toggleFavorite(current.id)}>
          <button
            className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-card/85 hover:bg-card border border-line text-title flex items-center justify-center backdrop-blur-xl transition-all hover:scale-105 active:scale-90 cursor-pointer shadow-sm"
            title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                isFavorited ? "fill-red-500 text-red-500 scale-110" : "text-muted hover:text-title"
              }`}
            />
          </button>
          </ProtectedAction>

          {/* Add to Playlist (+) Button */}
          <button
            onClick={() => setAddToPlaylistSong(current.originalSong)}
            className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-card/85 hover:bg-card border border-line text-muted hover:text-[#D4A32A] flex items-center justify-center backdrop-blur-xl transition-all hover:scale-105 active:scale-90 cursor-pointer shadow-sm"
            title="Add to Playlist"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Right: Up Next thumbnails (hidden on mobile) + Nav Arrows */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest shrink-0">
              Up Next
            </span>
            <div className="flex items-center gap-1.5">
              {carouselSlides.map((slide, idx) => {
                const isActive = idx === currentSlide;
                const hasFailed = failedImages.has(slide.id);
                return (
                  <button
                    key={slide.id}
                    onClick={() => goToSlide(idx)}
                    className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer shadow-md ${
                      isActive
                        ? "border-2 border-white scale-105 shadow-xl z-10"
                        : "border border-white/20 opacity-75 hover:opacity-100 hover:scale-105"
                    }`}
                    title={`Slide ${idx + 1}: ${slide.title}`}
                  >
                    {slide.bgUrl && !hasFailed ? (
                      <ImageWithFallback
                        src={slide.bgUrl}
                        alt={slide.title}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        sizes="(max-width: 640px) 32px, 40px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-neutral-700 to-neutral-900" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={prevSlide}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-md active:scale-90"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            <button
              onClick={nextSlide}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-md active:scale-90"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Global CSS Animation Keyframes */}
      <style jsx global>{`
        @keyframes slideProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
