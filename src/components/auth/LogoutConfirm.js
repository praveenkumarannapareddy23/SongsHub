"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, LogOut, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

/**
 * LogoutConfirm — Modal confirmation dialog for logout.
 * Spotify-inspired design with YouWorship branding.
 */
export default function LogoutConfirm({ onClose }) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      onClose();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />

      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-sm bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Logout confirmation"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] flex items-center justify-center text-[#727272] hover:text-white transition-all disabled:opacity-50 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="p-8 text-center">
          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-red-500/10 mx-auto mb-5 flex items-center justify-center">
            <LogOut className="w-6 h-6 text-red-400" />
          </div>

          {/* Heading */}
          <h2 className="text-lg font-bold text-white mb-2">
            Sign Out?
          </h2>

          <p className="text-sm text-[#a7a7a7] mb-8 leading-relaxed">
            Are you sure you want to sign out of YouWorship?
          </p>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-full border border-[rgba(255,255,255,0.15)] bg-transparent text-white font-semibold text-sm hover:bg-[rgba(255,255,255,0.05)] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="flex-1 py-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              <span>{loading ? "Signing out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
