"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { COLLECTIONS } from "@/firebase/firestore";

const TOTAL_VERSES_COUNT = 176;

/**
 * Returns the current date's day-of-year (1-365/366) in Indian Standard Time (UTC+5:30).
 * This ensures every user worldwide sees the same verse on the same IST calendar day.
 */
function getISTDayOfYear() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const istYear = istTime.getUTCFullYear();
  const istMonth = istTime.getUTCMonth();
  const istDate = istTime.getUTCDate();

  const startOfISTYear = new Date(Date.UTC(istYear, 0, 1));
  const currentISTDate = new Date(Date.UTC(istYear, istMonth, istDate));
  const diffMs = currentISTDate.getTime() - startOfISTYear.getTime();
  const dayOfYear = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;

  return dayOfYear;
}

/**
 * Calculate the time remaining until the next midnight IST (UTC+5:30).
 * Returns milliseconds.
 */
function getMsUntilNextISTMidnight() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const nowIST = now.getTime() + istOffset;
  const msPerDay = 24 * 60 * 60 * 1000;
  const nextMidnightIST = Math.ceil(nowIST / msPerDay) * msPerDay;
  return nextMidnightIST - nowIST;
}

/**
 * Builds a verse object from either Firebase data or local data.
 */
function buildVerse(data, totalVerses) {
  return {
    id: data.id,
    book: data.book || "",
    bookTelugu: data.bookTelugu || "",
    chapter: data.chapter || 0,
    verse: data.verse || 0,
    textEnglish: data.textEnglish || "",
    textTelugu: data.textTelugu || "",
    reference: `${data.book || ""} ${data.chapter || 0}:${data.verse || 0}`,
    referenceTelugu: `${data.bookTelugu || ""} ${data.chapter || 0}:${data.verse || 0}`,
    totalVerses,
  };
}

/**
 * useDailyVerse
 *
 * Fetches the daily verse from Firebase Firestore `bible_chapters` collection.
 * The verse changes every 24 hours at midnight IST (UTC+5:30).
 * Falls back to local verses.js data if Firebase is unavailable.
 *
 * @param {Object} [options]
 * @param {number} [options.verseIndex] - Override the index for testing.
 * @returns {{
 *   verse: Object,
 *   reference: string,
 *   referenceTelugu: string,
 *   dayOfYear: number,
 *   totalVerses: number,
 *   loading: boolean,
 *   source: string,
 * }}
 */
export default function useDailyVerse(options = {}) {
  const { verseIndex } = options;

  // Force re-render when date changes at IST midnight
  const [tick, setTick] = useState(0);
  const [firebaseVerse, setFirebaseVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("local");

  // Timer to refresh at IST midnight
  useEffect(() => {
    const msUntilMidnight = getMsUntilNextISTMidnight();
    const timer = setTimeout(() => {
      setTick((prev) => prev + 1);
    }, msUntilMidnight + 1000);

    return () => clearTimeout(timer);
  }, [tick]);

  // Compute the daily verse index
  const dayOfYear = useMemo(() => {
    return verseIndex !== undefined ? verseIndex : getISTDayOfYear();
  }, [verseIndex, tick]);

  // Index for fetching from Firebase (1-based: verse_1, verse_2, ...)
  const verseDocId = useMemo(() => {
    const index = (dayOfYear - 1) % TOTAL_VERSES_COUNT;
    return `verse_${index + 1}`;
  }, [dayOfYear]);

  // Fetch verse from Firebase
  const fetchVerse = useCallback(async () => {
    setLoading(true);
    try {
      const verseRef = doc(db, COLLECTIONS.BIBLE_CHAPTERS, verseDocId);
      const docSnap = await getDoc(verseRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const verseData = buildVerse(data, TOTAL_VERSES_COUNT);
        setFirebaseVerse(verseData);
        setSource("firebase");
        setLoading(false);
        return;
      }

      // Document not found — try getting _meta to check if collection exists
      const metaRef = doc(db, COLLECTIONS.BIBLE_CHAPTERS, "_meta");
      const metaSnap = await getDoc(metaRef);

      if (!metaSnap.exists()) {
        console.warn("⚠️ bible_chapters collection not found in Firestore.");
      }
    } catch (error) {
      console.warn("⚠️ Failed to fetch verse from Firebase:", error.message);
    }

    setSource("fallback");
    setLoading(false);
  }, [verseDocId]);

  // Re-fetch when day changes
  useEffect(() => {
    fetchVerse();
  }, [fetchVerse, tick]);

  // Default fallback verse if network fails
  const fallbackVerse = useMemo(() => {
    return buildVerse(
      {
        id: 1,
        book: "Psalm",
        bookTelugu: "కీర్తనలు",
        chapter: 23,
        verse: 4,
        textEnglish: "Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me.",
        textTelugu: "గాఢాంధకారపు లోయలో నేను సంచరించినను ఏ అపాయమునకు భయపడను, నీవు నాకు తోడై యుందువు."
      },
      TOTAL_VERSES_COUNT
    );
  }, []);

  // Use Firebase verse if available, otherwise fallback
  const verse = useMemo(() => {
    return firebaseVerse || fallbackVerse;
  }, [firebaseVerse, fallbackVerse]);

  // Periodically retry Firebase if it failed (every 5 minutes)
  useEffect(() => {
    if (source === "firebase") return;

    const retryTimer = setInterval(() => {
      fetchVerse();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(retryTimer);
  }, [source, fetchVerse]);

  return {
    verse,
    reference: verse.reference,
    referenceTelugu: verse.referenceTelugu,
    dayOfYear,
    totalVerses: TOTAL_VERSES_COUNT,
    loading,
    source,
  };
}
