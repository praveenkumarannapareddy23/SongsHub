"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "./auth-context";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/config";
import {
  updateFavorites,
  updatePlaylists,
  updateRecentlyPlayed,
  fetchUserPlaylists,
  createPlaylistDoc,
  updatePlaylistDoc,
  deletePlaylistDoc,
  joinPlaylistDoc,
  migrateLegacyPlaylists,
} from "@/lib/firestore-service";

const AudioContext = createContext(null);

function getDisplayArtist(song) {
  if (typeof song?.artist === "string" && song.artist.trim()) {
    return song.artist.trim();
  }

  if (typeof song?.artistName === "string" && song.artistName.trim()) {
    return song.artistName.trim();
  }

  if (typeof song?.artistObj?.name === "string" && song.artistObj.name.trim()) {
    return song.artistObj.name.trim();
  }

  if (
    typeof song?.artist === "object" &&
    typeof song.artist?.name === "string" &&
    song.artist.name.trim()
  ) {
    return song.artist.name.trim();
  }

  return "Unknown Artist";
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeSongForUi(song) {
  const artist = getDisplayArtist(song);

  return {
    ...song,
    id: String(song?.id || song?.slug || song?.title || crypto.randomUUID()),
    title: String(song?.title || song?.teluguTitle || "Untitled Song"),
    teluguTitle: song?.teluguTitle ? String(song.teluguTitle) : "",
    artist,
    artistName: artist,
    artistObj: song?.artistObj || { id: null, name: artist },
    album: song?.album ? String(song.album) : "",
    duration: song?.duration ? String(song.duration) : "0:00",
  };
}

const TELUGU_ENGLISH_MAP = {
  A: 'అ', B: 'బ', C: 'చ', D: 'ద', E: 'ఎ', F: 'ఫ', G: 'గ',
  H: 'హ', I: 'ఇ', J: 'జ', K: 'క', L: 'ల', M: 'మ', N: 'న',
  O: 'ఒ', P: 'ప', Q: 'క', R: 'ర', S: 'స', T: 'త', U: 'ఉ',
  V: 'వ', W: 'వ', X: 'క్ష', Y: 'య', Z: 'జ',
};

function isSongInLanguage(song, lang) {
  if (!song) return false;
  const songLang = (song.language || "").trim().toLowerCase();

  if (lang === "telugu") {
    if (songLang === "te" || songLang === "telugu") return true;
    if (songLang === "en" || songLang === "english" || songLang === "hi" || songLang === "hindi" || songLang === "ta" || songLang === "tamil") {
      return false;
    }
    const textToCheck = `${song.teluguTitle || ""} ${song.title || ""} ${song.lyrics || ""}`;
    return /[\u0C00-\u0C7F]/.test(textToCheck);
  }

  if (lang === "english") {
    if (songLang === "en" || songLang === "english") return true;
    if (songLang === "te" || songLang === "telugu" || songLang === "hi" || songLang === "hindi" || songLang === "ta" || songLang === "tamil") {
      return false;
    }
    const textToCheck = `${song.title || ""} ${song.teluguTitle || ""}`;
    return /[A-Za-z]/.test(song.title || "") && !/[\u0C00-\u0C7F\u0900-\u097F\u0B80-\u0BFF]/.test(textToCheck);
  }

  if (lang === "hindi") {
    if (songLang === "hi" || songLang === "hindi") return true;
    if (songLang === "te" || songLang === "telugu" || songLang === "en" || songLang === "english" || songLang === "ta" || songLang === "tamil") {
      return false;
    }
    return /[\u0900-\u097F]/.test(`${song.title || ""} ${song.lyrics || ""}`);
  }

  return true;
}

function getAlphabeticalKey(song, language) {
  if (language === "english") {
    const engTitle = song?.titleEnglish || song?.title || "";
    const first = engTitle.trim().charAt(0).toUpperCase();
    if (/[A-Z]/.test(first)) return first;
    return "#";
  }

  const nativePattern =
    language === "telugu"
      ? /[\u0C00-\u0C7F]/
      : language === "hindi"
        ? /[\u0900-\u097F]/
        : language === "tamil"
          ? /[\u0B80-\u0BFF]/
          : null;

  if (nativePattern) {
    const storedLetter = song?.teluguFirstLetter || song?.firstLetter || "";
    if (storedLetter && nativePattern.test(storedLetter.charAt(0))) {
      return storedLetter.charAt(0);
    }

    const nativeTitle = (language === "telugu" ? (song?.teluguTitle || song?.title) : (song?.title || song?.teluguTitle)) || "";
    const firstChar = nativeTitle.trim().charAt(0);
    if (nativePattern.test(firstChar)) return firstChar;

    if (language === "telugu") {
      const engFirst = (song?.title || song?.titleEnglish || "").trim().charAt(0).toUpperCase();
      if (TELUGU_ENGLISH_MAP[engFirst]) {
        return TELUGU_ENGLISH_MAP[engFirst];
      }
    }
  }

  const fallbackChar = song?.firstLetter || (song?.title || "").trim().charAt(0).toUpperCase();
  return fallbackChar || "#";
}

function isSongPlayable(song) {
  if (!song) return false;
  const audioUrl = song.audioUrl || song.media?.audio;
  const youtubeId = song.youtubeId;
  return !!(audioUrl || youtubeId);
}

export const AudioProvider = ({ children }) => {
  const { user, firestoreData, setFirestoreData } = useAuth();
  const userRef = useRef(user);
  const [songs, setSongs] = useState([]);
  const [songsLoading, setSongsLoading] = useState(true);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [queue, setQueue] = useState([]);
  const [originalQueue, setOriginalQueue] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [viewedSongId, setViewedSongId] = useState(null);
  // Persisted last viewed song ID to maintain visual highlight on return
  const [lastViewedSongId, setLastViewedSongId] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return sessionStorage.getItem("yw_last_viewed_song_id") || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Persisted list scroll offset to restore exact position when returning from lyrics
  const [lastListScrollPos, setLastListScrollPos] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const val = sessionStorage.getItem("yw_last_scroll_pos");
        return val ? parseInt(val, 10) : 0;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  });

  // Saves navigation context before opening song lyrics so Back returns seamlessly
  const recordSongNavigation = useCallback((songId, letter, scrollPos, lang, view) => {
    if (!songId) return;
    setLastViewedSongId(songId);
    setViewedSongId(songId);
    if (scrollPos !== undefined && scrollPos !== null) {
      setLastListScrollPos(scrollPos);
    }
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("yw_last_viewed_song_id", songId);
        if (scrollPos !== undefined && scrollPos !== null) {
          sessionStorage.setItem("yw_last_scroll_pos", String(scrollPos));
        }
        if (letter) {
          sessionStorage.setItem("yw_selected_letter", letter);
        }
        if (lang) {
          sessionStorage.setItem("yw_script_lang", lang);
        }
        if (view) {
          sessionStorage.setItem("yw_view_mode", view);
        }
      } catch (e) {}
    }
  }, []);

  // Clears navigation state when user explicitly returns to root browse
  const clearSongNavigationState = useCallback(() => {
    setLastViewedSongId(null);
    setViewedSongId(null);
    setLastListScrollPos(0);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("yw_last_viewed_song_id");
        sessionStorage.removeItem("yw_last_scroll_pos");
      } catch (e) {}
    }
  }, []);
  const [activeTab, setActiveTab] = useState("discover");
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [showFullHome, setShowFullHome] = useState(true);
  const [isMiniPlayerActive, setIsMiniPlayerActive] = useState(false);
  const [lyricsLanguage, setLyricsLanguage] = useState("telugu");
  const [addToPlaylistSong, setAddToPlaylistSong] = useState(null);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [collaboratingPlaylist, setCollaboratingPlaylist] = useState(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const [sections, setSections] = useState({});
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [hasEnteredApp, setHasEnteredApp] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isCookieSet = document.cookie.includes("yw_entered=1");
    const params = new URLSearchParams(window.location.search);
    const hasParams =
      params.has("tab") ||
      params.has("q") ||
      params.has("category") ||
      params.has("playlistId") ||
      params.has("auth") ||
      params.has("view") ||
      params.has("letter") ||
      params.has("app");
    const isNotRoot = window.location.pathname !== "/";

    if (isCookieSet || hasParams || isNotRoot) {
      setHasEnteredApp(true);
    }
  }, []);

  // ─── Pre-build alphabetical sections synchronously ─────────────
  // Called immediately when songs load so SongsSection never shows a spinner.
  const _prebuildSections = useCallback((songList, lang = 'telugu') => {
    const ALPHABETS = {
      english: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
      telugu: ['అ', 'ఆ', 'ఇ', 'ఈ', 'ఉ', 'ఊ', 'ఋ', 'ౠ', 'ఎ', 'ఏ', 'ఐ', 'ఒ', 'ఓ', 'ఔ', 'అం', 'అః', 'క', 'ఖ', 'గ', 'ఘ', 'ఙ', 'చ', 'ఛ', 'జ', 'ఝ', 'ఞ', 'ట', 'ఠ', 'డ', 'ఢ', 'ణ', 'త', 'థ', 'ద', 'ధ', 'న', 'ప', 'ఫ', 'బ', 'భ', 'మ', 'య', 'ర', 'ల', 'వ', 'శ', 'ష', 'స', 'హ', 'ళ', 'క్ష', 'ఱ'],
      hindi: ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ए', 'ऐ', 'ओ', 'औ', 'अं', 'अः', 'क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ', 'ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह', 'क्ष', 'त्र', 'ज्ञ'],
      tamil: ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'க', 'ச', 'ஜ', 'ஞ', 'ட', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ற', 'ல', 'வ', 'ஷ', 'ஸ', 'ஹ'],
    };
    const languageMap = {
      english: ['en', 'english'],
      telugu: ['te', 'telugu'],
      hindi: ['hi', 'hindi'],
      tamil: ['ta', 'tamil'],
    };
    const allowedLangs = languageMap[lang] || languageMap.english;
    const letters = ALPHABETS[lang] || ALPHABETS.english;
    const validLetters = new Set(letters);
    const BATCH_SIZE = 20;
    const grouped = {};
    songList.forEach(song => {
      if (!isSongInLanguage(song, lang)) return;
      const firstLetter = getAlphabeticalKey(song, lang);
      if (validLetters.has(firstLetter)) {
        if (!grouped[firstLetter]) grouped[firstLetter] = [];
        grouped[firstLetter].push(song);
      }
    });
    const newSections = {};
    letters.forEach(letter => {
      const allLetterSongs = grouped[letter] || [];
      if (allLetterSongs.length === 0) return;
      newSections[letter] = {
        songs: allLetterSongs.slice(0, BATCH_SIZE),
        lastDoc: null,
        hasMore: allLetterSongs.length > BATCH_SIZE,
        allSongs: allLetterSongs,
        showAll: false,
        loading: false,
      };
    });
    setSections(newSections);
    console.log('[Sections] Pre-built sections for', lang, ':', Object.keys(newSections).join(', '));
  }, []);

  const [currentSectionLetter, setCurrentSectionLetter] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const letter = urlParams.get("letter") || sessionStorage.getItem("yw_selected_letter") || null;
        if (letter) setCurrentSectionLetter(letter);
      } catch (e) {}
    }
  }, []);
  const [currentIndexInSection, setCurrentIndexInSection] = useState(null);
  const [isLoadingMoreNext, setIsLoadingMoreNext] = useState(false);

  const isLoopingRef = useRef(isLooping);
  const isShuffledRef = useRef(isShuffled);
  const sectionsRef = useRef(sections);
  const currentSectionLetterRef = useRef(currentSectionLetter);
  const currentIndexInSectionRef = useRef(currentIndexInSection);
  const sectionsLoadingRef = useRef(sectionsLoading);
  const queueRef = useRef(queue);
  const currentSongRef = useRef(currentSong);
  const songsRef = useRef(songs);
  const recentlyPlayedRef = useRef(recentlyPlayed);
  const consecutiveErrorsRef = useRef(0);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  useEffect(() => {
    isShuffledRef.current = isShuffled;
  }, [isShuffled]);

  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  useEffect(() => {
    currentSectionLetterRef.current = currentSectionLetter;
    if (currentSectionLetter && typeof window !== "undefined") {
      try {
        sessionStorage.setItem("yw_selected_letter", currentSectionLetter);
      } catch (e) {}
    }
  }, [currentSectionLetter]);

  useEffect(() => {
    currentIndexInSectionRef.current = currentIndexInSection;
  }, [currentIndexInSection]);

  useEffect(() => {
    sectionsLoadingRef.current = sectionsLoading;
  }, [sectionsLoading]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);

  useEffect(() => {
    recentlyPlayedRef.current = recentlyPlayed;
  }, [recentlyPlayed]);

  const getCurrentContextSongs = (currentPlayingSong) => {
    let contextSongs = songs;
    if (activeTab === "favorites") {
      contextSongs = songs.filter((s) => favorites.includes(s.id));
    } else if (activeTab === "playlist" && activePlaylistId) {
      const pl = playlists.find((p) => p.id === activePlaylistId);
      if (pl) {
        contextSongs = songs.filter((s) => pl.songIds.includes(s.id));
      } else {
        contextSongs = [];
      }
    } else if (activeTab === "recently-played") {
      contextSongs = recentlyPlayed
        .map((id) => songs.find((s) => s.id === id))
        .filter(Boolean);
    }

    // Ensure the playing song is part of the queue
    if (
      currentPlayingSong &&
      !contextSongs.some((s) => s.id === currentPlayingSong.id)
    ) {
      return songs;
    }
    return contextSongs;
  };

  const handleSetIsShuffled = (shuffledVal) => {
    setIsShuffled(shuffledVal);
    if (shuffledVal) {
      const remaining = queue.filter(
        (item) => (item.song?.id || item.id) !== currentSong?.id
      );
      const shuffled = shuffleArray(remaining);
      setQueue(shuffled);
      queueRef.current = shuffled;
    }
  };

  // ─── Play Queue Operations ──────────────────────────────────────

  const addToQueue = (song) => {
    if (!song) return;
    if (!currentSongRef.current) {
      playSong(song);
      return;
    }
    const newItem = {
      queueId: `qid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      song,
    };
    setQueue((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const updated = [...safePrev, newItem];
      queueRef.current = updated;
      return updated;
    });
  };

  const playNext = (song) => {
    if (!song) return;
    if (!currentSongRef.current) {
      playSong(song);
      return;
    }
    const newItem = {
      queueId: `qid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      song,
    };
    setQueue((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const updated = [newItem, ...safePrev];
      queueRef.current = updated;
      return updated;
    });
  };

  const removeFromQueue = (queueId) => {
    setQueue((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const updated = safePrev.filter(
        (item) => (item.queueId || item.id) !== queueId
      );
      queueRef.current = updated;
      return updated;
    });
  };

  const reorderQueue = (newQueue) => {
    if (!Array.isArray(newQueue)) return;
    setQueue(newQueue);
    queueRef.current = newQueue;
  };

  const moveQueueItem = (fromIndex, toIndex) => {
    setQueue((prev) => {
      const safe = [...(Array.isArray(prev) ? prev : [])];
      if (
        fromIndex < 0 ||
        fromIndex >= safe.length ||
        toIndex < 0 ||
        toIndex >= safe.length ||
        fromIndex === toIndex
      ) {
        return safe;
      }
      const [moved] = safe.splice(fromIndex, 1);
      safe.splice(toIndex, 0, moved);
      queueRef.current = safe;
      return safe;
    });
  };

  const clearQueue = () => {
    setQueue([]);
    queueRef.current = [];
  };

  const handleNextSong = useCallback(() => {
    const currentQueue = queueRef.current;
    if (!currentQueue || currentQueue.length === 0) {
      if (isLoopingRef.current && currentSongRef.current) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch((err) => console.log("Playback error: ", err));
        }
      } else {
        setIsPlaying(false);
      }
      return;
    }

    // Find next playable item in queue
    let nextItemIndex = 0;
    while (
      nextItemIndex < currentQueue.length &&
      !isSongPlayable(currentQueue[nextItemIndex]?.song || currentQueue[nextItemIndex])
    ) {
      nextItemIndex++;
    }

    if (nextItemIndex < currentQueue.length) {
      const nextItem = currentQueue[nextItemIndex];
      const nextSong = nextItem.song || nextItem;
      const remainingQueue = currentQueue.slice(nextItemIndex + 1);

      setQueue(remainingQueue);
      queueRef.current = remainingQueue;
      setCurrentSong(nextSong);
      currentSongRef.current = nextSong;
      setIsPlaying(true);
      setProgress(0);
    } else {
      setQueue([]);
      queueRef.current = [];
      setIsPlaying(false);
    }
  }, []);

  const handlePrevSong = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      return;
    }
    const recent = recentlyPlayedRef.current;
    if (recent && recent.length > 1) {
      const prevSongId = recent[1];
      const prevSongObj = (songsRef.current || []).find((s) => s.id === prevSongId);
      if (prevSongObj) {
        playSong(prevSongObj);
        return;
      }
    }
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
    }
  }, []);

  const audioRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);

  // Keep user ref in sync
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // When the user signs out, stop playback entirely so music does not
  // keep playing while the player bar is hidden for logged-out users.
  useEffect(() => {
    if (!user && currentSongRef.current) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
      }
      if (
        youtubePlayerRef.current &&
        typeof youtubePlayerRef.current.pauseVideo === "function"
      ) {
        try {
          youtubePlayerRef.current.pauseVideo();
        } catch (e) {}
      }
      setIsPlaying(false);
      setCurrentSong(null);
      setProgress(0);
    }
  }, [user]);

  // When Firebase user data loads, merge favorites & recently played, and load top-level collaborative playlists
  useEffect(() => {
    if (!firestoreData) return;

    const {
      favorites: favs,
      recentlyPlayed: recent,
    } = firestoreData;

    if (Array.isArray(favs) && favs.length > 0) {
      setFavorites(favs);
    }
    if (Array.isArray(recent) && recent.length > 0) {
      setRecentlyPlayed(recent);
    }
  }, [firestoreData]);

  // Load collaborative and owned playlists from top-level collection when user logs in
  useEffect(() => {
    if (!user?.uid) return;

    let isMounted = true;
    const loadPlaylists = async () => {
      try {
        const topLevelPlaylists = await fetchUserPlaylists(user.uid);

        // Check if legacy user doc has playlists that need migration
        if (
          firestoreData &&
          Array.isArray(firestoreData.playlists) &&
          firestoreData.playlists.length > 0
        ) {
          const unmigrated = firestoreData.playlists.filter(
            (legacyPl) => !topLevelPlaylists.some((tp) => tp.id === legacyPl.id)
          );
          if (unmigrated.length > 0) {
            const newlyMigrated = await migrateLegacyPlaylists(user.uid, unmigrated, user);
            topLevelPlaylists.push(...newlyMigrated);
          }
        }

        if (isMounted) {
          if (topLevelPlaylists.length > 0) {
            setPlaylists(topLevelPlaylists);
            try {
              localStorage.setItem("songhub_playlists", JSON.stringify(topLevelPlaylists));
            } catch {}
          }
        }
      } catch (err) {
        console.error("Error loading user playlists:", err);
      }
    };

    loadPlaylists();

    return () => {
      isMounted = false;
    };
  }, [user, firestoreData]);

  // Load songs from the API endpoint.
  // Priority: 1) prefetched global 2) in-progress prefetch promise 3) browser cache / fresh fetch
  useEffect(() => {
    let isMounted = true;

    // Skip fetch if songs already loaded (SPA re-mount / hot reload)
    if (songs.length > 0) {
      setSongsLoading(false);
      return () => { isMounted = false; };
    }

    // 1) Check if the landing page prefetched songs (instant!)
    const prefetched = window.__SONGHUB_PREFETCHED_SONGS;
    if (Array.isArray(prefetched) && prefetched.length > 0) {
      const fetchedSongs = prefetched.filter(Boolean).map(normalizeSongForUi);
      setSongs(fetchedSongs);
      setQueue(fetchedSongs);
      setOriginalQueue(fetchedSongs);
      setSongsLoading(false);
      console.log(`✓ Loaded ${fetchedSongs.length} songs from prefetch (instant)`);
      delete window.__SONGHUB_PREFETCHED_SONGS; // free memory
      // Pre-build English sections immediately so SongsSection skips loading spinner
      _prebuildSections(fetchedSongs, 'telugu');
      return () => { isMounted = false; };
    }

    // 1.5) Check if the landing page prefetch is currently IN PROGRESS
    const prefetchPromise = window.__SONGHUB_PREFETCHED_PROMISE;
    if (prefetchPromise && typeof prefetchPromise.then === "function") {
      setSongsLoading(true);
      prefetchPromise
        .then((songsData) => {
          if (!isMounted) return;
          const fetchedSongs = Array.isArray(songsData)
            ? songsData.filter(Boolean).map(normalizeSongForUi)
            : [];
          setSongs(fetchedSongs);
          setQueue(fetchedSongs);
          setOriginalQueue(fetchedSongs);
          setSongsLoading(false);
          console.log(`✓ Loaded ${fetchedSongs.length} songs from in-progress prefetch promise`);
          _prebuildSections(fetchedSongs, 'telugu');
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error("❌ Failed to resolve prefetch promise:", err);
          setSongsLoading(false);
        })
        .finally(() => {
          delete window.__SONGHUB_PREFETCHED_PROMISE; // free memory
        });
      return () => { isMounted = false; };
    }

    // 2) Browser cache or fresh fetch — only now set loading
    setSongsLoading(true);
    fetch("/api/songs?all=true", { cache: "default" })
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const fetchedSongs = Array.isArray(data?.songs)
          ? data.songs.filter(Boolean).map(normalizeSongForUi)
          : [];
        setSongs(fetchedSongs);
        setQueue(fetchedSongs);
        setOriginalQueue(fetchedSongs);
        setSongsLoading(false);
        console.log(`✓ Loaded ${fetchedSongs.length} songs from API`);
        // Pre-build English sections immediately so SongsSection skips loading spinner
        _prebuildSections(fetchedSongs, 'telugu');
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("❌ Failed to fetch songs from API:", err);
        setSongsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync native looping property of the HTML5 Audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  // Initialize browser-dependent values
  useEffect(() => {
    // 1. Initialize HTML Audio Element by ref from DOM or fallback
    if (!audioRef.current) {
      audioRef.current = document.getElementById("global-audio-player") || new Audio();
    }
    audioRef.current.volume = volume;
    audioRef.current.loop = isLoopingRef.current;

    // 2. Load lists from localStorage (fallback for non-auth users)
    const savedFavorites = localStorage.getItem("songhub_favorites");
    if (savedFavorites) {
      try {
        const favs = JSON.parse(savedFavorites);
        setTimeout(() => {
          setFavorites(favs);
        }, 0);
      } catch (e) {
        console.error(e);
      }
    }

    const savedPlaylists = localStorage.getItem("songhub_playlists");
    if (savedPlaylists) {
      try {
        const plays = JSON.parse(savedPlaylists);
        setTimeout(() => {
          setPlaylists(plays);
        }, 0);
      } catch (e) {
        console.error(e);
      }
    }

    const savedRecently = localStorage.getItem("songhub_recently");
    if (savedRecently) {
      try {
        const recently = JSON.parse(savedRecently);
        setTimeout(() => {
          setRecentlyPlayed(recently);
        }, 0);
      } catch (e) {
        console.error(e);
      }
    }

    // 3. Setup audio event listeners
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      consecutiveErrorsRef.current = 0; // Reset error count on successful load
    };

    const handleEnded = async () => {
      if (isLoopingRef.current) {
        audio.currentTime = 0;
        audio.play().catch((err) => console.log("Playback error: ", err));
        return;
      }

      // Check if we are playing inside an alphabetical letter section
      const letter = currentSectionLetterRef.current;
      const index = currentIndexInSectionRef.current;

      if (letter && index !== null) {
        const section = sectionsRef.current[letter];
        if (section && section.songs) {
          const nextIndex = index + 1;
          
          if (nextIndex < section.songs.length) {
            // Next song is already loaded in the section, play it!
            const nextSong = section.songs[nextIndex];
            playSong(nextSong, letter, nextIndex, section.songs);
          } else if (section.hasMore && section.allSongs) {
            // End of loaded batch but all songs are pre-computed in allSongs
            const allLetterSongs = section.allSongs;
            if (nextIndex < allLetterSongs.length) {
              const updatedSongs = allLetterSongs;
              setSections((prev) => ({
                ...prev,
                [letter]: {
                  ...prev[letter],
                  songs: updatedSongs,
                  hasMore: false,
                  showAll: true,
                }
              }));
              const nextSong = updatedSongs[nextIndex];
              playSong(nextSong, letter, nextIndex, updatedSongs);
            }
          }
        }
      } else {
        // Default queue auto-play next
        handleNextSong();
      }
    };

    const handleError = (e) => {
      console.warn("Audio element error, skipping to next song:", e);
      consecutiveErrorsRef.current += 1;
      const currentQueue = queueRef.current;
      if (consecutiveErrorsRef.current >= Math.max(5, currentQueue.length)) {
        console.error("Too many consecutive audio playback errors. Stopping.");
        setIsPlaying(false);
        consecutiveErrorsRef.current = 0;
      } else {
        handleNextSong();
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
    };
  }, []);

  // Handle currentSong change
  useEffect(() => {
    if (!audioRef.current) return;

    if (currentSong) {
      const srcToPlay = currentSong.audioUrl || currentSong.media?.audio || "";

      if (srcToPlay) {
        const isSameSrc = audioRef.current.src === srcToPlay;
        if (!isSameSrc) {
          audioRef.current.src = srcToPlay;
          audioRef.current.load();
        }

        if (isPlaying) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn("Audio playback attempted for src:", srcToPlay, err);
              // If play() was interrupted by load() or buffering, auto-play once audio is ready
              if (
                err.name === "AbortError" ||
                err.name === "NotAllowedError" ||
                err.name === "NotSupportedError"
              ) {
                const onCanPlay = () => {
                  audioRef.current?.play().catch(() => setIsPlaying(false));
                  audioRef.current?.removeEventListener("canplay", onCanPlay);
                };
                audioRef.current?.addEventListener("canplay", onCanPlay);
              } else {
                setIsPlaying(false);
              }
            });
          }
        }
      } else {
        // No direct MP3 URL (e.g. YouTube video only) — pause HTML5 audio so only video plays
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      }

      // Add to recently played (cap at 20, deduplicate, newest first) + sync to Firestore if logged in
      setTimeout(() => {
        setRecentlyPlayed((prev) => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const filtered = safePrev.filter((id) => id !== currentSong.id);
          const updated = [currentSong.id, ...filtered].slice(0, 20);
          try {
            localStorage.setItem("songhub_recently", JSON.stringify(updated));
          } catch {}
          // Sync to Firestore if authenticated
          const uid = userRef.current?.uid;
          if (uid) {
            updateRecentlyPlayed(uid, updated);
          }
          return updated;
        });
      }, 0);
    } else {
      audioRef.current.pause();
    }
  }, [currentSong]);

  // Handle play/pause toggles
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    const srcToPlay = currentSong.audioUrl || currentSong.media?.audio || "";
    if (!srcToPlay) return;

    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.log("Play failed: ", err);
          if (err.name === "AbortError") {
            const onCanPlay = () => {
              audioRef.current?.play().catch(() => setIsPlaying(false));
              audioRef.current?.removeEventListener("canplay", onCanPlay);
            };
            audioRef.current?.addEventListener("canplay", onCanPlay);
          } else {
            setIsPlaying(false);
          }
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Keep refs in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Handle volume and mute
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    audioRef.current.muted = isMuted;
  }, [volume, isMuted]);

  // ─── YouTube Player Management ─────────────────────────────────
  // Manages a hidden YT.Player for YouTube-only songs (no audio URL).
  // Handles: playback, duration detection, progress tracking, auto-next.
  const youtubeApiLoadedRef = useRef(false);
  const youtubePlayerRef = useRef(null);
  const youtubeProgressRef = useRef(null);

  useEffect(() => {
    const hasYoutube = currentSong?.youtubeId;
    const hasAudio = currentSong?.audioUrl || currentSong?.media?.audio;
    if (!hasYoutube || hasAudio) {
      setIsMiniPlayerActive(false);
      return;
    }

    let isMounted = true;
    let pollTimer = null;
    const youtubeId = currentSong.youtubeId;

    if (youtubePlayerRef.current) {
      try {
        youtubePlayerRef.current.destroy();
      } catch (e) {}
      youtubePlayerRef.current = null;
    }
    if (youtubeProgressRef.current) {
      clearInterval(youtubeProgressRef.current);
      youtubeProgressRef.current = null;
    }

    const playerDivId = `yt-audio-${youtubeId}-${Date.now()}`;
    const playerDiv = document.createElement("div");
    playerDiv.id = playerDivId;
    playerDiv.style.position = "absolute";
    playerDiv.style.width = "200px";
    playerDiv.style.height = "200px";
    playerDiv.style.opacity = "0";
    playerDiv.style.pointerEvents = "none";
    playerDiv.style.left = "-9999px";
    playerDiv.style.top = "-9999px";
    document.body.appendChild(playerDiv);

    const createPlayer = () => {
      if (!isMounted || !window.YT?.Player) return;
      try {
        const player = new window.YT.Player(playerDivId, {
          height: "200",
          width: "200",
          videoId: youtubeId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: () => {
              if (!isMounted) return;
              youtubePlayerRef.current = player;
              consecutiveErrorsRef.current = 0; // Reset error count on successful YouTube ready

              if (typeof player.setVolume === "function") {
                player.setVolume(isMuted ? 0 : volume * 100);
              }

              const detectedSec = player.getDuration();
              if (detectedSec && detectedSec > 0) {
                setDuration(detectedSec);
                const mins = Math.floor(detectedSec / 60);
                const secs = Math.floor(detectedSec % 60);
                const formatted = `${mins}:${secs.toString().padStart(2, "0")}`;
                setCurrentSong((prev) =>
                  prev
                    ? { ...prev, duration: formatted, durationSec: detectedSec }
                    : prev,
                );
                setSongs((prev) =>
                  prev.map((s) =>
                    s.id === currentSong?.id
                      ? { ...s, duration: formatted, durationSec: detectedSec }
                      : s,
                  ),
                );
                const songRef = doc(db, "youworship_songs", currentSong.id);
                updateDoc(songRef, {
                  duration: detectedSec,
                  updatedAt: new Date().toISOString(),
                }).catch(() => {});
              }

              if (
                isPlayingRef.current &&
                typeof player?.playVideo === "function"
              ) {
                try {
                  player.playVideo();
                } catch (e) {}
              }

              youtubeProgressRef.current = setInterval(() => {
                if (!youtubePlayerRef.current || !isMounted) return;
                try {
                  if (
                    typeof youtubePlayerRef.current.getCurrentTime ===
                    "function"
                  ) {
                    const time = youtubePlayerRef.current.getCurrentTime();
                    if (time !== undefined) setProgress(time);
                  }
                } catch (e) {}
              }, 1000);
            },
            onStateChange: (event) => {
              if (!isMounted) return;
              if (event.data === 0) {
                if (isLoopingRef.current) {
                  if (typeof player?.seekTo === "function")
                    try {
                      player.seekTo(0);
                    } catch (e) {}
                  if (typeof player?.playVideo === "function")
                    try {
                      player.playVideo();
                    } catch (e) {}
                } else {
                  handleNextSong();
                }
              }
            },
            onError: (event) => {
              console.warn("YouTube player error:", event.data);
              consecutiveErrorsRef.current += 1;
              const currentQueue = queueRef.current;
              if (consecutiveErrorsRef.current >= Math.max(5, currentQueue.length)) {
                console.error("Too many consecutive YouTube playback errors. Stopping.");
                setIsPlaying(false);
                consecutiveErrorsRef.current = 0;
              } else {
                handleNextSong();
              }
            },
          },
        });
        youtubePlayerRef.current = player;
      } catch (err) {
        console.warn("YouTube player creation failed:", err);
      }
    };

    if (!window.YT?.Player) {
      if (!youtubeApiLoadedRef.current) {
        youtubeApiLoadedRef.current = true;
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScript = document.getElementsByTagName("script")[0];
        firstScript.parentNode.insertBefore(tag, firstScript);
        window.onYouTubeIframeAPIReady = () => {};
      }
      pollTimer = setInterval(() => {
        if (window.YT?.Player && isMounted) {
          clearInterval(pollTimer);
          pollTimer = null;
          createPlayer();
        }
      }, 300);
    } else {
      createPlayer();
    }

    return () => {
      isMounted = false;
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      if (youtubeProgressRef.current) {
        clearInterval(youtubeProgressRef.current);
        youtubeProgressRef.current = null;
      }
      const existingDiv = document.getElementById(playerDivId);
      if (existingDiv) existingDiv.remove();
      if (youtubePlayerRef.current) {
        try {
          if (typeof youtubePlayerRef.current.destroy === "function") {
            youtubePlayerRef.current.destroy();
          }
        } catch (e) {}
        youtubePlayerRef.current = null;
      }
    };
  }, [currentSong?.id]);

  // Control YouTube playback when isPlaying toggles
  useEffect(() => {
    const player = youtubePlayerRef.current;
    if (!player) return;
    try {
      if (isPlaying) {
        if (typeof player.playVideo === "function") {
          player.playVideo();
        }
      } else {
        if (typeof player.pauseVideo === "function") {
          player.pauseVideo();
        }
      }
    } catch (e) {
      console.warn("YouTube play/pause error:", e);
    }
  }, [isPlaying]);

  // Handle YouTube iframe sizing and styling for Mini Player mode
  useEffect(() => {
    const player = youtubePlayerRef.current;
    if (!player) return;
    try {
      const iframe = player.getIframe();
      if (!iframe) return;

      if (isMiniPlayerActive) {
        iframe.style.display = "block";
        iframe.style.position = "fixed";
        iframe.style.bottom = "100px";
        iframe.style.right = "24px";
        iframe.style.left = "auto";
        iframe.style.top = "auto";
        iframe.style.opacity = "1";
        iframe.style.pointerEvents = "auto";
        iframe.style.width = "320px";
        iframe.style.height = "180px";
        iframe.style.zIndex = "9999";
        iframe.style.borderRadius = "12px";
        iframe.style.border = "2px solid rgba(255, 255, 255, 0.15)";
        iframe.style.boxShadow =
          "0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)";
        if (typeof player.setSize === "function") {
          player.setSize(320, 180);
        }
      } else {
        iframe.style.display = "block";
        iframe.style.position = "absolute";
        iframe.style.left = "-9999px";
        iframe.style.top = "-9999px";
        iframe.style.opacity = "0";
        iframe.style.pointerEvents = "none";
        iframe.style.width = "200px";
        iframe.style.height = "200px";
        iframe.style.zIndex = "-1";
        iframe.style.borderRadius = "0px";
        iframe.style.border = "none";
        iframe.style.boxShadow = "none";
        if (typeof player.setSize === "function") {
          player.setSize(200, 200);
        }
      }
    } catch (e) {
      console.warn("Mini player effect sizing error:", e);
    }
  }, [isMiniPlayerActive, currentSong?.id]);

  const initializeAlphabeticalSections = useCallback(async (lang = "telugu") => {
    // Build alphabetical sections from the already-loaded songs in state
    const currentSongs = songs;
    if (currentSongs.length === 0) {
      console.log("[Sections] songs still empty, skipping init");
      return;
    }

    console.log("[Sections] Initializing sections for", lang, "with", currentSongs.length, "songs");

    const ALPHABETS = {
      english: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
      telugu: ['అ', 'ఆ', 'ఇ', 'ఈ', 'ఉ', 'ఊ', 'ఋ', 'ౠ', 'ఎ', 'ఏ', 'ఐ', 'ఒ', 'ఓ', 'ఔ', 'అం', 'అః', 'క', 'ఖ', 'గ', 'ఘ', 'ఙ', 'చ', 'ఛ', 'జ', 'ఝ', 'ఞ', 'ట', 'ఠ', 'డ', 'ఢ', 'ణ', 'త', 'థ', 'ద', 'ధ', 'న', 'ప', 'ఫ', 'బ', 'భ', 'మ', 'య', 'ర', 'ల', 'వ', 'శ', 'ష', 'స', 'హ', 'ళ', 'క్ష', 'ఱ'],
      hindi: ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ए', 'ऐ', 'ओ', 'औ', 'अं', 'अः', 'क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ', 'ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह', 'क्ष', 'त्र', 'ज्ञ'],
      tamil: ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'க', 'ச', 'ஜ', 'ஞ', 'ட', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ற', 'ல', 'வ', 'ஷ', 'ஸ', 'ஹ'],
    };

    // Language filter
    const languageMap = {
      english: ["en", "english"],
      telugu: ["te", "telugu"],
      hindi: ["hi", "hindi"],
      tamil: ["ta", "tamil"],
    };
    const allowedLangs = languageMap[lang] || languageMap.english;

    const letters = ALPHABETS[lang] || ALPHABETS.english;
    // Always rebuild — clear old sections for this language's letters first
    const newSections = {};

    try {
      const BATCH_SIZE = 20;
      const validLetters = new Set(letters);

      // Group all songs by their first letter strictly for this language
      const grouped = {};
      currentSongs.forEach(song => {
        if (!isSongInLanguage(song, lang)) return;

        const firstLetter = getAlphabeticalKey(song, lang);
        if (validLetters.has(firstLetter)) {
          if (!grouped[firstLetter]) grouped[firstLetter] = [];
          grouped[firstLetter].push(song);
        }
      });

      console.log("[Sections] Grouped letters:", Object.keys(grouped).join(", "));

      // Build sections: only predefined letters of this language in order
      letters.forEach(letter => {
        const allLetterSongs = grouped[letter] || [];
        if (allLetterSongs.length === 0) return;

        const initialSongs = allLetterSongs.slice(0, BATCH_SIZE);
        newSections[letter] = {
          songs: initialSongs,
          lastDoc: null,
          hasMore: allLetterSongs.length > BATCH_SIZE,
          allSongs: allLetterSongs,
          showAll: false,
          loading: false,
        };
      });

      console.log("[Sections] Built sections for letters:", Object.keys(newSections).join(", "));

      setSections(newSections);
    } catch (error) {
      console.error("Failed to initialize alphabetical sections for language:", lang, error);
    }
  }, [songs]);

  const showAllSongsForLetter = useCallback(async (letter) => {
    const section = sectionsRef.current[letter];
    if (!section || section.showAll || section.loading) return;

    // Use the pre-computed allSongs from initialization
    const allLetterSongs = section.allSongs || section.songs;

    setSections((prev) => ({
      ...prev,
      [letter]: {
        ...prev[letter],
        songs: allLetterSongs,
        hasMore: false,
        showAll: true,
        loading: false,
      },
    }));
  }, []);

  const playSong = (song, sectionLetter = null, indexInSection = null, customQueue = null) => {
    if (!song) return;

    const effectiveLetter =
      sectionLetter ||
      currentSectionLetterRef.current ||
      (typeof window !== "undefined" ? sessionStorage.getItem("yw_selected_letter") : null) ||
      getAlphabeticalKey(song, lyricsLanguage || "telugu");

    if (effectiveLetter && effectiveLetter !== "#") {
      setCurrentSectionLetter(effectiveLetter);
      currentSectionLetterRef.current = effectiveLetter;
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("yw_selected_letter", effectiveLetter);
        } catch (e) {}
      }
    }
    if (indexInSection !== null) {
      setCurrentIndexInSection(indexInSection);
      currentIndexInSectionRef.current = indexInSection;
    }

    if (currentSong && currentSong.id === song.id) {
      if (isPlaying) {
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();
      } else {
        setIsPlaying(true);
        if (audioRef.current && audioRef.current.src) {
          audioRef.current.play().catch((e) => console.warn("Play error:", e));
        }
      }
    } else {
      const contextSongs = customQueue || getCurrentContextSongs(song);

      if (!isSongPlayable(song)) {
        // If the song is statically unplayable, search for the next playable one
        const currentIndex = contextSongs.findIndex((s) => s.id === song.id);
        if (currentIndex !== -1) {
          let nextIndex = (currentIndex + 1) % contextSongs.length;
          let checkedCount = 0;
          while (
            checkedCount < contextSongs.length &&
            !isSongPlayable(contextSongs[nextIndex])
          ) {
            nextIndex = (nextIndex + 1) % contextSongs.length;
            checkedCount++;
          }
          if (checkedCount < contextSongs.length) {
            playSong(contextSongs[nextIndex], sectionLetter, nextIndex, contextSongs);
            return;
          }
        }
      }

      const srcToPlay = song.audioUrl || song.media?.audio || "";
      setCurrentSong(song);
      setIsPlaying(true);
      setProgress(0);

      // Set queue and originalQueue for this context
      setOriginalQueue(contextSongs);

      const songIndex = contextSongs.findIndex((s) => s.id === song.id);
      let upcomingSongs = [];
      if (songIndex !== -1) {
        upcomingSongs = contextSongs.slice(songIndex + 1);
      } else {
        upcomingSongs = contextSongs.filter((s) => s.id !== song.id);
      }

      if (isShuffled) {
        upcomingSongs = shuffleArray(upcomingSongs);
      }

      const queueItems = upcomingSongs.map((s) => ({
        queueId: `qid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        song: s,
      }));

      setQueue(queueItems);
      queueRef.current = queueItems;

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        if (srcToPlay) {
          audioRef.current.src = srcToPlay;
          audioRef.current.load();
          audioRef.current.play().catch((err) => {
            console.warn("Direct click play error:", err);
          });
        } else {
          audioRef.current.pause();
          audioRef.current.removeAttribute("src");
        }
      }
    }
  };

  const togglePlay = () => {
    if (!currentSong && songs.length > 0) {
      playSong(songs[0]);
    } else if (currentSong) {
      if (isPlaying) {
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();
      } else {
        setIsPlaying(true);
        if (audioRef.current && audioRef.current.src) {
          audioRef.current
            .play()
            .catch((e) => console.warn("Toggle play error:", e));
        }
      }
    }
  };

  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    if (
      youtubePlayerRef.current &&
      typeof youtubePlayerRef.current.seekTo === "function"
    ) {
      try {
        youtubePlayerRef.current.seekTo(time, true);
      } catch (e) {}
    }
    setProgress(time);
  };

  const adjustVolume = (vol) => {
    const parsedVol = Math.max(0, Math.min(1, vol));
    setVolume(parsedVol);
    if (parsedVol > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const toggleFavorite = (songId) => {
    setFavorites((prev) => {
      const updated = prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId];
      localStorage.setItem("songhub_favorites", JSON.stringify(updated));

      // Sync to Firestore if authenticated
      const uid = userRef.current?.uid;
      if (uid) {
        updateFavorites(uid, updated);
      }

      return updated;
    });
  };

  const removeFromRecentlyPlayed = (songId) => {
    setRecentlyPlayed((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const updated = safePrev.filter((id) => id !== songId);
      try {
        localStorage.setItem("songhub_recently", JSON.stringify(updated));
      } catch {}
      const uid = userRef.current?.uid;
      if (uid) {
        updateRecentlyPlayed(uid, updated);
      }
      return updated;
    });
  };

  const clearRecentlyPlayed = () => {
    setRecentlyPlayed([]);
    try {
      localStorage.setItem("songhub_recently", JSON.stringify([]));
    } catch {}
    const uid = userRef.current?.uid;
    if (uid) {
      updateRecentlyPlayed(uid, []);
    }
  };

  const createPlaylist = async (name, description = "", linkDefaultRole = "editor") => {
    if (!name || !name.trim()) return;
    const uid = userRef.current?.uid || "guest";
    const ownerName =
      userRef.current?.displayName ||
      userRef.current?.email?.split("@")[0] ||
      "You";

    const newPlaylist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ownerId: uid,
      ownerName: ownerName,
      name: name.trim(),
      description: (description || "").trim(),
      songIds: [],
      songAddedBy: {},
      collaborators: {},
      collaboratorUids: [],
      linkDefaultRole: linkDefaultRole || "editor",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPlaylists((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const updated = [...safePrev, newPlaylist];
      try {
        localStorage.setItem("songhub_playlists", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (uid && uid !== "guest") {
      try {
        await createPlaylistDoc(newPlaylist);
      } catch (err) {
        console.error("Error creating playlist in Firestore:", err);
      }
    }
    return newPlaylist;
  };

  const editPlaylist = async (playlistId, { name, description, linkDefaultRole }) => {
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (linkDefaultRole !== undefined) updates.linkDefaultRole = linkDefaultRole;

    setPlaylists((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const updated = safePrev.map((pl) => {
        if (pl.id === playlistId) {
          return {
            ...pl,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        return pl;
      });
      try {
        localStorage.setItem("songhub_playlists", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const uid = userRef.current?.uid;
    if (uid && uid !== "guest") {
      try {
        await updatePlaylistDoc(playlistId, updates);
      } catch (err) {
        console.error("Error updating playlist in Firestore:", err);
      }
    }
  };

  const deletePlaylist = async (playlistId) => {
    setPlaylists((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const updated = safePrev.filter((list) => list.id !== playlistId);
      try {
        localStorage.setItem("songhub_playlists", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (activePlaylistId === playlistId) {
      setActivePlaylistId(null);
      setActiveTab("discover");
    }

    const uid = userRef.current?.uid;
    if (uid && uid !== "guest") {
      try {
        await deletePlaylistDoc(playlistId);
      } catch (err) {
        console.error("Error deleting playlist from Firestore:", err);
      }
    }
  };

  const addSongToPlaylist = async (playlistId, songId) => {
    const uid = userRef.current?.uid || "guest";
    const adderName =
      userRef.current?.displayName ||
      userRef.current?.email?.split("@")[0] ||
      "You";

    let alreadyInPlaylist = false;
    let newSongIds = [];
    let newSongAddedBy = {};

    setPlaylists((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const updated = safePrev.map((list) => {
        if (list.id === playlistId) {
          if (list.songIds && list.songIds.includes(songId)) {
            alreadyInPlaylist = true;
            return list;
          }
          newSongIds = [...(list.songIds || []), songId];
          newSongAddedBy = {
            ...(list.songAddedBy || {}),
            [songId]: {
              userId: uid,
              name: adderName,
              addedAt: new Date().toISOString(),
            },
          };
          return {
            ...list,
            songIds: newSongIds,
            songAddedBy: newSongAddedBy,
            updatedAt: new Date().toISOString(),
          };
        }
        return list;
      });

      try {
        localStorage.setItem("songhub_playlists", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (alreadyInPlaylist) {
      return { alreadyExists: true };
    }

    if (uid && uid !== "guest") {
      try {
        await updatePlaylistDoc(playlistId, {
          songIds: newSongIds,
          songAddedBy: newSongAddedBy,
        });
      } catch (err) {
        console.error("Error adding song to playlist in Firestore:", err);
      }
    }
    return { success: true };
  };

  const removeSongFromPlaylist = async (playlistId, songId) => {
    const uid = userRef.current?.uid;
    let newSongIds = [];
    let newSongAddedBy = {};

    setPlaylists((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const updated = safePrev.map((list) => {
        if (list.id === playlistId) {
          newSongIds = (list.songIds || []).filter((id) => id !== songId);
          newSongAddedBy = { ...(list.songAddedBy || {}) };
          delete newSongAddedBy[songId];
          return {
            ...list,
            songIds: newSongIds,
            songAddedBy: newSongAddedBy,
            updatedAt: new Date().toISOString(),
          };
        }
        return list;
      });

      try {
        localStorage.setItem("songhub_playlists", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (uid && uid !== "guest") {
      try {
        await updatePlaylistDoc(playlistId, {
          songIds: newSongIds,
          songAddedBy: newSongAddedBy,
        });
      } catch (err) {
        console.error("Error removing song from playlist in Firestore:", err);
      }
    }
  };

  const joinCollaborativePlaylist = async (playlistId, role = "editor") => {
    if (!userRef.current?.uid) return null;
    try {
      const joinedPl = await joinPlaylistDoc(playlistId, userRef.current, role);
      if (joinedPl) {
        setPlaylists((prev) => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const exists = safePrev.some((p) => p.id === joinedPl.id);
          const updated = exists
            ? safePrev.map((p) => (p.id === joinedPl.id ? joinedPl : p))
            : [...safePrev, joinedPl];
          try {
            localStorage.setItem("songhub_playlists", JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
      return joinedPl;
    } catch (err) {
      console.error("Error joining collaborative playlist:", err);
      throw err;
    }
  };

  const updatePlaylistInState = (updatedPl) => {
    if (!updatedPl?.id) return;
    setPlaylists((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const exists = safePrev.some((p) => p.id === updatedPl.id);
      const updated = exists
        ? safePrev.map((p) => (p.id === updatedPl.id ? { ...p, ...updatedPl } : p))
        : [...safePrev, updatedPl];
      try {
        localStorage.setItem("songhub_playlists", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const playPlaylist = (playlistOrId, shuffle = false) => {
    const pl =
      typeof playlistOrId === "object" && playlistOrId !== null
        ? playlistOrId
        : playlists.find((p) => p.id === playlistOrId);
    if (!pl || !pl.songIds || pl.songIds.length === 0) return;

    const playlistSongs = pl.songIds
      .map((id) => songs.find((s) => s.id === id))
      .filter(Boolean);

    if (playlistSongs.length === 0) return;

    if (shuffle) {
      const shuffled = shuffleArray(playlistSongs);
      playSong(shuffled[0], null, null, shuffled);
    } else {
      playSong(playlistSongs[0], null, null, playlistSongs);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        songs: songs,
        setSongs,
        songsLoading,
        currentSong,
        isPlaying,
        progress,
        duration,
        volume,
        isMuted,
        isLooping,
        isShuffled,
        queue,
        favorites,
        playlists,
        recentlyPlayed,
        setCurrentSong,
        setIsPlaying,
        setQueue,
        playSong,
        togglePlay,
        nextSong: handleNextSong,
        prevSong: handlePrevSong,
        seekTo,
        adjustVolume,
        toggleMute,
        setIsLooping,
        setIsShuffled: handleSetIsShuffled,
        toggleFavorite,
        createPlaylist,
        editPlaylist,
        deletePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        playPlaylist,
        removeFromRecentlyPlayed,
        clearRecentlyPlayed,
        addToPlaylistSong,
        setAddToPlaylistSong,
        isCreatePlaylistOpen,
        setIsCreatePlaylistOpen,
        editingPlaylist,
        setEditingPlaylist,
        collaboratingPlaylist,
        setCollaboratingPlaylist,
        joinCollaborativePlaylist,
        updatePlaylistInState,
        isQueueOpen,
        setIsQueueOpen,
        addToQueue,
        playNext,
        removeFromQueue,
        reorderQueue,
        moveQueueItem,
        clearQueue,
        viewedSongId,
        setViewedSongId,
        lastViewedSongId,
        setLastViewedSongId,
        lastListScrollPos,
        setLastListScrollPos,
        recordSongNavigation,
        clearSongNavigationState,
        activeTab,
        setActiveTab,
        activePlaylistId,
        setActivePlaylistId,
        showFullHome,
        setShowFullHome,
        isMiniPlayerActive,
        setIsMiniPlayerActive,
        lyricsLanguage,
        setLyricsLanguage,
        sections,
        sectionsLoading,
        initializeAlphabeticalSections,
        showAllSongsForLetter,
        currentSectionLetter,
        setCurrentSectionLetter,
        hasEnteredApp,
        setHasEnteredApp,
      }}
    >
      {children}
      <audio id="global-audio-player" ref={audioRef} preload="none" />
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
