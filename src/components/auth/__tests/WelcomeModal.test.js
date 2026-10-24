import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import WelcomeModal from "../WelcomeModal";
import { WelcomeModalProvider, useWelcomeModal } from "@/context/welcome-modal-context";
import { AuthProvider } from "@/context/auth-context";

// Mock Auth Context
jest.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    loading: false,
  }),
}));

describe("WelcomeModal Component & Gating Logic", () => {
  let localStorageMock;

  beforeEach(() => {
    // Setup Mock LocalStorage
    localStorageMock = (() => {
      let store = {};
      return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
          store[key] = value.toString();
        },
        removeItem: (key) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      };
    })();
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  test("should render modal with premium visual design order of elements", () => {
    render(
      <WelcomeModal
        isOpen={true}
        onClose={jest.fn()}
        onSignIn={jest.fn()}
        triggerReason="first-visit"
      />
    );

    // Verify Centered Title
    expect(screen.getByText("Welcome to You Worship")).toBeInTheDocument();

    // Verify Subtitle Info
    expect(
      screen.getByText("Discover Christian songs, lyrics, audio, and videos for free.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Start exploring instantly—an account is only needed if you'd like to save your personal experience."
      )
    ).toBeInTheDocument();

    // Verify Feature List unlocked items
    expect(screen.getByText("Save your favorite songs")).toBeInTheDocument();
    expect(screen.getByText("View your recently played songs")).toBeInTheDocument();
    expect(screen.getByText("Create and manage playlists")).toBeInTheDocument();
    expect(screen.getByText("Sync your library across devices")).toBeInTheDocument();

    // Verify CTA Sign Up / Log In
    expect(screen.getByRole("button", { name: "Sign Up / Log In" })).toBeInTheDocument();
  });

  test("should dismiss immediately on close icon click with no friction", () => {
    const handleClose = jest.fn();
    render(
      <WelcomeModal
        isOpen={true}
        onClose={handleClose}
        onSignIn={jest.fn()}
        triggerReason="first-visit"
      />
    );

    const closeBtn = screen.getByLabelText("Close welcome message");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test("should dismiss on ESC key press", () => {
    const handleClose = jest.fn();
    render(
      <WelcomeModal
        isOpen={true}
        onClose={handleClose}
        onSignIn={jest.fn()}
        triggerReason="first-visit"
      />
    );

    fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test("should trap focus inside the modal and initial-focus the CTA", async () => {
    render(
      <WelcomeModal
        isOpen={true}
        onClose={jest.fn()}
        onSignIn={jest.fn()}
        triggerReason="first-visit"
      />
    );

    const ctaBtn = screen.getByRole("button", { name: "Sign Up / Log In" });
    const closeBtn = screen.getByLabelText("Close welcome message");

    // Primary CTA gets initial focus
    await waitFor(() => {
      expect(document.activeElement).toBe(ctaBtn);
    });

    // Tab press cycles focus
    fireEvent.keyDown(window, { key: "Tab", code: "Tab" });
    // Focus traps to the close button (since it's the next focusable element in the list)
    expect(document.activeElement).toBe(closeBtn);
  });
});
