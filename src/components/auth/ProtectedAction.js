"use client";

import React, { cloneElement, Children } from "react";
import { useWelcomeModal } from "@/context/welcome-modal-context";

/**
 * ProtectedAction — wraps a single child element that requires authentication.
 */
export default function ProtectedAction({
  children,
  action,
  disabled = false,
  ...props
}) {
  const { requireAuth } = useWelcomeModal();

  const handleClick = (e) => {
    if (disabled) return;
    if (e && typeof e.stopPropagation === "function") {
      e.stopPropagation();
    }
    requireAuth(action);
  };

  const child = Children.only(children);

  return cloneElement(child, {
    onClick: handleClick,
    ...props,
  });
}
