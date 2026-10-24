"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useAudio } from "@/context/audio-context";
import { useWelcomeModal } from "@/context/welcome-modal-context";
import { getPlaylistById } from "@/lib/firestore-service";
import PlaylistDetailView from "@/components/playlist/PlaylistDetailView";
import { ListMusic, Users, Sparkles, Loader2, ArrowRight } from "lucide-react";

export default function PlaylistSharePage({ params }) {
  const resolvedParams = use(params);
  const playlistId = resolvedParams.id;

  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, setReturnPath } = useAuth();
  const { requireAuth } = useWelcomeModal();
  const {
    playlists,
    joinCollaborativePlaylist,
    setActivePlaylistId,
    setActiveTab,
    setIsCreatePlaylistOpen,
    setEditingPlaylist,
  } = useAudio();

  const [playlistData, setPlaylistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);

  // Fetch playlist document initially if not in local state
  useEffect(() => {
    let isMounted = true;
    const fetchDoc = async () => {
      try {
        const docData = await getPlaylistById(playlistId);
        if (!isMounted) return;
        if (!docData) {
          setError("Playlist not found or has been deleted.");
        } else {
          setPlaylistData(docData);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error fetching playlist:", err);
        setError("Unable to load playlist. Please check your connection.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDoc();

    return () => {
      isMounted = false;
    };
  }, [playlistId]);

  // Handle auto-joining for logged-in users or prompting sign-in for guests
  useEffect(() => {
    if (authLoading || !playlistData || hasJoined) return;

    if (!isAuthenticated) {
      setReturnPath(`/playlist/${playlistId}`);
      requireAuth(
        () => {},
        `Sign in to collaborate on "${playlistData.name || "this playlist"}"`
      );
      return;
    }

    // Authenticated: check if user is already owner or collaborator
    const isOwner = playlistData.ownerId === user.uid;
    const isCollaborator = playlistData.collaborators?.[user.uid] != null;

    if (!isOwner && !isCollaborator) {
      joinCollaborativePlaylist(playlistId, playlistData.linkDefaultRole || "editor")
        .then(() => {
          setHasJoined(true);
        })
        .catch((err) => {
          console.error("Error joining playlist:", err);
        });
    } else {
      setHasJoined(true);
    }
  }, [
    authLoading,
    isAuthenticated,
    playlistData,
    hasJoined,
    playlistId,
    user,
    setReturnPath,
    requireAuth,
    joinCollaborativePlaylist,
  ]);

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-card-hover border border-line flex items-center justify-center text-[#D4A32A]">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
        <p className="text-xs font-bold text-muted uppercase tracking-wider">
          Loading playlist...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto bg-card border border-line rounded-3xl animate-in fade-in my-12">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
          <ListMusic className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-title">{error}</h3>
        <button
          onClick={() => router.push("/")}
          className="px-5 py-2.5 rounded-full bg-[#D4A32A] text-black font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
      <PlaylistDetailView
        playlistId={playlistId}
        onBack={() => router.push("/?tab=playlists")}
        onEdit={(pl) => {
          setEditingPlaylist(pl);
          setIsCreatePlaylistOpen(true);
        }}
      />
    </div>
  );
}
