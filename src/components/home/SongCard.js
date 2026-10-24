"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Pause, Music, Plus } from "lucide-react";
import { useAudio } from "@/context/audio-context";

const letterGradients = {
  A: "from-red-600 to-red-900",
  B: "from-orange-600 to-orange-900",
  C: "from-amber-600 to-amber-900",
  D: "from-yellow-600 to-yellow-900",
  E: "from-lime-600 to-lime-900",
  F: "from-green-600 to-green-900",
  G: "from-emerald-600 to-emerald-900",
  H: "from-teal-600 to-teal-900",
  I: "from-cyan-600 to-cyan-900",
  J: "from-sky-600 to-sky-900",
  K: "from-blue-600 to-blue-900",
  L: "from-indigo-600 to-indigo-900",
  M: "from-violet-600 to-violet-900",
  N: "from-purple-600 to-purple-900",
  O: "from-fuchsia-600 to-fuchsia-900",
  P: "from-pink-600 to-pink-900",
  Q: "from-rose-600 to-rose-900",
  R: "from-red-500 to-rose-900",
  S: "from-orange-500 to-amber-900",
  T: "from-yellow-500 to-lime-900",
  U: "from-green-500 to-emerald-900",
  V: "from-teal-500 to-cyan-900",
  W: "from-sky-500 to-blue-900",
  X: "from-indigo-500 to-violet-900",
  Y: "from-purple-500 to-fuchsia-900",
  Z: "from-pink-500 to-rose-900",
};

function getLetterGradient(song) {
  const title = song.titleEnglish || song.title || song.teluguTitle || "";
  const firstLetter = title.charAt(0).toUpperCase();
  return letterGradients[firstLetter] || "from-slate-600 to-slate-900";
}

export default function SongCard({ song, currentSong, isPlaying, playSong, size = "md", language }) {
  const { setAddToPlaylistSong, currentSectionLetter, lastViewedSongId, recordSongNavigation } = useAudio();
  const isCurrent = currentSong?.id === song.id;
  const isThisPlaying = isCurrent && isPlaying;
  const isLastViewed = Boolean(
    lastViewedSongId && (lastViewedSongId === song.id || lastViewedSongId === song.slug)
  );

  const isSmall = size === "sm";
  const letterKey = currentSectionLetter || song.teluguFirstLetter || song.firstLetter;

  const handleNavigateLyrics = () => {
    const scrollEl = document.querySelector(".overflow-y-auto");
    const currentScrollPos = scrollEl ? scrollEl.scrollTop : 0;
    if (recordSongNavigation) {
      recordSongNavigation(song.id, letterKey, currentScrollPos, language, 'cards');
    }
  };

  return (
    <div
      onClick={() => playSong(song)}
      aria-current={isLastViewed ? "true" : undefined}
      data-last-viewed={isLastViewed ? "true" : undefined}
      className={`relative isolate flex-shrink-0 ${isSmall ? "w-36" : "w-48"} transition-all duration-300 group cursor-pointer ${
        isLastViewed
          ? "ring-2 ring-[#D4A32A] bg-amber-500/10 rounded-xl p-1.5 shadow-sm"
          : ""
      }`}
    >
      <div
        className={`relative aspect-square w-full rounded-md overflow-hidden border shadow-md bg-card ${
          isLastViewed ? "border-[#D4A32A]" : "border-line/50"
        } ${isSmall ? "mb-2" : "mb-3"}`}
      >
        {song.imageUrl || song.coverUrl ? (
          <Image
            src={song.imageUrl || song.coverUrl}
            alt={song.teluguTitle || song.title}
            width={300}
            height={300}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getLetterGradient(song)} flex items-center justify-center`}>
            <Music className="w-10 h-10 text-white/25" />
          </div>
        )}

        {/* Top Right: Add to Playlist (+) button */}
        <button
          id="tour-song-card-playlist-btn"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setAddToPlaylistSong(song);
          }}
          className={`absolute top-2 right-2 ${
            isSmall ? "w-7 h-7" : "w-8 h-8"
          } rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/20 hover:border-white/50 text-white hover:text-[#D4A32A] flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer z-10`}
          title="Add to Playlist"
        >
          <Plus className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
        </button>

        {/* Overlay: centered play/pause — always visible on mobile, hover on desktop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
          <div
            className={`transform scale-90 group-hover:scale-100 transition-transform duration-200 pointer-events-auto rounded-full bg-white text-black flex items-center justify-center shadow-xl ${
              isSmall ? "w-9 h-9" : "w-11 h-11"
            }`}
          >
            {isThisPlaying ? (
              <Pause className={isSmall ? "w-4 h-4 fill-current text-black" : "w-5 h-5 fill-current text-black"} />
            ) : (
              <Play className={`fill-current ml-0.5 text-black ${isSmall ? "w-4 h-4" : "w-5 h-5"}`} />
            )}
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/60 rounded-md text-xs text-handle font-medium z-10">
          {song.duration}
        </div>
      </div>

      {isLastViewed && (
        <div className="mb-1">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 shadow-xs">
            Last viewed
          </span>
        </div>
      )}

      <Link
        href={`/song/${encodeURIComponent(song.slug || song.id)}?view=lyrics${letterKey ? `&letter=${encodeURIComponent(letterKey)}` : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          handleNavigateLyrics();
        }}
        className={`font-bold text-title block truncate group-hover:text-handle hover:underline transition-colors ${
          isSmall ? "text-sm" : "text-base"
        } font-song-title`}
      >
        {language === "english"
          ? (song.titleEnglish || song.title)
          : (song.teluguTitle || song.title)}
      </Link>

      {((language === "english"
        ? (song.teluguTitle && song.teluguTitle !== (song.titleEnglish || song.title) ? song.teluguTitle : null)
        : (song.titleEnglish && song.titleEnglish !== (song.teluguTitle || song.title) ? song.titleEnglish : null))) && (
        <span className={`text-muted block truncate mt-0.5 font-bold font-song-title ${isSmall ? "text-xs" : "text-sm"}`}>
          {language === "english" ? song.teluguTitle : song.titleEnglish}
        </span>
      )}
    </div>
  );
}
