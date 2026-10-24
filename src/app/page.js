"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAudio } from "@/context/audio-context";
import { useSearch } from "@/context/search-context";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import SongsSection from "@/components/home/SongsSection";
import HeroCarousel from "@/components/home/HeroCarousel";
import VerseOfTheWeek from "@/components/home/VerseOfTheWeek";
import RecentlyPlayed from "@/components/home/RecentlyPlayed";
import SearchResults from "@/components/layout/SearchResults";
import LyricsSearchResults from "@/components/search/LyricsSearchResults";
import { useLyricsSearch } from "@/hooks/useLyricsSearch";
import SongArtwork from "@/components/ui/SongArtwork";
import CategoryExplorer from "@/components/categories/CategoryExplorer";
import { FullAppSkeleton } from "@/components/ui/SongSkeleton";
import RecentlyPlayedView from "@/components/home/RecentlyPlayedView";
import LikedSongsView from "@/components/home/LikedSongsView";
import PlaylistsOverview from "@/components/playlist/PlaylistsOverview";
import PlaylistDetailView from "@/components/playlist/PlaylistDetailView";
import CreatePlaylistModal from "@/components/playlist/CreatePlaylistModal";
import AddToPlaylistModal from "@/components/playlist/AddToPlaylistModal";
import LandingHero from "@/components/landing/LandingHero";
// Import normalized song search utilities for real-time ranking
import { filterAndRankSongs, getSongArtistName } from "@/utils/songSearch";

import {
  FolderHeart,
  ListMusic,
  Clock,
  Plus,
  Search,
  Heart,
  Trash2,
  ChevronLeft,
  Play,
  ArrowLeft,
  TrendingUp,
  Library,
  X,
  Music,
  Mic,
  LayoutGrid,
} from "lucide-react";

