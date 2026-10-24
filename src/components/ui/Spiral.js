"use client";

import React from "react";
import { cn } from "@/lib/utils";

function Spiral({
  dots = 8,
  radius = 31.25,
  className,
  ...props
}) {
  return (
    <span
      role="status"
      suppressHydrationWarning
      className={cn("relative inline-block", className)}
      {...props}
    >
      {Array.from({ length: dots }, (_, index) => {
        const angle = (index / dots) * (2 * Math.PI);
        const x = `${(50 + radius * Math.cos(angle)).toFixed(4)}%`;
        const y = `${(50 + radius * Math.sin(angle)).toFixed(4)}%`;
        const size = `${(150 / dots).toFixed(4)}%`;
        const delay = `${((index / dots) * 1.5).toFixed(4)}s`;

        return (
          <span
            key={index}
            aria-hidden="true"
            suppressHydrationWarning
            className="absolute inline-block rounded-full bg-current animate-spiral-dot"
            style={{
              left: x,
              top: y,
              width: size,
              height: size,
              animationDelay: delay,
            }}
          />
        );
      })}
      <span className="sr-only">Loading</span>
    </span>
  );
}

export { Spiral };
export default Spiral;
