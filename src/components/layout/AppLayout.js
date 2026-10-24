"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAudio } from "@/context/audio-context";
import { useSearch } from "@/context/search-context";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Header from "./Header";
import MobileNav from "./MobileNav";
import PlayerBar from "@/components/player-bar";
import AuthModal from "@/components/auth/AuthModal";
import TalkToUsDrawer from "./TalkToUsDrawer";
import { useAuth } from "@/context/auth-context";
import {
  WelcomeModalProvider,
  useWelcomeModal,
} from "@/context/welcome-modal-context";
import WelcomeModal from "@/components/auth/WelcomeModal";
import SignInNudge from "@/components/auth/SignInNudge";
import Image from "next/image";
import SongArtwork from "@/components/ui/SongArtwork";
import {
  Home,
  Music,
  Music2,
  PlayCircle,
  Play,
  LayoutGrid,
  Plus,
  ListMusic,
  SquareChevronLeft,
  SquareChevronRight,
  ChevronRight,
  X,
  Library,
  Heart,
  Info,
  Trash2,
  MessageSquare,
  MessageCircle,
  Shield,
  Sparkles,
  HelpCircle,
  ChevronDown,
  Compass,
  Clock,
  ArrowUp,
} from "lucide-react";
import FeatureTour from "./FeatureTour";
import { useTour } from "@/context/tour-context";
import AddToPlaylistModal from "@/components/playlist/AddToPlaylistModal";
import CreatePlaylistModal from "@/components/playlist/CreatePlaylistModal";
import CollaboratorsModal from "@/components/playlist/CollaboratorsModal";
import QueuePanel from "@/components/player/QueuePanel";

export default function AppLayout({ children }) {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("signup");

  return (
    <WelcomeModalProvider
      showAuthModal={() => {
        setShowAuth(true);
        setAuthMode("signup");
      }}
    >
      <Suspense fallback={<>{children}</>}>
        <AppLayoutInner
          showAuth={showAuth}
          setShowAuth={setShowAuth}
          authMode={authMode}
          setAuthMode={setAuthMode}
        >
          {children}
        </AppLayoutInner>
      </Suspense>
    </WelcomeModalProvider>
  );
}

