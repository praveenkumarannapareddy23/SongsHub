"use client";

import React, { use, useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Music,
  FileText,
  Plus,
  Share2,
  Copy,
  Check,
  Play,
  Pause,
  Heart,
  Maximize2,
  Minimize2,
  AArrowDown,
  AArrowUp,
  Link as LinkIcon,
} from "lucide-react";
import { useAudio } from "@/context/audio-context";
import { useTheme } from "@/context/theme-context";
import { useSearch } from "@/context/search-context";
import { useAuth } from "@/context/auth-context";

import SongLyrics, { LanguageSegmented } from "@/components/song/SongLyrics";
import YouTubeIcon from "@/components/ui/YouTubeIcon";
import { SongPageSkeleton, LyricsSkeleton } from "@/components/ui/SongSkeleton";
import ProtectedAction from "@/components/auth/ProtectedAction";
import { songService } from "@/services/songService";
import {
  getShareableSongUrl,
  getShareableSongText,
  getShareableSongTitle,
} from "@/utils/share";
import SongOptionsMenu from "@/components/song/SongOptionsMenu";

function formatVideoEmbedUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (trimmed.includes("youtube.com/embed/")) return trimmed;
  if (trimmed.includes("youtube.com/watch")) {
    const match = trimmed.match(/[?&]v=([^&]+)/);
    if (match && match[1])
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
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

function YouTubeVideoPlayer({ embedUrl, title, isPlaying }) {
  const iframeRef = React.useRef(null);

  React.useEffect(() => {
    if (!iframeRef.current) return;
    if (isPlaying) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: "" }),
        "*",
      );
    } else {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo", args: "" }),
        "*",
      );
    }
  }, [isPlaying]);

  const srcWithJsApi = `${embedUrl}${embedUrl.includes("?") ? "&" : "?"}enablejsapi=1`;

  return (
    <div className="relative w-full max-w-5xl aspect-video bg-black/40 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/10 mx-auto">
      <iframe
        ref={iframeRef}
        src={srcWithJsApi}
        title={`${title} - Video`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
}

function getSongLetter(song, language = "telugu") {
  if (!song) return null;
  if (language === "english") {
    const engTitle = song?.titleEnglish || song?.title || "";
    const first = engTitle.trim().charAt(0).toUpperCase();
    if (/[A-Z]/.test(first)) return first;
    return "#";
  }

  const title = song?.teluguTitle || song?.title || "";
  const storedLetter = song?.teluguFirstLetter || song?.firstLetter || "";
  const nativePattern =
    language === "telugu"
      ? /[\u0C00-\u0C7F]/
      : language === "hindi"
        ? /[\u0900-\u097F]/
        : language === "tamil"
          ? /[\u0B80-\u0BFF]/
          : null;

  if (nativePattern) {
    if (nativePattern.test(storedLetter)) return storedLetter;
    const firstChar = title.trim().charAt(0);
    if (nativePattern.test(firstChar)) return firstChar;
  }

  const fallbackChar = storedLetter || title.trim().charAt(0).toUpperCase();
  return fallbackChar || null;
}

export default function SongPageClient({ params, initialSong = null }) {
  const unwrappedParams = params ? (typeof params.then === "function" ? use(params) : params) : {};
  const id = unwrappedParams?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewMode = searchParams?.get("view") || null; // "video" | "lyrics" | null

  const lyricsContainerRef = useRef(null);
  const [isFullscreenLyrics, setIsFullscreenLyrics] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(0.6);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenLyrics(
        document.fullscreenElement === lyricsContainerRef.current,
      );
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreenLyrics = () => {
    const el = lyricsContainerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const increaseFontSize = () => {
    setFontSizeMultiplier((prev) => Math.min(prev + 0.15, 2.0));
  };
  const decreaseFontSize = () => {
    setFontSizeMultiplier((prev) => Math.max(prev - 0.15, 0.7));
  };

  const { isAuthenticated, loading: authLoading } = useAuth();

  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const {
    songs,
    setSongs,
    songsLoading,
    currentSong,
    isPlaying,
    playSong,
    favorites,
    toggleFavorite,
    playlists,
    addSongToPlaylist,
    removeSongFromPlaylist,
    setAddToPlaylistSong,
    setActiveTab,
    lyricsLanguage,
    setLyricsLanguage,
    currentSectionLetter,
    setCurrentSectionLetter,
    setLastViewedSongId,
  } = useAudio();

  useEffect(() => {
    const letterFromQuery = searchParams?.get("letter") || searchParams?.get("fromLetter");
    if (letterFromQuery) {
      if (setCurrentSectionLetter) setCurrentSectionLetter(letterFromQuery);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("yw_selected_letter", letterFromQuery);
        } catch (e) {}
      }
    }
  }, [searchParams, setCurrentSectionLetter]);

  const handleBack = () => {
    let storedLetter = null;
    let fromList = false;
    try {
      if (typeof window !== "undefined") {
        storedLetter = sessionStorage.getItem("yw_selected_letter");
        fromList = sessionStorage.getItem("yw_navigated_from_list") === "1";
      }
    } catch (e) {}

    const letterFromQuery = searchParams?.get("letter") || searchParams?.get("fromLetter");
    const targetLetter =
      letterFromQuery ||
      currentSectionLetter ||
      storedLetter ||
      getSongLetter(song, lyricsLanguage || "telugu");

    if (targetLetter && targetLetter !== "#") {
      try {
        sessionStorage.setItem("yw_selected_letter", targetLetter);
      } catch (e) {}
    }

    // Preserve browser stack: use router.back() if navigated from within the app, otherwise fallback to alphabet section
    if (fromList && typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else if (targetLetter && targetLetter !== "#") {
      router.push(`/?tab=discover&letter=${encodeURIComponent(targetLetter)}`);
    } else {
      router.push("/?tab=discover");
    }
  };

  const { setSearchQuery, setShowFullResults } = useSearch();

  const [song, setSong] = useState(initialSong);

  // Keep track of the currently viewed song ID so returning to list highlights it
  useEffect(() => {
    if (song?.id) {
      if (setLastViewedSongId) {
        setLastViewedSongId(song.id);
      }
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("yw_last_viewed_song_id", song.id);
        } catch (e) {}
      }
    }
  }, [song?.id, setLastViewedSongId]);
  const [lyricsLoading, setLyricsLoading] = useState(!initialSong || !(initialSong.lyricsTelugu || initialSong.lyrics));
  const selectedLanguage = lyricsLanguage;
  const setSelectedLanguage = setLyricsLanguage;

  const prevSongIdRef = useRef(null);

  useEffect(() => {
    if (song && prevSongIdRef.current !== song.id) {
      prevSongIdRef.current = song.id;
      const songLanguage = (song.language || "").toLowerCase();
      const isHi = songLanguage === "hi" || songLanguage === "hindi";
      const isTa = songLanguage === "ta" || songLanguage === "tamil";
      const isEn = songLanguage === "en" || songLanguage === "english";
      
      if (isHi) {
        setLyricsLanguage("hindi");
      } else if (isTa) {
        setLyricsLanguage("tamil");
      } else if (isEn) {
        setLyricsLanguage("english");
      } else {
        setLyricsLanguage("telugu");
      }
    }
  }, [song, setLyricsLanguage]);

  const [gradientColor, setGradientColor] = useState({ r: 18, g: 18, b: 18 });
  const fetchingRef = useRef(false);
  const prevIdRef = useRef(id);

  const isCurrentSong = currentSong?.id === song?.id;
  const isThisPlaying = isCurrentSong && isPlaying;

  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const playlistDropdownRef = useRef(null);
  const shareDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        playlistDropdownRef.current &&
        !playlistDropdownRef.current.contains(e.target)
      ) {
        setShowPlaylistDropdown(false);
      }
      if (
        shareDropdownRef.current &&
        !shareDropdownRef.current.contains(e.target)
      ) {
        setShowShareDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const songTitle = song ? song.teluguTitle || song.title : "";
  const songSubtitle =
    song && (song.titleEnglish || song.title) !== songTitle
      ? ` (${song.titleEnglish || song.title})`
      : "";

  const handleShare = async () => {
    setShowShareDropdown(false);
    const shareUrl = getShareableSongUrl(song);
    const shareText = getShareableSongText(song);
    const shareTitle = getShareableSongTitle(song);

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.debug("Web Share API error:", err);
        }
      }
    }

    await handleCopyLink(shareUrl);
  };

  const handleCopyLink = async (url) => {
    const linkToCopy = url || getShareableSongUrl(song);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(linkToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = linkToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setToastMessage("Link copied!");
      setShowShareDropdown(false);
    } catch (err) {
      console.error("Clipboard write failed:", err);
      setToastMessage(
        "Could not copy. Select and copy the link from the address bar.",
      );
    }
    setTimeout(() => setToastMessage(""), 2500);
  };

  const getRawLyrics = (lang) => {
    if (!song) return "";
    if (lang === "english") {
      if (song.lyricsEnglish) {
        return Array.isArray(song.lyricsEnglish)
          ? song.lyricsEnglish.join("\n")
          : song.lyricsEnglish;
      }
      if (Array.isArray(song.lyrics)) {
        const matched = song.lyrics.find((l) => l.language === "en");
        if (matched) return matched.content || matched.text || "";
      }
      return "";
    } else {
      if (song.lyricsTelugu) {
        return Array.isArray(song.lyricsTelugu)
          ? song.lyricsTelugu.join("\n")
          : song.lyricsTelugu;
      }
      if (Array.isArray(song.lyrics)) {
        const matched = song.lyrics.find((l) => l.language === "te");
        if (matched) return matched.content || matched.text || "";
      }
      if (typeof song.lyrics === "string") return song.lyrics;
      return "";
    }
  };

  const handleCopyLyrics = async () => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      let lyricsText = "";
      let header = "";

      if (selectedLanguage === "telugu") {
        lyricsText = getRawLyrics("telugu");
        header = `YouWorship Lyrics: ${song.teluguTitle || song.title} (Telugu)\n\n`;
      } else if (selectedLanguage === "english") {
        lyricsText = getRawLyrics("english");
        header = `YouWorship Lyrics: ${song.titleEnglish || song.title} (English)\n\n`;
      } else {
        const teluguLyrics = getRawLyrics("telugu");
        const englishLyrics = getRawLyrics("english");

        if (teluguLyrics && englishLyrics && teluguLyrics !== englishLyrics) {
          const teluguLines = teluguLyrics
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
          const englishLines = englishLyrics
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
          const combined = [];
          const maxLen = Math.max(teluguLines.length, englishLines.length);
          for (let i = 0; i < maxLen; i++) {
            if (teluguLines[i]) combined.push(teluguLines[i]);
            if (englishLines[i]) combined.push(englishLines[i]);
            if (teluguLines[i] || englishLines[i]) combined.push("");
          }
          lyricsText = combined.join("\n");
          header = `YouWorship Lyrics: ${song.teluguTitle || song.title} - ${song.titleEnglish || song.title} (Bilingual)\n\n`;
        } else {
          lyricsText = teluguLyrics || englishLyrics;
          header = `YouWorship Lyrics: ${song.teluguTitle || song.title}\n\n`;
        }
      }

      try {
        await navigator.clipboard.writeText(header + lyricsText);
      } catch (e) {
        // clipboard fallback silent
      }
      setToastMessage(
        `Lyrics (${selectedLanguage === "dual" ? "bilingual" : selectedLanguage}) copied!`,
      );
      setTimeout(() => setToastMessage(""), 2000);
    }
  };

  useEffect(() => {
    let decodedId = id;
    try {
      decodedId = decodeURIComponent(id || "");
    } catch (e) {
      decodedId = id;
    }

    const targetNFC = (decodedId || "").normalize("NFC");
    const rawNFC = (id || "").normalize("NFC");
    const targetLower = targetNFC.toLowerCase();
    const rawLower = rawNFC.toLowerCase();

    // Check if current song state already matches target
    const currentSongMatches = song && (
      (song.id || "").normalize("NFC") === targetNFC ||
      (song.id || "").normalize("NFC") === rawNFC ||
      (song.slug || "").normalize("NFC") === targetNFC ||
      (song.slug || "").normalize("NFC") === rawNFC ||
      (song.slugEnglish || "").normalize("NFC") === targetNFC ||
      (song.slugEnglish || "").normalize("NFC") === rawNFC ||
      (song.title || "").normalize("NFC").toLowerCase() === targetLower ||
      (song.teluguTitle || "").normalize("NFC").toLowerCase() === targetLower ||
      (song.titleEnglish || "").normalize("NFC").toLowerCase() === targetLower
    );

    const foundSong =
      (currentSongMatches ? song : null) ||
      (initialSong && (
        (initialSong.id || "").normalize("NFC") === targetNFC ||
        (initialSong.slug || "").normalize("NFC") === targetNFC ||
        (initialSong.slugEnglish || "").normalize("NFC") === targetNFC
      ) ? initialSong : null) ||
      songs.find((s) => {
        const sIdNFC = (s.id || "").normalize("NFC");
        const sSlugNFC = (s.slug || "").normalize("NFC");
        const sSlugEnglishNFC = (s.slugEnglish || "").normalize("NFC");
        const sTitleNFC = (s.title || "").normalize("NFC");
        const sTeluguTitleNFC = (s.teluguTitle || "").normalize("NFC");
        const sTitleEngNFC = (s.titleEnglish || "").normalize("NFC");
        return (
          sIdNFC === targetNFC ||
          sIdNFC === rawNFC ||
          sSlugNFC === targetNFC ||
          sSlugNFC === rawNFC ||
          sSlugEnglishNFC === targetNFC ||
          sSlugEnglishNFC === rawNFC ||
          sTitleNFC === targetNFC ||
          sTitleNFC === rawNFC ||
          sTeluguTitleNFC === targetNFC ||
          sTeluguTitleNFC === rawNFC ||
          sTitleEngNFC === targetNFC ||
          sTitleEngNFC === rawNFC ||
          sSlugNFC.toLowerCase() === targetLower ||
          sSlugEnglishNFC.toLowerCase() === targetLower ||
          sTitleNFC.toLowerCase() === targetLower ||
          decodeURIComponent(sIdNFC) === targetNFC ||
          decodeURIComponent(sSlugNFC) === targetNFC
        );
      }) ||
      (currentSong &&
      ((currentSong.id || "").normalize("NFC") === targetNFC ||
        (currentSong.id || "").normalize("NFC") === rawNFC ||
        (currentSong.slug || "").normalize("NFC") === targetNFC ||
        (currentSong.slug || "").normalize("NFC") === rawNFC ||
        (currentSong.slugEnglish || "").normalize("NFC") === targetNFC ||
        (currentSong.slugEnglish || "").normalize("NFC") === rawNFC)
        ? currentSong
        : null);

    if (foundSong) {
      setSong(foundSong);
    }

    const hasFullLyrics = (s) => s && (
      (typeof s.lyricsTelugu === "string" && s.lyricsTelugu.trim().length > 0) ||
      (Array.isArray(s.lyricsTelugu) && s.lyricsTelugu.length > 0) ||
      (typeof s.lyricsEnglish === "string" && s.lyricsEnglish.trim().length > 0) ||
      (Array.isArray(s.lyricsEnglish) && s.lyricsEnglish.length > 0) ||
      (typeof s.lyrics === "string" && s.lyrics.trim().length > 0) ||
      (Array.isArray(s.lyrics) && s.lyrics.length > 0)
    );

    if (hasFullLyrics(foundSong)) {
      setLyricsLoading(false);
      return;
    }

    setLyricsLoading(true);
    fetchingRef.current = true;

    songService
      .getSongById(decodedId)
      .then((fetchedSong) => {
        if (fetchedSong) {
          setSong(fetchedSong);
          setLyricsLoading(false);
          if (typeof setSongs === "function") {
            setSongs((prevSongs) =>
              prevSongs.map((s) => (s.id === fetchedSong.id ? { ...s, ...fetchedSong } : s))
            );
          }
        } else {
          fetch(`/api/songs/${encodeURIComponent(decodedId)}`, {
            cache: "no-store",
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.song) {
                setSong(data.song);
                if (typeof setSongs === "function") {
                  setSongs((prevSongs) =>
                    prevSongs.map((s) => (s.id === data.song.id ? { ...s, ...data.song } : s))
                  );
                }
              }
              setLyricsLoading(false);
            })
            .catch(() => {
              setLyricsLoading(false);
            });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch song directly:", err);
        fetch(`/api/songs/${encodeURIComponent(decodedId)}`, {
          cache: "no-store",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.song) setSong(data.song);
            setLyricsLoading(false);
          })
          .catch(() => {
            setLyricsLoading(false);
          });
      })
      .finally(() => {
        fetchingRef.current = false;
      });
  }, [id, songs, currentSong, initialSong]);

  useEffect(() => {
    if (song) {
      const hasTelugu = !!(
        (typeof song.lyricsTelugu === "string" &&
          song.lyricsTelugu.trim().length > 0) ||
        (Array.isArray(song.lyricsTelugu) && song.lyricsTelugu.length > 0) ||
        (Array.isArray(song.lyrics) &&
          song.lyrics.some((l) => l.language === "te"))
      );
      setSelectedLanguage(hasTelugu ? "telugu" : "english");
    }
  }, [song]);

  const handlePlayClick = () => {
    playSong(song);
  };

  if (!song) {
    if (lyricsLoading || songsLoading) {
      return (
        <div className="flex-1 flex flex-col h-full bg-canvas items-center justify-center p-6 md:p-12">
          <LyricsSkeleton language={selectedLanguage || "telugu"} isImmersive={viewMode === "lyrics"} />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full bg-canvas">
        <Music className="w-12 h-12 text-dim mb-4" />
        <h2 className="text-xl font-bold text-title">Song not found</h2>
        <Link href="/" className="mt-4 text-sm text-amber-400 hover:underline">
          Return to home
        </Link>
      </div>
    );
  }

  const isFavorited = favorites.includes(song.id);
  const rawVideoUrl =
    song.media?.video || song.videoUrl || song.youtubeUrl || "";
  const embedUrl = formatVideoEmbedUrl(rawVideoUrl);
  const { r, g, b } = gradientColor;

  // 1. FULL CENTER SCREEN VIDEO VIEW (?view=video)
  if (viewMode === "video") {
    return (
      <div
        className="relative flex-1 flex flex-col h-full overflow-hidden bg-canvas transition-all duration-500 ease-out"
        style={{
          background: `radial-gradient(120% 120% at 50% 0%, rgba(${r},${g},${b},0.2) 0%, rgba(${Math.max(0, r - 30)},${Math.max(0, g - 30)},${Math.max(0, b - 30)},0.05) 45%, var(--canvas) 100%)`,
        }}
      >
        {/* Minimal back link */}
        <div className="p-6 flex items-center justify-between z-40">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-muted hover:text-title text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer bg-card hover:bg-card-hover px-3 py-1.5 rounded-full border border-line shadow-sm"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={() =>
              router.push(
                `/song/${encodeURIComponent(song.slug || song.id)}?view=lyrics`,
              )
            }
            className="flex items-center gap-1.5 text-muted hover:text-title text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer bg-card hover:bg-card-hover px-3.5 py-1.5 rounded-full border border-line shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-title" />
            <span>View Lyrics</span>
          </button>
        </div>

        {/* Center Main Screen Video Player */}
        <div className="flex-1 w-full flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden">
          {rawVideoUrl && embedUrl ? (
            <div className="w-full max-w-5xl space-y-4">
              <YouTubeVideoPlayer
                embedUrl={embedUrl}
                title={song.title}
                isPlaying={isPlaying}
              />
              <div className="text-center">
                <h2
                  className="text-xl md:text-2xl font-bold text-title font-song-title"
                >
                  {selectedLanguage === "english" ? (song.titleEnglish || song.title) : (song.teluguTitle || song.title)}
                </h2>
                {((selectedLanguage === "english"
                  ? (song.teluguTitle && song.teluguTitle !== (song.titleEnglish || song.title) ? song.teluguTitle : null)
                  : (song.titleEnglish && song.titleEnglish !== (song.teluguTitle || song.title) ? song.titleEnglish : null))) && (
                  <p className="text-xs text-muted/80 italic mt-0.5">
                    {selectedLanguage === "english" ? song.teluguTitle : song.titleEnglish}
                  </p>
                )}
                <p className="text-xs text-muted mt-1">
                  {selectedLanguage === "english"
                    ? (song.artistNameEnglish || song.artist)
                    : (song.artist === "Unknown Artist" ? "తెలియని కళాకారుడు" : (song.artistName || song.artist))}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center px-8 py-16">
              <div className="w-20 h-20 rounded-full bg-card border border-line flex items-center justify-center mb-5 shadow-sm">
                <YouTubeIcon className="w-9 h-9 text-muted" />
              </div>
              <h4 className="text-lg font-bold text-muted mb-2">
                No Video Available
              </h4>
              <p className="text-sm text-muted max-w-sm">
                A video for this track has not been added yet.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. FULL SCREEN IMMERSIVE LYRICS VIEW (?view=lyrics)
  if (viewMode === "lyrics") {
    const artistDisplayName =
      typeof song?.artist === "object"
        ? song.artist?.name
        : song?.artistName ||
          (song?.artist === "Unknown Artist"
            ? (selectedLanguage === "english" ? "Unknown Artist" : "తెలియని కళాకారుడు")
            : song?.artist) ||
          "";

    const teluguTitle = song.teluguTitle || song.title;
    const englishTitle = song.titleEnglish || song.title;
    const primaryTitle =
      selectedLanguage === "english" ? englishTitle : teluguTitle;

    return (
      <div
        className="relative flex-1 flex flex-col h-full overflow-hidden bg-canvas transition-all duration-500 ease-out"
        style={{
          background: `radial-gradient(120% 120% at 50% 0%, rgba(${r},${g},${b},0.2) 0%, rgba(${Math.max(0, r - 30)},${Math.max(0, g - 30)},${Math.max(0, b - 30)},0.05) 45%, var(--canvas) 100%)`,
        }}
      >
        {/* Sticky Top Header Bar */}
        <div className="px-3.5 sm:px-8 py-2.5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 z-40 bg-canvas/95 backdrop-blur-xl border-b border-line shadow-sm shrink-0">
          {/* Top Row on Mobile: Back button + Song Name & Author Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 w-full sm:w-auto flex-1">
            <button
              onClick={handleBack}
              className="p-1.5 sm:p-2 hover:bg-card-hover rounded-full text-dim hover:text-copy cursor-pointer transition-all duration-200 active:scale-95 flex-shrink-0"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col min-w-0 leading-tight">
              <h1 className="text-base sm:text-lg font-bold text-title tracking-tight font-song-title truncate">
                {primaryTitle}
              </h1>
              {artistDisplayName && (
                <p className="text-xs text-muted font-medium truncate mt-0.5">
                  {artistDisplayName}
                </p>
              )}
            </div>
          </div>

          {/* Bottom Row on Mobile (down of song & author name), Right side on Desktop */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 select-none w-full sm:w-auto">
            {/* Action Tools: Font size, Share, Add, Copy */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Font Size Controls — Custom a | A Pill Design */}
              <div
                className="flex items-center bg-card border border-line/60 rounded-xl px-1 py-0.5 shadow-sm h-8 md:h-9 shrink-0 select-none backdrop-blur-md"
                title="Adjust Font Size"
              >
                <button
                  type="button"
                  onClick={decreaseFontSize}
                  className="px-2 h-full flex items-center justify-center text-muted hover:text-title hover:bg-card-hover rounded-lg transition-all active:scale-90 cursor-pointer"
                  title="Decrease Font Size"
                  aria-label="Decrease Font Size"
                >
                  <span className="font-extrabold text-xs">a</span>
                </button>
                <div className="w-[1.5px] h-4 bg-amber-500/80 mx-0.5 rounded-full shrink-0" aria-hidden="true" />
                <button
                  type="button"
                  onClick={increaseFontSize}
                  className="px-2 h-full flex items-center justify-center text-muted hover:text-title hover:bg-card-hover rounded-lg transition-all active:scale-90 cursor-pointer"
                  title="Increase Font Size"
                  aria-label="Increase Font Size"
                >
                  <span className="font-black text-sm">A</span>
                </button>
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="p-1.5 md:p-2 rounded-full text-muted hover:text-title hover:bg-card-hover/60 transition-all cursor-pointer active:scale-90 shrink-0"
                title="Share song"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Add to Playlist Button */}
              <button
                onClick={() => setAddToPlaylistSong(song)}
                className="p-1.5 md:p-2 rounded-full text-muted hover:text-[#D4A32A] hover:bg-card-hover/60 transition-all cursor-pointer active:scale-90 shrink-0"
                title="Add to playlist"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Copy Lyrics Button */}
              <button
                onClick={handleCopyLyrics}
                className="p-1.5 md:p-2 rounded-full text-muted hover:text-title hover:bg-card-hover/60 transition-all cursor-pointer active:scale-90 shrink-0"
                title="Copy lyrics to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            {/* Language Segmented Toggle */}
            <LanguageSegmented
              selected={selectedLanguage}
              onChange={setSelectedLanguage}
              songLanguage={(song?.language || "").toLowerCase()}
              hasChords={Array.isArray(song?.chords) && song.chords.length > 0}
            />
          </div>
        </div>

        <SongLyrics
          song={song}
          isImmersive={true}
          isLyricsPage={true}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          fontSizeMultiplier={fontSizeMultiplier}
          loading={lyricsLoading}
        />

        {/* Share/Copy Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-24 right-8 bg-[#D4A32A] text-black px-4 py-2.5 rounded-xl text-xs font-black shadow-2xl flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-3">
            <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // 3. MAIN SONG DETAILS VIEW (DEFAULT)
  return (
    <div
      className="relative flex-1 min-h-0 flex flex-col overflow-y-auto bg-canvas text-copy min-w-0 font-lato"
      style={{
        background: isLight
          ? "none"
          : `radial-gradient(140% 80% at 50% 0%, rgba(${r},${g},${b},0.2) 0%, transparent 80%)`,
      }}
    >
      {/* Sticky Action Header Bar */}
      <div className="sticky top-0 z-30 flex flex-col bg-canvas/95 backdrop-blur-md border-b border-line/35 shadow-sm">
        {/* Main Header Row */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 md:px-8 py-2.5 sm:py-3">
          {/* Left Side: Back button + Titles */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-card-hover rounded-full text-dim hover:text-copy cursor-pointer transition-all duration-200 active:scale-95 flex-shrink-0"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col leading-tight min-w-0">
              <h1
                className="text-title text-base md:text-lg font-bold truncate font-song-title"
              >
                {selectedLanguage === "english" ? (song.titleEnglish || song.title) : (song.teluguTitle || song.title)}
              </h1>
              {song.artist && (
                <p className="text-[11px] text-muted truncate mt-0.5 font-semibold tracking-wide">
                  {selectedLanguage === "english"
                    ? `${song.teluguTitle && song.teluguTitle !== (song.titleEnglish || song.title) ? `${song.teluguTitle} • ` : ""}${song.artistNameEnglish || song.artist}`
                    : `${song.titleEnglish && song.titleEnglish !== (song.teluguTitle || song.title) ? `${song.titleEnglish} • ` : ""}${song.artist === "Unknown Artist" ? "తెలియని కళాకారుడు" : (song.artistName || song.artist)}`}
                </p>
              )}
            </div>
          </div>

          {/* Right Side: Action Icons Group */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0 select-none">
            <button
              onClick={handlePlayClick}
              className="w-9 h-9 rounded-full bg-title text-card flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer flex-shrink-0"
              title={isThisPlaying ? "Pause" : "Play"}
            >
              {isThisPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* 2. Favorite Button */}
            <ProtectedAction action={() => toggleFavorite(song.id)}>
              <button
                onClick={() => toggleFavorite(song.id)}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm flex-shrink-0 ${
                  isFavorited
                    ? "border-red-500/40 text-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                    : "border-line bg-card text-muted hover:text-title hover:bg-card-hover"
                }`}
                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart
                  className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`}
                />
              </button>
            </ProtectedAction>

            {/* 3. Add to Playlist Button */}
            <ProtectedAction
              action={() => setAddToPlaylistSong(song)}
            >
              <button
                onClick={() => setAddToPlaylistSong(song)}
                className="w-9 h-9 rounded-full bg-card hover:bg-card-hover border border-line text-muted hover:text-title flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer shadow-sm"
                title="Add to playlist"
              >
                <Plus className="w-4 h-4" />
              </button>
            </ProtectedAction>

            {/* 4. Watch Video Button */}
            {rawVideoUrl && embedUrl && (
              <Link
                href={`/song/${encodeURIComponent(song.slug || song.id)}?view=video`}
                onClick={() => {
                  if (currentSong?.id !== song.id) playSong(song);
                }}
                className="w-9 h-9 rounded-full border border-line bg-card text-muted hover:text-title hover:bg-card-hover flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm flex-shrink-0"
                title="Watch Video"
              >
                <YouTubeIcon className="w-4 h-4 text-red-400" />
              </Link>
            )}

            {/* 5. Share Button */}
            <div className="relative" ref={shareDropdownRef}>
              <button
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.share) {
                    handleShare();
                  } else {
                    setShowShareDropdown(!showShareDropdown);
                  }
                }}
                className="w-9 h-9 rounded-full bg-card hover:bg-card-hover border border-line text-muted hover:text-title flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer shadow-sm"
                title="Share song"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {showShareDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-card border border-line rounded-2xl shadow-xl py-1.5 z-50 w-48 font-sans animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-muted uppercase tracking-wider border-b border-line">
                    Share
                  </div>
                  <button
                    onClick={handleShare}
                    className="w-full px-3 py-2.5 text-xs text-copy hover:bg-card-hover text-left flex items-center gap-2.5 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-muted shrink-0" />
                    <span className="font-semibold text-title">Share</span>
                  </button>
                  <button
                    onClick={() => handleCopyLink()}
                    className="w-full px-3 py-2.5 text-xs text-copy hover:bg-card-hover text-left flex items-center gap-2.5 border-t border-line/35 cursor-pointer"
                  >
                    <LinkIcon className="w-4 h-4 text-muted shrink-0" />
                    <span className="font-semibold text-title">Copy Link</span>
                  </button>
                </div>
              )}
            </div>

            {/* 6. Copy Icon */}
            <button
              onClick={handleCopyLyrics}
              className="w-9 h-9 rounded-full bg-card hover:bg-card-hover border border-line text-muted hover:text-title flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer shadow-sm"
              title="Copy lyrics to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* 7. Song Options Menu */}
            <SongOptionsMenu song={song} triggerClassName="w-9 h-9 border border-line bg-card hover:bg-card-hover text-muted hover:text-title flex items-center justify-center shadow-sm" />
          </div>
        </div>
      </div>

      <div className="w-full px-6 md:px-8 pb-16 pt-2 space-y-8 flex-1 flex flex-col">
        {/* Lyrics Section */}
        <div className="space-y-4 pt-2 flex-1 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-[10px] font-bold text-muted uppercase tracking-[0.25em]">
              Lyrics
            </h3>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <LanguageSegmented
                selected={selectedLanguage}
                onChange={setSelectedLanguage}
                songLanguage={(song?.language || "").toLowerCase()}
                hasChords={Array.isArray(song?.chords) && song.chords.length > 0}
              />

              {/* Size & Full Screen Controls */}
              <div className="flex items-center bg-card-hover border border-line/60 rounded-full p-0.5 shadow-sm h-9 md:h-11 overflow-hidden shrink-0">
                <button
                  onClick={decreaseFontSize}
                  className="px-2.5 md:px-3 h-full flex items-center justify-center text-muted hover:text-title hover:bg-card/45 rounded-full transition-all cursor-pointer"
                  title="Decrease Font Size"
                >
                  <AArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={increaseFontSize}
                  className="px-2.5 md:px-3 h-full flex items-center justify-center text-muted hover:text-title hover:bg-card/45 rounded-full transition-all cursor-pointer"
                  title="Increase Font Size"
                >
                  <AArrowUp className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-4 bg-line/30 mx-1 shrink-0" />
                <button
                  onClick={toggleFullscreenLyrics}
                  className={`px-3 h-full flex items-center justify-center transition-all cursor-pointer rounded-full hover:bg-card/45 ${
                    isFullscreenLyrics
                      ? "text-amber-500 font-bold"
                      : "text-muted hover:text-title"
                  }`}
                  title="Toggle Fullscreen Lyrics"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-4 bg-line/30 mx-1 shrink-0" />
                <button
                  onClick={() => setAddToPlaylistSong(song)}
                  className="px-3 h-full flex items-center justify-center text-muted hover:text-[#D4A32A] hover:bg-card/45 rounded-full transition-all cursor-pointer"
                  title="Add to Playlist"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={lyricsContainerRef}
            className={`relative flex flex-col flex-1 min-h-0 rounded-2xl overflow-hidden border border-line bg-card shadow-sm transition-all ${
              isFullscreenLyrics ? "p-6 md:p-12 bg-card" : ""
            }`}
          >
            {isFullscreenLyrics && (
              <button
                onClick={toggleFullscreenLyrics}
                className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-card/90 backdrop-blur-md border border-line/60 hover:bg-card-hover text-dim hover:text-title text-[11px] font-bold rounded-full px-3 py-1.5 shadow-lg transition-all cursor-pointer active:scale-95"
                title="Exit Fullscreen"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </button>
            )}
            <SongLyrics
              song={song}
              isImmersive={true}
              selectedLanguage={selectedLanguage}
              setSelectedLanguage={setSelectedLanguage}
              fontSizeMultiplier={fontSizeMultiplier}
              loading={lyricsLoading}
            />
          </div>
        </div>
      </div>

      {/* Share/Copy Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-8 bg-[#D4A32A] text-black px-4 py-2.5 rounded-xl text-xs font-black shadow-2xl flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-3">
          <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
