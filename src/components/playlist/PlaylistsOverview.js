"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ListMusic,
  Plus,
  Play,
  MoreVertical,
  Edit3,
  Trash2,
  FolderHeart,
  Users,
} from "lucide-react";
import { useAudio } from "@/context/audio-context";
import SongArtwork from "@/components/ui/SongArtwork";

function PlaylistCoverArt({ songIds, songs }) {
  const resolvedSongs = (songIds || [])
    .map((id) => (songs || []).find((s) => s.id === id))
    .filter(Boolean);

  if (resolvedSongs.length === 0) {
    return (
      <div className="w-full h-full bg-card-hover flex items-center justify-center text-muted">
        <ListMusic className="w-12 h-12 stroke-1 opacity-60 text-dim" />
      </div>
    );
  }

  if (resolvedSongs.length >= 4) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
        {resolvedSongs.slice(0, 4).map((s, idx) => (
          <div key={idx} className="relative overflow-hidden w-full h-full border border-black/20">
            <SongArtwork song={s} className="w-full h-full object-cover" iconSize="w-4 h-4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <SongArtwork song={resolvedSongs[0]} className="w-full h-full object-cover" iconSize="w-10 h-10" />
    </div>
  );
}

export default function PlaylistsOverview({ onSelectPlaylist, onCreateClick, onEditClick }) {
  const {
    playlists,
    songs,
    deletePlaylist,
    playPlaylist,
    setCollaboratingPlaylist,
  } = useAudio();
  const [menuOpenId, setMenuOpenId] = useState(null);

  const safePlaylists = Array.isArray(playlists) ? playlists : [];

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line/20 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-title tracking-tight flex items-center gap-2.5">
            <ListMusic className="w-7 h-7 text-[#D4A32A]" />
            My Playlists
          </h1>
          <p className="text-xs md:text-sm text-muted font-medium mt-1">
            Organize and enjoy your customized worship collections.
          </p>
        </div>

        <button
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4A32A] hover:bg-[#c49527] active:scale-95 text-black font-extrabold text-xs tracking-wide shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create Playlist</span>
        </button>
      </div>

      {/* Playlists Grid or Empty State */}
      {safePlaylists.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 md:p-16 border border-line/40 rounded-3xl bg-card-hover/20 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-[#D4A32A]/10 border border-[#D4A32A]/20 flex items-center justify-center text-[#D4A32A] shadow-inner">
            <FolderHeart className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-title">Create your first playlist</h3>
            <p className="text-xs text-muted leading-relaxed font-medium">
              Organize your favorite worship songs and easily play them anytime.
            </p>
          </div>
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#D4A32A] hover:bg-[#c49527] active:scale-95 text-black font-extrabold text-xs shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Playlist</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 pt-1">
          {safePlaylists.map((playlist) => {
            const isMenuOpen = menuOpenId === playlist.id;
            const trackCount = playlist.songIds?.length || 0;

            return (
              <div
                key={playlist.id}
                onClick={() => onSelectPlaylist(playlist.id)}
                className="group relative bg-card border border-line/40 hover:border-line rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              >
                {/* Cover Artwork Container */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-card-hover mb-3 border border-line/30">
                  <PlaylistCoverArt songIds={playlist.songIds} songs={songs} />

                  {/* Play Button Overlay */}
                  {trackCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playPlaylist(playlist);
                      }}
                      className="absolute right-2.5 bottom-2.5 w-10 h-10 rounded-full bg-[#D4A32A] text-black flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer z-10"
                      title="Play Playlist"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  )}

                  {/* More options menu button */}
                  <div className="absolute top-2 right-2 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(isMenuOpen ? null : playlist.id);
                      }}
                      className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Playlist Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1.5 w-36 bg-card border border-line rounded-xl shadow-2xl p-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                      >
                        <button
                          onClick={() => {
                            setMenuOpenId(null);
                            setCollaboratingPlaylist(playlist);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-copy hover:text-title hover:bg-card-hover transition-colors cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-[#D4A32A]" />
                          <span>Collaborate</span>
                        </button>
                        <button
                          onClick={() => {
                            setMenuOpenId(null);
                            onEditClick(playlist);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-copy hover:text-title hover:bg-card-hover transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setMenuOpenId(null);
                            if (window.confirm(`Delete playlist "${playlist.name}"?`)) {
                              deletePlaylist(playlist.id);
                            }
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Playlist Info */}
                <div className="space-y-1 min-w-0">
                  <h3 className="font-bold text-sm text-title truncate tracking-tight">
                    {playlist.name}
                  </h3>
                  {playlist.description && (
                    <p className="text-[11px] text-muted truncate">
                      {playlist.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-dim mt-1">
                    <span>{trackCount} track{trackCount !== 1 ? "s" : ""}</span>
                    {Object.keys(playlist.collaborators || {}).length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-[#D4A32A]">
                          👥 {Object.keys(playlist.collaborators || {}).length + 1}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
