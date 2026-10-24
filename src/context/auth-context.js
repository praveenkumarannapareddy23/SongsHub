"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  auth,
  googleProvider,
  facebookProvider,
  appleProvider,
} from "@/lib/firebase";
import {
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  getRedirectResult,
  sendSignInLinkToEmail,
  signInWithEmailLink as firebaseSignInWithEmailLink,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { fetchUserData, saveUserLoginData } from "@/lib/firestore-service";

const AuthContext = createContext(null);

// Email link configuration
const actionCodeSettings = {
  url: typeof window !== "undefined" ? `${window.location.origin}/auth/verify` : "",
  handleCodeInApp: true,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firestoreData, setFirestoreData] = useState(null);
  const [returnPath, setReturnPath] = useState(null);

  // Initialize auth: process redirect result AND listen for auth state changes
  // Initialize auth: process redirect result AND listen for auth state changes
  useEffect(() => {
    let cancelled = false;

    // 1. Handle redirect login results (mobile flow via signInWithRedirect)
    getRedirectResult(auth)
      .then((result) => {
        if (cancelled) return;
        if (result?.user) {
          setUser(result.user);
          saveUserLoginData(result.user.uid, {
            provider: "google",
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            lastLogin: new Date().toISOString(),
          });
        }
      })
      .catch((error) => {
        console.error("Redirect sign-in error:", error);
      });

    // 2. Listen for all auth state changes (popup, redirect, refresh, etc.)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (cancelled) return;
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const data = await fetchUserData(firebaseUser.uid, {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
          if (!cancelled) setFirestoreData(data);
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      } else {
        setFirestoreData(null);
      }

      if (!cancelled) setLoading(false);
    });

    // 3. Email link sign-in is now handled by the dedicated /auth/verify page.
    // The context no longer processes email links to avoid duplicate handling
    // and to provide a proper UI (no window.prompt).

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // ─── Sign In Methods ────────────────────────────────────────────

  // ─── Sign In Methods ────────────────────────────────────────────

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      if (error.code === "auth/popup-blocked") {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
          console.error("Redirect sign-in error:", redirectError);
          throw redirectError;
        }
      } else {
        if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
          console.warn("Google sign-in popup closed by user or cancelled request.");
        } else {
          console.error("Google sign-in error:", error);
        }
        throw error;
      }
    }
  };

  const signInWithFacebook = async () => {
    try {
      await signInWithPopup(auth, facebookProvider);
    } catch (error) {
      if (error.code === "auth/popup-blocked") {
        try {
          await signInWithRedirect(auth, facebookProvider);
        } catch (redirectError) {
          console.error("Facebook redirect error:", redirectError);
          throw redirectError;
        }
      } else {
        if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
          console.warn("Facebook sign-in popup closed by user or cancelled request.");
        } else {
          console.error("Facebook sign-in error:", error);
        }
        throw error;
      }
    }
  };

  const signInWithApple = async () => {
    try {
      await signInWithPopup(auth, appleProvider);
    } catch (error) {
      if (error.code === "auth/popup-blocked") {
        try {
          await signInWithRedirect(auth, appleProvider);
        } catch (redirectError) {
          console.error("Apple redirect error:", redirectError);
          throw redirectError;
        }
      } else {
        if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
          console.warn("Apple sign-in popup closed by user or cancelled request.");
        } else {
          console.error("Apple sign-in error:", error);
        }
        throw error;
      }
    }
  };


    // Friendly error messages for Firebase auth errors
  const getFriendlyErrorMessage = (error) => {
    const code = error?.code || "";
    const messages = {
      "auth/invalid-email": "This email address is not valid. Please check and try again.",
      "auth/user-not-found": "No account found with this email address.",
      "auth/wrong-password": "Wrong password. Please check and try again.",
      "auth/invalid-credential": "Invalid email or password. Please try again.",
      "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
      "auth/network-request-failed": "Network error. Please check your internet connection.",
      "auth/expired-action-code": "This link has expired. Please request a new one.",
      "auth/invalid-action-code": "This link is invalid or has already been used.",
      "auth/operation-not-allowed": "Email link sign-in is not enabled. Please contact support.",
    };
    return messages[code] || "An unexpected error occurred. Please try again.";
  };

  const sendEmailLink = async (email) => {
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      return { success: true };
    } catch (error) {
      console.error("Error sending email link:", error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  };

  const signInWithEmailLink = async (email, url) => {
    try {
      const result = await firebaseSignInWithEmailLink(auth, email, url);
      window.localStorage.removeItem("emailForSignIn");
      return { success: true, user: result.user };
    } catch (error) {
      console.error("Email link sign-in error:", error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  };

  const signInWithPassword = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      console.error("Password sign-in error:", error);
      return { success: false, error };
    }
  };

  const signUpWithPassword = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      console.error("Sign up error:", error);
      return { success: false, error };
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Clear all cached user data from localStorage on logout
      const keysToRemove = [
        "emailForSignIn",
        "songhub_favorites",
        "songhub_playlists",
        "songhub_recently",
      ];
      keysToRemove.forEach((key) => {
        try {
          window.localStorage.removeItem(key);
        } catch (e) {
          // Ignore if localStorage is not available
        }
      });
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  const value = {
    user,
    loading,
    firestoreData,
    setFirestoreData,
    returnPath,
    setReturnPath,
    isAuthenticated: !!user,
    // Auth methods
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    sendEmailLink,
    signInWithEmailLink,
    signInWithPassword,
    signUpWithPassword,
    getFriendlyErrorMessage,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
