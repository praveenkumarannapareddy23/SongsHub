"use client";

import Image from "next/image";
import EnterAppButton from "./EnterAppButton";
import SongsPrefetcher from "./SongsPrefetcher";

export default function LandingHero({ onEnter, redirectTo }) {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#0B0F18] flex flex-col items-center justify-center px-5 sm:px-6 select-none">
      {/* Prefetch API */}
      <link rel="prefetch" href="/api/songs?all=true" />
      <SongsPrefetcher />

      {/* Deep navy (#0B0F18) → black gradient */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#0B0F18] via-[#02040E] to-black"
      />

      {/* Soft golden ambient glow radiating from behind the centered logo */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[14%] flex justify-center">
        <div className="landing-glow h-[min(58vw,500px)] w-[min(88vw,740px)] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(242,193,78,0.18)_0%,rgba(242,193,78,0.05)_42%,transparent_70%)] blur-2xl" />
      </div>

      {/* Subtle bottom fade for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/60 to-transparent"
      />

      {/* ─── Content ─── */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full">
        {/* LOGO */}
        <div className="landing-fade-up relative mb-6 md:mb-8">
          <div
            aria-hidden
            className="landing-glow pointer-events-none absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(242,193,78,0.32)_0%,transparent_70%)] blur-2xl"
          />
          <div className="landing-float relative">
            <Image
              src="/youworship-logo.png"
              alt="You Worship"
              width={1254}
              height={1254}
              priority
              className="relative w-[clamp(10.5rem,18vh,16rem)] h-auto drop-shadow-[0_0_20px_rgba(242,193,78,0.25)]"
            />
            <div
              aria-hidden
              className="landing-shimmer pointer-events-none absolute inset-0 rounded-full"
            />
          </div>
        </div>

        {/* TITLE */}
        <h1
          className="landing-fade-up font-serif text-[clamp(2.25rem,min(9vh,13vw),6.5rem)] font-bold leading-[1.15] tracking-[0.04em] whitespace-nowrap gold-title-text"
          style={{ animationDelay: "0.15s" }}
        >
          You Worship
        </h1>

        {/* SUBTITLE */}
        <p
          className="landing-fade-up mt-5 md:mt-6 text-[clamp(0.85rem,min(2.2vh,4vw),1.25rem)] text-[#A9B2C6] md:text-[#8A93A8] font-normal md:font-light tracking-[0.18em] md:tracking-[0.3em] uppercase"
          style={{ animationDelay: "0.3s" }}
        >
          <span className="inline-flex items-center gap-x-3 gap-y-1 flex-wrap justify-center">
            <span>Christian Songs</span>
            <span className="text-[#F2C14E] text-[0.6em] leading-none">•</span>
            <span>Lyrics</span>
            <span className="text-[#F2C14E] text-[0.6em] leading-none">•</span>
            <span>Audio</span>
            <span className="text-[#F2C14E] text-[0.6em] leading-none">•</span>
            <span>Videos</span>
          </span>
        </p>

        {/* TAGLINE */}
        <div
          className="landing-fade-up mt-5 md:mt-7 space-y-1.5 md:space-y-2 text-[clamp(1.1rem,min(2.4vh,4.5vw),1.75rem)] font-serif italic font-medium leading-relaxed text-[#F2F2F2]"
          style={{ animationDelay: "0.45s" }}
        >
          <p>
            Songs that <span className="text-[#F2C14E] font-medium">inspire</span>.
          </p>
          <p>
            Lyrics that <span className="text-[#F2C14E] font-medium">touch</span> the heart.
          </p>
        </div>

        {/* CTA BUTTON */}
        <div
          className="landing-fade-up mt-7 md:mt-9"
          style={{ animationDelay: "0.6s" }}
        >
          <EnterAppButton
            href={redirectTo || "/?tab=discover"}
            onEnter={onEnter}
          />
          {redirectTo && (
            <p className="mt-4 text-xs md:text-sm text-[#8A93A8]/90 tracking-wide">
              You were sent to a song — open it after entering.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
