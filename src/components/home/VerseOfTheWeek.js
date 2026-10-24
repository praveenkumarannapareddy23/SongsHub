"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Share2, Check, Volume2, Pause, Loader2 } from "lucide-react";
import useDailyVerse from "@/hooks/useDailyVerse";
import { useAudio } from "@/context/audio-context";
import { VerseSkeleton } from "@/components/ui/SongSkeleton";

export default function VerseOfTheWeek() {
  const { verse, reference, referenceTelugu, loading } = useDailyVerse();
  const { isPlaying: isMusicPlaying, togglePlay } = useAudio();
  const [copied, setCopied] = useState(false);

  // Audio Playback State
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioLang, setAudioLang] = useState("te"); // "te" (Telugu) or "en" (English)
  const audioRef = useRef(null);
  const speechActiveRef = useRef(false);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    speechActiveRef.current = false;
    setIsAudioPlaying(false);
    setIsLoadingAudio(false);
  }, []);

  // Cleanup on unmount or verse change
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [verse, stopAudio]);

  const playVerseAudio = useCallback(
    async (langToPlay) => {
      if (!verse) return;
      stopAudio();

      // Pause active background music so the verse is clear
      if (isMusicPlaying && togglePlay) {
        togglePlay();
      }

      setIsLoadingAudio(true);

      const textToSpeak =
        langToPlay === "en"
          ? `${verse.textEnglish} — ${reference}`
          : `${verse.textTelugu} — ${referenceTelugu}`;

      // Native browser speech synthesis fallback
      const speakWithBrowser = () => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
          setIsLoadingAudio(false);
          setIsAudioPlaying(false);
          return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = langToPlay === "te" ? "te-IN" : "en-US";
        utterance.rate = 0.9;

        utterance.onstart = () => {
          setIsLoadingAudio(false);
          setIsAudioPlaying(true);
          speechActiveRef.current = true;
        };
        utterance.onend = () => {
          setIsAudioPlaying(false);
          setIsLoadingAudio(false);
          speechActiveRef.current = false;
        };
        utterance.onerror = () => {
          setIsAudioPlaying(false);
          setIsLoadingAudio(false);
          speechActiveRef.current = false;
        };

        window.speechSynthesis.speak(utterance);
      };

      // Try server-generated crystal clear MP3 TTS stream
      try {
        const url = `/api/verse/tts?text=${encodeURIComponent(textToSpeak)}&lang=${langToPlay}`;
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        const audio = audioRef.current;
        audio.src = url;

        audio.onplaying = () => {
          setIsLoadingAudio(false);
          setIsAudioPlaying(true);
        };

        audio.onended = () => {
          setIsAudioPlaying(false);
          setIsLoadingAudio(false);
        };

        audio.onerror = () => {
          console.debug("Verse TTS fetch failed, switching to browser speech fallback");
          speakWithBrowser();
        };

        await audio.play();
      } catch (err) {
        console.debug("Audio play error, falling back to speech synthesis:", err);
        speakWithBrowser();
      }
    },
    [verse, reference, referenceTelugu, isMusicPlaying, togglePlay, stopAudio]
  );

  const handleToggleAudio = () => {
    if (isAudioPlaying || isLoadingAudio) {
      stopAudio();
    } else {
      playVerseAudio(audioLang);
    }
  };

  const handleLangChange = (newLang) => {
    if (audioLang === newLang) return;
    setAudioLang(newLang);
    if (isAudioPlaying) {
      playVerseAudio(newLang);
    }
  };

  const handleShare = useCallback(async () => {
    const currentVerse = verse;
    if (!currentVerse) return;

    const verseUrl = "https://youworship.world";

    const shareText = `${currentVerse.textEnglish}

— ${reference}

${currentVerse.textTelugu}
— ${referenceTelugu}

${verseUrl}
YouWorship — Daily Bible Verse`;

    // Try native Web Share API first (mobile & modern desktop)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `YouWorship - ${reference}`,
          text: shareText,
          url: verseUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed — fall through to clipboard
        if (err.name !== "AbortError") {
          console.debug("Web Share API error:", err);
        }
      }
    }

    // Fallback: copy to clipboard
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      } else {
        // Older fallback for browsers without Clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = shareText;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.debug("Clipboard API error:", err);
    }
  }, [verse, reference, referenceTelugu]);

  if (loading || !verse) {
    return <VerseSkeleton />;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-card-hover/20 via-card/10 to-card-hover/20 border border-line/20 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-title/30 transition-all duration-500 group">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-title/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-title/8 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/2 rounded-full blur-2xl pointer-events-none" />

      {/* Left Accent Bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-title via-title/50 to-transparent" />

      {/* Content Column */}
      <div className="relative z-10 flex-1 space-y-4 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-title uppercase tracking-widest bg-title/10 px-2.5 py-1 rounded-full">
            Verse of the Day
          </span>
          <span className="h-px w-8 bg-line" />
          <span className="text-[10px] font-bold text-dim uppercase tracking-wider">
            {reference}
          </span>
        </div>
        <div className="space-y-3">
          {/* Telugu verse */}
          <p className="text-title text-xl md:text-2xl font-bold leading-[1.6] font-telugu text-left drop-shadow-sm group-hover:text-title transition-colors duration-300">
            &ldquo;{verse.textTelugu}&rdquo;
          </p>
          {/* English verse */}
          <p className="text-muted/80 text-sm md:text-base italic font-medium leading-relaxed text-left">
            &ldquo;{verse.textEnglish}&rdquo;
          </p>
        </div>
      </div>

      {/* Right Action & Citation block */}
      <div className="relative z-10 flex flex-col items-end justify-between shrink-0 self-stretch text-right md:border-l md:border-line/20 md:pl-6 pt-2 md:pt-0">
        {/* Actions Row: Language selector, Listen audio button, Share button */}
        <div className="flex items-center gap-2">
          {/* Audio Language Switcher */}
          <div
            className="flex items-center bg-card-hover/90 border border-line/60 rounded-lg p-0.5 text-[10px] font-bold shadow-xs select-none"
            title="Select audio language"
          >
            <button
              type="button"
              onClick={() => handleLangChange("te")}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                audioLang === "te"
                  ? "bg-title text-card shadow-xs"
                  : "text-muted hover:text-title"
              }`}
              title="Telugu Voice"
            >
              తెలుగు
            </button>
            <button
              type="button"
              onClick={() => handleLangChange("en")}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                audioLang === "en"
                  ? "bg-title text-card shadow-xs"
                  : "text-muted hover:text-title"
              }`}
              title="English Voice"
            >
              EN
            </button>
          </div>

          {/* Audio Listen / Pause Button */}
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`relative h-8 px-2.5 rounded-lg border transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 select-none ${
              isAudioPlaying
                ? "bg-[#D4A32A] text-black border-[#D4A32A] shadow-md shadow-[#D4A32A]/20"
                : "bg-card-hover hover:bg-card border-line text-title hover:border-[#D4A32A]/50"
            }`}
            title={isAudioPlaying ? "Pause audio" : "Listen to verse audio"}
            aria-label="Listen to verse audio"
          >
            {isLoadingAudio ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isAudioPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <div className="flex items-end gap-0.5 h-3 px-0.5">
                  <span className="w-0.5 h-full bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-0.5 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-0.5 h-full bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#D4A32A]" />
                <span className="text-[11px] font-bold hidden sm:inline">Listen</span>
              </>
            )}
          </button>

          {/* Share icon-only button */}
          <button
            type="button"
            onClick={handleShare}
            className="relative w-8 h-8 rounded-lg bg-card-hover hover:bg-card border border-line transition-all duration-200 text-dim hover:text-title flex items-center justify-center group/btn cursor-pointer"
            title={copied ? "Copied!" : "Share this verse"}
            aria-label="Share verse"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Share2 className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform duration-200" />
            )}
            {copied && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-green-400 bg-card border border-line rounded px-1.5 py-0.5 whitespace-nowrap shadow-sm">
                Copied!
              </span>
            )}
          </button>
        </div>

        <div className="mt-auto space-y-1 pt-4">
          <span className="text-xs font-bold text-title block font-telugu">
            {referenceTelugu}
          </span>
          <span className="text-[10px] text-dim block tracking-wider uppercase font-semibold">
            Bible Verse Daily
          </span>
        </div>
      </div>
    </div>
  );
}
