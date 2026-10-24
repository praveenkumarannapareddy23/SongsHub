"use client";

import React, { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useAudio } from "@/context/audio-context";
import CategoryLanguageSelector from "./CategoryLanguageSelector";
import CategoryCard from "./CategoryCard";
import CategoryDetails from "./CategoryDetails";
import Loading from "@/components/Loading";
import { Spiral } from "@/components/ui/Spiral";
import { CATEGORIES_DATA } from "./categoryData";

export default function CategoryExplorer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { songs, songsLoading } = useAudio();
  const selectedLanguage = searchParams?.get("lang") || "telugu";
  const [isPending, startTransition] = useTransition();

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    searchParams?.get("category") || null
  );

  // Sync state if URL searchParams change
  useEffect(() => {
    const cat = searchParams?.get("category") || null;
    setSelectedCategoryId(cat);
  }, [searchParams]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSelectedCategoryId(params.get("category") || null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleLanguageChange = (lang) => {
    const params = new URLSearchParams(window.location.search);
    params.set("lang", lang);
    startTransition(() => {
      router.push(`${window.location.pathname}?${params.toString()}`);
    });
  };

  const filteredCategories = CATEGORIES_DATA.filter((category) => {
    // If selected language is Hindi, only show the specified categories
    if (selectedLanguage === "hindi") {
      const allowedHindiCategories = [
        "Worship",
        "Praise",
        "Hope",
        "Christmas",
        "Gospel",
        "Encouraging",
        "Second Coming",
        "Comfort",
        "Commitment",
        "Thanksgiving",
        "Repentance"
      ];
      if (!allowedHindiCategories.some(c => c.toLowerCase() === category.nameEn.toLowerCase())) {
        return false;
      }
    }

    const songIds = selectedLanguage === "telugu" ? category.songIdsTe : category.songIdsEn;
    const songCount = (songs || []).filter((song) => {
      const songLanguage = (song.language || "").toLowerCase();
      let matchesLanguage = false;
      if (selectedLanguage === "telugu") {
        matchesLanguage = songLanguage === "te" || songLanguage === "telugu";
      } else if (selectedLanguage === "english") {
        matchesLanguage = songLanguage === "en" || songLanguage === "english";
      } else if (selectedLanguage === "hindi") {
        matchesLanguage = songLanguage === "hi" || songLanguage === "hindi";
      } else if (selectedLanguage === "tamil") {
        matchesLanguage = songLanguage === "ta" || songLanguage === "tamil";
      }

      if (!matchesLanguage) return false;

      if (selectedLanguage === "telugu") {
        const hasTeluguScript = /[\u0C00-\u0C7F]/.test(song.title) || /[\u0C00-\u0C7F]/.test(song.teluguTitle);
        if (!hasTeluguScript) return false;
      }

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

      const matchByHardcodedList = songIds.includes(song.id);

      return matchByCategoryField || matchByHardcodedList;
    }).length;

    if (selectedLanguage === "hindi" || selectedLanguage === "tamil") {
      return true;
    }
    return songCount > 0;
  });

  const selectedCategory = CATEGORIES_DATA.find((c) => c.id === selectedCategoryId);

  const handleSelectCategory = (id) => {
    setSelectedCategoryId(id);
    const params = new URLSearchParams(window.location.search);
    params.set("category", id);
    window.history.pushState(null, "", `${window.location.pathname}?${params.toString()}`);
  };

  const handleBack = () => {
    setSelectedCategoryId(null);
    const params = new URLSearchParams(window.location.search);
    params.delete("category");
    window.history.pushState(null, "", `${window.location.pathname}?${params.toString()}`);
  };

  const categoryLoadingLabels = {
    telugu: "తెలుగు కేటగిరీలు లోడ్ అవుతున్నాయి...",
    english: "Loading categories...",
    hindi: "कैटेगरी लोड हो रही हैं...",
  };
  const categoryLoadingMessage = categoryLoadingLabels[selectedLanguage] || categoryLoadingLabels.english;

  return (
    <div className="space-y-6 select-none relative">
      {isPending && (
        <div className="fixed inset-0 bg-canvas/70 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in duration-150 text-center gap-3">
          <Spiral className="w-10 h-10 text-[#D4A32A]" dots={8} radius={32} />
          <span className="text-xs md:text-sm font-bold text-title tracking-tight font-telugu">
            {categoryLoadingMessage}
          </span>
        </div>
      )}
      <AnimatePresence>
        {selectedCategory ? (
          <motion.div
            key="category-details"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <CategoryDetails
              category={selectedCategory}
              language={selectedLanguage}
              onBack={handleBack}
            />
          </motion.div>
        ) : (
          <motion.div
            key="category-browse"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Header section with inline Language Selector */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-5">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-black text-title tracking-tight">
                  Songs By Categories
                </h1>
                <p className="text-xs md:text-sm text-muted font-semibold">
                  Discover Christian worship songs by category.
                </p>
              </div>

              <div className="shrink-0">
                <CategoryLanguageSelector
                  selectedLanguage={selectedLanguage}
                  onChange={handleLanguageChange}
                />
              </div>
            </div>

            {/* Categories Grid or Loading State */}
            {songsLoading ? (
              <Loading message={categoryLoadingMessage} showSkeleton={true} />
            ) : filteredCategories.length === 0 ? (
              <div className="p-12 text-center text-muted border border-line rounded-xl bg-card-hover/20 select-none">
                <span className="font-semibold block text-white text-lg">No categories available</span>
                <span className="text-xs block mt-1">Try another language.</span>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2"
              >
                {filteredCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    language={selectedLanguage}
                    onClick={() => handleSelectCategory(category.id)}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
