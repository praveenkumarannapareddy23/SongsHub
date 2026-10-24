"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { SongRowSkeleton } from "../ui/SongSkeleton";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Plus,
  Share2,
  Check,
  Heart,
  Download,
  VolumeX,
} from "lucide-react";
import SongCard from "./SongCard";
import SongArtwork from "../ui/SongArtwork";
import { useAudio } from "@/context/audio-context";
import CategoryPlaylistTable from "../categories/CategoryPlaylistTable";
import { useRouter } from "next/navigation";
import { SongsSectionSkeleton } from "../ui/SongSkeleton";
import { AnimatePresence, motion } from "framer-motion";

const TELUGU_ALPHABET_ORDER = [
  "అ",
  "ఆ",
  "ఇ",
  "ఈ",
  "ఉ",
  "ఊ",
  "ఋ",
  "ౠ",
  "ఎ",
  "ఏ",
  "ఐ",
  "ఒ",
  "ఓ",
  "ఔ",
  "అం",
  "అః",
  "క",
  "ఖ",
  "గ",
  "ఘ",
  "ఙ",
  "చ",
  "ఛ",
  "జ",
  "ఝ",
  "ఞ",
  "ట",
  "ఠ",
  "డ",
  "ఢ",
  "ణ",
  "త",
  "థ",
  "ద",
  "ధ",
  "న",
  "ప",
  "ఫ",
  "బ",
  "భ",
  "మ",
  "య",
  "ర",
  "ల",
  "వ",
  "శ",
  "ష",
  "స",
  "హ",
  "ళ",
  "క్ష",
  "ఱ",
];

function teluguSort(a, b) {
  const o = TELUGU_ALPHABET_ORDER;
  const idxA = o.indexOf(a);
  const idxB = o.indexOf(b);


  if (idxA !== -1 && idxB !== -1) {
    return idxA - idxB;
  }
  if (idxA !== -1) return -1;
  if (idxB !== -1) return 1;


  return a.localeCompare(b);
}

const HINDI_ALPHABET_ORDER = [
  "अ", "आ", "इ", "ई", "उ", "ऊ", "ऋ", "ए", "ऐ", "ओ", "औ", "अं", "अः",
  "क", "ख", "ग", "घ", "ङ",
  "च", "छ", "ज", "झ", "ञ",
  "ट", "ठ", "ड", "ढ", "ण",
  "त", "थ", "द", "ध", "न",
  "प", "फ", "ब", "भ", "म",
  "य", "र", "ल", "व",
  "श", "ष", "स", "ह",
  "क्ष", "त्र", "ज्ञ"
];

function hindiSort(a, b) {
  const o = HINDI_ALPHABET_ORDER;
  const idxA = o.indexOf(a);
  const idxB = o.indexOf(b);

  if (idxA !== -1 && idxB !== -1) {
    return idxA - idxB;
  }
  if (idxA !== -1) return -1;
  if (idxB !== -1) return 1;

  return a.localeCompare(b);
}

const TAMIL_ALPHABET_ORDER = [
  "அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ",
  "க", "ச", "ஜ", "ஞ", "ட", "த", "ந", "ப", "ம", "ய", "ர", "ற", "ல", "வ", "ஷ", "ஸ", "ஹ"
];

function tamilSort(a, b) {
  const o = TAMIL_ALPHABET_ORDER;
  const idxA = o.indexOf(a);
  const idxB = o.indexOf(b);

  if (idxA !== -1 && idxB !== -1) {
    return idxA - idxB;
  }
  if (idxA !== -1) return -1;
  if (idxB !== -1) return 1;

  return a.localeCompare(b);
}

