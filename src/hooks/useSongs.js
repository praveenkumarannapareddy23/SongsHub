"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { songService } from "../services/songService";

const PAGE_SIZE = 20;

/**
 * Custom React hook for fetching and managing songs from youworship_songs collection.
 * Supports cursor-based (keyset) pagination via /api/songs for infinite scroll,
 * plus paginated category and letter filtering.
 *
 * @returns {Object} { songs, loading, loadingMore, error, hasMore, loadMore, refetch, search, filterByCategory, filterByLetter, activeFilter }
 */
export function useSongs() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState({ type: null, value: null });
  const cursorRef = useRef(null);

  /**
   * Build the fetch URL based on current filter and cursor state
   */
  const buildUrl = useCallback((cursor, limit, filter) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    if (filter.type === "category" && filter.value) {
      params.set("category", filter.value);
    } else if (filter.type === "letter" && filter.value) {
      params.set("letter", filter.value);
    }
    return `/api/songs?${params.toString()}`;
  }, []);

  /**
   * Fetch the first page of songs (reset pagination)
   */
  const fetchSongs = useCallback(async (filter = { type: null, value: null }) => {
    setLoading(true);
    setError(null);
    setHasMore(true);
    setActiveFilter(filter);
    cursorRef.current = null;

    try {
      const url = buildUrl(null, PAGE_SIZE, filter);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setSongs(data.songs || []);
      cursorRef.current = data.cursor;
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("useSongs hook error:", err);
      setError(err.message || "Failed to load songs from Firestore.");
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  // Fetch first page on mount
  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  /**
   * Load the next page of songs (infinite scroll trigger)
   */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursorRef.current) return;

    setLoadingMore(true);
    try {
      const url = buildUrl(cursorRef.current, PAGE_SIZE, activeFilter);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setSongs((prev) => [...prev, ...(data.songs || [])]);
      cursorRef.current = data.cursor;
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("useSongs loadMore error:", err);
      setError(err.message || "Failed to load more songs.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, activeFilter, buildUrl]);

  /**
   * Filter songs by category (resets pagination, uses server-side cursor)
   */
  const filterByCategory = useCallback(async (category) => {
    if (!category) return fetchSongs(); // clear filter
    await fetchSongs({ type: "category", value: category });
  }, [fetchSongs]);

  /**
   * Filter songs by first letter (resets pagination, uses server-side cursor)
   */
  const filterByLetter = useCallback(async (letter) => {
    if (!letter) return fetchSongs(); // clear filter
    await fetchSongs({ type: "letter", value: letter });
  }, [fetchSongs]);

  /**
   * Search songs by query (client-side via cached service — no pagination)
   */
  const search = useCallback(async (queryStr) => {
    setLoading(true);
    try {
      const results = await songService.searchSongs(queryStr);
      setSongs(results);
      setHasMore(false); // search returns all matches
    } catch (err) {
      setError(err.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear all filters and reload from first page
   */
  const clearFilter = useCallback(async () => {
    await fetchSongs();
  }, [fetchSongs]);

  return {
    songs,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refetch: fetchSongs,
    search,
    filterByCategory,
    filterByLetter,
    clearFilter,
    activeFilter,
  };
}
