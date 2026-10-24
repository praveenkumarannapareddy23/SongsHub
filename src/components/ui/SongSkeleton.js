import { Spiral } from "@/components/ui/Spiral";

export function SongCardSkeleton() {
  return (
    <div className="group relative w-48 shrink-0 animate-pulse" role="status" aria-label="Loading song">
      <div className="relative aspect-square w-full rounded-xl bg-card-hover/80 overflow-hidden border border-line/40">
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-white/5 animate-pulse" />
      </div>
      <div className="mt-2.5 space-y-1.5 px-0.5">
        <div className="h-3.5 bg-card-hover rounded-md w-3/4" />
        <div className="h-3 bg-card-hover/60 rounded-md w-1/2" />
      </div>
    </div>
  );
}

export function SongRowSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center justify-between px-1">
        <div className="h-5 bg-card-hover rounded-md w-24" />
        <div className="h-3 bg-card-hover/60 rounded-md w-16" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <SongCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function SongsSectionSkeleton() {
  return (
    <div className="space-y-8 py-4">
      <div className="sr-only">
        <h2>Christian Worship Songs & Lyrics Collection</h2>
        <p>Explore thousands of Christian worship songs in Telugu, English, and Hindi with lyrics and audio.</p>
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <SongRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroCarouselSkeleton() {
  return (
    <div className="relative w-full min-h-[340px] md:h-[360px] rounded-2xl md:rounded-3xl overflow-hidden bg-card border border-line shadow-2xl flex items-center p-6 md:p-10">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-card to-card pointer-events-none" />
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 w-full relative z-10 animate-pulse">
        <div className="w-36 h-36 md:w-56 md:h-56 rounded-2xl bg-card-hover/80 shrink-0 border border-line/40" />
        <div className="flex-1 space-y-4 w-full">
          <div className="h-5 bg-card-hover rounded-full w-48" />
          <div className="h-8 md:h-12 bg-card-hover rounded-xl w-3/4" />
          <div className="h-4 bg-card-hover/70 rounded-lg w-1/2" />
          <div className="flex gap-3 pt-2">
            <div className="h-10 w-32 bg-card-hover rounded-full" />
            <div className="h-10 w-32 bg-card-hover rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function VerseSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-white/[0.04] border border-line p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
      <div className="flex-1 space-y-4 w-full">
        <div className="flex items-center gap-2">
          <div className="h-4 w-28 bg-card-hover rounded-full" />
          <div className="h-px w-8 bg-card-hover" />
          <div className="h-3 w-20 bg-card-hover rounded-md" />
        </div>
        <div className="space-y-3">
          <div className="h-6 md:h-8 bg-card-hover rounded-lg w-full" />
          <div className="h-6 md:h-8 bg-card-hover rounded-lg w-4/5" />
          <div className="h-4 bg-card-hover rounded-md w-2/3" />
        </div>
      </div>
      <div className="w-full md:w-32 flex flex-col items-end gap-3 shrink-0">
        <div className="h-8 w-24 bg-card-hover rounded-full" />
        <div className="h-4 w-20 bg-card-hover rounded-md mt-auto" />
      </div>
    </div>
  );
}

export function SongPageSkeleton() {
  return (
    <div className="relative flex-1 min-h-screen bg-canvas p-6 md:p-12 overflow-hidden select-none">
      {/* Ambient glowing backdrop */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(212,163,42,0.15),transparent_70%)]" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-10">
        {/* Top Header Row Skeleton */}
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-full bg-card-hover border border-line/40 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="w-24 h-9 rounded-full bg-card-hover border border-line/40 animate-pulse" />
            <div className="w-28 h-9 rounded-full bg-card-hover border border-line/40 animate-pulse" />
          </div>
        </div>

        {/* Hero Artwork + Song Title */}
        <div className="flex flex-col md:flex-row items-center gap-8 py-4">
          <div className="w-48 h-48 md:w-60 md:h-60 rounded-3xl bg-card-hover/90 border border-line/50 shadow-2xl flex items-center justify-center shrink-0 relative overflow-hidden">
            <Spiral className="w-12 h-12 text-[#D4A32A]" dots={10} radius={34} />
          </div>
          <div className="space-y-4 flex-1 w-full text-center md:text-left">
            <div className="h-4 bg-amber-500/20 rounded-full w-28 mx-auto md:mx-0 animate-pulse" />
            <div className="h-10 md:h-14 bg-card-hover rounded-2xl w-3/4 mx-auto md:mx-0 animate-pulse" />
            <div className="h-5 bg-card-hover/70 rounded-lg w-1/3 mx-auto md:mx-0 animate-pulse" />
            <div className="flex items-center justify-center md:justify-start gap-3 pt-4">
              <div className="h-12 w-36 bg-[#D4A32A]/20 border border-[#D4A32A]/40 rounded-full animate-pulse" />
              <div className="h-12 w-12 bg-card-hover rounded-full border border-line animate-pulse" />
              <div className="h-12 w-12 bg-card-hover rounded-full border border-line animate-pulse" />
            </div>
          </div>
        </div>

        {/* Shimmering Lyrics Lines Skeleton */}
        <div className="space-y-5 max-w-2xl mx-auto pt-8">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-5 bg-card-hover/70 rounded-lg mx-auto animate-pulse"
              style={{
                width: `${55 + ((i * 13) % 40)}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CategoryDetailsSkeleton({ language = "telugu" }) {
  const loadingLabels = {
    telugu: "కేటగిరీ పాటలు లోడ్ అవుతున్నాయి...",
    english: "Loading category songs...",
    hindi: "कैटेगरी के गाने लोड हो रहे हैं...",
    tamil: "வகைப் பாடல்கள் ஏற்றப்படுகின்றன...",
  };
  const label = loadingLabels[language] || loadingLabels.english;

  return (
    <div className="relative flex flex-col items-center justify-center py-24 text-center space-y-5 animate-in fade-in duration-300">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(212,163,42,0.12),transparent_70%)]" />
      <div className="relative z-10 w-20 h-20 rounded-3xl bg-card border border-line/60 shadow-2xl flex items-center justify-center">
        <Spiral className="w-10 h-10 text-[#D4A32A]" dots={10} radius={34} />
      </div>
      <p className="relative z-10 text-xs md:text-sm font-bold text-title tracking-tight font-telugu">{label}</p>
    </div>
  );
}

export function LyricsSkeleton({ language = "telugu", isImmersive = false }) {
  const loadingLabels = {
    telugu: "తెలుగు లిరిక్స్ లోడ్ అవుతున్నాయి...",
    english: "Loading lyrics...",
    hindi: "हिन्दी लिरिक्स लोड हो रहे हैं...",
    tamil: "பாடல் வரிகள் ஏற்றப்படுகின்றன...",
  };
  const label = loadingLabels[language] || loadingLabels.english;

  return (
    <div className={`relative w-full text-center space-y-6 animate-in fade-in duration-300 ${isImmersive ? "py-20" : "py-14"} flex flex-col items-center justify-center`}>
      {/* Ambient gold glow backdrop */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_50%_at_50%_45%,rgba(212,163,42,0.14),transparent_70%)]" />

      {/* Center glowing badge with Spiral loader */}
      <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-card/90 backdrop-blur-xl border border-line shadow-[0_8px_30px_rgba(212,163,42,0.2)] flex items-center justify-center">
        <Spiral className="w-9 h-9 sm:w-11 sm:h-11 text-[#D4A32A]" dots={10} radius={34} />
      </div>

      <div className="relative z-10 space-y-2 max-w-sm px-4">
        <p className="text-xs sm:text-sm font-bold text-title tracking-tight font-telugu">{label}</p>
        <div className="flex items-center justify-center gap-1.5 h-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4A32A] animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4A32A] animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4A32A] animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>

      {/* Shimmering placeholder lines */}
      <div className="relative z-10 w-full max-w-lg space-y-3.5 pt-2 px-6">
        <div className="h-4 bg-card-hover/80 rounded-full w-4/5 mx-auto animate-pulse" />
        <div className="h-4 bg-card-hover/60 rounded-full w-3/5 mx-auto animate-pulse" style={{ animationDelay: "150ms" }} />
        <div className="h-4 bg-card-hover/70 rounded-full w-2/3 mx-auto animate-pulse" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

export function FullAppSkeleton() {
  return (
    <div className="flex-1 bg-canvas p-6 space-y-8 animate-pulse">
      <div className="sr-only">
        <h1>YouWorship — Christian Songs, Lyrics, Audio & Videos</h1>
        <p>A Christ-centered worship platform. Discover thousands of Telugu, English, and Hindi Christian worship songs with synchronized lyrics, chords, audio, and videos.</p>
      </div>
      <HeroCarouselSkeleton />
      <VerseSkeleton />
      <SongsSectionSkeleton />
    </div>
  );
}
