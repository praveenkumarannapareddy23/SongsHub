"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/auth-context";

const TourContext = createContext(null);

export function TourProvider({ children }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const lastTriggeredUidRef = useRef(null);

  /**
   * Onboarding Tour Launch Logic:
   * 1. Without login (Guest): Shows every time the application is opened.
   * 2. Logged-in user (Gmail account): Shows ONLY ONCE on first login with that account.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (authLoading) return;

    try {
      if (!isAuthenticated || !user?.uid) {
        // Without login: show every time the application is opened
        if (lastTriggeredUidRef.current !== "guest") {
          lastTriggeredUidRef.current = "guest";
          const timer = setTimeout(() => {
            setCurrentStep(0);
            setIsOpen(true);
          }, 1000);
          return () => clearTimeout(timer);
        }
      } else {
        // Logged in: show ONLY ONCE for this Gmail / user account
        const accountKey = user.email ? user.email.toLowerCase().trim() : user.uid;
        const userStorageKey = `youworship_onboardingCompleted_${accountKey}`;
        const isCompleted = localStorage.getItem(userStorageKey);

        if (!isCompleted && lastTriggeredUidRef.current !== accountKey) {
          lastTriggeredUidRef.current = accountKey;
          const timer = setTimeout(() => {
            setCurrentStep(0);
            setIsOpen(true);
          }, 800);
          return () => clearTimeout(timer);
        }
      }
    } catch {
      // Handle storage errors safely
    }
  }, [isAuthenticated, user, authLoading]);

  // Start / Replay Tour manually anytime
  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  // Close tour and save completion
  const closeTour = useCallback(() => {
    setIsOpen(false);
    try {
      if (user?.uid) {
        const accountKey = user.email ? user.email.toLowerCase().trim() : user.uid;
        localStorage.setItem(`youworship_onboardingCompleted_${accountKey}`, "true");
        // Also persist by UID for backwards compatibility
        localStorage.setItem(`youworship_onboardingCompleted_${user.uid}`, "true");
      }
    } catch {
      // Handle storage errors safely
    }
  }, [user]);

  const nextStep = useCallback((totalSteps) => {
    setCurrentStep((prev) => {
      if (prev + 1 >= totalSteps) {
        closeTour();
        return prev;
      }
      return prev + 1;
    });
  }, [closeTour]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <TourContext.Provider
      value={{
        isOpen,
        currentStep,
        setCurrentStep,
        startTour,
        closeTour,
        nextStep,
        prevStep,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}
