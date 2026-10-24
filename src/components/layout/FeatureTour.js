"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTour } from "@/context/tour-context";
import {
  Search,
  LayoutGrid,
  Music2,
  Mic,
  Plus,
} from "lucide-react";

const TOUR_STEPS = [
  {
    id: "search",
    stepNum: "1/6",
    targetId: "tour-search-bar",
    targetMobileId: "tour-search-bar",
    preferredPlacement: "bottom",
    icon: Search,
    iconColor: "text-sky-400 bg-sky-500/15 border-sky-500/25",
    title: "Search songs",
    description: "Find any song, artist, album or lyrics instantly using search.",
  },
  {
    id: "voice-search",
    stepNum: "2/6",
    targetId: "tour-search-mic-btn",
    targetMobileId: "tour-mobile-search-mic-btn",
    preferredPlacement: "bottom",
    icon: Mic,
    iconColor: "text-amber-400 bg-amber-500/15 border-amber-500/25",
    title: "Voice Search",
    description: "Tap the mic icon inside the search bar to search songs or lyrics with your voice in Telugu or English.",
  },
  {
    id: "categories",
    stepNum: "3/6",
    targetId: "tour-search-categories-btn",
    targetMobileId: "tour-mobile-categories",
    preferredPlacement: "bottom",
    icon: LayoutGrid,
    iconColor: "text-purple-400 bg-purple-500/15 border-purple-500/25",
    title: "Categories",
    description: "Click the categories icon inside the search bar to explore themed songs.",
  },
  {
    id: "songs",
    stepNum: "4/6",
    targetId: "tour-nav-songs",
    targetMobileId: "tour-mobile-songs",
    preferredPlacement: "right",
    icon: Music2,
    iconColor: "text-emerald-400 bg-emerald-500/15 border-emerald-500/25",
    title: "Songs",
    description: "Browse and discover all worship songs in the catalog.",
  },
  {
    id: "song-card-playlist",
    stepNum: "5/6",
    targetId: "tour-song-card-playlist-btn",
    targetMobileId: "tour-song-card-playlist-btn",
    preferredPlacement: "bottom",
    icon: Plus,
    iconColor: "text-amber-400 bg-amber-500/15 border-amber-500/25",
    title: "Add to Playlist",
    description: "Tap the '+' icon on any song card to save songs directly into your custom worship playlists.",
  },
  {
    id: "lyrics",
    stepNum: "6/6",
    targetId: "tour-lyrics-btn",
    targetMobileId: "tour-mobile-lyrics-btn",
    preferredPlacement: "top",
    icon: Mic,
    iconColor: "text-amber-400 bg-amber-500/15 border-amber-500/25",
    title: "Song Lyrics",
    description: "Read synced Telugu & English lyrics while playing worship songs.",
  },
];

