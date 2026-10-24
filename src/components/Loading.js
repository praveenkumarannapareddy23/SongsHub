"use client";

import React from "react";
import { Spiral } from "@/components/ui/Spiral";

/**
 * Reusable Minimalist Loading Component with Spiral Animation
 */
export default function Loading({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[260px] text-center w-full animate-in fade-in duration-200">
      <Spiral className="w-12 h-12 text-[#D4A32A]" dots={10} radius={34} />
      <p className="text-xs md:text-sm font-bold text-title tracking-tight mt-4 font-telugu">
        {message}
      </p>
    </div>
  );
}
