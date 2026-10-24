"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music2, Heart, Clock, FolderHeart, Cloud, Bell } from "lucide-react";

/**
 * WelcomeModal — Premium welcome overlay shown on first-visit or feature gating.
 * Fully accessible, supports keyboard navigation, focus trap, and WCAG AA contrast.
 */
export default function WelcomeModal({
  isOpen,
  onClose,
  onSignIn,
  triggerReason = "first-visit",
}) {
  const modalRef = useRef(null);
  const ctaRef = useRef(null);

  // Focus trap & escape key handler
  useEffect(() => {
    if (!isOpen) return;

    // Set initial focus to the Primary CTA button
    const focusTimer = setTimeout(() => {
      ctaRef.current?.focus();
    }, 100);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab") {
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: loop to end
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          // Tab: loop to start
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Motion variants for premium entry animation
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", damping: 30, stiffness: 300, mass: 0.8 },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop Scrim */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-modal-title"
            aria-describedby="welcome-modal-subtitle"
            className="relative w-full max-w-[460px] my-auto bg-[rgba(11,15,24,0.78)] border border-white/10 rounded-[24px] p-6 md:p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-[24px] overflow-hidden focus:outline-none"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            tabIndex={-1}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4A32A]/50"
              aria-label="Close welcome message"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Centered Large Music Note Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-[#D4A32A]/10 border border-[#D4A32A]/20 flex items-center justify-center shadow-[0_8px_32px_rgba(212,163,42,0.1)]">
                <Music2 className="w-8 h-8 text-[#D4A32A]" aria-hidden="true" />
              </div>
            </div>

            {/* Title */}
            <h1
              id="welcome-modal-title"
              className="text-2xl font-black text-[#F5F3EE] tracking-tight mb-3"
            >
              {triggerReason === "first-visit"
                ? "Welcome to You Worship"
                : "Unlock Personalized Experience"}
            </h1>

            {/* Subtitle */}
            <div id="welcome-modal-subtitle" className="space-y-2 mb-6">
              <p className="text-sm font-medium text-[#B8BCC8] leading-relaxed">
                Discover Christian songs, lyrics, audio, and videos for free.
              </p>
              <p className="text-xs text-[#7A7E8C] leading-relaxed">
                Start exploring instantly—an account is only needed if you&apos;d like to save your personal experience.
              </p>
            </div>

            {/* Thin low-opacity gold hairline divider */}
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4A32A]/30 to-transparent my-5" />

            {/* Personalized Features List */}
            <div className="space-y-4 text-left mb-6">
              <h2 className="text-[10px] font-bold text-[#D4A32A] uppercase tracking-widest text-center mb-3">
                ✨ Unlock Personalized Features
              </h2>
              
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-xs text-[#B8BCC8]">
                  <Heart className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
                  <span>Save your favorite songs</span>
                </li>
                <li className="flex items-center gap-3 text-xs text-[#B8BCC8]">
                  <Clock className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
                  <span>View your recently played songs</span>
                </li>
                <li className="flex items-center gap-3 text-xs text-[#B8BCC8]">
                  <FolderHeart className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                  <span>Create and manage playlists</span>
                </li>
                <li className="flex items-center gap-3 text-xs text-[#B8BCC8]">
                  <Cloud className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
                  <span>Sync your library across devices</span>
                </li>
                <li className="flex items-center gap-3 text-xs text-[#B8BCC8]">
                  <Bell className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>Receive notifications about newly added songs</span>
                </li>
              </ul>
            </div>

            {/* Information Card Panel */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-6 text-left">
              <p className="text-[11px] text-[#8C90A0] leading-relaxed">
                <span className="font-semibold text-white/90">No account is required</span> to enjoy You Worship. You can freely browse all songs, lyrics, audio, and videos. Create an account anytime to save your favorites, playlists, and listening history across your devices.
              </p>
            </div>

            {/* Primary CTA Button */}
            <button
              ref={ctaRef}
              onClick={() => {
                onClose();
                onSignIn?.();
              }}
              className="w-full py-3.5 px-6 rounded-full bg-[#D4A32A] hover:bg-[#c49527] active:scale-[0.98] text-black font-black text-sm tracking-wide transition-all shadow-[0_8px_24px_rgba(212,163,42,0.25)] hover:shadow-[0_12px_32px_rgba(212,163,42,0.35)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
            >
              Sign Up / Log In
            </button>

            {/* Muted helper text below the CTA */}
            <p className="text-[11px] text-[#7A7E8C] mt-3">
              You can sign up anytime from the profile menu.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
