"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Folder,
  Music2,
  Search,
  Heart,
  Ellipsis,
} from "lucide-react";
import { useAudio } from "@/context/audio-context";
import { useSearch } from "@/context/search-context";
import { useWelcomeModal } from "@/context/welcome-modal-context";
import MobileMoreSheet from "./MobileMoreSheet";

export default function MobileNav({ isAuthenticated, setShowAuth, setAuthMode, setShowTalkToUs, setShowAboutModal }) {
  const {
    activeTab,
    setActiveTab,
    setActivePlaylistId,
    setViewedSongId,
    showFullHome,
    setShowFullHome,
    setCurrentSectionLetter,
  } = useAudio();

  const { setSearchQuery, setShowFullResults } = useSearch();
  const router = useRouter();
  const pathname = usePathname();
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const isOnSongPage = pathname?.startsWith("/song/");

  const { requireAuth: triggerWelcomeNudge } = useWelcomeModal();

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const scrollContainers = document.querySelectorAll(
        ".overflow-y-auto, [class*='overflow-y-auto']",
      );
      scrollContainers.forEach((el) => {
        el.scrollTop = 0;
      });
      const mainEl = document.querySelector("main");
      if (mainEl) {
        mainEl.scrollTo(0, 0);
      }
    }
  };

  const tabs = [
    {
      id: "home",
      label: "Home",
      icon: <Home className="w-6 h-6 stroke-[2.2]" />,
      onClick: () => {
        scrollToTop();
        setSearchQuery("");
        setShowFullResults(false);
        setActiveTab("discover");
        setActivePlaylistId(null);
        setViewedSongId(null);
        setShowFullHome(true);
        router.push("/?tab=discover");
      },
    },
    {
      id: "categories",
      label: "Categories",
      icon: <Folder className="w-5 h-5" />,
      onClick: () => {
        scrollToTop();
        setSearchQuery("");
        setShowFullResults(false);
        setActiveTab("categories");
        setActivePlaylistId(null);
        setViewedSongId(null);
        router.push("/?tab=categories");
      },
    },
    {
      id: "songs",
      label: "Songs",
      icon: <Music2 className="w-5 h-5" />,
      onClick: () => {
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
      },
    },
    {
      id: "search",
      label: "Search",
      icon: <Search className="w-5 h-5" />,
      onClick: () => {
        scrollToTop();
        setActiveTab("search");
        setActivePlaylistId(null);
        setViewedSongId(null);
        router.push("/?tab=search");
      },
    },
    {
      id: "favorites",
      label: "Likes",
      icon: <Heart className="w-5 h-5" />,
      onClick: () => triggerWelcomeNudge(() => {
        scrollToTop();
        setSearchQuery("");
        setShowFullResults(false);
        setActiveTab("favorites");
        setActivePlaylistId(null);
        setViewedSongId(null);
        router.push("/?tab=favorites");
      }),
    },
  ];

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[56px] bg-card/95 backdrop-blur-xl border-t border-line z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.35)] select-none pointer-events-auto transform translate-z-0">
        {/* ─── Tab Buttons ─── */}
        <div className="flex items-center justify-around px-2 h-full pb-[env(safe-area-inset-bottom,0px)]">
          {tabs.map((tab) => {
            const isActive = !isOnSongPage && (
              activeTab === tab.id ||
              (tab.id === "home" && activeTab === "discover" && showFullHome) ||
              (tab.id === "songs" && activeTab === "discover" && !showFullHome)
            );
            return (
              <button
                key={tab.id}
                id={
                  tab.id === "home"
                    ? "tour-mobile-home"
                    : tab.id === "categories"
                    ? "tour-mobile-categories"
                    : tab.id === "songs"
                    ? "tour-mobile-songs"
                    : tab.id === "search"
                    ? "tour-mobile-search"
                    : tab.id === "favorites"
                    ? "tour-mobile-favorites"
                    : undefined
                }
                onClick={tab.onClick}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "text-title font-bold"
                    : "text-dim hover:text-copy"
                }`}
              >
                <span className={isActive ? "scale-105 text-white" : "text-dim"}>{tab.icon}</span>
                <span className={`text-[10px] font-semibold tracking-tight ${
                  isActive ? "opacity-100 text-white" : "opacity-70 text-dim"
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* ─── More Tab ─── */}
          <button
            onClick={() => setShowMoreSheet(true)}
            className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 cursor-pointer text-dim hover:text-copy"
            title="More"
          >
            <Ellipsis className="w-5 h-5 text-dim" />
            <span className="text-[10px] font-semibold tracking-tight opacity-70 text-dim">
              More
            </span>
          </button>
        </div>
      </nav>

      {/* ─── More Bottom Sheet ─── */}
      <MobileMoreSheet
        isOpen={showMoreSheet}
        onClose={() => setShowMoreSheet(false)}
        onOpenTalkToUs={() => setShowTalkToUs?.(true)}
        onOpenAbout={() => setShowAboutModal?.(true)}
      />
    </>
  );
}
