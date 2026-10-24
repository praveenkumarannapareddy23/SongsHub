"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Mail, ArrowLeft } from "lucide-react";
import Image from "next/image";
import {
  auth,
} from "@/lib/firebase";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { saveUserLoginData } from "@/lib/firestore-service";

/**
 * Email Verification Page — handles Firebase Email Link sign-in.
 * User lands here after clicking the sign-in link in their email.
 *
 * Flow:
 *   1. Detect email link in URL via isSignInWithEmailLink()
 *   2. Retrieve email from localStorage (stored when link was requested)
 *   3. If email found → auto-complete sign-in → redirect to home
 *   4. If email not found → show a small form to re-enter email
 *   5. Show error messages for expired/invalid links
 */
export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading | email_needed | success | error
  const [emailInput, setEmailInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = window.location.href;

    // Check if this URL contains an email sign-in link
    if (!isSignInWithEmailLink(auth, url)) {
      setStatus("error");
      setErrorMessage("This page was accessed without a valid sign-in link. Please request a new one.");
      return;
    }

    // Try to get the email from localStorage (stored when user requested the link)
    const storedEmail = window.localStorage.getItem("emailForSignIn");
    if (storedEmail) {
      // Email found — complete sign-in automatically
      completeSignIn(storedEmail, url);
    } else {
      // Email not found — ask user to provide it via a form (no window.prompt!)
      setStatus("email_needed");
    }
  }, []);

  async function completeSignIn(emailAddress, url) {
    setStatus("loading");
    setErrorMessage("");

    try {
      const result = await signInWithEmailLink(auth, emailAddress, url);
      window.localStorage.removeItem("emailForSignIn");

      // Save user data to Firestore
      await saveUserLoginData(result.user.uid, {
        provider: "email",
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        lastLogin: new Date().toISOString(),
      });

      setStatus("success");

      // Redirect to home after a brief celebration (replace to avoid stale URL in history)
      setTimeout(() => {
        router.replace("/");
      }, 1500);
    } catch (error) {
      console.error("Email link sign-in error:", error);
      setStatus("error");

      const code = error?.code || "";
      const messages = {
        "auth/expired-action-code": "This verification link has expired. Please request a new one.",
        "auth/invalid-action-code": "This sign-in link is invalid or has already been used.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/user-disabled": "This account has been disabled.",
        "auth/network-request-failed": "Check your internet connection and try again.",
        "auth/operation-not-allowed": "Email link sign-in is not enabled. Please contact support.",
      };
      setErrorMessage(messages[code] || "An unexpected error occurred. Please try again.");
    }
  }

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    const url = window.location.href;
    completeSignIn(emailInput.trim(), url);
  };

  const handleRequestNewLink = () => {
    router.push("/");
  };

  // ── Loading State ──
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-12 h-12 mx-auto mb-6 rounded-full border-2 border-[#D4A32A]/30 border-t-[#D4A32A]"
          />
          <p className="text-white font-semibold text-lg">Verifying your link...</p>
          <p className="text-[#727272] text-sm mt-2">Please wait a moment</p>
        </motion.div>
      </div>
    );
  }

  // ── Email Needed State (no window.prompt!) ──
  if (status === "email_needed") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image src="/youworship-logo.png" alt="YouWorship" width={56} height={56} className="w-14 h-14 object-contain" priority />
          </div>

          {/* Mail Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-full bg-[#D4A32A]/15 flex items-center justify-center">
              <Mail className="w-8 h-8 text-[#D4A32A]" />
            </div>
          </div>

          <h1 className="text-xl font-black text-white text-center mb-2">
            Confirm your email
          </h1>
          <p className="text-sm text-[#a7a7a7] text-center mb-8">
            Please enter the email address you used to sign in so we can complete the verification.
          </p>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="name@example.com"
              required
              autoFocus
              className="w-full px-4 py-3 bg-[#111111] border border-[rgba(255,255,255,0.12)] rounded-lg text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all"
            />
            <button
              type="submit"
              disabled={!emailInput.trim()}
              className="w-full py-3 rounded-full bg-[#D4A32A] text-black font-bold text-sm hover:bg-[#c49527] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Confirm & Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleRequestNewLink}
              className="text-sm text-[#a7a7a7] hover:text-white font-semibold transition-colors cursor-pointer"
            >
              Request a new link
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Success State ──
  if (status === "success") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6"
          >
            <Image
              src="/youworship-logo.png"
              alt="You Worship"
              width={64}
              height={64}
              className="w-16 h-16 object-contain"
              priority
            />
          </motion.div>

          {/* Brand Name */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg font-black text-white/60 text-center tracking-[0.2em] uppercase mb-6"
          >
            You Worship
          </motion.h1>

          {/* Success Check */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.15 }}
            className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-500/15 flex items-center justify-center"
          >
            <CheckCircle2 className="w-9 h-9 text-emerald-400" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-xl font-black text-white mb-2"
          >
            Signed in successfully!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-sm text-[#a7a7a7]"
          >
            Welcome back to You Worship 🎵
          </motion.p>

          {/* Spinning loader while redirecting */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 mt-8"
          >
            <div className="w-3.5 h-3.5 rounded-full border-2 border-[#D4A32A]/30 border-t-[#D4A32A] animate-spin" />
            <span className="text-xs text-[#727272]">Redirecting...</span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── Error State ──
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/youworship-logo.png" alt="YouWorship" width={56} height={56} className="w-14 h-14 object-contain" priority />
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/15 flex items-center justify-center"
        >
          <XCircle className="w-9 h-9 text-red-400" />
        </motion.div>

        <h1 className="text-xl font-black text-white mb-2">Sign-in failed</h1>
        <p className="text-sm text-[#a7a7a7] mb-8">{errorMessage}</p>

        <button
          onClick={handleRequestNewLink}
          className="w-full py-3 rounded-full bg-[#D4A32A] text-black font-bold text-sm hover:bg-[#c49527] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Request a new link</span>
        </button>
      </motion.div>
    </div>
  );
}
