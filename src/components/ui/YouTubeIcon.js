"use client";

export default function YouTubeIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={className}
    >
      {/* Red rounded rectangle background — uses currentColor for theme flexibility */}
      <rect x="0.5" y="1.5" width="23" height="21" rx="5" ry="5" fill="currentColor" />
      {/* White play triangle — always white regardless of theme */}
      <path d="M9.5 7.5v9l8-4.5-8-4.5z" fill="white" />
    </svg>
  );
}
