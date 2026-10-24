"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import LoginPage from "./LoginPage";
import SignUpPage from "./SignUpPage";
import PasswordLogin from "./PasswordLogin";
import EmailSentPage from "./EmailSentPage";

const STEPS = {
  LOGIN: "login",
  SIGNUP: "signup",
  EMAIL_SENT: "email_sent",
  PASSWORD: "password",
};

/**
 * AuthModal — Full-screen auth flow (Spotify-inspired, YouWorship branded).
 * Uses Firebase Email Link (passwordless) authentication as the primary method.
 *
 * Props:
 *   onClose: () => void
 *   onSuccess: () => void  — called after successful auth
 *   returnAction: boolean  — whether user was redirected from a protected action
 *   initialStep: "login" | "signup"
 */
export default function AuthModal({ onClose, onSuccess, returnAction = false, initialStep = "login", closable = true }) {
  const { isAuthenticated, loading, sendEmailLink } = useAuth();
  const [step, setStep] = useState(initialStep === "signup" ? STEPS.SIGNUP : STEPS.LOGIN);
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [emailLinkError, setEmailLinkError] = useState(null);

  // If user becomes authenticated while modal is open, trigger success
  useEffect(() => {
    if (isAuthenticated && !loading) {
      onSuccess?.();
    }
  }, [isAuthenticated, loading]);

  // Close on escape (only when closable)
  useEffect(() => {
    if (!closable) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [closable]);

  const handleContinueWithEmail = async (emailAddress) => {
    setEmail(emailAddress);
    setEmailLinkError(null);
    // Send the email link before showing the success screen
    const result = await sendEmailLink(emailAddress);
    if (result.success) {
      setStep(STEPS.EMAIL_SENT);
    } else {
      setEmailLinkError(result.error || "Failed to send email. Please try again.");
    }
  };

  const handleResendEmailLink = async () => {
    setResendLoading(true);
    setEmailLinkError(null);
    const result = await sendEmailLink(email);
    setResendLoading(false);
    if (!result.success) {
      setEmailLinkError(result.error || "Failed to resend email. Please try again.");
    }
  };

  // Track which step sent us to EMAIL_SENT
  const [prevStep, setPrevStep] = useState(null);

  const handlePasswordLogin = () => {
    setStep(STEPS.PASSWORD);
  };

  const handleBackToLogin = () => {
    setStep(STEPS.LOGIN);
  };

  const handleSwitchToSignup = () => {
    setStep(STEPS.SIGNUP);
  };

  const handleSwitchToLogin = () => {
    setStep(STEPS.LOGIN);
  };

  // Determine if current flow is signup or login
  const isSignupFlow = step === STEPS.SIGNUP || (step === STEPS.EMAIL_SENT && prevStep === "signup");

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-y-auto">
      {/* Full-screen auth page container */}
      <div className="min-h-screen flex items-center justify-center p-6">
        
        {/* Close Button — hidden when not closable (forced auth gate) */}
        {closable && (
          <button
            onClick={onClose}
            className="fixed top-4 right-4 z-20 w-10 h-10 rounded-full bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.15)] flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Auth Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Global error banner — visible on any step when email link send fails */}
          {emailLinkError && step !== STEPS.EMAIL_SENT && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-8 md:px-10 pt-4 pb-0"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
                {emailLinkError}
              </div>
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            {step === STEPS.LOGIN && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <LoginPage
                  onContinueWithEmail={(email) => {
                    setPrevStep("login");
                    handleContinueWithEmail(email);
                  }}
                  onClose={onClose}
                  onSuccess={onSuccess}
                  onSwitchToSignup={handleSwitchToSignup}
                />
              </motion.div>
            )}

            {step === STEPS.SIGNUP && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <SignUpPage
                  onContinueWithEmail={(email) => {
                    setPrevStep("signup");
                    handleContinueWithEmail(email);
                  }}
                  onSwitchToLogin={handleSwitchToLogin}
                  onClose={onClose}
                  onSuccess={onSuccess}
                />
              </motion.div>
            )}

            {step === STEPS.EMAIL_SENT && (
              <motion.div
                key="email_sent"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                {emailLinkError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-8 md:px-10 pt-4 pb-0"
                  >
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
                      {emailLinkError}
                    </div>
                  </motion.div>
                )}
                <EmailSentPage
                  email={email}
                  context={isSignupFlow ? "signup" : "login"}
                  onResend={handleResendEmailLink}
                  onUseAnotherEmail={() => {
                    setEmailLinkError(null);
                    setStep(isSignupFlow ? STEPS.SIGNUP : STEPS.LOGIN);
                  }}
                  resendLoading={resendLoading}
                />
              </motion.div>
            )}

            {step === STEPS.PASSWORD && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <PasswordLogin
                  onBack={handleBackToLogin}
                  onSuccess={onSuccess}
                  onClose={onClose}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