const searchableText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "number") return String(value).toLowerCase();
  if (typeof value === "object" && typeof value.name === "string") return value.name.toLowerCase();
  return "";
};

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const {
    songs,
    songsLoading,
    currentSong,
    isPlaying,
    playSong,
    favorites,
    toggleFavorite,
    playlists,
    createPlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    recentlyPlayed,
    activeTab,
    setActiveTab,
    activePlaylistId,
    setActivePlaylistId,
    setViewedSongId,
    showFullHome,
    setShowFullHome,
    addToPlaylistSong,
    setAddToPlaylistSong,
    isCreatePlaylistOpen,
    setIsCreatePlaylistOpen,
    editingPlaylist,
    setEditingPlaylist,
    hasEnteredApp,
    setHasEnteredApp,
    currentSectionLetter,
    setCurrentSectionLetter,
  } = useAudio();

  const { searchQuery, setSearchQuery, showFullResults, setShowFullResults, searchMode, setSearchMode, triggerVoiceSearch } = useSearch();

  // Lyrics search (used when searchMode === "lyrics")
  const {
    query: lyricsQuery,
    setQuery: setLyricsQuery,
    results: lyricsResults,
    total: lyricsTotal,
    loading: lyricsLoading,
    error: lyricsError,
    hasMore: lyricsHasMore,
    loadMore: lyricsLoadMore,
    clear: clearLyricsSearch,
  } = useLyricsSearch({ debounceMs: 350 });

  // Sync searchQuery -> lyricsQuery when in lyrics mode
  useEffect(() => {
    if (searchMode === "lyrics" && searchQuery) {
      setLyricsQuery(searchQuery);
      setShowFullResults(true);
    }
  }, [searchMode]);

  const commitMobileSearch = useCallback((value) => {
    setSearchQuery(value);
    if (value) {
      setShowFullResults(true);
    }
    // Always update lyrics query when in lyrics mode
    if (searchMode === "lyrics") {
      setLyricsQuery(value || "");
    }
  }, [setSearchQuery, setShowFullResults, searchMode, setLyricsQuery]);

  const {
    inputValue: mobileInputValue,
    handleChange: handleMobileSearchChange,
    flush: flushMobileSearch,
    clear: clearMobileSearch,
  } = useDebouncedSearch({
    initialValue: searchQuery,
    onCommit: commitMobileSearch,
    debounceMs: 250,
  });

  const onMobileSearchChange = useCallback((e) => {
    handleMobileSearchChange(e);
    setLyricsQuery(e.target.value || "");
  }, [handleMobileSearchChange, setLyricsQuery]);

  const [selectedLetter, setSelectedLetter] = useState(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([
    "ఉదయ ఆరాధన",
    "స్తుతి పాటలు",
    "శ్రీమంతుడు",
    "Jesus worship"
  ]);

  const isLandingVisible =
    !searchParams?.get("tab") &&
    !searchParams?.get("q") &&
    !searchParams?.get("category") &&
    !searchParams?.get("playlistId") &&
    !searchParams?.get("view") &&
    !searchParams?.get("letter") &&
    !searchParams?.get("app") &&
    !searchParams?.get("auth");

  // Sync 1: browser URL parameters -> context tab/search/letter state (on load/popstate)
  useEffect(() => {
    if (!searchParams) return;
    
    const tabParam = searchParams.get("tab");
    const viewParam = searchParams.get("view");
    const letterParam = searchParams.get("letter");

    if (tabParam === "songs" || viewParam === "songs") {
      setActiveTab("discover");
      setShowFullHome(false);
    } else if (tabParam === "discover" || !tabParam) {
      if (activeTab !== "discover") {
        setActiveTab("discover");
      }
      setShowFullHome(!letterParam);
    } else if (tabParam) {
      if (tabParam !== activeTab) {
        setActiveTab(tabParam);
      }
    }
    
    const playlistIdParam = searchParams.get("playlistId") || searchParams.get("id");
    if (playlistIdParam) {
      if (playlistIdParam !== activePlaylistId) {
        setActivePlaylistId(playlistIdParam);
      }
    } else {
      if (activePlaylistId) {
        setActivePlaylistId(null);
      }
    }
    
    const queryParam = searchParams.get("q");
    if (queryParam) {
      if (queryParam !== searchQuery) {
        setSearchQuery(queryParam);
        setShowFullResults(true);
      }
    } else if (showFullResults) {
      setSearchQuery("");
      setShowFullResults(false);
    }

    if (letterParam) {
      if (letterParam !== selectedLetter) {
        setSelectedLetter(letterParam);
      }
      if (setCurrentSectionLetter) setCurrentSectionLetter(letterParam);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("yw_selected_letter", letterParam);
        } catch (e) {}
      }
    } else {
      if (selectedLetter) {
        setSelectedLetter(null);
      }
    }

    // Sync searchMode param
    const smParam = searchParams.get("searchMode");
    if (smParam === "lyrics" && searchMode !== "lyrics") {
      setSearchMode("lyrics");
    }
  }, [searchParams, currentSectionLetter, setCurrentSectionLetter]);

  // Sync 2: context state changes -> browser URL parameters
  useEffect(() => {
    if (!searchParams) return;
    if (isLandingVisible) return;

    const params = new URLSearchParams(window.location.search);
    let changed = false;

    // Sync tab param
    const currentTabInUrl = params.get("tab");
    const targetTab = activeTab === "discover" ? (showFullHome && !selectedLetter ? "discover" : "songs") : activeTab;
    if (targetTab && targetTab !== currentTabInUrl) {
      params.set("tab", targetTab);
      changed = true;
    }

    // Sync playlistId param
    const currentPlaylistIdInUrl = params.get("playlistId");
    if (activeTab === "playlist" && activePlaylistId) {
      if (activePlaylistId !== currentPlaylistIdInUrl) {
        params.set("playlistId", activePlaylistId);
        changed = true;
      }
    } else if (currentPlaylistIdInUrl) {
      params.delete("playlistId");
      changed = true;
    }

    // Clean up category param if tab is no longer categories
    if (activeTab !== "categories" && params.has("category")) {
      params.delete("category");
      changed = true;
    }

    // Sync search query param
    const currentQueryInUrl = params.get("q");
    if (searchQuery && showFullResults) {
      if (searchQuery !== currentQueryInUrl) {
        params.set("q", searchQuery);
        changed = true;
      }
    } else if (currentQueryInUrl) {
      params.delete("q");
      changed = true;
    }

    // Sync letter param
    const currentLetterInUrl = params.get("letter");
    if (selectedLetter) {
      if (selectedLetter !== currentLetterInUrl) {
        params.set("letter", selectedLetter);
        changed = true;
      }
    } else if (currentLetterInUrl) {
      params.delete("letter");
      changed = true;
    }

    if (changed) {
      startTransition(() => {
        router.push(`/?${params.toString()}`);
      });
    }
  }, [activeTab, showFullHome, activePlaylistId, searchQuery, showFullResults, selectedLetter]);

  // Reset letter if user switches away from discover/songs tabs or runs search query
  useEffect(() => {
    if ((activeTab !== "discover" && activeTab !== "songs") || (searchQuery && showFullResults)) {
      setSelectedLetter(null);
    }
  }, [activeTab, searchQuery, showFullResults]);

  const getFilteredSongs = () => {
    const safeSongs = Array.isArray(songs) ? songs : [];
    let list = [...safeSongs];
    if (activeTab === "favorites") {
      list = list.filter((song) => favorites.includes(song.id));
    } else if (activeTab === "playlist" && activePlaylistId) {
      const pl = playlists.find((p) => p.id === activePlaylistId);
      if (pl) list = list.filter((song) => pl.songIds.includes(song.id));
      else list = [];
    } else if (activeTab === "recently-played") {
      list = recentlyPlayed
        .map((id) => songs.find((s) => s.id === id))
        .filter(Boolean);
    }
    const trimmedQuery = (searchQuery || "").toString().trim();
    if (trimmedQuery && showFullResults) {
      // Use ranked real-time search matching with prefix & word-boundary scoring
      list = filterAndRankSongs(list, trimmedQuery, 300);
    }
    return list;
  };

  const filteredSongs = getFilteredSongs();
  const activePlaylist = playlists.find((p) => p.id === activePlaylistId);

  // Mobile active query updates on every keystroke
  const activeMobileQuery = (mobileInputValue !== undefined ? mobileInputValue : searchQuery).trim();

  // Mobile specific search results dynamically updating with ranked scores on every keystroke
  const mobileSearchResults = useMemo(() => {
    if (!activeMobileQuery) return [];
    return filterAndRankSongs(songs, activeMobileQuery, 100);
  }, [songs, activeMobileQuery]);

  const handleCreatePlaylistMobile = (e) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName("");
      setIsCreatingPlaylist(false);
    }
  };

  if (isLandingVisible) {
    return (
      <LandingHero
        onEnter={() => router.push("/?tab=discover")}
        redirectTo={searchParams?.get("redirect")}
      />
    );
  }

  return (
    <div className={`flex-1 flex flex-col min-h-0 overflow-y-auto`}>
      
      {/* ──────────────────────────────────────────────────────── */}
      {/* ─── DESKTOP VIEW ─── */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:block p-4">
        {/* VIEW HEADER (Favorites only; Recently Played and Playlists have dedicated banners) */}
        {activeTab === "favorites" && !selectedLetter && !(searchQuery && showFullResults) && (
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-title tracking-tight flex items-center gap-2">
              <FolderHeart className="w-5 h-5 text-red-500" />
              My Favorites
            </h1>
            <p className="text-xs text-muted mt-1">Your curated collection of loved songs.</p>
          </div>
        )}

        {/* Hero Carousel (full width, above) */}
        {activeTab === "discover" && showFullHome && !(searchQuery && showFullResults) && !selectedLetter && (
          <div className="mb-8">
            <HeroCarousel />
          </div>
        )}

        {/* Verse of the Day */}
        {activeTab === "discover" && !(searchQuery && showFullResults) && !selectedLetter && (
          <div className="mb-8">
            <VerseOfTheWeek />
          </div>
        )}

        {/* Recently Played Carousel */}
        {activeTab === "discover" && showFullHome && !(searchQuery && showFullResults) && !selectedLetter && (
          <div className="mb-8">
            <RecentlyPlayed />
          </div>
        )}

        {/* Dedicated Recently Played View */}
        {activeTab === "recently-played" && !(searchQuery && showFullResults) && (
          <RecentlyPlayedView />
        )}

        {/* Dedicated Playlists Overview (when no playlist is selected) */}
        {(activeTab === "playlists" || activeTab === "playlist") && !activePlaylistId && !(searchQuery && showFullResults) && (
          <PlaylistsOverview
            onSelectPlaylist={(id) => {
              setActiveTab("playlist");
              setActivePlaylistId(id);
            }}
            onCreateClick={() => setIsCreatePlaylistOpen(true)}
            onEditClick={(pl) => {
              setEditingPlaylist(pl);
              setIsCreatePlaylistOpen(true);
            }}
          />
        )}

        {/* Dedicated Playlist Detail View (when a playlist is selected) */}
        {(activeTab === "playlist" || activeTab === "playlists") && activePlaylistId && !(searchQuery && showFullResults) && (
          <PlaylistDetailView
            playlistId={activePlaylistId}
            onBack={() => {
              setActivePlaylistId(null);
              setActiveTab("playlists");
            }}
            onEdit={(pl) => {
              setEditingPlaylist(pl);
              setIsCreatePlaylistOpen(true);
            }}
          />
        )}

        {/* Category Explorer View */}
        {activeTab === "categories" && !(searchQuery && showFullResults) && (
          <CategoryExplorer />
        )}

        {/* Liked Songs / Favorites View */}
        {activeTab === "favorites" && !(searchQuery && showFullResults) && (
          <LikedSongsView />
        )}

        {/* Songs Section or Search Results */}
        {activeTab !== "categories" && activeTab !== "recently-played" && activeTab !== "playlists" && activeTab !== "favorites" && !(activeTab === "playlist") && (
          searchQuery && showFullResults ? (
            <div className="flex-1 flex flex-col min-h-0 space-y-8">
              {filteredSongs.length > 0 && (
                <SearchResults
                  results={filteredSongs}
                  query={searchQuery}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  playSong={playSong}
                />
              )}
              {lyricsResults.length > 0 && (
                <div className={`${filteredSongs.length > 0 ? "border-t border-line/30 pt-6" : ""}`}>
                  <LyricsSearchResults
                    results={lyricsResults}
                    total={lyricsTotal}
                    query={searchQuery}
                    loading={lyricsLoading}
                    error={lyricsError}
                    hasMore={lyricsHasMore}
                    onLoadMore={lyricsLoadMore}
                  />
                </div>
              )}
              {filteredSongs.length === 0 && lyricsResults.length === 0 && !lyricsLoading && (
                <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                  <Search className="w-8 h-8 text-dim mb-4" />
                  <h2 className="text-lg font-semibold text-title">No matches found</h2>
                  <p className="text-sm text-muted mt-1.5 max-w-xs">
                    We couldn&apos;t find any songs or lyrics matching &ldquo;{searchQuery}&rdquo;.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <SongsSection
              songs={filteredSongs}
              songsLoading={songsLoading}
              currentSong={currentSong}
              isPlaying={isPlaying}
              playSong={playSong}
              selectedLetter={selectedLetter}
              setSelectedLetter={setSelectedLetter}
            />
          )
        )}
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* ─── MOBILE VIEW ─── */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="block lg:hidden p-4 space-y-6">
        
        {/* 1. BROWSE TAB */}
        {activeTab === "discover" && (
          <div className="space-y-6">
            
            {!selectedLetter && showFullHome && <HeroCarousel />}
            {!selectedLetter && <VerseOfTheWeek />}
            {!selectedLetter && showFullHome && <RecentlyPlayed />}

            <SongsSection
              songs={filteredSongs}
              songsLoading={songsLoading}
              currentSong={currentSong}
              isPlaying={isPlaying}
              playSong={playSong}
              selectedLetter={selectedLetter}
              setSelectedLetter={setSelectedLetter}
            />
          </div>
        )}

        {/* 2. CATEGORIES TAB */}
        {activeTab === "categories" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <CategoryExplorer />
          </div>
        )}

        {/* 3. SEARCH TAB */}
        {activeTab === "search" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {!searchParams?.get("category") && (
              <>
                {!(isSearchFocused || searchQuery.trim() !== "") ? (
                  /* Standard Spotify header & clean input */
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex flex-col">
                      <h1 className="text-3xl font-black text-title tracking-tight">Search</h1>
                    </div>
                    <div className="relative flex items-center w-full">
                      <div className="relative flex-1">
                        <Search className="w-5 h-5 text-dim absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="What do you want to listen to?"
                          value={mobileInputValue}
                          onFocus={() => setIsSearchFocused(true)}
                          onChange={(e) => {
                            onMobileSearchChange(e);
                          }}
                          className="w-full h-11 pl-12 pr-24 text-sm bg-card-hover rounded-lg focus:outline-none focus:bg-line transition-all duration-150 text-title placeholder-muted border-none font-medium shadow-inner"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                          {mobileInputValue && (
                            <button
                              onClick={clearMobileSearch}
                              className="p-1 hover:bg-line/30 rounded-full text-dim hover:text-title cursor-pointer transition-all duration-150"
                              title="Clear Search"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <div className="w-px h-4.5 bg-line mx-1 self-center shrink-0" aria-hidden="true" />
                          <button
                            id="tour-mobile-search-mic-btn"
                            onClick={triggerVoiceSearch}
                            className="p-1.5 rounded-full text-dim hover:text-amber-400 hover:bg-line/30 active:scale-95 transition-all duration-200 cursor-pointer"
                            title="Voice Search"
                          >
                            <Mic className="w-5 h-5" />
                          </button>
                          <button
                            id="tour-mobile-categories"
                            onClick={() => {
                              setActiveTab("categories");
                              router.push("/?tab=categories");
                            }}
                            className="p-1.5 rounded-full text-dim hover:text-amber-400 hover:bg-line/30 active:scale-95 transition-all duration-200 cursor-pointer"
                            title="Browse Categories"
                          >
                            <LayoutGrid className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Focused / active search sticky layout */
                  <div className="sticky top-0 bg-card py-2 z-30 flex items-center gap-2.5 w-full animate-in slide-in-from-top-1.5 duration-200">
                    <div className="relative flex-1">
                      <Search className="w-5 h-5 text-dim absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search songs, artists, genres..."
                        value={mobileInputValue}
                        onChange={(e) => {
                          onMobileSearchChange(e);
                        }}
                        className="w-full h-11 pl-12 pr-24 text-sm bg-card-hover rounded-lg focus:outline-none transition-all duration-150 text-title placeholder-muted border-none font-medium"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                        {mobileInputValue && (
                          <button
                            onClick={() => {
                              clearMobileSearch();
                            }}
                            className="p-1 hover:bg-card-hover rounded-full text-dim hover:text-title cursor-pointer transition-colors duration-150"
                            title="Clear Search"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className="w-px h-4.5 bg-line mx-1 self-center shrink-0" aria-hidden="true" />
                        <button
                          id="tour-mobile-search-mic-btn-focused"
                          onClick={triggerVoiceSearch}
                          className="p-1.5 rounded-full text-dim hover:text-amber-400 hover:bg-line/30 active:scale-95 transition-all duration-200 cursor-pointer"
                          title="Voice Search"
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setIsSearchFocused(false);
                            setActiveTab("categories");
                            router.push("/?tab=categories");
                          }}
                          className="p-1.5 rounded-full text-dim hover:text-amber-400 hover:bg-line/30 active:scale-95 transition-all duration-200 cursor-pointer"
                          title="Browse Categories"
                        >
                          <LayoutGrid className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsSearchFocused(false);
                        clearMobileSearch();
                      }}
                      className="text-xs font-bold text-title hover:text-dim active:scale-95 transition-all duration-150 pr-1 shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}

            {searchParams?.get("category") ? (
              /* Category details page always takes precedence */
              <CategoryExplorer />
            ) : isSearchFocused && searchQuery.trim() === "" ? (
              /* focused empty state: Recent Searches */
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-title">Recent searches</h2>
                  {recentSearches.length > 0 && (
                    <button
                      onClick={() => setRecentSearches([])}
                      className="text-xs font-bold text-dim hover:text-title transition-colors cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {recentSearches.length === 0 ? (
                  <div className="text-center py-16 text-muted">
                    <p className="text-sm font-semibold">Search for songs, artists, or categories</p>
                    <p className="text-xs text-dim mt-1">Your recent searches will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentSearches.map((query, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-card-hover/40 cursor-pointer transition-colors"
                        onClick={() => {
                          setSearchQuery(query);
                          setShowFullResults(true);
                        }}
                      >
                        <div className="flex items-center gap-3.5">
                          <Clock className="w-4 h-4 text-muted" />
                          <span className="text-sm font-semibold text-title">{query}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecentSearches(recentSearches.filter((_, i) => i !== index));
                          }}
                          className="p-1 hover:bg-card-hover rounded-full text-dim hover:text-title cursor-pointer transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : searchQuery.trim() === "" ? (
              /* Search Hub default: Dynamic Category Explorer */
              <CategoryExplorer />
            ) : (
              /* Inline Search Results */
              <div className="space-y-6">
                {/* 1. Songs metadata matches */}
                {mobileSearchResults.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-line pb-2">
                      <span className="text-xs font-bold text-muted uppercase tracking-wider">Songs</span>
                      <span className="text-xs text-dim">{mobileSearchResults.length} found</span>
                    </div>
                    <div className="space-y-1.5">
                      {mobileSearchResults.map((song) => {
                        const isCurrent = currentSong?.id === song.id;
                        return (
                          <div
                            key={song.id}
                            onClick={() => {
                              playSong(song);
                              router.push(`/song/${encodeURIComponent(song.slug || song.id)}`);
                            }}
                            className={`flex items-center gap-3 p-2 rounded-xl active:bg-card-hover transition-colors cursor-pointer ${
                              isCurrent ? "bg-card-hover border border-line" : ""
                            }`}
                          >
                            <div className="w-11 h-11 rounded-lg overflow-hidden border border-line shrink-0">
                              <SongArtwork song={song} className="w-full h-full object-cover" iconSize="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm font-semibold block truncate ${
                                isCurrent ? "text-title" : "text-title"
                              } ${song.teluguTitle ? "font-telugu" : ""}`}>
                                {song.teluguTitle || song.title}
                              </span>
                              <span className="text-xs text-muted block truncate mt-0.5">
                                {song.titleEnglish && song.titleEnglish !== (song.teluguTitle || song.title)
                                  ? `${song.titleEnglish} • `
                                  : ""}
                                {getSongArtistName(song) || "Unknown Artist"}
                              </span>
                            </div>
                            <div className="shrink-0 flex items-center gap-1 text-xs text-dim pr-1">
                              {isCurrent && isPlaying ? (
                                <div className="flex items-end gap-[2px] h-3">
                                  <span className="w-[2px] bg-white rounded-full h-3 animate-music-bar-1" />
                                  <span className="w-[2px] bg-white rounded-full h-2 animate-music-bar-2" />
                                  <span className="w-[2px] bg-white rounded-full h-2.5 animate-music-bar-3" />
                                </div>
                              ) : (
                                <span>{song.duration}</span>
                              )}

                              {/* Add to Playlist (+) button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAddToPlaylistSong(song);
                                }}
                                className="p-1.5 rounded-lg hover:bg-card-hover text-muted hover:text-[#D4A32A] transition-colors cursor-pointer"
                                title="Add to Playlist"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Lyrics matches */}
                {lyricsResults.length > 0 && (
                  <div className="space-y-4">
                    <LyricsSearchResults
                      results={lyricsResults}
                      total={lyricsTotal}
                      query={searchQuery}
                      loading={lyricsLoading}
                      error={lyricsError}
                      hasMore={lyricsHasMore}
                      onLoadMore={lyricsLoadMore}
                    />
                  </div>
                )}

                {/* Loading state */}
                {lyricsLoading && mobileSearchResults.length === 0 && lyricsResults.length === 0 && (
                  <div className="text-center py-12 text-muted">
                    <p className="text-sm">Searching...</p>
                  </div>
                )}

                {/* Empty state */}
                {mobileSearchResults.length === 0 && lyricsResults.length === 0 && !lyricsLoading && (
                  <div className="text-center py-12 text-muted">
                    <p className="font-semibold text-sm">No matches found</p>
                    <p className="text-xs mt-1 text-dim">Try another spelling or phrase</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. FAVORITES TAB (MOBILE) */}
        {activeTab === "favorites" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <LikedSongsView />
          </div>
        )}

        {/* 5. RECENTLY PLAYED TAB (MOBILE) */}
        {activeTab === "recently-played" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <RecentlyPlayedView />
          </div>
        )}

        {/* 6. PLAYLISTS TAB (MOBILE) */}
        {(activeTab === "playlist" || activeTab === "playlists") && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {activePlaylistId ? (
              <PlaylistDetailView
                playlistId={activePlaylistId}
                onBack={() => {
                  setActivePlaylistId(null);
                  setActiveTab("playlists");
                }}
                onEdit={(pl) => {
                  setEditingPlaylist(pl);
                  setIsCreatePlaylistOpen(true);
                }}
              />
            ) : (
              <PlaylistsOverview
                onSelectPlaylist={(id) => {
                  setActiveTab("playlist");
                  setActivePlaylistId(id);
                }}
                onCreateClick={() => setIsCreatePlaylistOpen(true)}
                onEditClick={(pl) => {
                  setEditingPlaylist(pl);
                  setIsCreatePlaylistOpen(true);
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<FullAppSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
