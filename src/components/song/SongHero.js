"use client";

import React, { useState, useEffect } from "react";
import { extractDominantColor } from "@/utils/extract-color";
import { useTheme } from "@/context/theme-context";

export default function SongHero({ song }) {
  const { theme } = useTheme();
  const [gradientColor, setGradientColor] = useState({ r: 18, g: 18, b: 18 });

  useEffect(() => {
    if (song?.coverUrl) {
      extractDominantColor(song.coverUrl).then(setGradientColor);
    }
  }, [song?.coverUrl]);

  const { r, g, b } = gradientColor;
  const isLight = theme === "light";
  const heroBackground = isLight
    ? `linear-gradient(180deg, rgba(${r},${g},${b},0.08) 0%, rgba(${r},${g},${b},0.02) 60%, var(--canvas) 100%)`
    : `linear-gradient(180deg, rgba(${r},${g},${b},0.35) 0%, rgba(${r},${g},${b},0.12) 65%, var(--canvas) 100%)`;

  return (
    <div className="w-full space-y-6">
      {/* 1. Immersive Gradient Hero Banner */}
      <div
        className="relative -mx-6 md:-mx-8 -mt-[60px] px-6 md:px-8 pt-24 pb-8 md:pb-10 rounded-b-2xl overflow-hidden border-b border-line transition-all duration-300"
        style={{
          background: heroBackground,
        }}
      >
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end">
          {/* Info Details */}
          <div className="flex-1 min-w-0 text-center md:text-left space-y-3">
            <span className="text-[10px] font-bold text-muted uppercase tracking-[0.25em]">
              Song
            </span>

            <h1
              className={`text-title text-2xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight select-all drop-shadow-sm ${
                song.language === "ta" || song.language === "tamil"
                  ? ""
                  : song.teluguTitle
                    ? "font-telugu"
                    : ""
              }`}
            >
              {song.teluguTitle || song.title}
            </h1>

            {song.titleEnglish && song.titleEnglish !== (song.teluguTitle || song.title) && (
              <p className="text-lg md:text-xl text-muted font-semibold tracking-wide">
                {song.titleEnglish}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1 text-sm text-muted pt-1 font-medium">
              <span className="font-bold text-title hover:text-copy hover:underline cursor-pointer transition-colors">
                {song.artist}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
