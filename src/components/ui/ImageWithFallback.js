"use client";

import React, { useState } from "react";
import { Music } from "lucide-react";

export default function ImageWithFallback({
  src,
  alt,
  width = 160,
  height = 160,
  className = "",
  sizes,
  priority = false,
  fallbackClassName = "",
  fallbackIconSize = "w-6 h-6",
  style,
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-950 flex items-center justify-center ${className} ${fallbackClassName}`.trim()}
        style={style}
      >
        <Music className={`text-white/20 ${fallbackIconSize}`} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setHasError(true)}
      style={style}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
