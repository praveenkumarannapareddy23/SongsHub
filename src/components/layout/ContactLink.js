"use client";

/**
 * Opens the Talk to Us drawer (contact form) from anywhere in the app.
 * The AppLayout listens for the custom event and shows the drawer.
 */
export default function ContactLink({ className = "" }) {
  return (
    <button
      onClick={() =>
        window.dispatchEvent(new CustomEvent("youworship:open-talk-to-us"))
      }
      className={className}
    >
      Contact Us
    </button>
  );
}
