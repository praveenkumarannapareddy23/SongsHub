"use client";

import React from "react";
import { motion } from "framer-motion";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

const CATEGORY_DESCRIPTIONS = {
  "praise":
    "Lift up your hands and celebrate His goodness with joyful songs of praise.",
  "worship":
    "Enter into holy worship with these heartfelt songs of praise and adoration.",
  "encouraging":
    "Find inspiration and strength with uplifting songs to encourage your daily walk of faith.",
  "hope":
    "Find strength, encouragement, and hope for your journey in times of trial.",
  "gospel":
    "Explore powerful gospel songs and messages sharing the good news of Jesus Christ.",
  "prayer":
    "Peaceful worship songs for prayer, deep devotion, and communion with God.",
  "commitment":
    "Dedicate your life and paths to the Lord with these songs of commitment and surrender.",
  "comfort":
    "Find peace, solace, and comfort in God's loving arms during hard times.",
  "christmas":
    "Celebrate the birth of our Savior Jesus Christ with classic Christmas songs.",
  "repentance":
    "Songs of humble repentance, seeking God's mercy, forgiveness, and restoration.",
  "thanksgiving":
    "Express gratitude and praise for God's endless blessings, harvest, and love.",
  "correction":
    "Songs of guidance, instruction, and divine correction to keep our paths straight.",
  "good-friday":
    "Remember the ultimate sacrifice of Jesus Christ on the cross at Calvary.",
  "second-coming":
    "Prepare your hearts for the glorious second coming of our Lord Jesus Christ.",
  "marriage":
    "Sacred and joyful songs celebrating Christian marriage and holy covenant.",
  "morning-worship":
    "Start your day in His presence with inspiring morning worship melodies.",
  "salvation":
    "Reflect on the gift of grace, redemption, and eternal salvation.",
  "holy-spirit":
    "Invite the presence, power, and guidance of the Holy Spirit into your heart.",
  "healing-miracles":
    "Experience God's healing touch and comfort through songs of faith and miracles.",
  "bible-based":
    "Sing the truths of Scripture with songs grounded in God's eternal Word.",
  "festival-special-songs":
    "Joyful songs for special church occasions, celebrations, and holy days.",
  "children-songs":
    "Pure, simple, and inspiring worship melodies for children and family worship.",
  "youth":
    "Energetic, modern worship songs for youth fellowship and personal devotion.",
  "communion":
    "Meditate on the body and blood of Christ during Communion and Holy Supper.",
  "easter":
    "Rejoice in the glorious resurrection of Jesus Christ and His victory over death.",
  "baptism":
    "Celebrate new life in Christ and public declaration of faith through baptism.",
};

const CATEGORY_COLORS = {
  "praise": "from-[#991b1b]/80 to-canvas",
  "worship": "from-[#065f46]/80 to-canvas",
  "encouraging": "from-[#0f766e]/80 to-canvas",
  "hope": "from-[#065f46]/80 to-canvas",
  "gospel": "from-[#581c87]/80 to-canvas",
  "prayer": "from-[#024e75]/80 to-canvas",
  "commitment": "from-[#0284c7]/80 to-canvas",
  "comfort": "from-[#0891b2]/80 to-canvas",
  "christmas": "from-[#991b1b]/80 to-canvas",
  "repentance": "from-[#3730a3]/80 to-canvas",
  "thanksgiving": "from-[#7a2c02]/80 to-canvas",
  "correction": "from-[#4f46e5]/80 to-canvas",
  "good-friday": "from-[#292524]/80 to-canvas",
  "second-coming": "from-[#7c3aed]/80 to-canvas",
  "marriage": "from-[#be185d]/80 to-canvas",
  "morning-worship": "from-[#7a2c02]/80 to-canvas",
  "salvation": "from-[#581c87]/80 to-canvas",
  "holy-spirit": "from-[#075985]/80 to-canvas",
  "healing-miracles": "from-[#155e75]/80 to-canvas",
  "bible-based": "from-[#065f46]/80 to-canvas",
  "festival-special-songs": "from-[#9d174d]/80 to-canvas",
  "children-songs": "from-[#92400e]/80 to-canvas",
  "youth": "from-[#5b21b6]/80 to-canvas",
  "communion": "from-[#881337]/80 to-canvas",
  "easter": "from-[#854d0e]/80 to-canvas",
  "baptism": "from-[#155e75]/80 to-canvas",
};

export default function CategoryHeroBanner({ category, language, songCount }) {
  const name = category.nameEn;
  const langName = language === "telugu" ? "Telugu" : "English";
  const desc =
    CATEGORY_DESCRIPTIONS[category.id] ||
    "Curated Christian worship and devotion collection.";
  const bannerColor =
    CATEGORY_COLORS[category.id] || "from-[#1e293b]/80 to-canvas";

  return (
    <div
      className={`relative w-full pt-16 pb-6 px-6 md:px-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end select-none overflow-hidden bg-gradient-to-b ${bannerColor}`}
    >
      {/* Category artwork (sharp corners per Spotify Album design) */}
      <motion.div
        className="w-44 h-44 md:w-48 md:h-48 rounded-md overflow-hidden shrink-0 shadow-lg z-10 border border-line"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <ImageWithFallback
          src={category.bgImage}
          alt={name}
          width={192}
          height={192}
          className="w-full h-full object-cover"
          sizes="192px"
        />
      </motion.div>

      {/* Category details */}
      <div className="flex-1 text-center md:text-left z-10 flex flex-col justify-end">
        <span className="text-[11px] font-bold text-muted uppercase tracking-widest block mb-1">
          Playlist
        </span>
        <h1
          className={`text-title text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none mb-3 drop-shadow-md ${language === "telugu" ? "font-telugu" : ""}`}
        >
          {name}
        </h1>
        <p className="text-xs md:text-sm text-muted max-w-xl mb-4 leading-relaxed font-medium">
          {desc}
        </p>
        <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-title font-bold">
          <span>YouWorship</span>
          <span className="text-muted/50">&bull;</span>
          <span className="text-muted font-medium">{langName}</span>
          <span className="text-muted/50">&bull;</span>
          <span>
            {songCount} song{songCount !== 1 && "s"}
          </span>
        </div>
      </div>
    </div>
  );
}
