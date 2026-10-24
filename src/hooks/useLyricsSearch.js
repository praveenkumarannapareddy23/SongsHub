"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * useLyricsSearch — Hook that calls the /api/search/lyrics endpoint
 * with debounced queries and returns fuzzy-matched results with
 * highlighted lyric snippets.
 *
 * @param {Object} options
 * @param {number} [options.debounceMs=350] — Debounce delay
 * @param {string} [options.language] — Optional language filter ("te", "en", "hi", etc.)
 * @returns {{
 *   query: string,
 *   setQuery: (q: string) => void,
 *   results: Array,
 *   total: number,
 *   loading: boolean,
 *   error: string|null,
 *   search: (q?: string) => void,
 *   clear: () => void,
 *   hasMore: boolean,
 *   loadMore: () => void,
 * }}
 */
export function useLyricsSearch({ debounceMs = 350, language = "" } = {}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const currentQueryRef = useRef("");

  const doSearch = useCallback(
    async (q, pageNum = 1, append = false) => {
      const trimmed = (q || "").trim();
      if (!trimmed || trimmed.length < 2) {
        setResults([]);
        setTotal(0);
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Cancel any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      if (!append) setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: trimmed,
          page: String(pageNum),
          perPage: "30",
        });
        if (language) params.set("lang", language);

        const res = await fetch(`/api/search/lyrics?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Search request failed");

        const data = await res.json();

        if (append) {
          setResults((prev) => [...prev, ...data.results]);
        } else {
          setResults(data.results);
        }
        setTotal(data.total);
        setHasMore(data.hasMore);
        setPage(data.page);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    },
    [language]
  );

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    currentQueryRef.current = trimmed;

    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setTotal(0);
      setHasMore(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      doSearch(trimmed, 1, false);
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, debounceMs, doSearch]);

  const search = useCallback(
    (q) => {
      const val = q !== undefined ? q : query;
      setQuery(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      doSearch(val, 1, false);
    },
    [query, doSearch]
  );

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    doSearch(currentQueryRef.current, page + 1, true);
  }, [hasMore, loading, page, doSearch]);

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    setTotal(0);
    setHasMore(false);
    setError(null);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  return {
    query,
    setQuery,
    results,
    total,
    loading,
    error,
    search,
    clear,
    hasMore,
    loadMore,
  };
}
