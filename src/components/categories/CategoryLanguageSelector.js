"use client";

import React from "react";
import { motion } from "framer-motion";

export default function CategoryLanguageSelector({ selectedLanguage, onChange }) {
  const options = [
    { id: "telugu", label: "తెలుగు" },
    { id: "english", label: "English" },
    { id: "hindi", label: "हिन्दी" }
  ];

  return (
    <div className="flex justify-start items-center">
      <div className="flex h-11 bg-card-hover/50 backdrop-blur-md border border-white/5 rounded-full p-1 shadow-[0_8px_32px_rgba(0,0,0,0.37)] relative select-none w-fit overflow-hidden">
        {options.map((opt) => {
          const isSelected = selectedLanguage === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => {
                onChange(opt.id);
              }}
              className={`relative h-full px-6 text-xs font-extrabold rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center z-10 select-none outline-none ${
                isSelected
                  ? "bg-white text-black shadow-sm"
                  : "bg-transparent text-muted hover:text-title"
              }`}
            >
              <span className="relative z-10">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
