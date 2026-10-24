"use client";

import React, { createContext, useContext, useState } from "react";
import { useAuth } from "./auth-context";

const WelcomeModalContext = createContext(null);

export function WelcomeModalProvider({ children, showAuthModal }) {
  const { isAuthenticated } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [triggerReason, setTriggerReason] = useState("feature-gate");
  const [nudgeMessage, setNudgeMessage] = useState(null);
  
  // Track if they have dismissed the welcome modal once in this browser session
  const [hasDismissedOnce, setHasDismissedOnce] = useState(false);

  const openWelcomeModal = (reason = "feature-gate") => {
    setTriggerReason(reason);
    setIsOpen(true);
    setNudgeMessage(null); // Dismiss nudge if we show the full modal
  };

  const closeWelcomeModal = () => {
    setIsOpen(false);
    setHasDismissedOnce(true);
  };

  const showSignInNudge = (message) => {
    setNudgeMessage(message || "Log in to save your favorites, playlists, and listening history.");
  };

  const dismissNudge = () => {
    setNudgeMessage(null);
  };

  const requireAuth = (action) => {
    if (isAuthenticated) {
      if (action) action();
      return true;
    }

    // Guest user
    if (hasDismissedOnce) {
      // Show compact nudge instead of full modal
      showSignInNudge();
    } else {
      // Show full welcome modal
      openWelcomeModal("feature-gate");
    }
    return false;
  };

  return (
    <WelcomeModalContext.Provider
      value={{
        isOpen,
        triggerReason,
        openWelcomeModal,
        closeWelcomeModal,
        nudgeMessage,
        showSignInNudge,
        dismissNudge,
        requireAuth,
        showAuthModal,
      }}
    >
      {children}
    </WelcomeModalContext.Provider>
  );
}

export function useWelcomeModal() {
  const context = useContext(WelcomeModalContext);
  if (!context) {
    throw new Error("useWelcomeModal must be used within a WelcomeModalProvider");
  }
  return context;
}
