"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

// Must match src/proxy.js — this cookie tells the landing gate that the
// visitor chose to enter the app, letting all subsequent navigation through.
const ENTERED_COOKIE = "yw_entered";

/**
 * "Explore Songs" CTA. Sets the session cookie (so the app is not gated again)
 * and navigates to `href` — either /home or the deep link the visitor was sent
 * to (e.g. a shared song).
 *
 * Shows a loading spinner while songs are being prefetched so the user
 * navigates to /home only when data is ready.
 */
export default function EnterAppButton({ href = "/?tab=discover", onEnter }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(
    (e) => {
      e.preventDefault();

      // Set the session cookie
      document.cookie = `${ENTERED_COOKIE}=1; path=/; SameSite=Lax`;

      if (onEnter) onEnter();

      // If songs are already prefetched, navigate instantly
      const prefetched = window.__SONGHUB_PREFETCHED_SONGS;
      if (Array.isArray(prefetched) && prefetched.length > 0) {
        router.push(href);
        return;
      }

      // Otherwise, fetch songs first, then navigate
      setLoading(true);

      let navigated = false;
      const navigate = () => {
        if (!navigated) {
          navigated = true;
          if (onEnter) onEnter();
          router.push(href);
        }
      };

      // Ensure we redirect within 1 second even if fetch is slow
      const timer = setTimeout(navigate, 1000);

      const fetchPromise = fetch("/api/songs?all=true", { cache: "default" })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load songs");
          return res.json();
        })
        .then((data) => {
          if (data?.songs) {
            window.__SONGHUB_PREFETCHED_SONGS = data.songs;
            return data.songs;
          }
          return [];
        })
        .catch((err) => {
          console.error("Prefetch fetch failed:", err);
          return [];
        });

      window.__SONGHUB_PREFETCHED_PROMISE = fetchPromise;

      fetchPromise.finally(() => {
        clearTimeout(timer);
        navigate();
      });
    },
    [href, router]
  );

  return (
    <Link
      href={href}
      prefetch={true}
      onClick={handleClick}
      className="landing-cta group relative inline-flex items-center justify-center gap-2.5 md:gap-3 rounded-[30px] px-7 py-3.5 md:px-11 md:py-[18px] text-[clamp(0.95rem,min(2vh,4.2vw),1.35rem)] font-serif font-bold text-white bg-white/[0.06] backdrop-blur-xl border border-[#D9A544]/50 shadow-[0_0_30px_rgba(242,193,78,0.22),inset_0_1px_0_rgba(255,255,255,0.14)] cursor-pointer"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 md:w-6 md:h-6 text-[#F2C14E] animate-spin" />
          <span>Loading songs...</span>
        </>
      ) : (
        <>
          <span>Explore Songs</span>
          <ArrowRight className="w-4 h-4 md:w-6 md:h-6 text-[#F2C14E] transition-transform duration-300 group-hover:translate-x-1.5" />
        </>
      )}
    </Link>
  );
}
