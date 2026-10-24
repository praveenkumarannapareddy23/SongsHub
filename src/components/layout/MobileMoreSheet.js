"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayCircle,
  LayoutGrid,
  MessageSquare,
  Info,
  X,
  HelpCircle,
  Clock,
  ListMusic,
} from "lucide-react";
import { useAudio } from "@/context/audio-context";
import { useTour } from "@/context/tour-context";
import { useRouter } from "next/navigation";

const moreItems = [
  {
    id: "now-playing",
    icon: <PlayCircle className="w-5 h-5" />,
    label: "Now Playing",
    description: "View current song lyrics",
    accent: "text-sky-400",
  },
  {
    id: "recently-played",
    icon: <Clock className="w-5 h-5" />,
    label: "Recently Played",
    description: "Listening history & recent tracks",
    accent: "text-[#D4A32A]",
  },
  {
    id: "playlists",
    icon: <ListMusic className="w-5 h-5" />,
    label: "My Playlists",
    description: "Custom worship playlists",
    accent: "text-purple-400",
  },
  {
    id: "categories",
    icon: <LayoutGrid className="w-5 h-5" />,
    label: "Categories",
    description: "Browse by genre & mood",
    accent: "text-amber-400",
  },
  {
    id: "contact",
    icon: <MessageSquare className="w-5 h-5" />,
    label: "Contact Us",
    description: "Send feedback or request a song",
    accent: "text-emerald-400",
  },
  {
    id: "replay-tour",
    icon: <HelpCircle className="w-5 h-5" />,
    label: "Replay Tour",
    description: "Walk through app features again",
    accent: "text-purple-400",
  },
  {
    id: "about",
    icon: <Info className="w-5 h-5" />,
    label: "About",
    description: "Learn more about YouWorship",
    accent: "text-sky-400",
  },
];

export default function MobileMoreSheet({
  isOpen,
  onClose,
  onOpenTalkToUs,
  onOpenAbout,
}) {
  const { currentSong, setActiveTab, setActivePlaylistId, setViewedSongId } = useAudio();
  const { startTour } = useTour();
  const router = useRouter();

  const handleItemClick = (itemId) => {
    onClose();
    // Small delay so the sheet closes before navigation triggers
    setTimeout(() => {
      switch (itemId) {
        case "replay-tour":
          startTour();
          break;
        case "now-playing":
          if (currentSong) {
            router.push(
              `/song/${encodeURIComponent(currentSong.slug || currentSong.id)}?view=lyrics`
            );
          } else {
            setActiveTab("discover");
            router.push("/");
          }
          break;
        case "recently-played":
          setActiveTab("recently-played");
          setActivePlaylistId(null);
          setViewedSongId(null);
          router.push("/?tab=recently-played");
          break;
        case "playlists":
          setActiveTab("playlists");
          setActivePlaylistId(null);
          setViewedSongId(null);
          router.push("/?tab=playlists");
          break;
        case "categories":
          setActiveTab("categories");
          setActivePlaylistId(null);
          setViewedSongId(null);
          router.push("/?tab=categories");
          break;
        case "contact":
          onOpenTalkToUs?.();
          break;
        case "about":
          onOpenAbout?.();
          break;

        default:
          break;
      }
    }, 200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 cursor-pointer"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-line/30 rounded-t-2xl shadow-2xl max-h-[75vh] overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]"
          >
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-line/50" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-line/20">
              <h3 className="text-sm font-bold text-title">More</h3>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-card-hover rounded-full text-dim hover:text-copy transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="px-3 py-2 space-y-0.5">
              {/* ─── Menu items ─── */}
              {moreItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className="w-full flex items-center gap-4 px-3 py-3.5 rounded-xl hover:bg-card-hover/60 active:bg-card-hover transition-all text-left cursor-pointer group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-card-hover border border-line flex items-center justify-center shrink-0 ${item.accent} group-hover:scale-105 transition-transform`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-title block truncate">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-muted block truncate mt-0.5">
                      {item.description}
                    </span>
                  </div>
                  <div className="text-dim shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            {/* Bottom safe area padding */}
            <div className="h-4" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
