"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ListMusic,
  Shield,
  LogOut,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useAudio } from "@/context/audio-context";
import { useTour } from "@/context/tour-context";
import { useRouter } from "next/navigation";
import Image from "next/image";

/**
 * ProfileDropdown — User avatar button with dropdown menu.
 * Shows avatar image or initials fallback.
 * Menu items: Favorites, Playlists, Admin Dashboard, Logout.
 */
export default function ProfileDropdown() {
  const { user, isAuthenticated, signOut, firestoreData } = useAuth();
  const { setActiveTab, setActivePlaylistId, setViewedSongId } = useAudio();
  const { startTour } = useTour();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  if (!isAuthenticated || !user) return null;

  const menuItems = [
    { icon: <Heart className="w-4 h-4" />, label: "Favorites", onClick: () => {
      setIsOpen(false);
      setActiveTab("favorites");
      setActivePlaylistId(null);
      setViewedSongId(null);
      router.push("/?tab=favorites");
    }},
    { icon: <ListMusic className="w-4 h-4" />, label: "Playlists", onClick: () => {
      setIsOpen(false);
      setActiveTab("playlist");
      setActivePlaylistId(null);
      setViewedSongId(null);
      router.push("/?tab=playlists");
    }},
    { icon: <HelpCircle className="w-4 h-4" />, label: "Replay Tour", onClick: () => {
      setIsOpen(false);
      startTour();
    }},
  ];

  // Admin-only item
  const isAdmin =
    user?.email === "alsaikumar22@gmail.com" ||
    user?.email === "control@youworship.world" ||
    user?.email?.endsWith("@youworship.admin") ||
    firestoreData?.role === "admin";

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Avatar Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-card-hover border border-line hover:bg-line transition-all cursor-pointer active:scale-95"
          aria-label="User menu"
          aria-expanded={isOpen}
        >
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName || "User"}
              width={24}
              height={24}
              className="w-6 h-6 rounded-full object-cover"
              referrerPolicy="no-referrer"
              sizes="24px"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#D4A32A]/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#D4A32A]">
                {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-dim transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-56 bg-[#181818] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-2xl overflow-hidden z-50"
              role="menu"
            >
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                <p className="text-sm font-semibold text-white truncate">
                  {user.displayName || "User"}
                </p>
                <p className="text-xs text-[#727272] truncate mt-0.5">
                  {user.email || ""}
                </p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#a7a7a7] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer"
                    role="menuitem"
                  >
                    <span className="text-[#727272]">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}

                {/* Admin Dashboard (admin only) */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/admin");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#D4A32A] hover:text-[#D4A32A] hover:bg-[rgba(212,163,42,0.08)] transition-colors cursor-pointer"
                    role="menuitem"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Dashboard</span>
                  </button>
                )}

                {/* Divider */}
                <div className="my-1 border-t border-[rgba(255,255,255,0.06)]" />

                {/* Logout */}
                <button
                  onClick={async () => {
                    setIsOpen(false);
                    try {
                      await signOut();
                      router.push("/");
                    } catch (error) {
                      console.error("Logout error:", error);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#a7a7a7] hover:text-red-400 hover:bg-[rgba(239,68,68,0.08)] transition-colors cursor-pointer"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
