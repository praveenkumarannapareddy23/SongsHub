"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAudio } from "@/context/audio-context";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

export default function CategoryCard({ category, language, onClick }) {
  const { songs } = useAudio();
  const name = language === "telugu" ? category.nameTe : category.nameEn;
  const songIds = language === "telugu" ? category.songIdsTe : category.songIdsEn;
  const songCount = (songs || []).filter((song) => {
    // Verify language matches the selected tab language strictly
    const songLanguage = (song.language || "").toLowerCase();
    let matchesLanguage = false;
    if (language === "telugu") {
      matchesLanguage = songLanguage === "te" || songLanguage === "telugu";
    } else if (language === "english") {
      matchesLanguage = songLanguage === "en" || songLanguage === "english";
    } else if (language === "hindi") {
      matchesLanguage = songLanguage === "hi" || songLanguage === "hindi";
    } else if (language === "tamil") {
      matchesLanguage = songLanguage === "ta" || songLanguage === "tamil";
    }

    if (!matchesLanguage) return false;

    // If active tab is telugu, ensure the song title contains Telugu script to hide duplicates with English titles
    if (language === "telugu") {
      const hasTeluguScript = /[\u0C00-\u0C7F]/.test(song.title) || /[\u0C00-\u0C7F]/.test(song.teluguTitle);
      if (!hasTeluguScript) return false;
    }

    // 1. Match by database category array or string
    const matchByCategoryField = Array.isArray(song.categoryArr)
      ? song.categoryArr.some(cat => 
          cat.toLowerCase() === category.nameEn.toLowerCase() || 
          cat.toLowerCase() === category.nameTe.toLowerCase() ||
          (Array.isArray(category.legacyNames) && category.legacyNames.some(ln => ln.toLowerCase() === cat.toLowerCase()))
        )
      : (typeof song.category === "string" && (
          song.category.toLowerCase() === category.nameEn.toLowerCase() || 
          song.category.toLowerCase() === category.nameTe.toLowerCase() ||
          (Array.isArray(category.legacyNames) && category.legacyNames.some(ln => ln.toLowerCase() === song.category.toLowerCase()))
        ));

    // 2. Fallback: match by the hardcoded list in categoryData.js
    const matchByHardcodedList = songIds.includes(song.id);

    return matchByCategoryField || matchByHardcodedList;
  }).length;

  let langLabel = "English";
  if (language === "telugu") langLabel = "Telugu";
  else if (language === "hindi") langLabel = "Hindi";
  else if (language === "tamil") langLabel = "Tamil";

  return (
    <motion.div
      onClick={onClick}
      className="relative w-full h-[180px] rounded-xl overflow-hidden border border-white/5 bg-white/[0.02] backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.37)] cursor-pointer group flex flex-col justify-end p-5 select-none"
      whileHover={{
        scale: 1.03,
        borderColor: "rgba(255, 255, 255, 0.25)",
        boxShadow: "0 0 25px rgba(255, 255, 255, 0.05), 0 8px 32px rgba(0, 0, 0, 0.5)"
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full h-full"
        >
          <ImageWithFallback
            src={category.bgImage}
            alt={category.motif}
            width={800}
            height={600}
            className="w-full h-full object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </motion.div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070707]/95 via-[#070707]/40 to-transparent transition-all duration-300 group-hover:from-[#070707]/98 group-hover:via-[#070707]/50" />
      </div>

      {/* Info Container */}
      <div className="relative z-10 flex flex-col gap-0.5">
        <span className="text-[9px] font-bold tracking-widest text-muted/60 uppercase transition-colors duration-300 group-hover:text-white/60">
          {category.motif}
        </span>
        <h3 className={`text-lg font-black text-white group-hover:text-white transition-colors duration-300 line-clamp-2 leading-tight ${language === "telugu" ? "font-telugu" : ""}`}>
          {name}
        </h3>
        <p className="text-xs text-muted font-medium mt-1">
          {songCount} {langLabel} Song{songCount !== 1 && "s"}
        </p>
      </div>
    </motion.div>
  );
}