export default function FeatureTour() {
  const { isOpen, currentStep, setCurrentStep, closeTour, nextStep } = useTour();
  const [targetRect, setTargetRect] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, arrow: "top" });
  const cardRef = useRef(null);

  const step = TOUR_STEPS[currentStep] || TOUR_STEPS[0];
  const totalSteps = TOUR_STEPS.length;
  const isLastStep = currentStep === totalSteps - 1;
  const IconComp = step.icon || Music2;

  const updatePositions = useCallback(() => {
    if (!isOpen) return;

    const isMobile = window.innerWidth < 1024;
    const targetElementId = (isMobile && step.targetMobileId) ? step.targetMobileId : step.targetId;
    let el = document.getElementById(targetElementId);

    // Fallback if mobile specific ID is missing
    if (!el && step.targetId) {
      el = document.getElementById(step.targetId);
    }

    if (!el) {
      // If target element is not found, center the card
      setTargetRect(null);
      return;
    }

    // Scroll into view if element is outside comfortable viewport bounds
    const initialRect = el.getBoundingClientRect();
    if (initialRect.top < 60 || initialRect.bottom > window.innerHeight - 80) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }

    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
    });

    const cardWidth = Math.min(280, window.innerWidth - 32);
    const cardHeight = 160;
    const padding = 14;

    let top = 0;
    let left = 0;
    let arrow = "top";

    const placement = step.preferredPlacement;

    if (placement === "bottom-left") {
      top = rect.bottom + padding;
      left = Math.max(16, rect.right - cardWidth);
      arrow = "top-right";
    } else if (placement === "bottom") {
      top = rect.bottom + padding;
      left = Math.max(16, rect.left + rect.width / 2 - cardWidth / 2);
      arrow = "top";
    } else if (placement === "right") {
      top = Math.max(16, rect.top + rect.height / 2 - cardHeight / 2);
      left = rect.right + padding;
      arrow = "left";
    } else if (placement === "top") {
      top = Math.max(16, rect.top - cardHeight - padding);
      left = Math.max(16, rect.left + rect.width / 2 - cardWidth / 2);
      arrow = "bottom";
    }

    // Boundary constraints within viewport
    if (left + cardWidth > window.innerWidth - 16) {
      left = window.innerWidth - cardWidth - 16;
    }
    if (left < 16) left = 16;

    if (top + cardHeight > window.innerHeight - 16) {
      top = window.innerHeight - cardHeight - 16;
    }
    if (top < 16) top = 16;

    setPopoverPos({ top, left, arrow });
  }, [isOpen, step]);

  useEffect(() => {
    updatePositions();
    window.addEventListener("resize", updatePositions);
    window.addEventListener("scroll", updatePositions, true);

    return () => {
      window.removeEventListener("resize", updatePositions);
      window.removeEventListener("scroll", updatePositions, true);
    };
  }, [updatePositions]);

  // Keyboard navigation (Enter or Right arrow to advance, Escape to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeTour();
      } else if (e.key === "Enter" || e.key === "ArrowRight") {
        if (isLastStep) {
          closeTour();
        } else {
          nextStep(totalSteps);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeTour, nextStep, isLastStep, totalSteps]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] select-none pointer-events-auto">
      {/* ─── 1. Target Element Spotlight Glowing Box ─── */}
      {targetRect && (
        <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75)",
            borderRadius: 14,
          }}
          className="fixed pointer-events-none z-[301] border-2 border-[#D4A32A] shadow-[0_0_24px_rgba(212,163,42,0.65)]"
        />
      )}

      {/* Fallback global backdrop when no target */}
      {!targetRect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-[301]"
        />
      )}

      {/* ─── 2. Spotlight Tooltip / Card (Compact Box) ─── */}
      <AnimatePresence mode="wait">
        <motion.div
          ref={cardRef}
          key={step.id}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: popoverPos.top,
            left: popoverPos.left,
            width: Math.min(280, typeof window !== "undefined" ? window.innerWidth - 32 : 280),
          }}
          className="z-[305] bg-gradient-to-br from-[#221e19] via-[#171412] to-[#0e0d0b] text-white rounded-[18px] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.8)] border border-[#D4A32A]/35"
        >
          {/* Pointer Arrow */}
          {popoverPos.arrow === "top" && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#221e19] rotate-45 border-t border-l border-[#D4A32A]/35 rounded-xs" />
          )}
          {popoverPos.arrow === "top-right" && (
            <div className="absolute -top-2 right-6 w-3.5 h-3.5 bg-[#221e19] rotate-45 border-t border-l border-[#D4A32A]/35 rounded-xs" />
          )}
          {popoverPos.arrow === "bottom" && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#0e0d0b] rotate-45 border-b border-r border-[#D4A32A]/35 rounded-xs" />
          )}
          {popoverPos.arrow === "left" && (
            <div className="absolute top-5 -left-2 w-3.5 h-3.5 bg-[#171412] rotate-45 border-b border-l border-[#D4A32A]/35 rounded-xs" />
          )}

          {/* Header with Icon and Title */}
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 shadow-sm ${step.iconColor}`}
            >
              <IconComp className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-xs font-bold tracking-tight text-white leading-tight truncate">
                  {step.title}
                </h3>
                <span className="text-[10px] font-bold text-amber-400/90 shrink-0">
                  {step.stepNum}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-white/85 leading-relaxed font-normal mb-3">
            {step.description}
          </p>

          {/* Bottom Row: Skip & Next/Done button */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10">
            <button
              onClick={closeTour}
              className="text-[11px] font-semibold text-muted hover:text-white transition-colors cursor-pointer"
            >
              Skip
            </button>
            <button
              onClick={() => {
                if (isLastStep) {
                  closeTour();
                } else {
                  nextStep(totalSteps);
                }
              }}
              className="px-3.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-[#D4A32A] hover:brightness-110 text-black font-extrabold text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              {isLastStep ? "Done" : "Next"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ─── 3. Fixed Bottom Bar: Dots Indicator & Skip Tour ─── */}
      <div className="fixed bottom-6 left-0 right-0 z-[305] flex items-center justify-between px-8 md:px-12 pointer-events-auto">
        <div className="w-20" /> {/* Spacer for symmetry */}

        {/* Dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentStep
                  ? "w-6 bg-[#D4A32A] shadow-sm"
                  : "w-2 bg-white/30 hover:bg-white/60"
              }`}
              aria-label={`Go to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Skip tour link */}
        <button
          onClick={closeTour}
          className="text-xs font-bold text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          Skip tour
        </button>
      </div>
    </div>
  );
}
