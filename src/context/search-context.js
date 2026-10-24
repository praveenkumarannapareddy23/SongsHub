"use client";

import React, { createContext, useContext, useState } from "react";

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFullResults, setShowFullResults] = useState(false);
  // "songs" | "lyrics" — controls whether the search bar does title/artist or lyrics fuzzy search
  const [searchMode, setSearchMode] = useState("songs");
  const [voiceSearchTrigger, setVoiceSearchTrigger] = useState(0);
  const triggerVoiceSearch = () => setVoiceSearchTrigger((prev) => prev + 1);

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        showFullResults,
        setShowFullResults,
        searchMode,
        setSearchMode,
        voiceSearchTrigger,
        triggerVoiceSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) throw new Error("useSearch must be used within SearchProvider");
  return context;
}
