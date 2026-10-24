"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Music,
  MessageSquare,
  Sparkles,
  Loader2,
  CheckCircle2,
  Star
} from "lucide-react";
import { saveSongRequest, saveFeedback } from "@/lib/firestore-service";

export default function TalkToUsDrawer({
  isOpen,
  onClose,
  initialTab = "request",
  initialCategory = "Account & Login"
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // "request" or "feedback"
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Request form state
  const [songTitle, setSongTitle] = useState("");
  const [language, setLanguage] = useState("Telugu");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");

  // Feedback form state
  const [fbCategory, setFbCategory] = useState("Contact Us");
  const [fbName, setFbName] = useState("");
  const [fbEmail, setFbEmail] = useState("");
  const [fbRating, setFbRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  // Reset and sync state when drawer closes/opens
  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      if (initialTab) setActiveTab(initialTab);
      if (initialCategory) setFbCategory(initialCategory);
      setSongTitle("");
      setLanguage("Telugu");
      setYoutubeLink("");
      setReqName("");
      setReqEmail("");
      setFbName("");
      setFbEmail("");
      setFbRating(0);
      setHoveredRating(0);
    }
  }, [isOpen, initialTab, initialCategory]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!songTitle.trim()) return;

    setSubmitting(true);
    try {
      await saveSongRequest({
        title: songTitle.trim(),
        language,
        youtubeLink: youtubeLink.trim() || null,
        name: reqName.trim() || null,
        email: reqEmail.trim() || null,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      alert("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      await saveFeedback({
        category: fbCategory,
        name: fbName.trim() || null,
        email: fbEmail.trim() || null,
        rating: fbRating,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 cursor-pointer"
          />

          {/* Drawer container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 h-full w-full max-w-[450px] bg-card border-l border-line/30 shadow-2xl z-50 flex flex-col overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-line-muted shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4A32A] fill-[#D4A32A]/25" />
                <h2 className="font-bold text-title text-lg tracking-wide">
                  Talk to us
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-card-hover rounded-full text-dim hover:text-copy transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inner Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col">
              {success ? (
                /* Success View */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12"
                >
                  <CheckCircle2 className="w-16 h-16 text-[#D4A32A]" />
                  <h3 className="font-bold text-title text-xl">
                    Thank you!
                  </h3>
                  <p className="text-sm text-muted max-w-xs">
                    {activeTab === "request"
                      ? "Your song request has been submitted successfully."
                      : "We appreciate your feedback to make YouWorship better!"}
                  </p>
                </motion.div>
              ) : (
                /* Form view */
                <>
                  <p className="text-sm text-muted mb-5 shrink-0">
                    Request a song, report an issue, or just say hi.
                  </p>

                  {/* Custom Toggle Switch */}
                  <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-canvas rounded-xl border border-line-muted mb-6 shrink-0 select-none">
                    <button
                      type="button"
                      onClick={() => setActiveTab("request")}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        activeTab === "request"
                          ? "bg-card-hover text-white border border-line/35 shadow-sm"
                          : "text-dim hover:text-copy"
                      }`}
                    >
                      <Music className="w-4 h-4" />
                      <span>Request a song</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("feedback")}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        activeTab === "feedback"
                          ? "bg-card-hover text-white border border-line/35 shadow-sm"
                          : "text-dim hover:text-copy"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Feedback</span>
                    </button>
                  </div>

                  {/* Scrollable Form Body */}
                  <div className="flex-1 min-h-0">
                    {activeTab === "request" ? (
                      /* Request Song Form */
                      <form onSubmit={handleRequestSubmit} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-dim uppercase tracking-wider block">
                            Song title <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Yesu Naa Praanam"
                            value={songTitle}
                            onChange={(e) => setSongTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-input border border-line/60 rounded-xl text-sm focus:outline-none focus:border-[#D4A32A]/50 focus:bg-card-hover text-copy placeholder-muted/60"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-dim uppercase tracking-wider block">
                            Language
                          </label>
                          <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full px-4 py-2.5 bg-input border border-line/60 rounded-xl text-sm focus:outline-none focus:border-[#D4A32A]/50 focus:bg-card-hover text-copy"
                          >
                            <option value="Telugu">Telugu</option>
                            <option value="English">English</option>
                            <option value="Hindi">Hindi</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-dim uppercase tracking-wider block">
                            YouTube link
                          </label>
                          <input
                            type="url"
                            placeholder="https://youtu.be/..."
                            value={youtubeLink}
                            onChange={(e) => setYoutubeLink(e.target.value)}
                            className="w-full px-4 py-2.5 bg-input border border-line/60 rounded-xl text-sm focus:outline-none focus:border-[#D4A32A]/50 focus:bg-card-hover text-copy placeholder-muted/60"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-dim uppercase tracking-wider block">
                            Your name
                          </label>
                          <input
                            type="text"
                            value={reqName}
                            onChange={(e) => setReqName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-input border border-line/60 rounded-xl text-sm focus:outline-none focus:border-[#D4A32A]/50 focus:bg-card-hover text-copy placeholder-muted/60"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-dim uppercase tracking-wider block">
                            Email (optional)
                          </label>
                          <input
                            type="email"
                            value={reqEmail}
                            onChange={(e) => setReqEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-input border border-line/60 rounded-xl text-sm focus:outline-none focus:border-[#D4A32A]/50 focus:bg-card-hover text-copy placeholder-muted/60"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full py-3 bg-[#D4A32A] hover:bg-[#c49527] text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-6 cursor-pointer"
                        >
                          {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span>Submit Request</span>
                          )}
                        </button>
                      </form>
                    ) : (
                      /* Feedback Form */
                      <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-dim uppercase tracking-wider block">
                            Name
                          </label>
                          <input
                            type="text"
                            value={fbName}
                            onChange={(e) => setFbName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-input border border-line/60 rounded-xl text-sm focus:outline-none focus:border-[#D4A32A]/50 focus:bg-card-hover text-copy placeholder-muted/60"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-dim uppercase tracking-wider block">
                            Email
                          </label>
                          <input
                            type="email"
                            placeholder="so we can reply"
                            value={fbEmail}
                            onChange={(e) => setFbEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-input border border-line/60 rounded-xl text-sm focus:outline-none focus:border-[#D4A32A]/50 focus:bg-card-hover text-copy placeholder-muted/60"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-dim uppercase tracking-wider block">
                            Rating
                          </label>
                          <div className="flex items-center gap-1.5 py-1">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const isHighlighted = hoveredRating >= star || (!hoveredRating && fbRating >= star);
                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setFbRating(star)}
                                  onMouseEnter={() => setHoveredRating(star)}
                                  onMouseLeave={() => setHoveredRating(0)}
                                  className="p-1 text-dim hover:scale-110 active:scale-95 transition-all cursor-pointer"
                                >
                                  <Star
                                    className={`w-8 h-8 transition-all ${
                                      isHighlighted
                                        ? "text-[#D4A32A] fill-[#D4A32A]"
                                        : "text-line fill-card-hover"
                                    }`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full py-3 bg-[#D4A32A] hover:bg-[#c49527] text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-6 cursor-pointer"
                        >
                          {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span>Submit Feedback</span>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
