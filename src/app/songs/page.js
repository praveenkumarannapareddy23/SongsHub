"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SongsSectionSkeleton } from "@/components/ui/SongSkeleton";

export default function SongsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?tab=songs");
  }, [router]);

  return <SongsSectionSkeleton />;
}

