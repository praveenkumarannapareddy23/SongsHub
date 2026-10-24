"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import Image from "next/image";

/**
 * PasswordLogin — Email + Password login form.
 * Now actually calls Firebase Auth to verify credentials.
 */
export default function PasswordLogin({
  onBack,
  onSuccess,
  onClose,
}) {
  const { signInWithPassword, getFriendlyErrorMessage } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithPassword(email.trim(), password);
      if (result.success) {
        onSuccess?.();
      } else {
        const errorMessage = result.error?.code
          ? getFriendlyErrorMessage(result.error)
          : "Invalid email or password. Please try again.";
        setError(errorMessage);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Password login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 md:p-10 w-full max-w-md mx-auto">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center mb-6"
      >
        <Image
          src="/youworship-logo.png"
          alt="YouWorship"
          width={56}
          height={56}
          className="w-14 h-14 object-contain"
          priority
        />
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="text-2xl md:text-3xl font-black text-white text-center tracking-tight mb-8"
      >
        Log in with password
      </motion.h1>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Password Login Form */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-white/80 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            autoFocus
            className="w-full px-4 py-3 bg-[#111111] border border-[rgba(255,255,255,0.12)] rounded-lg text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/80 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full px-4 py-3 pr-11 bg-[#111111] border border-[rgba(255,255,255,0.12)] rounded-lg text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727272] hover:text-white transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me + Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-[#111111] text-[#D4A32A] focus:ring-[#D4A32A]"
            />
            <span className="text-xs text-[#a7a7a7]">Remember Me</span>
          </label>
          <button
            type="button"
            className="text-xs text-[#a7a7a7] hover:text-white font-semibold transition-colors cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim() || !password.trim()}
          className="w-full py-3 rounded-full bg-[#D4A32A] text-black font-bold text-sm hover:bg-[#c49527] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          <span>{loading ? "Signing in..." : "Log In"}</span>
        </button>
      </motion.form>

      {/* Divider */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-4 my-6"
      >
        <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
        <span className="text-xs font-semibold text-[#727272] uppercase tracking-wider">OR</span>
        <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
      </motion.div>

      {/* Social Login Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <button
          type="button"
          className="w-full py-3 rounded-full border border-[rgba(255,255,255,0.15)] bg-transparent hover:bg-[rgba(255,255,255,0.05)] text-white font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <button
          type="button"
          className="w-full py-3 rounded-full border border-[rgba(255,255,255,0.15)] bg-transparent hover:bg-[rgba(255,255,255,0.05)] text-white font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>
          </svg>
          <span>Continue with Facebook</span>
        </button>

        <button
          type="button"
          className="w-full py-3 rounded-full border border-[rgba(255,255,255,0.15)] bg-transparent hover:bg-[rgba(255,255,255,0.05)] text-white font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          <span>Continue with Apple</span>
        </button>
      </motion.div>

      {/* Bottom switch */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-8 space-y-3 text-center"
      >
        <button
          onClick={onBack}
          className="w-full text-center text-sm text-[#727272] hover:text-[#a7a7a7] transition-colors cursor-pointer"
        >
          ← Back to login
        </button>
      </motion.div>
    </div>
  );
}
