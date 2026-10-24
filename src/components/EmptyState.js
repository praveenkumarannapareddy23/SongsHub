"use client";

import React from "react";
import { Music, RefreshCw } from "lucide-react";

/**
 * Reusable Empty State component for when no songs match the query/filter
 */
export default function EmptyState({
  title = "No songs found",
  message = "There are no documents matching your criteria in the youworship_songs collection.",
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-card border border-line/40 max-w-lg mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-card-hover border border-line flex items-center justify-center mb-4 text-dim">
        <Music className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-title tracking-tight">{title}</h3>
      <p className="text-xs text-muted mt-1.5 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 px-4 py-2 bg-card-hover hover:bg-white/15 text-title text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      )}
    </div>
  );
}
