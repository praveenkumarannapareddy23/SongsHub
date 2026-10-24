"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import YouTubeIcon from "@/components/ui/YouTubeIcon";
import {
  Loader2,
  Plus,
  X,
  Check,
  Music,
  Save,
  ArrowLeft,
  AlertCircle,
  Shield,
  Image,
  Headphones,
  Tags,
  Globe,
  FolderOpen,
  Calendar,
  Clock,
  User,
  FileText,
  ChevronDown,
  Search,
  Trash2,
  Edit3,
  ListMusic,
  RefreshCw,
  ArrowUpDown,
} from "lucide-react";
import NextImage from "next/image";
import { CATEGORIES_DATA } from "@/components/categories/categoryData";

const CATEGORIES = CATEGORIES_DATA.map((c) => c.nameEn);

const LANGUAGES = [
  { value: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { value: "en", label: "English", nativeLabel: "English" },
  { value: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
];

// ─── Language info for dynamic lyrics tabs ──────────────────────────
const LYRICS_LANG_MAP = {
  te: { value: "te", tabKey: "te", nativeLabel: "తెలుగు", field: "lyricsTe", format: "original", placeholder: "Paste Telugu lyrics here... Use double newlines for stanza breaks.", font: "font-[Noto_Sans_Telugu,sans-serif]" },
  hi: { value: "hi", tabKey: "hi", nativeLabel: "हिन्दी", field: "lyricsHi", format: "original", placeholder: "Paste Hindi lyrics here... Use double newlines for stanza breaks.", font: "font-[Noto_Sans_Devanagari,sans-serif]" },
  en: { value: "en", tabKey: "ro", nativeLabel: "English", field: "lyricsEn", format: "original", placeholder: "Paste English lyrics here...", font: "" },
};

const ROMANIZED_LANG = { value: "en", tabKey: "en", nativeLabel: "Romanized", field: "lyricsEn", format: "transliteration", placeholder: "Paste Romanized/English lyrics here...", font: "" };
const EMPTY_FORM = {
  title: "", titleEnglish: "", artistName: "", artistNameEnglish: "", artistId: "", language: "te",
  categories: [], album: "", year: new Date().getFullYear(),
  duration: "", tags: [], lyricsTe: "", lyricsEn: "", lyricsHi: "",
  mediaImage: "", mediaAudio: "", mediaVideo: "",
};
// ─── Safe Fetch Response Parser ──────────────────────────────────────
async function safeParseResponse(res, defaultError) {
  const contentType = res.headers.get("content-type");
  let data = null;
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch (e) {
      console.error("Error parsing JSON response:", e);
    }
  }
  if (!res.ok) {
    const errorMsg = data?.error || `${defaultError} (Status ${res.status})`;
    throw new Error(errorMsg);
  }
  return data;
}

// ─── Fetch with Timeout Helper ───────────────────────────────────────
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 40000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection or refresh the page.");
    }
    throw err;
  }
}

// ─── Tag Input ─────────────────────────────────────────────────────
function TagInput({ tags, setTags }) {
  const [input, setInput] = useState("");
  const addTag = () => {
    const t = input.trim();
    if (t) { setTags((prev) => (prev.includes(t) ? prev : [...prev, t])); setInput(""); }
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#D4A32A]/10 border border-[#D4A32A]/20 rounded-full text-xs font-medium text-[#D4A32A]">
            {tag}
            <button type="button" onClick={() => setTags((prev) => prev.filter((t) => t !== tag))} className="ml-0.5 text-[#D4A32A]/60 hover:text-[#D4A32A] cursor-pointer"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }} placeholder="Type a tag and press Enter..." className="flex-1 px-3 py-2 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
        <button type="button" onClick={addTag} disabled={!input.trim()} className="px-3 py-2 rounded-lg bg-[#D4A32A]/10 border border-[#D4A32A]/20 text-[#D4A32A] text-sm font-semibold hover:bg-[#D4A32A]/20 transition-all disabled:opacity-40 cursor-pointer"><Plus className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