function AppLayoutInner({
  children,
  showAuth,
  setShowAuth,
  authMode,
  setAuthMode,
}) {
  const {
    isOpen: isWelcomeOpen,
    triggerReason: welcomeReason,
    closeWelcomeModal,
    nudgeMessage,
    dismissNudge,
    requireAuth,
  } = useWelcomeModal();

  const { startTour } = useTour();

  const {
    songs,
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    favorites,
    playlists,
    createPlaylist,
    deletePlaylist,
    toggleFavorite,
    activeTab,
    setActiveTab,
    activePlaylistId,
    setActivePlaylistId,
    setViewedSongId,
    showFullHome,
    setShowFullHome,
    recentlyPlayed,
    addToPlaylistSong,
    setAddToPlaylistSong,
    isCreatePlaylistOpen,
    setIsCreatePlaylistOpen,
    editingPlaylist,
    setEditingPlaylist,
    collaboratingPlaylist,
    setCollaboratingPlaylist,
    hasEnteredApp,
    setCurrentSectionLetter,
  } = useAudio();

  const pathname = usePathname();
  const router = useRouter();
  const { setSearchQuery, setShowFullResults } = useSearch();
  const {
    isAuthenticated,
    loading: authLoading,
    setReturnPath,
    returnPath,
  } = useAuth();

  // After auth resolves (splash screen no longer showing), redirect to stored returnPath
  useEffect(() => {
    if (!authLoading && isAuthenticated && returnPath) {
      const path = returnPath;
      setReturnPath(null);
      router.push(path);
    }
  }, [authLoading, isAuthenticated, returnPath, router, setReturnPath]);

  // Detect ?auth= URL param (from shared song links) and open auth modal
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get("auth");
    if (authParam && !isAuthenticated) {
      setAuthMode(authParam); // "login" or "signup"
      setShowAuth(true);
      // Store redirect path if present
      const redirectParam = params.get("redirect");
      if (redirectParam) {
        setReturnPath(decodeURIComponent(redirectParam));
      }
      // Clean URL without triggering a re-render loop
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [isAuthenticated, setReturnPath]);

  // Scroll to top button & circular filling progress
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll =
        window.scrollY || document.documentElement.scrollTop || 0;
      const winHeight =
        (document.documentElement.scrollHeight || document.body.scrollHeight) -
        window.innerHeight;

      const scrollContainers = document.querySelectorAll(".overflow-y-auto");
      let maxInternalScroll = 0;
      let maxInternalHeight = 0;

      scrollContainers.forEach((el) => {
        if (el.scrollTop > maxInternalScroll) {
          maxInternalScroll = el.scrollTop;
          maxInternalHeight = el.scrollHeight - el.clientHeight;
        }
      });

      const activeScroll = Math.max(winScroll, maxInternalScroll);
      const activeHeight = Math.max(winHeight, maxInternalHeight);

      if (activeHeight > 0) {
        const progress = Math.min(
          100,
          Math.max(0, (activeScroll / activeHeight) * 100),
        );
        setScrollProgress(progress);
      }

      setShowScrollTop(activeScroll > 120);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
      capture: true,
    });
    document.addEventListener("scroll", handleScroll, {
      passive: true,
      capture: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
      document.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, []);

  const handleScrollToTop = () => {
    // Instant jump to top directly without smooth scroll delay
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const scrollContainers = document.querySelectorAll(".overflow-y-auto");
    scrollContainers.forEach((el) => {
      el.scrollTop = 0;
    });
    setScrollProgress(0);
    setShowScrollTop(false);
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [showTalkToUs, setShowTalkToUs] = useState(false);
  const [talkToUsTab, setTalkToUsTab] = useState("request");
  const [talkToUsCategory, setTalkToUsCategory] = useState("Contact Us");
  const [queriesExpanded, setQueriesExpanded] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      const mainEl = document.querySelector("main");
      if (mainEl) {
        mainEl.scrollTo(0, 0);
      }
    }
  };

  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName("");
      setShowCreateModal(false);
    }
  };

  const searchParams = useSearchParams();
  const isLanding =
    pathname === "/" &&
    !searchParams?.get("tab") &&
    !searchParams?.get("q") &&
    !searchParams?.get("category") &&
    !searchParams?.get("playlistId") &&
    !searchParams?.get("view") &&
    !searchParams?.get("letter") &&
    !searchParams?.get("app") &&
    !searchParams?.get("auth");
  const isDiscover = pathname === "/" || pathname === "/home";

  // Footer / header links open drawers via custom events
  useEffect(() => {
    const openTalkToUs = () => setShowTalkToUs(true);
    const openAbout = () => setShowAboutModal(true);
    window.addEventListener("youworship:open-talk-to-us", openTalkToUs);
    window.addEventListener("youworship:open-about", openAbout);
    return () => {
      window.removeEventListener("youworship:open-talk-to-us", openTalkToUs);
      window.removeEventListener("youworship:open-about", openAbout);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Disable hotkey when on the Explore Songs landing screen
      if (isLanding) return;

      if (e.code === "Space" || e.key === " ") {
        // Skip hotkey when typing in input, textarea, select, button, or contenteditable
        const active = document.activeElement;
        if (
          active &&
          (active.tagName === "INPUT" ||
            active.tagName === "TEXTAREA" ||
            active.tagName === "SELECT" ||
            active.tagName === "BUTTON" ||
            active.isContentEditable)
        ) {
          return;
        }

        // Prevent default spacebar scroll behavior
        e.preventDefault();

        // Toggle playback status
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [togglePlay, isAuthenticated]);

  // ─── AUTH LOADING: no splash screen ──────────────────────────────────────
  // The app renders immediately while Firebase resolves the auth state in the
  // background (isAuthenticated flips a moment later). Removing the branded
  // splash avoids the jarring logo + spinner flash after "Explore Songs".

  // ─── AUTH GATE: for non-authenticated users, show content but block interaction ───
  // The home page content is fully visible. An invisible overlay catches all clicks
  // and triggers the auth modal. This prevents ProtectedAction double-modals and
  // gives the user a clean "browse first, then authenticate" experience.

  // ─── LANDING SCREEN (Explore Songs): render children without app chrome ───
  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col bg-canvas text-copy font-sans overflow-hidden select-none">
      <Header setShowAuth={setShowAuth} setAuthMode={setAuthMode} />
      <div className="flex flex-1 min-h-0 min-w-0 lg:pt-2 lg:px-2 lg:pb-[88px] lg:gap-2 gap-0 p-0 overflow-hidden">
        {/* SIDEBAR — production-grade navigation */}
        <aside
          className={`${sidebarCollapsed ? "w-20" : "w-72"} bg-card rounded-xl hidden lg:flex flex-col shrink-0 transition-all duration-300 ease-in-out`}
        >
          {/* ─── Main Navigation ─── */}
          <div className="px-3 pt-3 pb-2 space-y-0.5 shrink-0">
            <div id="tour-nav-songs">
              <SidebarNavItem
                icon={<Music className="w-5 h-5" />}
                label="Songs"
                collapsed={sidebarCollapsed}
                active={isDiscover && activeTab === "discover" && !showFullHome}
                onClick={() => {
                  scrollToTop();
                  setSearchQuery("");
                  setShowFullResults(false);
                  setActiveTab("discover");
                  setActivePlaylistId(null);
                  setViewedSongId(null);
                  setShowFullHome(false);
                  if (setCurrentSectionLetter) setCurrentSectionLetter(null);
                  if (typeof window !== "undefined") {
                    try {
                      sessionStorage.removeItem("yw_selected_letter");
                    } catch (e) {}
                  }
                  router.push("/?tab=songs");
                }}
              />
            </div>
            <SidebarNavItem
              icon={<PlayCircle className="w-5 h-5" />}
              label="Now Playing"
              collapsed={sidebarCollapsed}
              active={false}
              onClick={() => {
                scrollToTop();
                if (currentSong) {
                  router.push(
                    `/song/${encodeURIComponent(currentSong.slug || currentSong.id)}?view=lyrics`,
                  );
                } else {
                  setSearchQuery("");
                  setShowFullResults(false);
                  setActivePlaylistId(null);
                  setViewedSongId(null);
                  router.push("/");
                }
              }}
            />
            <div id="tour-nav-categories">
              <SidebarNavItem
                icon={<LayoutGrid className="w-5 h-5" />}
                label="Categories"
                collapsed={sidebarCollapsed}
                active={isDiscover && activeTab === "categories"}
                onClick={() => {
                  scrollToTop();
                  setSearchQuery("");
                  setShowFullResults(false);
                  setActiveTab("categories");
                  setActivePlaylistId(null);
                  setViewedSongId(null);
                  router.push("/?tab=categories");
                }}
              />
            </div>
          </div>

          {/* ─── Divider ─── */}
          <div className="mx-3 border-t border-line/10 shrink-0" />

          {/* ─── Your Library Section ─── */}
          <div className="min-h-0 flex-1 flex flex-col px-3 pt-2 pb-1 overflow-hidden">
            {/* Library Header */}
            <div
              className={`flex items-center ${sidebarCollapsed ? "justify-center px-3" : "justify-between px-1"} py-2 shrink-0`}
            >
              {!sidebarCollapsed && (
                <span className="text-[10px] font-bold text-dim uppercase tracking-wider">
                  Your Library
                </span>
              )}
              {sidebarCollapsed ? (
                <Library className="w-5 h-5 text-dim" />
              ) : (
                <button
                  onClick={() => {
                    requireAuth(() => {
                      setIsCreatePlaylistOpen(true);
                    });
                  }}
                  className="p-1 hover:bg-card-hover rounded-md text-dim hover:text-copy transition-colors cursor-pointer"
                  title="New Playlist"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Recently Played */}
            {!sidebarCollapsed && (
              <div className="px-1 mb-1 shrink-0">
                <button
                  onClick={() => {
                    scrollToTop();
                    setSearchQuery("");
                    setShowFullResults(false);
                    setActivePlaylistId(null);
                    setViewedSongId(null);
                    setActiveTab("recently-played");
                    router.push("/?tab=recently-played");
                  }}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left cursor-pointer ${
                    isDiscover && activeTab === "recently-played"
                      ? "bg-card-hover"
                      : "hover:bg-card-hover"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-card-hover border border-line flex items-center justify-center shrink-0 shadow-sm text-dim">
                    <Clock className="w-4.5 h-4.5 text-[#D4A32A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-copy block truncate">
                      Recently Played
                    </span>
                    <span className="text-xs text-muted block truncate">
                      {
                        (Array.isArray(recentlyPlayed)
                          ? recentlyPlayed
                          : []
                        ).filter((id) => songs.some((s) => s.id === id)).length
                      }{" "}
                      song
                      {(Array.isArray(recentlyPlayed)
                        ? recentlyPlayed
                        : []
                      ).filter((id) => songs.some((s) => s.id === id))
                        .length !== 1
                        ? "s"
                        : ""}
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* Collection (Favorites) */}
            {!sidebarCollapsed && (
              <div className="px-1 mb-1 shrink-0">
                <div id="tour-nav-favorites" className="group relative">
                  <button
                    onClick={() => {
                      requireAuth(() => {
                        scrollToTop();
                        setSearchQuery("");
                        setShowFullResults(false);
                        setActivePlaylistId(null);
                        setViewedSongId(null);
                        setActiveTab("favorites");
                        router.push("/?tab=favorites");
                      });
                    }}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left cursor-pointer ${
                      isDiscover && activeTab === "favorites"
                        ? "bg-card-hover"
                        : "hover:bg-card-hover"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-300 flex items-center justify-center shrink-0 shadow-sm">
                      <Heart className="w-4.5 h-4.5 text-title fill-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-copy block truncate">
                        Liked Songs
                      </span>
                      <span className="text-xs text-muted block truncate">
                        {
                          (Array.isArray(favorites) ? favorites : []).filter(
                            (id) => songs.some((s) => s.id === id),
                          ).length
                        }{" "}
                        liked song
                        {(Array.isArray(favorites) ? favorites : []).filter(
                          (id) => songs.some((s) => s.id === id),
                        ).length !== 1
                          ? "s"
                          : ""}
                      </span>
                    </div>
                  </button>
                  {favorites.length > 0 && (
                    <button
                      onClick={() =>
                        favorites.forEach((id) => toggleFavorite(id))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted hover:text-red-400 hover:bg-card-hover opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Clear all favorites"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Playlists label */}
            {!sidebarCollapsed && (
              <div className="px-1 pt-2 pb-1 flex items-center justify-between shrink-0">
                <button
                  onClick={() => {
                    scrollToTop();
                    setSearchQuery("");
                    setShowFullResults(false);
                    setActivePlaylistId(null);
                    setViewedSongId(null);
                    setActiveTab("playlists");
                    router.push("/?tab=playlists");
                  }}
                  className="text-[10px] font-bold text-dim hover:text-title uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Playlists
                </button>
              </div>
            )}

            {/* Playlist items — Expanded vertical scroll height */}
            <div
              className={`min-h-0 flex-1 ${sidebarCollapsed ? "" : "overflow-y-auto"} space-y-1 px-1 py-1`}
            >
              {playlists.length === 0 && !sidebarCollapsed && (
                <div className="px-2 py-6 text-center">
                  <p className="text-xs text-muted">No playlists yet</p>
                </div>
              )}
              {playlists.map((list) => (
                <div key={list.id} className="group relative">
                  <LibraryItem
                    icon={
                      <div className="w-9 h-9 rounded-lg bg-card-hover flex items-center justify-center shrink-0 shadow-sm text-dim">
                        <ListMusic className="w-4.5 h-4.5" />
                      </div>
                    }
                    title={list.name}
                    subtitle={`${list.songIds.length} songs`}
                    collapsed={sidebarCollapsed}
                    active={
                      isDiscover &&
                      activeTab === "playlist" &&
                      activePlaylistId === list.id
                    }
                    onClick={() => {
                      requireAuth(() => {
                        scrollToTop();
                        setActiveTab("playlist");
                        setActivePlaylistId(list.id);
                        setViewedSongId(null);
                        router.push(`/?tab=playlist&playlistId=${list.id}`);
                      });
                    }}
                  />
                  {!sidebarCollapsed && (
                    <button
                      onClick={() => deletePlaylist(list.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted hover:text-red-400 hover:bg-card-hover opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title={`Delete ${list.name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ─── Divider ─── */}
          <div className="mx-3 border-t border-line/10 shrink-0" />

          {/* ─── Queries Dropdown Section ─── */}
          <div className="px-3 pt-1.5 pb-2 space-y-0.5 shrink-0">
            <button
              onClick={() => {
                if (sidebarCollapsed) {
                  setSidebarCollapsed(false);
                  setQueriesExpanded(true);
                } else {
                  setQueriesExpanded((v) => !v);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                queriesExpanded && !sidebarCollapsed
                  ? "text-copy bg-card-hover/40"
                  : "text-muted hover:text-copy hover:bg-card-hover/20"
              }`}
              title="Queries & Support"
            >
              <div className="flex items-center gap-4">
                <HelpCircle className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && <span>Queries</span>}
              </div>
              {!sidebarCollapsed && (
                <ChevronDown
                  className={`w-4 h-4 text-muted transition-transform duration-200 ${
                    queriesExpanded ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {/* Dropdown Options */}
            {queriesExpanded && !sidebarCollapsed && (
              <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-line/25 ml-5.5 animate-in slide-in-from-top-2 duration-150">
                <SidebarNavItem
                  icon={<Shield className="w-4 h-4 text-indigo-400 shrink-0" />}
                  label="Account & Login Issues"
                  collapsed={false}
                  active={
                    showTalkToUs &&
                    talkToUsTab === "feedback" &&
                    talkToUsCategory === "Account & Login"
                  }
                  onClick={() => {
                    setTalkToUsTab("feedback");
                    setTalkToUsCategory("Account & Login");
                    setShowTalkToUs(true);
                  }}
                  isSubItem={true}
                />
                <SidebarNavItem
                  icon={
                    <Sparkles className="w-4 h-4 text-[#D4A32A] shrink-0" />
                  }
                  label="Feature Requests"
                  collapsed={false}
                  active={
                    showTalkToUs &&
                    talkToUsTab === "feedback" &&
                    talkToUsCategory === "Feature Request"
                  }
                  onClick={() => {
                    setTalkToUsTab("feedback");
                    setTalkToUsCategory("Feature Request");
                    setShowTalkToUs(true);
                  }}
                  isSubItem={true}
                />
                <SidebarNavItem
                  icon={
                    <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  }
                  label="Contact Us"
                  collapsed={false}
                  active={
                    showTalkToUs &&
                    talkToUsTab === "feedback" &&
                    talkToUsCategory === "Contact Us"
                  }
                  onClick={() => {
                    setTalkToUsTab("feedback");
                    setTalkToUsCategory("Contact Us");
                    setShowTalkToUs(true);
                  }}
                  isSubItem={true}
                />
                <SidebarNavItem
                  icon={
                    <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
                  }
                  label="Replay Tour"
                  collapsed={false}
                  active={false}
                  onClick={startTour}
                  isSubItem={true}
                />
              </div>
            )}

            <SidebarNavItem
              icon={<Info className="w-5 h-5 text-sky-400" />}
              label="About"
              collapsed={sidebarCollapsed}
              active={showAboutModal}
              onClick={() => setShowAboutModal(true)}
            />
          </div>

          {/* ─── Bottom Collapse Toggle ─── */}
          <div
            className={`px-3 pb-3 pt-1 ${sidebarCollapsed ? "flex justify-center" : "flex justify-end"}`}
          >
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="p-1.5 hover:bg-card-hover rounded-full text-dim hover:text-copy transition-colors cursor-pointer"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <SquareChevronLeft
                className={`w-5 h-5 transition-transform duration-300 ${
                  sidebarCollapsed ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </aside>

        {/* MAIN PANEL CONTENT */}
        <main
          className={`flex-1 flex flex-col min-w-0 bg-card lg:rounded-xl lg:border lg:border-line/30 overflow-hidden relative ${
            currentSong ? "pb-[120px]" : "pb-[60px]"
          } lg:pb-0`}
        >
          {children}
        </main>

        {/* RIGHT PANEL — Now Playing & Up Next (collapsible) */}
        <aside
          className={`${
            currentSong ? "hidden lg:flex" : "hidden"
          } flex-col shrink-0 bg-card rounded-xl border border-line/30 overflow-hidden transition-all duration-300 ease-in-out ${
            rightPanelCollapsed ? "w-12" : "w-80"
          }`}
        >
          {currentSong && rightPanelCollapsed ? (
            /* Collapsed: thin strip with expand button */
            <div className="flex flex-col items-center pt-3 h-full">
              <button
                onClick={() => setRightPanelCollapsed(false)}
                className="p-1.5 hover:bg-card-hover rounded-full text-dim hover:text-copy transition-colors cursor-pointer"
                title="Expand now playing"
              >
                <SquareChevronLeft className="w-5 h-5 rotate-180" />
              </button>
              {/* Mini album art indicator */}
              <div className="mt-4 w-8 h-8 rounded-md overflow-hidden border border-line opacity-60">
                <SongArtwork
                  song={currentSong}
                  className="w-full h-full object-cover"
                  iconSize="w-3 h-3"
                />
              </div>
            </div>
          ) : currentSong ? (
            /* Expanded: full content - entire right panel scrolls */
            <div className="flex flex-col h-full p-5 space-y-5 overflow-y-auto">
              {/* Header with collapse button - sticky so collapse button stays accessible */}
              <div className="flex items-center justify-between sticky top-0 bg-card z-10 py-1 -mt-1">
                <h3 className="text-[10px] font-bold text-dim uppercase tracking-wider">
                  Now Playing
                </h3>
                <button
                  onClick={() => setRightPanelCollapsed(true)}
                  className="p-1.5 hover:bg-card-hover rounded-full text-dim hover:text-copy transition-colors cursor-pointer"
                  title="Collapse panel"
                >
                  <SquareChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 shrink-0">
                <div className="aspect-square w-full rounded-lg overflow-hidden bg-card-hover border border-line">
                  <SongArtwork
                    song={currentSong}
                    className="w-full h-full object-cover"
                    iconSize="w-10 h-10"
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-sm text-title block truncate">
                    {currentSong.title}
                  </span>
                  <span className="text-xs text-muted block truncate">
                    {currentSong.artist}
                  </span>
                </div>
              </div>

              <div className="flex flex-col space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-dim uppercase tracking-wider">
                    Up Next (
                    {songs.filter((s) => s.id !== currentSong?.id).length})
                  </h3>
                </div>
                <div className="space-y-1.5 pr-1">
                  {songs
                    .filter((s) => s.id !== currentSong?.id)
                    .map((song) => (
                      <button
                        key={song.id}
                        onClick={() => playSong(song)}
                        className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-card-hover transition-colors text-left cursor-pointer group"
                      >
                        <SongArtwork
                          song={song}
                          className="w-8 h-8 object-cover rounded border border-line shrink-0"
                          iconSize="w-3 h-3"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-copy group-hover:text-title block truncate">
                            {song.teluguTitle || song.title}
                          </span>
                          <span className="text-[10px] text-dim block truncate">
                            {song.titleEnglish}
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {/* PERSISTENT AUDIO PLAYER */}
      <Suspense fallback={null}>
        <PlayerBar />
      </Suspense>

      {/* MOBILE BOTTOM NAV — fixed at bottom on mobile, hidden on md+ */}
      <MobileNav
        isAuthenticated={isAuthenticated}
        setShowAuth={setShowAuth}
        setAuthMode={setAuthMode}
        setShowTalkToUs={setShowTalkToUs}
        setShowAboutModal={setShowAboutModal}
      />

      {/* CREATE PLAYLIST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-line rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line-muted">
              <span className="font-semibold text-title text-sm">
                Create New Playlist
              </span>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-card-hover rounded-full text-dim hover:text-handle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePlaylist} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-dim uppercase tracking-wider block mb-1">
                  Playlist Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Focus Session, Pop Vibes"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-dim/30 focus:border-dim text-copy bg-card-hover"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-line rounded-lg text-xs font-semibold text-muted hover:bg-card-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-card text-title rounded-lg text-xs font-semibold hover:bg-card-hover active:scale-98 transition-all shadow-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUTH MODAL — rendered as overlay on top of page content when triggered */}
      {showAuth && !isAuthenticated && (
        <AuthModal
          initialStep={authMode}
          closable={true}
          onClose={() => {
            setShowAuth(false);
            setReturnPath(null);
          }}
          onSuccess={() => {
            setShowAuth(false);
            // After auth success, redirect to stored return path if set
            if (returnPath) {
              setTimeout(() => {
                router.push(returnPath);
                setReturnPath(null);
              }, 100);
            }
          }}
        />
      )}

      {/* ABOUT MODAL */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-line rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line-muted">
              <span className="font-semibold text-title text-sm">
                About YouWorship
              </span>
              <button
                onClick={() => setShowAboutModal(false)}
                className="p-1 hover:bg-card-hover rounded-full text-dim hover:text-handle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Logo & Brand */}
              <div className="flex items-center gap-4 pb-4 border-b border-line/50">
                <Image
                  src="/youworship-logo.png"
                  alt="You Worship"
                  width={56}
                  height={56}
                  className="w-14 h-14 object-contain shrink-0"
                />
                <div>
                  <h2 className="text-xl font-black text-title">YouWorship</h2>
                  <p className="text-[10px] text-title font-semibold mt-0.5">
                    Lyrics & Music
                  </p>
                </div>
              </div>

              {/* Mission Statement */}
              <div className="space-y-3 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-title">YouWorship</strong> is a
                  Christ-centered worship platform from the creators of{" "}
                  <a
                    href="https://trueharvest.world"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#D4A32A] hover:text-[#c49527] underline underline-offset-2 transition-colors font-semibold"
                  >
                    TrueHarvest (trueharvest.world)
                  </a>
                  .
                </p>

                <p>
                  While <strong className="text-title">TrueHarvest</strong> is
                  dedicated to helping believers grow through God&apos;s Word,{" "}
                  <strong className="text-title">
                    <a
                      href="https://youworship.world"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-title hover:text-[#D4A32A] underline underline-offset-2 transition-colors"
                    >
                      YouWorship
                    </a>{" "}
                    (youworship.world)
                  </strong>{" "}
                  exists to help believers respond to His Word through worship.
                </p>

                <div className="bg-canvas border-l-2 border-[#D4A32A] rounded-r-lg px-4 py-3 my-4">
                  <p className="text-sm italic text-muted leading-relaxed">
                    &ldquo;We believe every worship song is more than a melody —
                    every lyric carries a message that speaks to the heart.
                    Before you lead others in worship, let the words first
                    prepare your own heart and draw you closer to Christ.&rdquo;
                  </p>
                </div>

                <p className="font-semibold text-title text-center pt-1">
                  May every song you sing bring glory to God and lead many into
                  His presence.
                </p>
              </div>

              {/* Close Button */}
              <div className="flex justify-center pt-1">
                <button
                  onClick={() => setShowAboutModal(false)}
                  className="px-6 py-2 bg-card-hover border border-line rounded-lg text-xs font-semibold text-copy hover:bg-line transition-all active:scale-95 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action: Scroll To Top */}
      {showScrollTop && (
        <div className="fixed right-4 lg:right-6 bottom-32 lg:bottom-24 z-40 flex flex-col items-center gap-2 select-none">
          <button
            onClick={handleScrollToTop}
            className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-card/95 hover:bg-card-hover text-dim hover:text-title border border-line shadow-xl backdrop-blur-md flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 animate-in fade-in zoom-in-75 duration-200 group relative"
            title="Jump to top"
            aria-label="Jump to top"
          >
            {/* Circular filling SVG progress ring */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5"
              viewBox="0 0 40 40"
            >
              {/* Background Track */}
              <circle
                cx="20"
                cy="20"
                r="17"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                className="text-line/40"
              />
              {/* Animated Filling Progress Ring */}
              <circle
                cx="20"
                cy="20"
                r="17"
                stroke="#D4A32A"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                strokeDasharray="106.81"
                strokeDashoffset={106.81 - (scrollProgress / 100) * 106.81}
                className="transition-[stroke-dashoffset] duration-150 ease-out"
              />
            </svg>

            {/* Center Up Arrow */}
            <ArrowUp className="w-4 h-4 lg:w-4.5 lg:h-4.5 text-title group-hover:-translate-y-0.5 transition-transform relative z-10" />

            <span className="absolute right-full mr-2.5 px-2 py-1 bg-card/95 backdrop-blur-md text-title text-[11px] font-bold rounded-lg shadow-xl border border-line opacity-0 scale-95 origin-right group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none whitespace-nowrap">
              Top
            </span>
          </button>
        </div>
      )}

      {/* TALK TO US DRAWER (Fallback for footer contact links) */}
      <TalkToUsDrawer
        isOpen={showTalkToUs}
        onClose={() => setShowTalkToUs(false)}
        initialTab={talkToUsTab}
        initialCategory={talkToUsCategory}
      />

      {/* WELCOME MODAL */}
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={closeWelcomeModal}
        onSignIn={() => {
          setShowAuth(true);
          setAuthMode("signup");
        }}
        triggerReason={welcomeReason}
      />

      {/* SIGN IN NUDGE */}
      <SignInNudge
        isOpen={!!nudgeMessage}
        message={nudgeMessage || ""}
        onDismiss={dismissNudge}
        onSignIn={() => {
          setShowAuth(true);
          setAuthMode("signup");
        }}
      />
      {/* FEATURE ONBOARDING TOUR */}
      <FeatureTour />

      {/* GLOBAL PLAYLIST MODALS */}
      <AddToPlaylistModal
        song={addToPlaylistSong}
        isOpen={!!addToPlaylistSong}
        onClose={() => setAddToPlaylistSong(null)}
      />

      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => {
          setIsCreatePlaylistOpen(false);
          setEditingPlaylist(null);
        }}
        initialPlaylist={editingPlaylist}
      />

      <CollaboratorsModal
        playlist={collaboratingPlaylist}
        isOpen={!!collaboratingPlaylist}
        onClose={() => setCollaboratingPlaylist(null)}
      />

      {/* GLOBAL PLAY QUEUE DRAWER */}
      <QueuePanel />
    </div>
  );
}

function SidebarNavItem({
  icon,
  label,
  collapsed,
  active,
  onClick,
  isSubItem = false,
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-3"} ${
        isSubItem ? "px-2 py-2 text-xs" : "px-3 py-3 text-sm"
      } rounded-lg font-semibold transition-all group relative cursor-pointer ${
        active
          ? "text-copy bg-card-hover/20"
          : "text-muted hover:text-copy hover:bg-card-hover/10"
      }`}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && (
        <span
          className={`truncate ${active ? "text-title" : "text-muted group-hover:text-title"}`}
        >
          {label}
        </span>
      )}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-card text-title text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl border border-line">
          {label}
        </div>
      )}
    </button>
  );
}

function LibraryItem({ icon, title, subtitle, collapsed, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group relative cursor-pointer min-h-[48px] ${
        active ? "bg-card-hover border border-line/40 text-title" : "hover:bg-card-hover border border-transparent"
      }`}
      title={collapsed ? title : undefined}
    >
      {icon}
      {!collapsed && (
        <div className="flex-1 min-w-0 flex flex-col justify-center leading-snug">
          <span
            className={`text-sm font-semibold truncate block ${active ? "text-title" : "text-copy group-hover:text-title"}`}
          >
            {title}
          </span>
          <span className="text-[11px] text-muted truncate block mt-0.5">{subtitle}</span>
        </div>
      )}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-card text-title text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl border border-line">
          <div className="font-semibold">{title}</div>
          <div className="text-[10px] text-muted">{subtitle}</div>
        </div>
      )}
    </button>
  );
}
