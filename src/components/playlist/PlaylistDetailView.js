"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  Shuffle,
  Edit3,
  Trash2,
  Plus,
  Heart,
  FileText,
  Clock,
  MoreVertical,
  X,
  ListMusic,
  Users,
  Crown,
  AlertCircle,
} from "lucide-react";
import { useAudio } from "@/context/audio-context";
import { useAuth } from "@/context/auth-context";
import SongArtwork from "@/components/ui/SongArtwork";
import ProtectedAction from "@/components/auth/ProtectedAction";
import { subscribeToPlaylist } from "@/lib/firestore-service";
import SongOptionsMenu from "@/components/song/SongOptionsMenu";
import AddSongsToPlaylistModal from "@/components/playlist/AddSongsToPlaylistModal";

export default function PlaylistDetailView({ playlistId, onBack, onEdit }) {
  const { user } = useAuth();
  const {
    playlists,
    songs,
    currentSong,
    isPlaying,
    playSong,
    playPlaylist,
    removeSongFromPlaylist,
    deletePlaylist,
    favorites,
    toggleFavorite,
    setAddToPlaylistSong,
    setActiveTab,
    setCollaboratingPlaylist,
    updatePlaylistInState,
  } = useAudio();

  const [isDeleted, setIsDeleted] = useState(false);
  const [isAddSongsModalOpen, setIsAddSongsModalOpen] = useState(false);
  const router = useRouter();

  // Find playlist from state
  const playlist = playlists.find((p) => p.id === playlistId);

  // Real-time Firestore sync
  useEffect(() => {
    if (!playlistId || !user) return;
    let unsubscribe = null;
    try {
      unsubscribe = subscribeToPlaylist(
        playlistId,
        (livePl) => {
          if (livePl) {
            setIsDeleted(false);
            updatePlaylistInState(livePl);
          }
        },
        (err) => {
          console.debug("Playlist live sync error:", err);
        }
      );
    } catch (err) {
      console.debug("Live sync init error:", err);
    }

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [playlistId, user]);

  if (isDeleted) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto bg-card border border-line rounded-3xl animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-title">This playlist was deleted</h3>
        <p className="text-xs text-muted leading-relaxed">
          The owner has removed this playlist. It is no longer accessible.
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-full bg-[#D4A32A] text-black font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          Back to Playlists
        </button>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-muted">Playlist not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-card border border-line text-xs font-bold text-title"
        >
          Back to Playlists
        </button>
      </div>
    );
  }

  const currentUserId = user?.uid;
  const isOwner =
    playlist.ownerId === currentUserId ||
    (!playlist.ownerId && !currentUserId);

  const collaboratorEntry = playlist.collaborators?.[currentUserId];
  const userRole = isOwner
    ? "owner"
    : typeof collaboratorEntry === "object"
      ? collaboratorEntry.role
      : collaboratorEntry || "viewer";

  const canAddSongs = isOwner || userRole === "editor";
  const canRemoveSongs = isOwner || userRole === "editor";
  const canEditPlaylist = isOwner;
  const canManageCollaborators = isOwner;

  const collaboratorCount = Object.keys(playlist.collaborators || {}).length;
  const isCollaborative = collaboratorCount > 0;

  const playlistSongs = (playlist.songIds || [])
    .map((id) => songs.find((s) => s.id === id))
    .filter(Boolean);

  const isCurrentPlaylistPlaying =
    isPlaying &&
    currentSong &&
    playlist.songIds?.includes(currentSong.id);

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-card border border-line/50 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-xl">
        {/* Background ambient gradient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4A32A]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-title mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Playlists</span>
        </button>

        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            {/* Category / Collaboration Tag */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A32A]/15 border border-[#D4A32A]/30 text-[#D4A32A] text-[10px] font-black uppercase tracking-wider">
                {isCollaborative ? (
                  <>
                    <Users className="w-3.5 h-3.5" />
                    <span>Collaborative Playlist</span>
                  </>
                ) : (
                  <>
                    <ListMusic className="w-3.5 h-3.5" />
                    <span>Custom Playlist</span>
                  </>
                )}
              </div>

              {userRole && userRole !== "owner" && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-card-hover border border-line text-[10px] font-bold text-muted uppercase tracking-wider">
                  <span>Role: {userRole}</span>
                </div>
              )}
            </div>

            <h1 className="text-2xl md:text-4xl font-black text-title tracking-tight">
              {playlist.name}
            </h1>

            {/* Owner & Subtitle */}
            <div className="flex items-center gap-2 text-xs text-muted font-medium">
              <span>
                Created by{" "}
                <span className="font-bold text-title">
                  {isOwner ? "You" : playlist.ownerName || "Owner"}
                </span>
              </span>
            </div>

            {playlist.description && (
              <p className="text-xs md:text-sm text-muted leading-relaxed font-medium">
                {playlist.description}
              </p>
            )}

            {/* Counts */}
            <div className="flex items-center gap-3 text-xs text-dim font-semibold pt-1">
              <span>{playlistSongs.length} track{playlistSongs.length !== 1 ? "s" : ""}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-muted">
                <Users className="w-3.5 h-3.5" />
                <span>
                  {collaboratorCount + 1} Member{collaboratorCount !== 0 ? "s" : ""}
                </span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {playlistSongs.length > 0 && (
              <>
                <button
                  onClick={() => playPlaylist(playlist, false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4A32A] hover:bg-[#c49527] active:scale-95 text-black font-black text-xs tracking-wider shadow-lg transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>PLAY ALL</span>
                </button>
                <button
                  onClick={() => playPlaylist(playlist, true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-card-hover hover:bg-line border border-line active:scale-95 text-title font-bold text-xs shadow-md transition-all cursor-pointer"
                  title="Shuffle Play"
                >
                  <Shuffle className="w-4 h-4 text-muted" />
                  <span>Shuffle</span>
                </button>
              </>
            )}

            {/* Collaborate Button (Owner Only) */}
            {canManageCollaborators && (
              <button
                onClick={() => setCollaboratingPlaylist(playlist)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-card-hover hover:bg-line border border-line text-title font-bold text-xs transition-colors cursor-pointer shadow-sm active:scale-95"
                title="Collaborate & Invite Members"
              >
                <Users className="w-4 h-4 text-[#D4A32A]" />
                <span>Collaborate</span>
              </button>
            )}

            {/* Edit Button (Owner Only) */}
            {canEditPlaylist && (
              <button
                onClick={() => onEdit(playlist)}
                className="p-2.5 rounded-full bg-card-hover hover:bg-line border border-line text-muted hover:text-title transition-colors cursor-pointer"
                title="Edit Playlist"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            {/* Delete Button (Owner Only) */}
            {canEditPlaylist && (
              <button
                onClick={() => {
                  if (window.confirm(`Delete playlist "${playlist.name}"?`)) {
                    deletePlaylist(playlist.id);
                    onBack();
                  }
                }}
                className="p-2.5 rounded-full bg-card-hover hover:bg-red-500/15 border border-line hover:border-red-500/30 text-muted hover:text-red-400 transition-colors cursor-pointer"
                title="Delete Playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Song List Header & Add Song CTA */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold text-muted uppercase tracking-wider">
          Tracks ({playlistSongs.length})
        </h2>

        {canAddSongs && (
          <button
            onClick={() => setIsAddSongsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#D4A32A]/10 hover:bg-[#D4A32A]/20 border border-[#D4A32A]/40 text-xs font-bold text-[#D4A32A] transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4A32A]" />
            <span>Add Song</span>
          </button>
        )}
      </div>

      {/* Song List */}
      {playlistSongs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-line/40 rounded-3xl bg-card-hover/20 text-center space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-card-hover border border-line flex items-center justify-center text-muted">
            <ListMusic className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-title">No songs in this playlist yet</h3>
            <p className="text-xs text-muted leading-relaxed font-medium">
              Browse worship songs and tap &ldquo;＋ Add to Playlist&rdquo; to add tracks here.
            </p>
          </div>
          {canAddSongs && (
            <button
              onClick={() => setIsAddSongsModalOpen(true)}
              className="px-6 py-2.5 rounded-full bg-[#D4A32A] hover:bg-[#c49527] text-black font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              + Add Songs
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {playlistSongs.map((song, index) => {
            const isSongActive = currentSong?.id === song.id;
            const isSongPlaying = isSongActive && isPlaying;
            const isFav = favorites.includes(song.id);

            // "Added by" metadata
            const addedByData = playlist.songAddedBy?.[song.id];
            const addedByName =
              addedByData?.name ||
              (playlist.ownerId === currentUserId ? "You" : playlist.ownerName || "Owner");

            return (
              <div
                key={song.id}
                className={`group flex items-center justify-between p-3 md:p-3.5 rounded-2xl border transition-all ${
                  isSongActive
                    ? "bg-card-hover/80 border-[#D4A32A]/40 shadow-sm"
                    : "bg-card/40 border-line/40 hover:bg-card-hover hover:border-line"
                }`}
              >
                {/* Left: Index, Play & Metadata */}
                <div
                  onClick={() => playSong(song, "playlist", index, playlistSongs)}
                  className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                >
                  {/* Track Number / Play Indicator */}
                  <span className="w-6 text-center text-xs font-bold text-muted tabular-nums shrink-0 group-hover:hidden">
                    {index + 1}
                  </span>
                  <div className="w-6 text-center shrink-0 hidden group-hover:block text-title">
                    {isSongPlaying ? (
                      <Pause className="w-4 h-4 mx-auto fill-current text-[#D4A32A]" />
                    ) : (
                      <Play className="w-4 h-4 mx-auto fill-current" />
                    )}
                  </div>

                  {/* Artwork */}
                  <div className="w-11 h-11 rounded-xl overflow-hidden border border-line/40 shrink-0 bg-card-hover">
                    <SongArtwork song={song} className="w-full h-full object-cover" iconSize="w-5 h-5" />
                  </div>

                  {/* Title & Artist */}
                  <div className="min-w-0 flex-1 pr-2">
                    <span
                      className={`text-xs md:text-sm font-bold truncate block transition-colors ${
                        isSongActive ? "text-[#D4A32A]" : "text-title"
                      } ${song.teluguTitle ? "font-telugu" : ""}`}
                    >
                      {song.teluguTitle || song.title}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-muted truncate mt-0.5 font-medium">
                      <span>{song.titleEnglish || song.title}</span>
                      {song.duration && (
                        <>
                          <span className="text-dim">•</span>
                          <span>{song.duration}</span>
                        </>
                      )}
                      <span className="text-dim">•</span>
                      <span className="text-[10px] text-dim truncate">
                        Added by <span className="font-semibold text-muted">{addedByName}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                  {/* Favorite button */}
                  <ProtectedAction action={`favorite_${song.id}`}>
                    <button
                      onClick={() => toggleFavorite(song.id)}
                      className="p-2 rounded-lg hover:bg-card text-muted hover:text-red-400 transition-colors cursor-pointer"
                      title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                    </button>
                  </ProtectedAction>

                  {/* Add to another playlist */}
                  <button
                    onClick={() => setAddToPlaylistSong(song)}
                    className="p-2 rounded-lg hover:bg-card text-muted hover:text-[#D4A32A] transition-colors cursor-pointer"
                    title="Add to another playlist"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {/* View Lyrics */}
                  <Link
                    href={`/song/${encodeURIComponent(song.slug || song.id)}?view=lyrics`}
                    className="p-2 rounded-lg hover:bg-card text-muted hover:text-title transition-colors hidden sm:block"
                    title="View Lyrics"
                  >
                    <FileText className="w-4 h-4" />
                  </Link>

                  {/* Options Menu (Play Next, Add to Queue, etc.) */}
                  <SongOptionsMenu song={song} />

                  {/* Remove from this playlist (Owner & Editor only) */}
                  {canRemoveSongs && (
                    <button
                      onClick={() => removeSongFromPlaylist(playlist.id, song.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors cursor-pointer"
                      title="Remove from playlist"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Songs Picker Modal */}
      <AddSongsToPlaylistModal
        playlist={playlist}
        isOpen={isAddSongsModalOpen}
        onClose={() => setIsAddSongsModalOpen(false)}
      />
    </div>
  );
}

