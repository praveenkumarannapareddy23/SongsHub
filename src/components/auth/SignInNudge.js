"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogIn } from "lucide-react";

/**
 * SignInNudge — Non-blocking toast nudge for guest actions when modal has already been dismissed.
 */
export default function SignInNudge({
  message = "Log in to save your favorites, playlists, and listening history.",
  isOpen,
  onDismiss,
  onSignIn,
}) {
  const containerVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", damping: 25, stiffness: 350 },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-[380px] z-[140] bg-[rgba(15,20,33,0.85)] border border-[#D4A32A]/25 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-start gap-3 text-white"
        >
          {/* Accent border strip */}
          <div className="w-1 self-stretch bg-[#D4A32A] rounded-full shrink-0" />

          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#B8BCC8] leading-relaxed mb-2.5">
              {message}
            </p>
            <button
              onClick={() => {
                onDismiss();
                onSignIn?.();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D4A32A]/10 border border-[#D4A32A]/20 hover:bg-[#D4A32A]/25 text-[#D4A32A] font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4A32A]/50"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-all cursor-pointer focus:outline-none"
            aria-label="Dismiss nudge"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