const ALPHABETS_MAP = {
  telugu: TELUGU_ALPHABET_ORDER,
  hindi: HINDI_ALPHABET_ORDER,
  tamil: TAMIL_ALPHABET_ORDER,
  english: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
};

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
  "\u0C05": "from-amber-600 to-amber-900",
  "\u0C06": "from-orange-600 to-orange-900",
  "\u0C07": "from-yellow-600 to-yellow-900",
  "\u0C08": "from-lime-600 to-lime-900",
  "\u0C09": "from-green-600 to-green-900",
  "\u0C0A": "from-emerald-600 to-emerald-900",
  "\u0C0E": "from-teal-600 to-teal-900",
  "\u0C0F": "from-cyan-600 to-cyan-900",
  "\u0C10": "from-sky-600 to-sky-900",
  "\u0C12": "from-blue-600 to-blue-900",
  "\u0C13": "from-indigo-600 to-indigo-900",
  "\u0C15": "from-violet-600 to-violet-900",
  "\u0C16": "from-purple-600 to-purple-900",
  "\u0C17": "from-fuchsia-600 to-fuchsia-900",
  "\u0C18": "from-pink-600 to-pink-900",
  "\u0C1A": "from-rose-600 to-rose-900",
  "\u0C1C": "from-red-500 to-rose-900",
  "\u0C21": "from-orange-500 to-amber-900",
  "\u0C24": "from-yellow-500 to-lime-900",
  "\u0C26": "from-green-500 to-emerald-900",
  "\u0C27": "from-teal-500 to-cyan-900",
  "\u0C28": "from-sky-500 to-blue-900",
  "\u0C2A": "from-indigo-500 to-violet-900",
  "\u0C2B": "from-purple-500 to-fuchsia-900",
  "\u0C2C": "from-pink-500 to-rose-900",
  "\u0C2D": "from-red-600 to-red-900",
  "\u0C2E": "from-orange-600 to-orange-900",
  "\u0C2F": "from-amber-600 to-amber-900",
  "\u0C30": "from-yellow-600 to-yellow-900",
  "\u0C32": "from-lime-600 to-lime-900",
  "\u0C35": "from-green-600 to-green-900",
  "\u0C36": "from-emerald-600 to-emerald-900",
  "\u0C37": "from-teal-600 to-teal-900",
  "\u0C38": "from-cyan-600 to-cyan-900",
  "\u0C39": "from-sky-600 to-sky-900",
};

function getLetterGradient(letter) {
  return letterGradients[letter] || "from-slate-600 to-slate-900";
}


