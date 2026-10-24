"use client";

import { useMemo } from "react";

/**
 * Mulberry32 — A simple seeded PRNG that produces the same sequence for the same seed.
 */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns the current ISO week number using UTC so it's consistent worldwide.
 */
function getISOWeekNumber(date = new Date()) {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const diffMs = d.getTime() - yearStart.getTime();
  const dayOfYear = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return Math.ceil((dayOfYear + 1) / 7);
}

/**
 * Fisher-Yates shuffle using a seeded random function.
 */
function seededShuffle(array, rng) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * useWeeklySongs
 *
 * Deterministically picks `count` songs from the Firebase youworship_songs array
 * based on the current ISO week number. Selection changes every Monday
 * and is consistent for all users.
 *
 * @param {Object} options
 * @param {Array} options.songs - Full song list from Firebase youworship_songs
 * @param {number} [options.count=5] - Number of songs for the carousel
 * @param {number} [options.weekOffset] - Override for testing
 * @returns {{ weeklySongs: Array, weekNumber: number }}
 */
export default function useWeeklySongs({
  songs = [],
  count = 5,
  weekOffset,
} = {}) {
  const weekNumber = useMemo(() => {
    const base = getISOWeekNumber();
    return weekOffset !== undefined ? base + weekOffset : base;
  }, [weekOffset]);

  const weeklySongs = useMemo(() => {
    if (!Array.isArray(songs) || songs.length === 0) return [];

    // Use year+week as a unique seed so songs rotate every week and change yearly
    const now = new Date();
    const yearSeed = now.getUTCFullYear() * 100;
    const seed = yearSeed + weekNumber;
    const rng = mulberry32(seed);

    const shuffled = seededShuffle(songs, rng);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }, [songs, count, weekNumber]);

  return { weeklySongs, weekNumber };
}
