"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Back button shown at the top of pages reached from footer links.
 * Returns to the previous page; if there is no history, navigates
 * to `fallbackHref` instead.
 */
export default function BackButton({
  fallbackHref = "/",
  className = "",
}) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      onClick={goBack}
      aria-label="Go back to previous page"
      title="Go back"
      className={`p-2 rounded-full text-muted hover:text-title hover:bg-card-hover transition-colors cursor-pointer shrink-0 ${className}`}
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );
}
