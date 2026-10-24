"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { FileText } from "lucide-react";
import { LyricsSkeleton } from "@/components/ui/SongSkeleton";
import { useTheme } from "@/context/theme-context";

export function LanguageSegmented({ selected, onChange, songLanguage, hasChords }) {
  const langs = [];
  const isHi = songLanguage === "hi" || songLanguage === "hindi";
  const isTa = songLanguage === "ta" || songLanguage === "tamil";
  const isEn = songLanguage === "en" || songLanguage === "english";

  if (isHi) {
    langs.push({ id: "hindi", label: "हिन्दी" });
    langs.push({ id: "english", label: "English" });
    if (hasChords) langs.push({ id: "chords", label: "Chords" });
  } else if (isTa) {
    langs.push({ id: "tamil", label: "தமிழ்" });
    langs.push({ id: "english", label: "English" });
    if (hasChords) langs.push({ id: "chords", label: "Chords" });
  } else if (isEn) {
    langs.push({ id: "english", label: "English" });
    if (hasChords) langs.push({ id: "chords", label: "Chords" });
  } else {
    langs.push({ id: "telugu", label: "తెలుగు" });
    langs.push({ id: "english", label: "English" });
    if (hasChords) langs.push({ id: "chords", label: "Chords" });
  }

  return (
    <div className="flex h-9 md:h-11 bg-card-hover border border-line/60 rounded-full p-0.5 shadow-sm w-fit">
      {langs.map((lang) => {
        const isSelected = selected === lang.id;
        const isChords = lang.id === "chords";
        const isDisabled = isChords && !hasChords;

        return (
          <button
            key={lang.id}
            onClick={() => {
              if (!isDisabled) {
                onChange(lang.id);
              }
            }}
            disabled={isDisabled}
            title={isDisabled ? "Chords not available" : ""}
            className={`h-full px-3.5 md:px-5 text-[10px] md:text-xs font-extrabold rounded-full transition-all duration-200 ${
              isDisabled
                ? "opacity-35 cursor-not-allowed bg-transparent text-muted"
                : isSelected
                  ? "bg-title text-card shadow-sm cursor-pointer"
                  : "bg-transparent text-muted hover:text-title cursor-pointer"
            }`}
          >
            <span>{lang.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function SongLyrics({
  song,
  isUnified = false,
  isImmersive = false,
  isLyricsPage = false,
  selectedLanguage: propLanguage,
  setSelectedLanguage: propSetLanguage,
  fontSizeMultiplier = 1.0,
  loading = false,
}) {
  const [internalLanguage, setInternalLanguage] = useState("telugu");

  const { theme } = useTheme();
  const isLight = theme === "light";

  const activeLyricClass = isLight
    ? "text-[#D4A32A] font-bold scale-[1.03] opacity-100 drop-shadow-[0_0_14px_rgba(212,163,42,0.35)]"
    : "text-[#FACC15] font-bold scale-[1.03] opacity-100 drop-shadow-[0_0_18px_rgba(250,204,21,0.45)]";

  const inactiveLyricClass = isLight
    ? "text-[#111827] font-normal opacity-100 hover:text-[#D4A32A] cursor-pointer"
    : "text-[#f9fafb] font-normal opacity-95 hover:text-[#FACC15] cursor-pointer";

  const inactiveEnglishClass = isLight
    ? "text-[#374151] font-normal opacity-100 hover:text-[#D4A32A] cursor-pointer"
    : "text-[#e5e7eb] font-normal opacity-95 hover:text-[#FACC15] cursor-pointer";

  const selectedLanguage = propLanguage !== undefined ? propLanguage : internalLanguage;
  const setSelectedLanguage = propSetLanguage !== undefined ? propSetLanguage : setInternalLanguage;
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const containerRef = useRef(null);
  const lineRefs = useRef({});

  // Extract stanzas for Telugu and English
  const stanzasTelugu = useMemo(() => {
    let raw = Array.isArray(song?.lyricsTelugu) ? song.lyricsTelugu.join("\n") : (song?.lyricsTelugu || "");
    if (!raw && typeof song?.lyrics === "string") {
      raw = song.lyrics;
    } else if (!raw && Array.isArray(song?.lyrics) && song.lyrics.length > 0) {
      const matched = song.lyrics.find((l) => l.language === "te" || l.isDefault) || song.lyrics[0];
      raw = matched?.content || matched?.text || "";
    }
    if (!raw || typeof raw !== "string") return [];
    return raw
      .split(/\n\s*\n+/)
      .map((block) =>
        block
          .split("\n")
          .map((l) => l.replace(/\[\d{2}:\d{2}\]/g, "").trim())
          .filter(Boolean)
      )
      .filter((b) => b.length > 0);
  }, [song]);

  const stanzasEnglish = useMemo(() => {
    let raw = Array.isArray(song?.lyricsEnglish) ? song.lyricsEnglish.join("\n") : (song?.lyricsEnglish || "");
    if (!raw && Array.isArray(song?.lyrics) && song.lyrics.length > 0) {
      const matched = song.lyrics.find((l) => l.language === "en");
      raw = matched?.content || matched?.text || "";
    }
    if (!raw || typeof raw !== "string") return [];
    return raw
      .split(/\n\s*\n+/)
      .map((block) =>
        block
          .split("\n")
          .map((l) => l.replace(/\[\d{2}:\d{2}\]/g, "").trim())
          .filter(Boolean)
      )
      .filter((b) => b.length > 0);
  }, [song]);

  useEffect(() => {
    if (song) {
      const songLanguage = (song.language || "").toLowerCase();
      const isHi = songLanguage === "hi" || songLanguage === "hindi";
      const isTa = songLanguage === "ta" || songLanguage === "tamil";

      const hasNative = !!(
        song.lyricsTelugu ||
        (Array.isArray(song.lyrics) && song.lyrics.some((l) => l.language === "te" || l.language === "hi" || l.language === "ta" || l.isDefault))
      );

      let defaultLang = "english";
      if (hasNative) {
        if (isHi) defaultLang = "hindi";
        else if (isTa) defaultLang = "tamil";
        else defaultLang = "telugu";
      }
      setInternalLanguage(defaultLang);
    }
  }, [song]);

  const stanzas = useMemo(() => {
    if (selectedLanguage === "english") {
      return stanzasEnglish.length > 0 ? stanzasEnglish : stanzasTelugu;
    }
    return stanzasTelugu.length > 0 ? stanzasTelugu : stanzasEnglish;
  }, [selectedLanguage, stanzasTelugu, stanzasEnglish]);

  const dualStanzas = useMemo(() => {
    if (selectedLanguage !== "dual") return [];
    const maxStanzas = Math.max(stanzasTelugu.length, stanzasEnglish.length);
    const combined = [];
    for (let i = 0; i < maxStanzas; i++) {
      combined.push({
        telugu: stanzasTelugu[i] || [],
        english: stanzasEnglish[i] || [],
      });
    }
    return combined;
  }, [selectedLanguage, stanzasTelugu, stanzasEnglish]);

  const flatLines = useMemo(() => stanzas.flat(), [stanzas]);

  const stanzaOffsets = useMemo(() => {
    const offsets = [];
    let count = 0;
    for (const stanza of stanzas) {
      offsets.push(count);
      count += stanza.length;
    }
    return offsets;
  }, [stanzas]);

  const isTeluguText = (text) => /[\u0C00-\u0C7F]/.test(text || "");

  useEffect(() => {
    setActiveLineIndex(-1);
    lineRefs.current = {};
  }, [selectedLanguage, song]);

  // Accurate, smooth scroll-focal line detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;
    const updateActiveLine = () => {
      ticking = false;
      const totalLines = flatLines.length;
      if (totalLines === 0) return;

      const cRect = container.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // When at the very top, activate first line (line 0)
      if (scrollTop <= 15) {
        setActiveLineIndex(0);
        return;
      }

      // When at the very bottom, activate last line
      if (scrollTop + clientHeight >= scrollHeight - 25) {
        setActiveLineIndex(totalLines - 1);
        return;
      }

      // Focal reading line is positioned at 42% from top of container
      const focalY = cRect.top + cRect.height * 0.42;

      let closestIdx = -1;
      let minDistance = Infinity;

      for (const [idxStr, el] of Object.entries(lineRefs.current)) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const lineCenter = rect.top + rect.height / 2;
        const dist = Math.abs(lineCenter - focalY);

        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = parseInt(idxStr, 10);
        }
      }

      if (closestIdx !== -1) {
        setActiveLineIndex(closestIdx);
      }
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateActiveLine);
        ticking = true;
      }
    };

    // Initial check on mount/update
    updateActiveLine();

    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [selectedLanguage, stanzas, dualStanzas, flatLines.length]);

  const handleLineClick = (idx) => {
    setActiveLineIndex(idx);
    const el = lineRefs.current[idx];
    const container = containerRef.current;
    if (el && container) {
      const elRect = el.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      const targetScrollTop =
        container.scrollTop +
        (elRect.top - cRect.top) -
        (cRect.height * 0.42 - elRect.height / 2);
      container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: "smooth" });
    }
  };

  const renderLyricText = (line) => line;

  if (isImmersive) {
    return (
      <div
        ref={containerRef}
        className={
          isLyricsPage
            ? "w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-card select-text font-lyrics px-3 sm:px-6 py-6 sm:py-8 scrollbar-thin"
            : "w-full flex-1 overflow-y-auto px-4 sm:px-12 md:px-16 py-8 sm:py-12 select-text bg-card font-lyrics scrollbar-thin"
        }
        style={
          isLyricsPage
            ? {
                fontSize: `${(fontSizeMultiplier / 0.6) * 100}%`,
                maskImage:
                  "linear-gradient(transparent, #000 8%, #000 92%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(transparent, #000 8%, #000 92%, transparent)",
              }
            : { fontSize: `${fontSizeMultiplier * 100}%` }
        }
      >
        <div
          className={
            isLyricsPage
              ? "w-full min-h-full flex flex-col justify-center py-6 pb-40"
              : "max-w-4xl mx-auto pb-48 min-h-full flex flex-col justify-center"
          }
        >
          {loading ? (
            <LyricsSkeleton language={selectedLanguage} isImmersive={true} />
          ) : selectedLanguage === "chords" ? (
            <div className="max-w-3xl mx-auto w-full py-4 bg-card-hover/20 rounded-2xl p-6 md:p-10 border border-line/45 shadow-inner">
              {song.chordCredits && (
                <div className="text-xs uppercase tracking-widest font-black text-muted mb-6 border-b border-line pb-3 flex justify-between items-center select-none">
                  <span>Chords</span>
                  <span className="text-title font-bold">{song.chordCredits}</span>
                </div>
              )}
              {Array.isArray(song.chords) && song.chords.length > 0 ? (
                <pre className="font-mono text-left text-base sm:text-lg md:text-xl overflow-x-auto whitespace-pre leading-relaxed tracking-wide text-title p-2 scrollbar-thin select-text">
                  {song.chords.join("\n")}
                </pre>
              ) : (
                <div className="py-24 text-center">
                  <p className="text-lg text-muted font-medium">Chords not available for this song.</p>
                </div>
              )}
            </div>
          ) : selectedLanguage === "dual" ? (
            /* Widescreen 2-Column Side-by-Side Grid, falling back to stack on Mobile */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
              {/* Left Column: Telugu */}
              <div className="space-y-10 text-center">
                <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.25em] mb-6 border-b border-line pb-2 max-w-xs mx-auto">
                  తెలుగు లిరిక్స్
                </h4>
                {stanzasTelugu.map((stanzaLines, sIdx) => (
                  <div key={`te-stanza-${sIdx}`} className="space-y-3 sm:space-y-4">
                    {stanzaLines.map((line, lIdx) => {
                      const lineIdx = (stanzaOffsets[sIdx] || 0) + lIdx;
                      const isActive = activeLineIndex === lineIdx;
                      return (
                        <div
                          key={`te-line-${sIdx}-${lIdx}`}
                          ref={(el) => {
                            lineRefs.current[lineIdx] = el;
                          }}
                          onClick={() => handleLineClick(lineIdx)}
                          className="py-1 transition-all duration-300"
                        >
                          <p
                            className={`text-center text-[1.25em] sm:text-[1.5em] md:text-[1.875em] tracking-tight leading-relaxed font-telugu select-text transition-all duration-300 ${
                              isActive ? activeLyricClass : inactiveLyricClass
                            }`}
                          >
                            {line}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Right Column: English */}
              <div className="space-y-10 text-center border-t border-line/20 pt-8 md:border-t-0 md:pt-0 md:border-l md:border-line/20 md:pl-16">
                <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.25em] mb-6 border-b border-line pb-2 max-w-xs mx-auto">
                  English / Romanized
                </h4>
                {stanzasEnglish.map((stanzaLines, sIdx) => (
                  <div key={`en-stanza-${sIdx}`} className="space-y-3 sm:space-y-4">
                    {stanzaLines.map((line, lIdx) => {
                      const lineIdx = (stanzaOffsets[sIdx] || 0) + lIdx;
                      const isActive = activeLineIndex === lineIdx;
                      return (
                        <div
                          key={`en-line-${sIdx}-${lIdx}`}
                          onClick={() => handleLineClick(lineIdx)}
                          className="py-1 transition-all duration-300"
                        >
                          <p
                            className={`text-center text-[1.125em] sm:text-[1.25em] md:text-[1.5em] tracking-wide leading-relaxed font-lyrics select-text transition-all duration-300 ${
                              isActive ? activeLyricClass : inactiveEnglishClass
                            }`}
                          >
                            {line}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Single Language Mode */
            <div
              className={
                isLyricsPage
                  ? "w-full text-center space-y-8"
                  : "max-w-2xl mx-auto text-center space-y-8 sm:space-y-10"
              }
            >
              {stanzas.map((stanzaLines, sIdx) => (
                <div
                  key={`stanza-${sIdx}`}
                  className="space-y-3 sm:space-y-4"
                >
                  {stanzaLines.map((line, lIdx) => {
                    const lineIdx = (stanzaOffsets[sIdx] || 0) + lIdx;
                    const isActive = activeLineIndex === lineIdx;
                    const isTelugu =
                      selectedLanguage === "telugu" ||
                      isTeluguText(line) ||
                      (song?.language || "").toLowerCase().includes("te");

                    return (
                      <div
                        key={`line-${lineIdx}`}
                        ref={(el) => {
                          lineRefs.current[lineIdx] = el;
                        }}
                        data-line-index={lineIdx}
                        onClick={() => handleLineClick(lineIdx)}
                        className="py-1 sm:py-1.5 transition-all duration-300"
                      >
                        <p
                          className={`text-center transition-all duration-300 select-text ${
                            isTelugu ? "font-telugu" : "font-lyrics"
                          } ${
                            isLyricsPage
                              ? "text-[1.25em] sm:text-[1.6em] leading-[1.95] tracking-tight"
                              : "text-[1.125em] sm:text-[1.375em] md:text-[1.625em] lg:text-[1.875em] tracking-tight leading-relaxed"
                          } ${
                            isActive ? activeLyricClass : inactiveLyricClass
                          }`}
                        >
                          {renderLyricText(line)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {!loading && selectedLanguage === "dual" && stanzasTelugu.length === 0 && stanzasEnglish.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-lg text-muted font-medium">Lyrics not available for this track.</p>
            </div>
          )}

          {!loading && selectedLanguage !== "dual" && flatLines.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-lg text-muted font-medium">Lyrics not available for this track.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const lyricsContent = (
    <div className="relative font-lyrics">
      <div
        ref={containerRef}
        className="relative px-4 sm:px-8 py-6 space-y-8 max-h-[75vh] overflow-y-auto scrollbar-thin"
        style={{ fontSize: `${fontSizeMultiplier * 100}%` }}
      >
        <div className="max-w-2xl mx-auto space-y-8 pb-32">
          {loading ? (
            <LyricsSkeleton language={selectedLanguage} isImmersive={false} />
          ) : selectedLanguage === "chords" ? (
            <div className="max-w-2xl mx-auto py-2 bg-card-hover/20 rounded-xl p-4 md:p-6 border border-line/45 shadow-inner">
              {song.chordCredits && (
                <div className="text-[10px] sm:text-xs uppercase tracking-widest font-black text-muted mb-4 border-b border-line pb-2 flex justify-between items-center select-none">
                  <span>Chord Credits</span>
                  <span className="text-title font-bold">{song.chordCredits}</span>
                </div>
              )}
              {Array.isArray(song.chords) && song.chords.length > 0 ? (
                <pre className="font-mono text-left text-sm md:text-base overflow-x-auto whitespace-pre leading-relaxed tracking-wide text-title p-2 scrollbar-thin select-text">
                  {song.chords.join("\n")}
                </pre>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted">Chords not available for this song.</p>
                </div>
              )}
            </div>
          ) : selectedLanguage === "dual" ? (
            dualStanzas.map((stanza, sIdx) => (
              <div key={`dual-stanza-${sIdx}`} className="space-y-4 py-3.5 border-b border-line/10 last:border-0">
                <div className="space-y-2">
                  {stanza.telugu.map((line, lIdx) => (
                    <p
                      key={`te-${sIdx}-${lIdx}`}
                      className="text-center text-base sm:text-lg md:text-xl font-normal leading-relaxed text-title font-telugu"
                    >
                      {line}
                    </p>
                  ))}
                </div>
                {stanza.english.length > 0 && (
                  <div className="space-y-1.5 pt-2 opacity-80 border-t border-dashed border-line/15">
                    {stanza.english.map((line, lIdx) => (
                      <p
                        key={`en-${sIdx}-${lIdx}`}
                        className="text-center text-xs sm:text-sm md:text-base font-normal leading-relaxed text-muted"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            stanzas.map((stanzaLines, sIdx) => (
              <div key={`stanza-${sIdx}`} className="space-y-2.5 sm:space-y-3">
                {stanzaLines.map((line, lIdx) => {
                  const lineIdx = (stanzaOffsets[sIdx] || 0) + lIdx;
                  const isActive = activeLineIndex === lineIdx;
                  const isTelugu =
                    selectedLanguage === "telugu" ||
                    isTeluguText(line) ||
                    (song?.language || "").toLowerCase().includes("te");

                  return (
                    <div
                      key={`line-${lineIdx}`}
                      ref={(el) => {
                        lineRefs.current[lineIdx] = el;
                      }}
                      data-line-index={lineIdx}
                      onClick={() => handleLineClick(lineIdx)}
                      className="py-1 transition-all duration-300"
                    >
                      <p
                        className={`text-center text-[1em] sm:text-[1.125em] md:text-[1.25em] leading-relaxed transition-all duration-300 ${
                          isTelugu ? "font-telugu" : "font-lyrics"
                        } ${
                          isActive ? activeLyricClass : inactiveLyricClass
                        }`}
                      >
                        {renderLyricText(line)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))
          )}

          {!loading && selectedLanguage === "dual" && dualStanzas.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm text-muted">Lyrics not available for this track.</p>
            </div>
          )}

          {!loading && selectedLanguage !== "dual" && flatLines.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm text-muted">Lyrics not available for this track.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isUnified) {
    return lyricsContent;
  }

  return (
    <div className="bg-card border border-line rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-title/70 animate-pulse" />
          Lyrics
        </h3>
        <LanguageSegmented
          selected={selectedLanguage}
          onChange={setSelectedLanguage}
          songLanguage={(song?.language || "").toLowerCase()}
          hasChords={Array.isArray(song?.chords) && song.chords.length > 0}
        />
      </div>
      {lyricsContent}
    </div>
  );
}
