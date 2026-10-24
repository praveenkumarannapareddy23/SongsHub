"use client";

import React, { useRef, useEffect } from "react";
import SongCard from "./SongCard";
import EmptyState from "./EmptyState";
import { SongsSectionSkeleton } from "./ui/SongSkeleton";

/**
 * Reusable SongGrid component handling loading, empty, error, and list states.
 * Supports infinite scroll when onLoadMore + hasMore are provided.
 */
export default function SongGrid({
  songs = [],
  loading = false,
  loadingMore = false,
  error = null,
  hasMore = false,
  onLoadMore,
  onPlaySong,
  onRetry,
}) {
  const sentinelRef = useRef(null);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !onLoadMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" }, // trigger 200px before the sentinel enters viewport
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);

  if (loading) {
    return <SongsSectionSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to Load Songs"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!songs || songs.length === 0) {
    return (
      <EmptyState
        title="No Songs Available"
        message="No documents were found in the youworship_songs collection."
        onRetry={onRetry}
      />
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} onPlay={onPlaySong} />
        ))}
      </div>

      {/* Infinite scroll sentinel — invisible element at the bottom */}
      {hasMore && (
        <div ref={sentinelRef} className="h-4" />
      )}

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-6">
          <div className="flex items-center gap-2 text-sm text-muted">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading more songs…
          </div>
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && songs.length > 0 && (
        <p className="text-center text-xs text-muted py-6">
          You&apos;ve reached the end · {songs.length} songs loaded
        </p>
      )}
    </div>
  );
}