export default function SongsSection({
  songs,
  songsLoading,
  currentSong,
  isPlaying,
  playSong,
  selectedLetter,
  setSelectedLetter,
}) {
  const router = useRouter();
  const sectionRefs = useRef({});
  const scrollRefs = useRef({});
  const [scriptLang, setScriptLang] = useState(() => {
    // Auto-detect script from initial selectedLetter
    if (selectedLetter) {
      if (/[\u0C00-\u0C7F]/.test(selectedLetter)) return "telugu";
      if (/[\u0900-\u097F]/.test(selectedLetter)) return "hindi";
      if (/[\u0B80-\u0BFF]/.test(selectedLetter)) return "tamil";
      if (/[A-Z]/i.test(selectedLetter)) return "english";
    }
    // Default to Telugu so Telugu songs show first
    return "telugu";
  });
 
  // State hooks for Spotify-style letter detail views
  const {
    playlists,
    addSongToPlaylist,
    setAddToPlaylistSong,
    favorites,
    toggleFavorite,
    showFullHome,
    setShowFullHome,
    setActiveTab,
    sections,
    sectionsLoading,
    initializeAlphabeticalSections,
    showAllSongsForLetter,
    currentSectionLetter,
    setCurrentSectionLetter,
    lastViewedSongId,
    lastListScrollPos,
    setLastListScrollPos,
    recordSongNavigation,
  } = useAudio();
 
  const [viewMode, setViewMode] = useState("playlist"); // "playlist" | "cards"
  const [isShared, setIsShared] = useState(false);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [scrollStates, setScrollStates] = useState({});
  const [pendingScrollToLetter, setPendingScrollToLetter] = useState(null);
  const [activeLetter, setActiveLetter] = useState(null);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);

  const increaseSongFontSize = () => setFontSizeMultiplier((prev) => Math.min(prev + 0.15, 1.4));
  const decreaseSongFontSize = () => setFontSizeMultiplier((prev) => Math.max(prev - 0.15, 0.8));
 
  useEffect(() => {
    if (!songsLoading) {
      initializeAlphabeticalSections(scriptLang);
    }
  }, [initializeAlphabeticalSections, scriptLang, songsLoading]);
 
  // Auto-switch scriptLang when a letter is clicked
  useEffect(() => {
    if (selectedLetter) {
      if (setCurrentSectionLetter) setCurrentSectionLetter(selectedLetter);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("yw_selected_letter", selectedLetter);
        } catch (e) {}
      }
      // Detect if the selected letter is Telugu, Hindi, Tamil, or English
      if (/[\u0C00-\u0C7F]/.test(selectedLetter)) {
        setScriptLang("telugu");
      } else if (/[\u0900-\u097F]/.test(selectedLetter)) {
        setScriptLang("hindi");
      } else if (/[\u0B80-\u0BFF]/.test(selectedLetter)) {
        setScriptLang("tamil");
      } else if (/[A-Z]/i.test(selectedLetter)) {
        setScriptLang("english");
      }
    }
  }, [selectedLetter, setCurrentSectionLetter]);

  useEffect(() => {
    if (selectedLetter && sections[selectedLetter] && !sections[selectedLetter].showAll && !sections[selectedLetter].loading) {
      showAllSongsForLetter(selectedLetter);
    }
  }, [selectedLetter, sections, showAllSongsForLetter]);
 
  const hasRestoredScrollRef = useRef(false);
  const prevSelectedLetterRef = useRef(selectedLetter);

  // Sync scroll position & default views on selectedLetter change
  useEffect(() => {
    setViewMode("playlist");
    if (prevSelectedLetterRef.current !== selectedLetter) {
      prevSelectedLetterRef.current = selectedLetter;
      hasRestoredScrollRef.current = false;
      let hasSavedPos = false;
      try {
        hasSavedPos = Boolean(
          lastListScrollPos ||
          (typeof window !== "undefined" && sessionStorage.getItem("yw_last_scroll_pos"))
        );
      } catch (e) {}

      if (!hasSavedPos) {
        const scrollable = document.querySelector(".overflow-y-auto");
        if (scrollable) {
          scrollable.scrollTop = 0;
        }
      }
    }
  }, [selectedLetter, lastListScrollPos]);
 
  // Click-outside dropdown closer
  useEffect(() => {
    const handleCloseMenu = () => {
      setShowPlaylistDropdown(false);
    };
    window.addEventListener("click", handleCloseMenu);
    return () => window.removeEventListener("click", handleCloseMenu);
  }, []);
 
  const updateLetterScroll = (letter) => {
    const el = scrollRefs.current[letter];
    if (el) {
      setScrollStates((prev) => ({
        ...prev,
        [letter]: {
          left: el.scrollLeft > 10,
          right: el.scrollLeft < el.scrollWidth - el.clientWidth - 10,
        },
      }));
    }
  };
 
  // Sections are already filtered by language in initializeAlphabeticalSections
  const getFilteredSongsForLetter = useCallback((letter) => {
    const letterSec = sections[letter];
    if (!letterSec) return [];
    if (letterSec.allSongs && letterSec.allSongs.length > 0) return letterSec.allSongs;
    return letterSec.songs || [];
  }, [sections]);
 
  const detailSongs = useMemo(() => {
    return selectedLetter ? getFilteredSongsForLetter(selectedLetter) : [];
  }, [selectedLetter, getFilteredSongsForLetter]);
 
  const availableLetters = useMemo(() => {
    const validLetters = new Set(ALPHABETS_MAP[scriptLang] || TELUGU_ALPHABET_ORDER);
    return Object.keys(sections)
      .filter((letter) => {
        return validLetters.has(letter) && getFilteredSongsForLetter(letter).length > 0;
      })
      .sort((a, b) => {
        if (scriptLang === "telugu") return teluguSort(a, b);
        if (scriptLang === "hindi") return hindiSort(a, b);
        if (scriptLang === "tamil") return tamilSort(a, b);
        return a.localeCompare(b);
      });
  }, [sections, getFilteredSongsForLetter, scriptLang]);
 
  useEffect(() => {
    const timer = setTimeout(() => {
      availableLetters.forEach((letter) => {
        updateLetterScroll(letter);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [availableLetters]);
 
  // Restore scroll position when detailSongs load for selected letter
  useEffect(() => {
    if (!selectedLetter || detailSongs.length === 0) return;
    if (hasRestoredScrollRef.current) return;

    let targetScroll = lastListScrollPos;
    if (!targetScroll && typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("yw_last_scroll_pos");
        if (stored) targetScroll = parseInt(stored, 10);
      } catch (e) {}
    }

    const timer = setTimeout(() => {
      const scrollable = document.querySelector(".overflow-y-auto");
      if (scrollable && targetScroll && targetScroll > 0) {
        scrollable.scrollTop = targetScroll;
        hasRestoredScrollRef.current = true;
      }

      if (lastViewedSongId) {
        const el = document.querySelector('[data-last-viewed="true"]');
        if (el) {
          el.scrollIntoView({ block: "nearest", behavior: "smooth" });
          hasRestoredScrollRef.current = true;
        }
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [selectedLetter, detailSongs, lastListScrollPos, lastViewedSongId]);

  // Restore scroll position when browsing full home list
  useEffect(() => {
    if (selectedLetter) return;
    if (songsLoading || songs.length === 0) return;
    if (hasRestoredScrollRef.current) return;

    let targetScroll = lastListScrollPos;
    if (!targetScroll && typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("yw_last_scroll_pos");
        if (stored) targetScroll = parseInt(stored, 10);
      } catch (e) {}
    }

    if (targetScroll && targetScroll > 0) {
      const timer = setTimeout(() => {
        const scrollable = document.querySelector(".overflow-y-auto");
        if (scrollable) {
          scrollable.scrollTop = targetScroll;
          hasRestoredScrollRef.current = true;
        }
        if (lastViewedSongId) {
          const el = document.querySelector('[data-last-viewed="true"]');
          if (el) {
            el.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [selectedLetter, songsLoading, songs, lastListScrollPos, lastViewedSongId]);

  const scrollRow = (letter, direction) => {
    const el = scrollRefs.current[letter];
    if (el) {
      const scrollAmt = 300;
      el.scrollLeft += direction === "left" ? -scrollAmt : scrollAmt;
    }
  };
 
  const openLetterDetail = (letter) => {
    setSelectedLetter(letter);
    if (setCurrentSectionLetter) setCurrentSectionLetter(letter);
    if (setLastListScrollPos) setLastListScrollPos(0);
    try {
      sessionStorage.setItem("yw_selected_letter", letter);
      sessionStorage.removeItem("yw_last_scroll_pos");
    } catch (e) {}
    router.push(`/?tab=songs&letter=${encodeURIComponent(letter)}`, { scroll: false });
  };

  const handleLetterClick = (letter) => {
    if (showFullHome) {
      if (activeLetter === letter) {
        setActiveLetter(null);
      } else {
        setActiveLetter(letter);
      }

      const letterIdx = availableLetters.indexOf(letter);
      if (letterIdx >= 0) {
        if (letterIdx >= visibleCount) {
          setVisibleCount(letterIdx + 1 + BATCH_SIZE);
        }
        setPendingScrollToLetter(letter);

        const el = sectionRefs.current[letter];
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      return;
    }

    if (selectedLetter === letter) {
      setSelectedLetter(null);
      if (setCurrentSectionLetter) setCurrentSectionLetter(null);
      if (setLastListScrollPos) setLastListScrollPos(0);
      try {
        sessionStorage.removeItem("yw_selected_letter");
        sessionStorage.removeItem("yw_last_scroll_pos");
      } catch (e) {}
      router.push("/?tab=songs", { scroll: false });
      return;
    }
    setSelectedLetter(letter);
    if (setCurrentSectionLetter) setCurrentSectionLetter(letter);
    if (setLastListScrollPos) setLastListScrollPos(0);
    try {
      sessionStorage.setItem("yw_selected_letter", letter);
      sessionStorage.removeItem("yw_last_scroll_pos");
    } catch (e) {}
    router.push(`/?tab=songs&letter=${encodeURIComponent(letter)}`, { scroll: false });
  };

  const handleShare = () => {
    setIsShared(true);
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(
        `${window.location.origin}/?tab=discover&letter=${selectedLetter}`,
      );
    }
    setTimeout(() => setIsShared(false), 2000);
  };
 
  const handlePlayAll = () => {
    const letterSongs = detailSongs;
    if (letterSongs.length > 0) {
      playSong(letterSongs[0], selectedLetter, 0, letterSongs);
    }
  };
 
  // ── Progressive infinite scroll ──────────────────────────────────
  const INITIAL_VISIBLE = 5;
  const BATCH_SIZE = 4;
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const sentinelRef = useRef(null);

  // IntersectionObserver for progressive section loading
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || selectedLetter) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + BATCH_SIZE);
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [selectedLetter, availableLetters.length, visibleCount]);

  // Scroll to pending letter once rendered
  useEffect(() => {
    if (pendingScrollToLetter) {
      const timer = setTimeout(() => {
        const el = sectionRefs.current[pendingScrollToLetter];
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          setPendingScrollToLetter(null);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [pendingScrollToLetter, visibleCount]);

  // Show skeleton only while songs are loading.
  // Don't block on empty sections — they may be empty when no songs
  // match the selected language filter (see initializeAlphabeticalSections).
  if (songsLoading) {
    return <SongsSectionSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="relative bg-card/95 backdrop-blur-md -mt-4 pt-3.5 md:pt-4 -mx-4 px-3 md:px-4 pb-2.5 md:pb-3.5 border-b border-line/35 shadow-md mb-3 flex flex-col gap-3">
        {/* Top Header Row: Script Selector */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Immersive Script Selector */}
          <div className="flex bg-card-hover/60 p-0.5 rounded-xl border border-line self-start shadow-inner">
            <button
              onClick={() => {
                setScriptLang("telugu");
                setSelectedLetter(null);
                setActiveLetter(null);
                if (setCurrentSectionLetter) setCurrentSectionLetter(null);
                initializeAlphabeticalSections("telugu");
              }}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                scriptLang === "telugu"
                  ? "bg-white text-black shadow-sm font-black"
                  : "text-muted hover:text-title"
              }`}
            >
              Telugu (తెలుగు)
            </button>
            <button
              onClick={() => {
                setScriptLang("english");
                setSelectedLetter(null);
                setActiveLetter(null);
                if (setCurrentSectionLetter) setCurrentSectionLetter(null);
                initializeAlphabeticalSections("english");
              }}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                scriptLang === "english"
                  ? "bg-white text-black shadow-sm font-black"
                  : "text-muted hover:text-title"
              }`}
            >
              English (A-Z)
            </button>
            <button
              onClick={() => {
                setScriptLang("hindi");
                setSelectedLetter(null);
                setActiveLetter(null);
                if (setCurrentSectionLetter) setCurrentSectionLetter(null);
                initializeAlphabeticalSections("hindi");
              }}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                scriptLang === "hindi"
                  ? "bg-white text-black shadow-sm font-black"
                  : "text-muted hover:text-title"
              }`}
            >
              Hindi (हिन्दी)
            </button>
          </div>
        </div>

        {/* Letters Scroll List */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {availableLetters.map((letter) => (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-sm md:text-base font-black transition-all shrink-0 cursor-pointer ${
                /[A-Z]/.test(letter) ? "font-sans" : (typeof letter === "string" && /[\u0C00-\u0C7F]/.test(letter) ? "font-telugu" : "")
              } ${
                (showFullHome ? activeLetter === letter : selectedLetter === letter)
                  ? "bg-title text-canvas scale-105 shadow-sm"
                  : "bg-card-hover text-title/90 hover:bg-line/60"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {sectionsLoading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3 text-muted">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-title"></div>
          <span className="text-xs font-semibold">Loading alphabetical sections...</span>
        </div>
      ) : availableLetters.length === 0 ? (
        <div className="p-12 text-center text-muted">
          <span className="font-semibold block text-copy">No songs found</span>
          <span className="text-xs block mt-1">
            Try adjusting your search or browse a different category.
          </span>
        </div>
      ) : selectedLetter ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                setSelectedLetter(null);
                setActiveLetter(null);
                if (setCurrentSectionLetter) setCurrentSectionLetter(null);
                if (typeof window !== "undefined") {
                  try {
                    sessionStorage.removeItem("yw_selected_letter");
                  } catch (e) {}
                }
                if (setShowFullHome) setShowFullHome(true);
                if (setActiveTab) setActiveTab("discover");
                router.push("/?tab=discover");
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-title transition-all duration-150 cursor-pointer self-start"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back to Browse
            </button>
          </div>

          {/* Dynamic Fading Color Banner (matched CategoryDetails) */}
          <div className="relative w-full pt-16 pb-6 px-6 md:px-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end select-none overflow-hidden bg-gradient-to-b from-[#312e81]/25 to-[#070707] rounded-2xl border border-line shadow-md">
            {/* Letter Cover Art Card */}
            <div className={`w-44 h-44 md:w-48 md:h-48 rounded-md bg-gradient-to-br ${getLetterGradient(selectedLetter)} flex items-center justify-center text-title font-bold text-5xl md:text-6xl tracking-tight select-none border border-line shadow-[0_8px_24px_rgba(0,0,0,0.5)] shrink-0`}>              
              {selectedLetter}
            </div>

            {/* Banner details */}
            <div className="flex-1 text-center md:text-left z-10 flex flex-col justify-end">
              <span className="text-[11px] font-bold text-title uppercase tracking-widest block mb-1">
                Alphabet Browser
              </span>
              <h1
                className={`text-title text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none mb-3 drop-shadow-md ${/[A-Z]/.test(selectedLetter) ? "" : (typeof selectedLetter === "string" && /[\u0C00-\u0C7F]/.test(selectedLetter) ? "font-telugu" : "")}`}
              >
                Songs starting with &ldquo;{selectedLetter}&rdquo;
              </h1>
              <p className="text-xs md:text-sm text-muted max-w-xl mb-4 leading-relaxed font-medium">
                Browse Christian worship songs starting with the alphabet letter{" "}
                {selectedLetter}.
              </p>
              <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-title/90 font-bold">
                <span>YouWorship</span>
                <span className="text-muted/50">&bull;</span>
                <span className="text-muted font-medium">
                  {scriptLang === "telugu" ? "Telugu" : scriptLang === "hindi" ? "Hindi" : "English"}
                </span>
                <span className="text-muted/50">&bull;</span>
                <span>
                  {detailSongs.length} track
                  {detailSongs.length !== 1 && "s"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar (Situated below colored banner per Spotify layout) */}
          <div className="flex items-center justify-between px-2 py-2 select-none">
            <div className="flex items-center gap-6">
              {/* Play Button (Spotify Round Play circle) */}
              <button
                onClick={handlePlayAll}
                className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
                title="Play All"
              >
                <Play className="w-6 h-6 fill-current text-black ml-0.5" />
              </button>

              {/* Add to Playlist button */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPlaylistDropdown(!showPlaylistDropdown);
                  }}
                  className="p-2 rounded-full transition-colors cursor-pointer text-muted hover:text-title"
                  title="Add Letter Songs to Playlist"
                >
                  <Plus className="w-6 h-6" />
                </button>

                {showPlaylistDropdown && (
                  <div className="absolute left-0 top-[110%] bg-dropdown border border-line rounded-xl shadow-2xl z-50 py-2 w-48 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
                    <span className="text-[9px] font-bold text-muted uppercase tracking-wider px-4 py-1.5 block border-b border-line mb-1">
                      Add to Playlist
                    </span>
                    {playlists.length === 0 ? (
                      <span className="text-xs text-muted px-4 py-2 block">
                        No playlists created
                      </span>
                    ) : (
                      playlists.map((list) => (
                        <button
                          key={list.id}
                          onClick={() => {
                            const letterSongs = detailSongs;
                            letterSongs.forEach((song) => {
                              if (!list.songIds.includes(song.id)) {
                                addSongToPlaylist(list.id, song.id);
                              }
                            });
                            setShowPlaylistDropdown(false);
                            alert(
                              `Added ${letterSongs.length} songs to "${list.name}"`,
                            );
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-title hover:bg-card-hover transition-colors cursor-pointer"
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
                {isShared ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Share2 className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* View layout toggler */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setViewMode(viewMode === "playlist" ? "cards" : "playlist")
                }
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

          {/* Tracklist or Song Grid */}
          <div className="relative min-h-[250px]">
            <AnimatePresence mode="wait">
              {viewMode === "cards" ? (
                <motion.div
                  key="grid-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
                >
                  {detailSongs.map((song, index) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      currentSong={currentSong}
                      isPlaying={isPlaying}
                      playSong={(s) => playSong(s, selectedLetter, index, detailSongs)}
                      language={scriptLang}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="playlist-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <CategoryPlaylistTable
                    category={{
                      id: `letter-${selectedLetter}`,
                      nameTe: `అక్షరం "${selectedLetter}"`,
                      nameEn: `Letter "${selectedLetter}"`,
                    }}
                    songs={detailSongs}
                    language={scriptLang}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className={showFullHome ? "space-y-6" : "space-y-8"}>
          {availableLetters.slice(0, visibleCount).map((letter) => {
            const letterSec = sections[letter];
            if (!letterSec) return null;
            const letterSongs = getFilteredSongsForLetter(letter);
            if (letterSongs.length === 0) return null;

            return (
              <div
                key={letter}
                ref={(el) => {
                  sectionRefs.current[letter] = el;
                }}
                data-letter={letter}
                className="scroll-mt-24"
              >
                {showFullHome ? (
                  <>
                    {/* Original Simple Header */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="text-2xl font-bold text-title font-sans"
                        >
                          {letter}
                        </span>
                        {letter === availableLetters[0] && (
                          <div
                            className="flex items-center bg-card-hover border border-line/60 rounded-xl px-1 py-0.5 shadow-sm h-8 shrink-0 select-none ml-1"
                            title="Adjust Letter Size"
                          >
                            <button
                              type="button"
                              onClick={decreaseSongFontSize}
                              className="px-2 h-full flex items-center justify-center text-muted hover:text-title hover:bg-card rounded-lg transition-all active:scale-90 cursor-pointer"
                              title="Decrease Letter Size"
                              aria-label="Decrease Letter Size"
                            >
                              <span className="font-extrabold text-xs">a</span>
                            </button>
                            <div className="w-[1.5px] h-3.5 bg-amber-500/80 mx-0.5 rounded-full shrink-0" aria-hidden="true" />
                            <button
                              type="button"
                              onClick={increaseSongFontSize}
                              className="px-2 h-full flex items-center justify-center text-muted hover:text-title hover:bg-card rounded-lg transition-all active:scale-90 cursor-pointer"
                              title="Increase Letter Size"
                              aria-label="Increase Letter Size"
                            >
                              <span className="font-black text-sm">A</span>
                            </button>
                          </div>
                        )}
                        <span className="text-xs text-muted/80 font-medium ml-1">
                          ({letterSongs.length})
                        </span>
                      </div>
                      <button
                        onClick={() => openLetterDetail(letter)}
                        className="text-xs font-bold text-handle hover:text-title transition-colors cursor-pointer"
                      >
                        Show all
                      </button>
                    </div>

                    {/* Original Horizontal Scrolling Row */}
                    <div className="relative isolate group/row flex flex-col">
                      {/* Left overlay arrow */}
                      <button
                        onClick={() => scrollRow(letter, "left")}
                        className={`absolute left-2 top-[96px] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card/90 hover:bg-card-hover backdrop-blur-sm hover:scale-105 items-center justify-center text-title cursor-pointer opacity-0 group-hover/row:opacity-100 transition-all duration-200 border border-line shadow-xl hidden ${
                          scrollStates[letter]?.left ? "md:flex" : "md:hidden"
                        } animate-in fade-in zoom-in`}
                        title="Scroll Left"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <div
                        ref={(el) => {
                          scrollRefs.current[letter] = el;
                        }}
                        onScroll={() => updateLetterScroll(letter)}
                        className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth"
                      >
                        {letterSongs.map((song, index) => (
                          <SongCard
                            key={song.id}
                            song={song}
                            currentSong={currentSong}
                            isPlaying={isPlaying}
                            playSong={(s) => playSong(s, letter, index, letterSongs)}
                            size="md"
                            language={scriptLang}
                          />
                        ))}
                      </div>

                      {/* Right overlay arrow */}
                      <button
                        onClick={() => scrollRow(letter, "right")}
                        className={`absolute right-2 top-[96px] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card/90 hover:bg-card-hover backdrop-blur-sm hover:scale-105 items-center justify-center text-title cursor-pointer opacity-0 group-hover/row:opacity-100 transition-all duration-200 border border-line shadow-xl hidden ${
                          scrollStates[letter]?.right !== false
                            ? "md:flex"
                            : "md:hidden"
                        } animate-in fade-in zoom-in`}
                        title="Scroll Right"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>


                    </div>
                  </>
                ) : (
                  <>
                    {/* Linked Divider Header Row */}
                    <div className="flex items-center gap-3 mb-4 select-none px-1">
                      <div className="w-10 h-10 rounded-xl bg-card-hover border border-line flex items-center justify-center text-lg font-black text-title shadow-sm shrink-0">
                        {letter}
                      </div>
                      {letter === availableLetters[0] && (
                        <div
                          className="flex items-center bg-card-hover border border-line/60 rounded-xl px-1 py-0.5 shadow-sm h-9 shrink-0 select-none"
                          title="Adjust Letter Size"
                        >
                          <button
                            type="button"
                            onClick={decreaseSongFontSize}
                            className="px-2.5 h-full flex items-center justify-center text-muted hover:text-title hover:bg-card rounded-lg transition-all active:scale-90 cursor-pointer"
                            title="Decrease Letter Size"
                            aria-label="Decrease Letter Size"
                          >
                            <span className="font-extrabold text-xs">a</span>
                          </button>
                          <div className="w-[1.5px] h-4 bg-amber-500/80 mx-0.5 rounded-full shrink-0" aria-hidden="true" />
                          <button
                            type="button"
                            onClick={increaseSongFontSize}
                            className="px-2.5 h-full flex items-center justify-center text-muted hover:text-title hover:bg-card rounded-lg transition-all active:scale-90 cursor-pointer"
                            title="Increase Letter Size"
                            aria-label="Increase Letter Size"
                          >
                            <span className="font-black text-sm">A</span>
                          </button>
                        </div>
                      )}
                      <div className="flex-1 h-px bg-line/35" />
                      <button
                        onClick={() => openLetterDetail(letter)}
                        className="px-3.5 py-1.5 rounded-xl bg-card-hover border border-line text-xs font-black text-dim hover:text-title hover:border-line-muted transition-all shadow-sm shrink-0 select-none cursor-pointer"
                      >
                        {letterSongs.length}
                      </button>
                    </div>

                    {/* 2-Column Song List Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {letterSongs.map((song, index) => {
                        const isCurrent = currentSong?.id === song.id;
                        const isThisPlaying = isCurrent && isPlaying;
                        const isLastViewed = Boolean(
                          lastViewedSongId && (lastViewedSongId === song.id || lastViewedSongId === song.slug)
                        );

                        const handleLyricsNavigation = () => {
                          const scrollEl = document.querySelector(".overflow-y-auto");
                          const currentScrollPos = scrollEl ? scrollEl.scrollTop : 0;
                          const letterKey = selectedLetter || letter || song.teluguFirstLetter || song.firstLetter;
                          if (recordSongNavigation) {
                            recordSongNavigation(song.id, letterKey, currentScrollPos, scriptLang, 'browse');
                          }
                          router.push(`/song/${encodeURIComponent(song.slug || song.id)}?view=lyrics${letterKey ? `&letter=${encodeURIComponent(letterKey)}` : ""}`);
                        };

                        const rowClass = isLastViewed
                          ? `border-l-4 border-l-[#D4A32A] ${isCurrent ? "bg-amber-500/20 text-white" : "bg-amber-500/10 dark:bg-amber-500/15 text-title"} shadow-xs`
                          : isCurrent
                          ? "border-[#D4A32A]/50 bg-card-hover shadow-[0_0_15px_rgba(212,163,42,0.12)]"
                          : "border-line/50 hover:border-line bg-card/85 hover:bg-card-hover";

                        return (
                          <div
                            key={song.id}
                            aria-current={isLastViewed ? "true" : undefined}
                            data-last-viewed={isLastViewed ? "true" : undefined}
                            className={`group flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-150 cursor-pointer select-none ${rowClass}`}
                            onClick={() => {
                              playSong(song, letter, index, letterSongs);
                            }}
                          >
                            {/* Left: Square Artwork/Music icon + Middle: Titles */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLyricsNavigation();
                              }}
                              className="flex items-center gap-3 min-w-0 flex-1 pr-2 cursor-pointer"
                              title="View song lyrics & details"
                            >
                              <div className={`w-11 h-11 rounded-xl bg-[#161616] border overflow-hidden flex items-center justify-center shrink-0 shadow-inner text-muted group-hover:text-title ${
                                isLastViewed ? "border-[#D4A32A]" : "border-[#282828]"
                              }`}>
                                <SongArtwork
                                  song={song}
                                  className="w-full h-full object-cover"
                                  iconSize="w-5 h-5"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                  <span
                                    style={{ fontSize: `${0.875 * fontSizeMultiplier}rem` }}
                                    className={`font-bold block truncate leading-tight ${
                                      isCurrent ? "text-[#D4A32A]" : "text-title group-hover:text-[#D4A32A]"
                                    } ${
                                      scriptLang !== "english" && /[\u0C00-\u0C7F]/.test(song.teluguTitle || song.title) ? "font-telugu leading-snug" : ""
                                    }`}
                                  >
                                    {scriptLang === "english" ? (song.titleEnglish || song.title) : (song.teluguTitle || song.title)}
                                  </span>
                                  {isLastViewed && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 select-none shrink-0 shadow-xs">
                                      Last viewed
                                    </span>
                                  )}
                                  {!(song.audioUrl || song.media?.audio || song.youtubeId) && (
                                    <span title="Audio not available" className="text-xs select-none shrink-0">🔇</span>
                                  )}
                                </div>
                                <span className="text-xs text-muted block truncate leading-tight mt-0.5">
                                  {scriptLang === "english"
                                    ? song.teluguTitle || (typeof song.artist === "object" ? song.artist?.name : song.artist || "Unknown Artist")
                                    : song.titleEnglish || (typeof song.artist === "object" ? song.artist?.name : song.artist || "Unknown Artist")}
                                </span>
                              </div>
                            </div>

                            {/* Right: Circular Play Button (▷) + Add to Playlist (+) + Rounded Square Chevron Details Button (>) */}
                            <div className="flex items-center gap-1.5 shrink-0 select-none">
                              {/* Circular Play Button */}
                              {song.audioUrl || song.media?.audio || song.youtubeId ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playSong(song, letter, index, letterSongs);
                                  }}
                                  className={`w-8 h-8 rounded-full border border-line/60 hover:border-white hover:bg-white/10 flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                                    isThisPlaying
                                      ? "bg-[#D4A32A] text-black border-[#D4A32A]"
                                      : "text-muted hover:text-title"
                                  }`}
                                  title={isThisPlaying ? "Pause" : "Play"}
                                >
                                  {isThisPlaying ? (
                                    <Pause className="w-3.5 h-3.5 fill-current text-black" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                  )}
                                </button>
                              ) : (
                                <div className="w-8 h-8 rounded-full border border-line/30 flex items-center justify-center text-red-500/60 cursor-not-allowed" title="Lyrics only — No audio available">
                                  <VolumeX className="w-3.5 h-3.5" />
                                </div>
                              )}

                              {/* Add to Playlist (+) Button */}
                              <button
                                id="tour-song-card-playlist-btn"
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAddToPlaylistSong(song);
                                }}
                                className="w-8 h-8 rounded-lg border border-line/60 hover:border-[#D4A32A]/80 hover:bg-[#D4A32A]/10 text-muted hover:text-[#D4A32A] flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                title="Add to Playlist"
                              >
                                <Plus className="w-4 h-4" />
                              </button>

                              {/* Rounded Square Chevron Details Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLyricsNavigation();
                                }}
                                className="w-8 h-8 rounded-lg border border-line/60 hover:border-white hover:bg-white/10 text-muted hover:text-title flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                title="View song lyrics & details"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>


                  </>
                )}
              </div>
            );
          })}

          {/* Progressive loading: show skeleton placeholders for upcoming sections */}
          {visibleCount < availableLetters.length && (
            <>
              {Array.from({ length: Math.min(BATCH_SIZE, availableLetters.length - visibleCount) }).map((_, i) => (
                <SongRowSkeleton key={`skeleton-${i}`} />
              ))}
              <div ref={sentinelRef} className="h-4" />
            </>
          )}
        </div>
      )}
    </div>
  );
}