// ─── Category Multi-Select ─────────────────────────────────────────
function CategorySelect({ selected, setSelected }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggle = (cat) => {
    setSelected(selected.includes(cat) ? selected.filter((c) => c !== cat) : [...selected, cat]);
  };
  return (
    <div className="relative" ref={dropdownRef}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white/80 focus:outline-none focus:border-[#D4A32A] transition-all cursor-pointer">
        <span className={selected.length === 0 ? "text-[#727272]" : "text-white"}>{selected.length === 0 ? "Select categories..." : `${selected.length} selected`}</span>
        <ChevronDown className={`w-4 h-4 text-[#727272] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto py-1">
          {CATEGORIES.map((cat) => {
            const isSel = selected.includes(cat);
            return (
              <button type="button" key={cat} onClick={() => toggle(cat)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer ${isSel ? "text-[#D4A32A] bg-[#D4A32A]/5" : "text-[#a7a7a7] hover:text-white hover:bg-[rgba(255,255,255,0.03)]"}`}>
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSel ? "bg-[#D4A32A] border-[#D4A32A]" : "border-[rgba(255,255,255,0.2)]"}`}>{isSel && <Check className="w-3 h-3 text-black" />}</div>
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────
function DeleteConfirmModal({ song, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Delete Song?</h2>
        <p className="text-sm text-[#a7a7a7] mb-2">
          Are you sure you want to delete
        </p>
        <p className="text-sm font-semibold text-white mb-6">
          &ldquo;{song.title}&rdquo;
        </p>
        <div className="flex items-center gap-3">
          <button onClick={onCancel} disabled={deleting} className="flex-1 py-3 rounded-full border border-[rgba(255,255,255,0.15)] text-white font-semibold text-sm hover:bg-[rgba(255,255,255,0.05)] transition-all disabled:opacity-50 cursor-pointer">Cancel</button>
          <button onClick={onConfirm} disabled={deleting} className="flex-1 py-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>{deleting ? "Deleting..." : "Delete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Song Modal ───────────────────────────────────────────────
function EditSongModal({ song, onClose, onSaveSuccess, getIdToken }) {
  const [form, setForm] = useState(() => {
    let formLang = "te";
    if (song.language) {
      const lowerLang = song.language.toLowerCase();
      if (lowerLang.startsWith("tel")) formLang = "te";
      else if (lowerLang.startsWith("hin")) formLang = "hi";
      else if (lowerLang.startsWith("eng")) formLang = "en";
      else formLang = song.language;
    }

    return {
      title: song.title || "",
      titleEnglish: song.titleEnglish || "",
      artistName: typeof song.artist === "string" ? song.artist : (song.artist?.name || ""),
      artistNameEnglish: typeof song.artist === "string" ? "" : (song.artist?.nameEnglish || ""),
      artistId: typeof song.artist === "string" ? "" : (song.artist?.id || ""),
      language: formLang,
      categories: Array.isArray(song.category) ? song.category : (song.category ? [song.category] : []),
      album: song.album || "",
      year: song.year || new Date().getFullYear(),
      duration: song.duration?.toString() || "",
      tags: Array.isArray(song.tags) ? song.tags : [],
      lyricsTe: typeof song.lyrics === "string" 
        ? song.lyrics 
        : (Array.isArray(song.lyrics) ? (song.lyrics.find((l) => l.language === "te" || l.language === "Telugu")?.content || "") : ""),
      lyricsEn: typeof song.englishLyrics === "string"
        ? song.englishLyrics
        : (Array.isArray(song.lyrics) ? (song.lyrics.find((l) => l.language === "en" || l.language === "English" || l.title === "Romanized")?.content || "") : ""),
      lyricsHi: Array.isArray(song.lyrics) ? (song.lyrics.find((l) => l.language === "hi" || l.language === "Hindi")?.content || "") : "",
      mediaImage: song.imageUrl || song.media?.image || "",
      mediaAudio: song.media?.audio || "",
      mediaVideo: song.media?.video || "",
    };
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lyricsTab, setLyricsTab] = useState(
    form.language === "en" ? "ro" : form.language
  );

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    if (field === "language") {
      setLyricsTab(value === "en" ? "ro" : value);
    }
  };

  const buildSongData = () => {
    const durationNum = parseInt(form.duration, 10) || 0;

    const lyricsArray = [];
    if (form.lyricsTe.trim()) {
      lyricsArray.push({
        language: "te",
        format: "original",
        title: "తెలుగు",
        content: form.lyricsTe.trim(),
        isDefault: form.language === "te",
      });
    }
    if (form.lyricsHi.trim()) {
      lyricsArray.push({
        language: "hi",
        format: "original",
        title: "हिन्दी",
        content: form.lyricsHi.trim(),
        isDefault: form.language === "hi",
      });
    }
    if (form.lyricsEn.trim()) {
      lyricsArray.push({
        language: "en",
        format: "transliteration",
        title: "Romanized",
        content: form.lyricsEn.trim(),
        isDefault: form.language === "en",
      });
    }

    if (lyricsArray.length > 0 && !lyricsArray.some((l) => l.isDefault)) {
      lyricsArray[0].isDefault = true;
    }

    return {
      title: form.title.trim(),
      titleEnglish: form.titleEnglish.trim(),
      artist: {
        id: form.artistId.trim() || null,
        name: form.artistName.trim() || "Unknown Artist",
        nameEnglish: form.artistNameEnglish.trim() || "Unknown Artist"
      },
      language: form.language === "te" ? "Telugu" : (form.language === "hi" ? "Hindi" : "English"),
      category: form.categories.length > 0 ? form.categories : ["Praise"],
      album: form.album.trim() || null,
      year: parseInt(form.year, 10) || new Date().getFullYear(),
      duration: durationNum,
      tags: form.tags,
      lyrics: lyricsArray,
      imageUrl: form.mediaImage.trim(),
      media: { image: form.mediaImage.trim() || "", audio: form.mediaAudio.trim() || "", video: form.mediaVideo.trim() || "" },
    };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Song title is required."); return; }
    if (!form.artistName.trim()) { setError("Artist name is required."); return; }
    setSaving(true); setError(null);
    try {
      const token = await getIdToken();
      const songData = buildSongData();
      const res = await fetch(`/api/admin/songs?id=${encodeURIComponent(song.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(songData),
      });
      await safeParseResponse(res, "Failed to save song");
      onSaveSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit3 className="w-5 h-5 text-[#D4A32A]" />
            <div>
              <h2 className="text-lg font-black tracking-tight">Edit Song</h2>
              <p className="text-xs text-[#727272]">Modify details for &ldquo;{song.title}&rdquo;</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] flex items-center justify-center text-[#727272] hover:text-white transition-all cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <section className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[rgba(255,255,255,0.06)]">
              <Music className="w-4 h-4 text-[#D4A32A]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Song Title (Telugu) <span className="text-red-400">*</span></label>
                <input type="text" value={form.title} onChange={(e) => updateField("title", e.target.value)} required className="w-full px-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Song Title (English / Romanized)</label>
                <input type="text" value={form.titleEnglish} onChange={(e) => updateField("titleEnglish", e.target.value)} className="w-full px-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Artist Name <span className="text-red-400">*</span></label>
                <input type="text" value={form.artistName} onChange={(e) => updateField("artistName", e.target.value)} required className="w-full px-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Artist Name (English)</label>
                <input type="text" value={form.artistNameEnglish} onChange={(e) => updateField("artistNameEnglish", e.target.value)} className="w-full px-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Artist ID (optional)</label>
                <input type="text" value={form.artistId} onChange={(e) => updateField("artistId", e.target.value)} className="w-full px-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Language</label>
                <select value={form.language} onChange={(e) => updateField("language", e.target.value)} className="w-full px-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all appearance-none cursor-pointer" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23727272' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", backgroundSize: "16px" }}>
                  {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.nativeLabel} ({l.label})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Album (optional)</label>
                <input type="text" value={form.album} onChange={(e) => updateField("album", e.target.value)} className="w-full px-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Year</label>
                <input type="number" value={form.year} onChange={(e) => updateField("year", e.target.value)} min="1900" max="2099" className="w-full px-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Duration (seconds)</label>
                <input type="number" value={form.duration} onChange={(e) => updateField("duration", e.target.value)} placeholder="e.g. 342" min="0" className="w-full px-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
              </div>
            </div>
          </section>

          {/* Categories & Tags */}
          <section className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[rgba(255,255,255,0.06)]">
              <FolderOpen className="w-4 h-4 text-[#D4A32A]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">Categories & Tags</h3>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">Categories</label>
              <CategorySelect selected={form.categories} setSelected={(val) => updateField("categories", val)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">Tags</label>
              <TagInput tags={form.tags} setTags={(val) => updateField("tags", val)} />
            </div>
          </section>

          {/* Lyrics */}
          <section className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[rgba(255,255,255,0.06)]">
              <FileText className="w-4 h-4 text-[#D4A32A]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">Lyrics</h3>
            </div>

            {(() => {
              const primary = LYRICS_LANG_MAP[form.language] || LYRICS_LANG_MAP.te;
              const secondary = ROMANIZED_LANG;
              const primaryTabKey = form.language === "en" ? "ro" : form.language;
              const secondaryTabKey = "en";
              return (
                <>
                  <div className="flex items-center gap-1 bg-[#111] border border-[rgba(255,255,255,0.06)] rounded-xl p-1 w-fit">
                    <button
                      type="button"
                      onClick={() => setLyricsTab(primaryTabKey)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        lyricsTab === primaryTabKey
                          ? "bg-[#D4A32A] text-black shadow-sm"
                          : "text-[#727272] hover:text-white"
                      }`}
                    >
                      {primary.nativeLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLyricsTab(secondaryTabKey)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        lyricsTab === secondaryTabKey
                          ? "bg-[#D4A32A] text-black shadow-sm"
                          : "text-[#727272] hover:text-white"
                      }`}
                    >
                      {secondary.nativeLabel}
                    </button>
                  </div>

                  {lyricsTab === primaryTabKey && (
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5">
                        {primary.nativeLabel} Lyrics <span className="text-[#727272] font-normal">({primary.format})</span>
                      </label>
                      <textarea
                        value={form[primary.field]}
                        onChange={(e) => updateField(primary.field, e.target.value)}
                        placeholder={primary.placeholder}
                        rows={8}
                        className={`w-full px-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all resize-vertical ${primary.font}`}
                      />
                    </div>
                  )}

                  {lyricsTab === secondaryTabKey && (
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5">
                        Romanized Lyrics <span className="text-[#727272] font-normal">(transliteration)</span>
                      </label>
                      <textarea
                        value={form.lyricsEn}
                        onChange={(e) => updateField("lyricsEn", e.target.value)}
                        placeholder={secondary.placeholder}
                        rows={8}
                        className="w-full px-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all resize-vertical"
                      />
                    </div>
                  )}
                </>
              );
            })()}
          </section>

          {/* Media URLs */}
          <section className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[rgba(255,255,255,0.06)]">
              <Image className="w-4 h-4 text-[#D4A32A]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">Media URLs</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Cover Image URL</label>
                <input type="url" value={form.mediaImage} onChange={(e) => updateField("mediaImage", e.target.value)} placeholder="https://example.com/cover.jpg" className="w-full px-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Audio URL</label>
                <input type="url" value={form.mediaAudio} onChange={(e) => updateField("mediaAudio", e.target.value)} placeholder="https://example.com/song.mp3" className="w-full px-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Video URL</label>
                <input type="url" value={form.mediaVideo} onChange={(e) => updateField("mediaVideo", e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full px-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
              </div>
            </div>
          </section>

          {/* Sticky footer spacing */}
          <div className="h-4" />
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0a0a0a] border-t border-[rgba(255,255,255,0.06)] flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className="px-5 py-2.5 rounded-full border border-[rgba(255,255,255,0.1)] text-xs font-semibold text-[#727272] hover:text-white hover:border-[rgba(255,255,255,0.2)] transition-all cursor-pointer disabled:opacity-50">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.title.trim()} className="px-6 py-2.5 rounded-full bg-[#D4A32A] text-black font-bold text-xs hover:bg-[#c49527] transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#D4A32A]/10">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sort timestamp helper ─────────────────────────────────────────
// Firestore timestamps arrive from the admin API as serialized
// { _seconds, _nanoseconds } objects (or ISO strings). Normalize to ms.
function toTimeMs(val) {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const t = Date.parse(val);
    return Number.isNaN(t) ? 0 : t;
  }
  if (typeof val === "object") {
    if (typeof val._seconds === "number") return val._seconds * 1000;
    if (typeof val.seconds === "number") return val.seconds * 1000;
    if (typeof val.toMillis === "function") return val.toMillis();
  }
  return 0;
}

// Format a timestamp (same inputs as toTimeMs) into a short readable date.
function formatDate(val) {
  const ms = toTimeMs(val);
  if (!ms) return "";
  try {
    return new Date(ms).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (e) {
    return "";
  }
}

// ─── Main Admin Dashboard ──────────────────────────────────────────
export default function AdminPage() {
  const { user, isAuthenticated, loading, firestoreData } = useAuth();
  const router = useRouter();
  const mountedRef = useRef(true);
  const songsLoadedRef = useRef(false);
  const songsFetchPromiseRef = useRef(null);
  const songsRef = useRef([]);

  useEffect(() => {
    // StrictMode in dev mounts -> unmounts -> remounts, so we must reset
    // the flag to true on every mount. Otherwise mountedRef stays false and
    // fetchSongs() silently skips its state updates (infinite loading).
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      const container = document.querySelector(".h-full.overflow-y-auto");
      if (container) {
        container.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  // ─── Tab State ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("add"); // "add" | "list"
  const [songs, setSongs] = useState([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("title-asc"); // "title-asc" | "recent" | "title-desc" | "year-desc" | "year-asc" | "artist-asc"
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null); // string message
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null); // null = new song, string = editing
  const [showPreview, setShowPreview] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingSongForModal, setEditingSongForModal] = useState(null);
  const [lyricsTab, setLyricsTab] = useState(
    EMPTY_FORM.language === "en" ? "ro" : EMPTY_FORM.language
  ); // "te" | "hi" | "ro" | "en"

  // ─── Form State ─────────────────────────────────────────────────
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
    // Auto-switch lyrics tab when language changes
    if (field === "language") {
      setLyricsTab(value === "en" ? "ro" : value);
    }
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, year: new Date().getFullYear() });
    setEditingId(null);
    setShowPreview(false);
  };

  // ─── Auth Protection ────────────────────────────────────────────
  const isAdmin =
    user?.email === "alsaikumar22@gmail.com" ||
    user?.email === "control@youworship.world" ||
    user?.email?.endsWith("@youworship.admin") ||
    firestoreData?.role === "admin";

  const getIdToken = useCallback(async () => {
    if (!user) throw new Error("Not authenticated");
    return user.getIdToken();
  }, [user]);

  const fetchSongs = useCallback(async (options = {}) => {
    if (!user) return [];

    const { force = false } = options;
    if (!force && songsLoadedRef.current) {
      return songsRef.current;
    }

    if (songsFetchPromiseRef.current) {
      return songsFetchPromiseRef.current;
    }

    const requestPromise = (async () => {
      setSongsLoading(true);
      setError(null);
      try {
        const token = await getIdToken();
        const res = await fetchWithTimeout("/api/admin/songs", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await safeParseResponse(res, "Failed to fetch songs");
        const nextSongs = Array.isArray(data?.songs)
          ? data.songs
          : Array.isArray(data)
            ? data
            : [];

        if (mountedRef.current) {
          setSongs(nextSongs);
        }
        songsRef.current = nextSongs;
        songsLoadedRef.current = true;
        return nextSongs;
      } catch (err) {
        console.error("Error fetching songs:", err);
        if (mountedRef.current) {
          setError(err.message);
        }
        return [];
      } finally {
        songsFetchPromiseRef.current = null;
        if (mountedRef.current) {
          setSongsLoading(false);
        }
      }
    })();

    songsFetchPromiseRef.current = requestPromise;
    return requestPromise;
  }, [user, getIdToken]);

  // ─── Build Song Data from Form ──────────────────────────────────
  const buildSongData = () => {
    const durationNum = parseInt(form.duration, 10) || 0;

    const lyricsArray = [];
    if (form.lyricsTe.trim()) {
      lyricsArray.push({
        language: "te",
        format: "original",
        title: "తెలుగు",
        content: form.lyricsTe.trim(),
        isDefault: form.language === "te",
      });
    }
    if (form.lyricsHi.trim()) {
      lyricsArray.push({
        language: "hi",
        format: "original",
        title: "हिन्दी",
        content: form.lyricsHi.trim(),
        isDefault: form.language === "hi",
      });
    }
    if (form.lyricsEn.trim()) {
      lyricsArray.push({
        language: "en",
        format: "transliteration",
        title: "Romanized",
        content: form.lyricsEn.trim(),
        isDefault: form.language === "en",
      });
    }

    if (lyricsArray.length > 0 && !lyricsArray.some((l) => l.isDefault)) {
      lyricsArray[0].isDefault = true;
    }

    return {
      title: form.title.trim(),
      titleEnglish: form.titleEnglish.trim(),
      artist: {
        id: form.artistId.trim() || null,
        name: form.artistName.trim() || "Unknown Artist",
        nameEnglish: form.artistNameEnglish.trim() || "Unknown Artist"
      },
      language: form.language === "te" ? "Telugu" : (form.language === "hi" ? "Hindi" : "English"),
      category: form.categories.length > 0 ? form.categories : ["Praise"],
      album: form.album.trim() || null,
      year: parseInt(form.year, 10) || new Date().getFullYear(),
      duration: durationNum,
      tags: form.tags,
      lyrics: lyricsArray,
      imageUrl: form.mediaImage.trim(),
      media: { image: form.mediaImage.trim() || "", audio: form.mediaAudio.trim() || "", video: form.mediaVideo.trim() || "" },
    };
  };


  // ─── Populate Form from Song Data ───────────────────────────────
  const populateForm = (song) => {
    let formLang = "te";
    if (song.language) {
      const lowerLang = song.language.toLowerCase();
      if (lowerLang.startsWith("tel")) formLang = "te";
      else if (lowerLang.startsWith("hin")) formLang = "hi";
      else if (lowerLang.startsWith("eng")) formLang = "en";
      else formLang = song.language;
    }

    setForm({
      title: song.title || "",
      titleEnglish: song.titleEnglish || "",
      artistName: typeof song.artist === "string" ? song.artist : (song.artist?.name || ""),
      artistId: typeof song.artist === "string" ? "" : (song.artist?.id || ""),
      language: formLang,
      categories: Array.isArray(song.category) ? song.category : (song.category ? [song.category] : []),
      album: song.album || "",
      year: song.year || new Date().getFullYear(),
      duration: song.duration?.toString() || "",
      tags: Array.isArray(song.tags) ? song.tags : [],
      lyricsTe: typeof song.lyrics === "string" 
        ? song.lyrics 
        : (Array.isArray(song.lyrics) ? (song.lyrics.find((l) => l.language === "te" || l.language === "Telugu")?.content || "") : ""),
      lyricsEn: typeof song.englishLyrics === "string"
        ? song.englishLyrics
        : (Array.isArray(song.lyrics) ? (song.lyrics.find((l) => l.language === "en" || l.language === "English" || l.title === "Romanized")?.content || "") : ""),
      lyricsHi: Array.isArray(song.lyrics) ? (song.lyrics.find((l) => l.language === "hi" || l.language === "Hindi")?.content || "") : "",
      mediaImage: song.imageUrl || song.media?.image || "",
      mediaAudio: song.media?.audio || "",
      mediaVideo: song.media?.video || "",
    });
    setEditingId(song.id);
    setActiveTab("add");
    setShowPreview(false);
    scrollToTop();
  };

  // ─── Create / Update Song ──────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Song title is required."); return; }
    if (!form.artistName.trim()) { setError("Artist name is required."); return; }
    setSaving(true); setError(null); setSuccess(null);
    try {
      const token = await getIdToken();
      const songData = buildSongData();
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/admin/songs?id=${encodeURIComponent(editingId)}` : "/api/admin/songs";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(songData),
      });
      const data = await safeParseResponse(res, "Failed to save song");
      resetForm();
      setSuccess(editingId ? "Song updated successfully!" : "Song added successfully!");
      setActiveTab("list");
      fetchSongs({ force: true });
      scrollToTop();
      setTimeout(() => { if (mountedRef.current) setSuccess(null); }, 5000);
    } catch (err) {
      setError(err.message);
      scrollToTop();
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete Song ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/admin/songs?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await safeParseResponse(res, "Failed to delete song");
      setDeleteTarget(null);
      setSuccess("Song deleted successfully!");
      fetchSongs({ force: true });
      setTimeout(() => { if (mountedRef.current) setSuccess(null); }, 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // ─── Preview Data ──────────────────────────────────────────────
  const previewData = showPreview ? buildSongData() : null;

  // ─── Filtered Songs & Pagination ───────────────────────────────
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLanguage, selectedCategory, sortBy]);

  const filteredSongs = songs.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (s.title || "").toLowerCase();
      const artist = (s.artist?.name || "").toLowerCase();
      if (!title.includes(q) && !artist.includes(q)) return false;
    }
    if (selectedLanguage) {
      if (s.language !== selectedLanguage) return false;
    }
    if (selectedCategory) {
      const categories = Array.isArray(s.category) ? s.category : (s.category ? [s.category] : []);
      const catObj = CATEGORIES_DATA.find(c => c.nameEn === selectedCategory);
      const matched = categories.some(cat => {
        if (cat.toLowerCase() === selectedCategory.toLowerCase()) return true;
        if (catObj) {
          if (catObj.nameTe && cat.toLowerCase() === catObj.nameTe.toLowerCase()) return true;
          if (Array.isArray(catObj.legacyNames) && catObj.legacyNames.some(ln => ln.toLowerCase() === cat.toLowerCase())) return true;
        }
        return false;
      });
      if (!matched) return false;
    }
    return true;
  });

  // Sort the filtered list based on the selected sort option
  const sortedSongs = [...filteredSongs].sort((a, b) => {
    switch (sortBy) {
      case "title-asc":
        return (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" });
      case "title-desc":
        return (b.title || "").localeCompare(a.title || "", undefined, { sensitivity: "base" });
      case "year-desc":
        return (Number(b.year) || 0) - (Number(a.year) || 0);
      case "year-asc":
        return (Number(a.year) || 0) - (Number(b.year) || 0);
      case "artist-asc":
        return (a.artist?.name || "").localeCompare(b.artist?.name || "", undefined, { sensitivity: "base" });
      case "recent":
      default:
        return (
          toTimeMs(b.updatedAt) - toTimeMs(a.updatedAt) ||
          toTimeMs(b.createdAt) - toTimeMs(a.createdAt)
        );
    }
  });

  const itemsPerPage = 15;
  const totalPages = Math.ceil(sortedSongs.length / itemsPerPage);
  const paginatedSongs = sortedSongs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ─── Auth Guards ────────────────────────────────────────────────
  if (loading) return <div className="min-h-screen bg-[#070707] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#D4A32A] animate-spin" /></div>;
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center p-8">
      <div className="text-center max-w-md"><AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" /><h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1><p className="text-[#a7a7a7] text-sm">Please sign in with an admin account.</p><button onClick={() => router.push("/")} className="mt-6 px-6 py-2.5 rounded-full bg-[#D4A32A] text-black font-bold text-sm hover:bg-[#c49527] transition-all cursor-pointer">Go Home</button></div>
    </div>
  );
  if (!isAdmin) return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center p-8">
      <div className="text-center max-w-md"><Shield className="w-12 h-12 text-[#D4A32A]/50 mx-auto mb-4" /><h1 className="text-2xl font-bold text-white mb-2">Admin Only</h1><p className="text-[#a7a7a7] text-sm">This dashboard is only available to administrators.</p><button onClick={() => router.push("/")} className="mt-6 px-6 py-2.5 rounded-full bg-[#D4A32A] text-black font-bold text-sm hover:bg-[#c49527] transition-all cursor-pointer">Go Home</button></div>
    </div>
  );

  return (
    <div className="h-full w-full overflow-y-auto bg-[#070707] text-white flex flex-col">
      {/* ─── Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#070707]/95 backdrop-blur-md border-b border-[rgba(255,255,255,0.06)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] flex items-center justify-center text-[#727272] hover:text-white transition-all cursor-pointer"><ArrowLeft className="w-4 h-4" /></button>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">Admin Dashboard</h1>
              <p className="text-[10px] text-[#727272] font-medium">Manage your song collection</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "add" && (
              <button onClick={() => setShowPreview(!showPreview)} className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${showPreview ? "bg-[#D4A32A]/10 border-[#D4A32A]/30 text-[#D4A32A]" : "border-[rgba(255,255,255,0.1)] text-[#727272] hover:text-white"}`}>Preview JSON</button>
            )}
          </div>
        </div>
      </header>

      {/* ─── Tab Navigation ──────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-1 bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-xl p-1 w-fit">
          <button onClick={() => { setActiveTab("add"); resetForm(); scrollToTop(); }} className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "add" ? "bg-[#D4A32A] text-black shadow-sm" : "text-[#727272] hover:text-white"}`}>
            <Plus className="w-3.5 h-3.5 inline mr-1.5" />Add Song
          </button>
          <button onClick={() => { setActiveTab("list"); fetchSongs({ force: true }); scrollToTop(); }} className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "list" ? "bg-[#D4A32A] text-black shadow-sm" : "text-[#727272] hover:text-white"}`}>
            <ListMusic className="w-3.5 h-3.5 inline mr-1.5" />All Songs ({songs.length})
          </button>
        </div>
      </div>

      {/* ─── Main Content ────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center"><Check className="w-4 h-4 text-emerald-400" /></div>
            <div><p className="text-sm font-semibold text-emerald-400">{success}</p></div>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {activeTab === "add" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ─── Form Column ──────────────────────────── */}
            <div className="lg:col-span-2 space-y-8">
              <form onSubmit={handleSave}>
                {editingId && (
                  <div className="mb-6 p-4 rounded-xl bg-[#D4A32A]/10 border border-[#D4A32A]/20 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Edit3 className="w-4 h-4 text-[#D4A32A]" /><span className="text-sm font-semibold text-[#D4A32A]">Editing Song</span></div>
                    <button type="button" onClick={resetForm} className="text-xs text-[#727272] hover:text-white font-semibold transition-colors cursor-pointer">Cancel edit</button>
                  </div>
                )}

                <section className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-[rgba(255,255,255,0.06)]">
                    <Music className="w-4 h-4 text-[#D4A32A]" /><h2 className="text-sm font-bold text-white uppercase tracking-wider">Basic Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5">Song Title (Telugu) <span className="text-red-400">*</span></label>
                      <input type="text" value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="అగ్ని మండించు" required className="w-full px-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5">Song Title (English / Romanized)</label>
                      <input type="text" value={form.titleEnglish || ""} onChange={(e) => updateField("titleEnglish", e.target.value)} placeholder="Agni Mandinchu" className="w-full px-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5"><User className="w-3 h-3 inline mr-1 text-[#D4A32A]" />Artist Name <span className="text-red-400">*</span></label>
                      <input type="text" value={form.artistName} onChange={(e) => updateField("artistName", e.target.value)} placeholder="ఫ్రెడ్డీ పాల్" required className="w-full px-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5">Artist Name (English)</label>
                      <input type="text" value={form.artistNameEnglish} onChange={(e) => updateField("artistNameEnglish", e.target.value)} placeholder="Freddie Paul" className="w-full px-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5">Artist ID <span className="text-[#727272] font-normal">(optional)</span></label>
                      <input type="text" value={form.artistId} onChange={(e) => updateField("artistId", e.target.value)} placeholder="artist-123" className="w-full px-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5"><Globe className="w-3 h-3 inline mr-1 text-[#D4A32A]" />Language</label>
                      <select value={form.language} onChange={(e) => updateField("language", e.target.value)} className="w-full px-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all appearance-none cursor-pointer" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23727272' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", backgroundSize: "16px" }}>
                        {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.nativeLabel} ({l.label})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5"><FolderOpen className="w-3 h-3 inline mr-1 text-[#D4A32A]" />Album <span className="text-[#727272] font-normal">(optional)</span></label>
                      <input type="text" value={form.album} onChange={(e) => updateField("album", e.target.value)} placeholder="Album name" className="w-full px-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5"><Calendar className="w-3 h-3 inline mr-1 text-[#D4A32A]" />Year</label>
                      <input type="number" value={form.year} onChange={(e) => updateField("year", e.target.value)} min="1900" max="2099" className="w-full px-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5"><Clock className="w-3 h-3 inline mr-1 text-[#D4A32A]" />Duration (seconds)</label>
                      <input type="number" value={form.duration} onChange={(e) => updateField("duration", e.target.value)} placeholder="e.g. 342" min="0" className="w-full px-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
                    </div>
                  </div>
                </section>

                <section className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5 mt-6">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-[rgba(255,255,255,0.06)]"><FolderOpen className="w-4 h-4 text-[#D4A32A]" /><h2 className="text-sm font-bold text-white uppercase tracking-wider">Categories & Tags</h2></div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">Categories</label>
                    <CategorySelect selected={form.categories} setSelected={(val) => updateField("categories", val)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5"><Tags className="w-3 h-3 inline mr-1 text-[#D4A32A]" />Tags</label>
                    <TagInput tags={form.tags} setTags={(val) => updateField("tags", val)} />
                  </div>
                </section>

                <section className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5 mt-6">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-[rgba(255,255,255,0.06)]">
                    <FileText className="w-4 h-4 text-[#D4A32A]" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Lyrics</h2>
                  </div>

                  {/* Lyrics Language Tabs — dynamic based on selected language */}
                  {(() => {
                    const primary = LYRICS_LANG_MAP[form.language] || LYRICS_LANG_MAP.te;
                    const secondary = ROMANIZED_LANG;
                    const primaryTabKey = form.language === "en" ? "ro" : form.language;
                    const secondaryTabKey = "en";
                    return (
                      <>
                        <div className="flex items-center gap-1 bg-[#111] border border-[rgba(255,255,255,0.06)] rounded-xl p-1 w-fit">
                          <button
                            type="button"
                            onClick={() => setLyricsTab(primaryTabKey)}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              lyricsTab === primaryTabKey
                                ? "bg-[#D4A32A] text-black shadow-sm"
                                : "text-[#727272] hover:text-white"
                            }`}
                          >
                            {primary.nativeLabel}
                          </button>
                          <button
                            type="button"
                            onClick={() => setLyricsTab(secondaryTabKey)}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              lyricsTab === secondaryTabKey
                                ? "bg-[#D4A32A] text-black shadow-sm"
                                : "text-[#727272] hover:text-white"
                            }`}
                          >
                            {secondary.nativeLabel}
                          </button>
                        </div>

                        {/* Primary Language Lyrics */}
                        {lyricsTab === primaryTabKey && (
                          <div>
                            <label className="block text-xs font-semibold text-white/70 mb-1.5">
                              {primary.nativeLabel} Lyrics <span className="text-[#727272] font-normal">({primary.format})</span>
                            </label>
                            <textarea
                              value={form[primary.field]}
                              onChange={(e) => updateField(primary.field, e.target.value)}
                              placeholder={primary.placeholder}
                              rows={10}
                              className={`w-full px-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all resize-vertical ${primary.font}`}
                            />
                          </div>
                        )}

                        {/* Romanized/Transliteration Lyrics */}
                        {lyricsTab === secondaryTabKey && (
                          <div>
                            <label className="block text-xs font-semibold text-white/70 mb-1.5">
                              Romanized Lyrics <span className="text-[#727272] font-normal">(transliteration)</span>
                            </label>
                            <textarea
                              value={form.lyricsEn}
                              onChange={(e) => updateField("lyricsEn", e.target.value)}
                              placeholder={secondary.placeholder}
                              rows={10}
                              className="w-full px-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all resize-vertical"
                            />
                          </div>
                        )}
                      </>
                    );
                  })()}
                </section>

                <section className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5 mt-6">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-[rgba(255,255,255,0.06)]"><Image className="w-4 h-4 text-[#D4A32A]" /><h2 className="text-sm font-bold text-white uppercase tracking-wider">Media URLs</h2></div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5"><Image className="w-3 h-3 inline mr-1 text-[#D4A32A]" />Cover Image URL</label>
                      <input type="url" value={form.mediaImage} onChange={(e) => updateField("mediaImage", e.target.value)} placeholder="https://example.com/cover.jpg" className="w-full px-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5"><Headphones className="w-3 h-3 inline mr-1 text-[#D4A32A]" />Audio URL</label>
                      <input type="url" value={form.mediaAudio} onChange={(e) => updateField("mediaAudio", e.target.value)} placeholder="https://example.com/song.mp3" className="w-full px-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5"><YouTubeIcon className="w-3 h-3 inline mr-1 text-[#D4A32A]" />Video URL</label>
                      <input type="url" value={form.mediaVideo} onChange={(e) => updateField("mediaVideo", e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full px-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
                    </div>
                  </div>
                </section>

                <div className="flex items-center gap-4 pt-4 pb-12">
                  <button type="submit" disabled={saving || !form.title.trim()} className="px-8 py-3.5 rounded-full bg-[#D4A32A] text-black font-bold text-sm hover:bg-[#c49527] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D4A32A]/10">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{saving ? "Saving..." : editingId ? "Update Song" : "Add Song to Collection"}</span>
                  </button>
                  <button type="button" onClick={resetForm} className="px-6 py-3.5 rounded-full border border-[rgba(255,255,255,0.1)] text-sm font-semibold text-[#727272] hover:text-white hover:border-[rgba(255,255,255,0.2)] transition-all cursor-pointer">
                    {editingId ? "Cancel" : "Clear"}
                  </button>
                </div>
              </form>
            </div>

            {/* ─── Preview Column ───────────────────────── */}
            <div className="lg:col-span-1">
              {showPreview && previewData ? (
                <div className="sticky top-24 bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.06)]"><h3 className="text-xs font-bold text-[#D4A32A] uppercase tracking-wider">JSON Preview</h3></div>
                  <div className="p-5 overflow-auto max-h-[70vh]"><pre className="text-[11px] text-[#a7a7a7] leading-relaxed font-mono whitespace-pre-wrap">{JSON.stringify(previewData, null, 2)}</pre></div>
                </div>
              ) : (
                <div className="sticky top-24 bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                  <div className="text-center py-12"><FileText className="w-10 h-10 text-[#727272] mx-auto mb-4" /><p className="text-sm text-[#727272]">Click <span className="text-[#D4A32A] font-semibold">Preview JSON</span> to see the formatted song data before saving.</p></div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ─── ALL SONGS TAB ─────────────────────────────── */
          <div className="space-y-6">
            {/* Search + Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#727272]" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search songs by title or artist..." className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#D4A32A] focus:ring-1 focus:ring-[#D4A32A]/30 transition-all" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Language Filter */}
                <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="px-4 py-3 bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:border-[#D4A32A] transition-all">
                  <option value="">All Languages</option>
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
                {/* Category Filter */}
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-3 bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:border-[#D4A32A] transition-all max-w-[160px] md:max-w-xs">
                  <option value="">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {/* Sort By */}
                <div className="relative">
                  <ArrowUpDown className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#727272]" />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="pl-9 pr-4 py-3 bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:border-[#D4A32A] transition-all cursor-pointer max-w-[180px] md:max-w-[200px]">
                    <option value="recent">Recently Updated</option>
                    <option value="title-asc">Title (A–Z)</option>
                    <option value="title-desc">Title (Z–A)</option>
                    <option value="year-desc">Year (Newest First)</option>
                    <option value="year-asc">Year (Oldest First)</option>
                    <option value="artist-asc">Artist (A–Z)</option>
                  </select>
                </div>
                <button onClick={() => { resetForm(); setActiveTab("add"); scrollToTop(); }} className="px-5 py-3 rounded-xl bg-[#D4A32A]/10 border border-[#D4A32A]/20 text-[#D4A32A] text-sm font-bold hover:bg-[#D4A32A]/20 transition-all cursor-pointer whitespace-nowrap"><Plus className="w-4 h-4 inline mr-1.5" />New Song</button>
              </div>
            </div>

            {/* Library Section Header (Mockup Style) */}
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-4 mt-8">
              <h2 className="text-xs font-black tracking-widest text-[#a7a7a7] uppercase">CURRENT LIBRARY ({songs.length})</h2>
              <button onClick={() => fetchSongs({ force: true })} className="text-xs font-bold text-[#D4A32A] hover:text-[#f3be3e] hover:underline transition-all cursor-pointer flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${songsLoading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Song List */}
            {songsLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-[#D4A32A] animate-spin" /></div>
            ) : paginatedSongs.length === 0 ? (
              <div className="text-center py-16 bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-2xl">
                <Music className="w-12 h-12 text-[#727272] mx-auto mb-4" />
                <p className="text-sm text-[#727272]">
                  {searchQuery || selectedLanguage || selectedCategory ? "No songs match your filters." : "No songs in the collection yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {paginatedSongs.map((song) => {
                  const artist = song.artist?.name || "Unknown Artist";
                  const yearInfo = song.year ? ` - ${song.year}` : "";
                  const langLabel = LANGUAGES.find(l => l.value === song.language)?.label || song.language?.toUpperCase() || "Telugu";
                  const subtitle = `${artist}${yearInfo} • ${langLabel}`;
                  const updatedLabel = sortBy === "recent" ? formatDate(song.updatedAt || song.createdAt) : "";
                  return (
                    <div key={song.id} className="group bg-transparent hover:bg-[rgba(255,255,255,0.03)] border-b border-[rgba(255,255,255,0.03)] rounded-lg p-4 flex items-center gap-4 transition-all">
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-lg bg-[#111] border border-[rgba(255,255,255,0.06)] overflow-hidden shrink-0 flex items-center justify-center">
                        {song.media?.image ? (
                          <img src={song.media.image} alt={song.title} className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-4 h-4 text-[#727272]" />
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold text-white truncate group-hover:text-[#D4A32A] transition-colors">{song.title}</p>
                          {!(song.audioUrl || song.media?.audio || song.youtubeId) && (
                            <span title="Audio not available" className="text-xs select-none">🔇</span>
                          )}
                          {!(song.youtubeId || song.media?.video) && (
                            <span title="Video not available" className="text-xs select-none">🚫🎥</span>
                          )}
                        </div>
                        <p className="text-xs text-[#727272] font-medium mt-0.5 truncate">{subtitle}</p>
                      </div>
                      {/* Updated date (visible proof for the Recently Updated sort) */}
                      {updatedLabel && (
                        <span className="text-[10px] text-[#D4A32A]/80 font-semibold shrink-0 hidden sm:block" title="Last updated">
                          {updatedLabel}
                        </span>
                      )}
                      {/* Duration */}
                      <span className="text-xs text-[#727272] font-mono shrink-0 hidden sm:block">
                        {song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, "0")}` : ""}
                      </span>
                      {/* Hover Actions (Translucent Circular Buttons) */}
                      <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                        <button onClick={() => setEditingSongForModal(song)} className="w-8 h-8 rounded-full bg-[#1e293b]/80 border border-white/10 hover:bg-[#D4A32A] hover:text-black flex items-center justify-center text-[#a7a7a7] hover:border-[#D4A32A]/30 transition-all cursor-pointer" title="Edit song">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(song)} className="w-8 h-8 rounded-full bg-[#1e293b]/80 border border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 flex items-center justify-center text-[#a7a7a7] transition-all cursor-pointer" title="Delete song">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <button onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); scrollToTop(); }} disabled={currentPage === 1} className="px-4 py-2 rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] text-xs font-bold text-white hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">Previous</button>
                <span className="text-xs text-[#727272]">Page {currentPage} of {totalPages}</span>
                <button onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); scrollToTop(); }} disabled={currentPage === totalPages} className="px-4 py-2 rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] text-xs font-bold text-white hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">Next</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Delete Confirm Modal ───────────────────────── */}
      {deleteTarget && (
        <DeleteConfirmModal
          song={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      {/* ─── Edit Song Modal ───────────────────────────── */}
      {editingSongForModal && (
        <EditSongModal
          song={editingSongForModal}
          onClose={() => setEditingSongForModal(null)}
          onSaveSuccess={() => {
            fetchSongs({ force: true });
            setEditingSongForModal(null);
            setSuccess("Song updated successfully!");
            setTimeout(() => { if (mountedRef.current) setSuccess(null); }, 5000);
          }}
          getIdToken={getIdToken}
        />
      )}
    </div>
  );
}
