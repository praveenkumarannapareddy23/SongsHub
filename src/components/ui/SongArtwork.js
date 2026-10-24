"use client";

import React, { useState } from "react";
import { Music } from "lucide-react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

const letterGradients = {
  A: "from-red-600 to-red-900",
  B: "from-orange-600 to-orange-900",
  C: "from-amber-600 to-amber-900",
  D: "from-yellow-600 to-yellow-900",
  E: "from-lime-600 to-lime-900",
  F: "from-green-600 to-green-900",
  G: "from-emerald-600 to-emerald-900",
  H: "from-teal-600 to-teal-900",
  I: "from-cyan-600 to-cyan-900",
  J: "from-sky-600 to-sky-900",
  K: "from-blue-600 to-blue-900",
  L: "from-indigo-600 to-indigo-900",
  M: "from-violet-600 to-violet-900",
  N: "from-purple-600 to-purple-900",
  O: "from-fuchsia-600 to-fuchsia-900",
  P: "from-pink-600 to-pink-900",
  Q: "from-rose-600 to-rose-900",
  R: "from-red-500 to-rose-900",
  S: "from-orange-500 to-amber-900",
  T: "from-yellow-500 to-lime-900",
  U: "from-green-500 to-emerald-900",
  V: "from-teal-500 to-cyan-900",
  W: "from-sky-500 to-blue-900",
  X: "from-indigo-500 to-violet-900",
  Y: "from-purple-500 to-fuchsia-900",
  Z: "from-pink-500 to-rose-900",
};

function getLetterGradient(song) {
  const title = song.titleEnglish || song.title || song.teluguTitle || "";
  const firstLetter = title.charAt(0).toUpperCase();
  return letterGradients[firstLetter] || "from-slate-600 to-slate-900";
}

export default function SongArtwork({ song, className = "w-full h-full object-cover", iconSize = "w-6 h-6" }) {
  const [hasError, setHasError] = useState(false);

  const gradient = getLetterGradient(song);

  if (hasError || !song.coverUrl) {
    return (
      <div className={`bg-gradient-to-br ${gradient} flex items-center justify-center ${className}`}>
        <Music className={`text-white/20 ${iconSize}`} />
      </div>
    );
  }

  return (
    <ImageWithFallback
      src={song.coverUrl}
      alt={song.teluguTitle || song.title}
      width={160}
      height={160}
      className={className}
      sizes="(max-width: 768px) 100vw, 160px"
    />
  );
}
